import { prisma } from "@/server/db";
import { Decimal, money } from "@/lib/money";

/**
 * Current balance per account, expressed in the account's OWN currency.
 *
 *   balance = openingBalance
 *           + Σ INCOME               (this account)
 *           − Σ EXPENSE              (this account)
 *           − Σ Transfer.fromAmount  (out of this account)
 *           + Σ Transfer.toAmount    (into this account)
 *           − Σ Transfer.fee         (charged to this account)
 *           − Σ InvestmentTxn BUY    settlement amount (cost, incl. fee)
 *           + Σ InvestmentTxn SELL   settlement amount (net proceeds)
 *
 * Transfers live in their own table, so INCOME/EXPENSE analytics can never
 * double-count them. Investment settlement moves cash out of / into the
 * settlement account exactly once, so portfolio market value + cash balance
 * never double-count the same money (see docs/ARCHITECTURE.md §N2).
 */
export async function computeAccountBalances(
  userId: string,
  opts: { asOf?: Date } = {},
): Promise<Map<string, Decimal>> {
  const dateFilter = opts.asOf ? { date: { lte: opts.asOf } } : {};
  const tradeFilter = opts.asOf ? { tradeDate: { lte: opts.asOf } } : {};

  const [
    accounts,
    txnSums,
    transferOut,
    transferIn,
    feeWithAccount,
    feeWithoutAccount,
    investmentSums,
  ] = await Promise.all([
    prisma.financeAccount.findMany({
      where: { userId },
      select: { id: true, openingBalance: true },
    }),
    prisma.transaction.groupBy({
      by: ["accountId", "kind"],
      where: { userId, deletedAt: null, ...dateFilter },
      _sum: { amount: true },
    }),
    prisma.transfer.groupBy({
      by: ["fromAccountId"],
      where: { userId, deletedAt: null, ...dateFilter },
      _sum: { fromAmount: true },
    }),
    prisma.transfer.groupBy({
      by: ["toAccountId"],
      where: { userId, deletedAt: null, ...dateFilter },
      _sum: { toAmount: true },
    }),
    prisma.transfer.groupBy({
      by: ["feeAccountId"],
      where: {
        userId,
        deletedAt: null,
        feeAccountId: { not: null },
        ...dateFilter,
      },
      _sum: { fee: true },
    }),
    prisma.transfer.groupBy({
      by: ["fromAccountId"],
      where: { userId, deletedAt: null, feeAccountId: null, ...dateFilter },
      _sum: { fee: true },
    }),
    prisma.investmentTransaction.groupBy({
      by: ["settlementAccountId", "type"],
      where: {
        userId,
        deletedAt: null,
        settlementAccountId: { not: null },
        ...tradeFilter,
      },
      _sum: { amount: true },
    }),
  ]);

  const balances = new Map<string, Decimal>();
  for (const a of accounts) {
    balances.set(a.id, money(a.openingBalance));
  }

  const add = (accountId: string | null, delta: Decimal) => {
    if (!accountId) return;
    const current = balances.get(accountId);
    if (!current) return; // account belongs to another user / archived-deleted
    balances.set(accountId, current.plus(delta));
  };

  for (const row of txnSums) {
    const amount = money(row._sum.amount ?? 0);
    add(row.accountId, row.kind === "INCOME" ? amount : amount.negated());
  }
  for (const row of transferOut) {
    add(row.fromAccountId, money(row._sum.fromAmount ?? 0).negated());
  }
  for (const row of transferIn) {
    add(row.toAccountId, money(row._sum.toAmount ?? 0));
  }
  for (const row of feeWithAccount) {
    add(row.feeAccountId, money(row._sum.fee ?? 0).negated());
  }
  for (const row of feeWithoutAccount) {
    add(row.fromAccountId, money(row._sum.fee ?? 0).negated());
  }
  for (const row of investmentSums) {
    const amount = money(row._sum.amount ?? 0);
    add(
      row.settlementAccountId,
      row.type === "SELL" ? amount : amount.negated(),
    );
  }

  return balances;
}

export async function computeAccountBalance(
  userId: string,
  accountId: string,
): Promise<Decimal> {
  const balances = await computeAccountBalances(userId);
  return balances.get(accountId) ?? money(0);
}
