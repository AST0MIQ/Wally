import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { writeAudit } from "@/server/lib/audit";
import { AppError, conflict, notFound } from "@/server/lib/errors";
import { computeAccountBalances } from "@/server/lib/balance";
import { toPlain } from "@/lib/money";
import type {
  AccountCreateInput,
  AccountUpdateInput,
} from "@/lib/validation/account";

export type AccountWithBalance = {
  id: string;
  name: string;
  type: string;
  customTypeLabel: string | null;
  currency: string;
  icon: string | null;
  color: string | null;
  status: "ACTIVE" | "ARCHIVED";
  openingBalance: string;
  openingBalanceDate: string;
  balance: string;
  createdAt: string;
};

function serialize(
  a: Prisma.FinanceAccountGetPayload<object>,
  balance: string,
): AccountWithBalance {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    customTypeLabel: a.customTypeLabel,
    currency: a.currency,
    icon: a.icon,
    color: a.color,
    status: a.status,
    openingBalance: toPlain(a.openingBalance),
    openingBalanceDate: a.openingBalanceDate.toISOString(),
    balance,
    createdAt: a.createdAt.toISOString(),
  };
}

export async function listAccounts(
  userId: string,
  opts: { includeArchived?: boolean } = {},
): Promise<AccountWithBalance[]> {
  const accounts = await prisma.financeAccount.findMany({
    where: {
      userId,
      ...(opts.includeArchived ? {} : { status: "ACTIVE" }),
    },
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const balances = await computeAccountBalances(userId);
  return accounts.map((a) => serialize(a, toPlain(balances.get(a.id) ?? 0)));
}

export async function reorderAccounts(userId: string, ids: string[]): Promise<void> {
  const uniqueIds = [...new Set(ids)];
  const owned = await prisma.financeAccount.count({
    where: { userId, status: "ACTIVE", id: { in: uniqueIds } },
  });
  if (owned !== uniqueIds.length) notFound("Account not found");
  await prisma.$transaction(
    uniqueIds.map((id, sortOrder) =>
      prisma.financeAccount.update({ where: { id }, data: { sortOrder } }),
    ),
  );
}

export type AccountLite = {
  id: string;
  name: string;
  type: string;
  currency: string;
  icon: string | null;
  color: string | null;
  /** current balance in the account's own currency (plain decimal string) */
  balance: string;
};

export async function listAccountsMinimal(
  userId: string,
): Promise<AccountLite[]> {
  const [rows, balances] = await Promise.all([
    prisma.financeAccount.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        type: true,
        currency: true,
        icon: true,
        color: true,
      },
    }),
    computeAccountBalances(userId),
  ]);
  return rows.map((r) => ({
    ...r,
    balance: toPlain(balances.get(r.id) ?? 0),
  }));
}

export async function getAccount(
  userId: string,
  id: string,
): Promise<AccountWithBalance> {
  const account = await prisma.financeAccount.findFirst({
    where: { id, userId },
  });
  if (!account) notFound("Account not found");

  const balances = await computeAccountBalances(userId);
  return serialize(account, toPlain(balances.get(account.id) ?? 0));
}

export async function createAccount(
  userId: string,
  input: AccountCreateInput,
): Promise<{ id: string }> {
  const account = await prisma.financeAccount.create({
    data: {
      userId,
      name: input.name,
      type: input.type,
      customTypeLabel:
        input.type === "OTHER" ? (input.customTypeLabel ?? null) : null,
      openingBalance: input.openingBalance,
      openingBalanceDate: input.openingBalanceDate,
      currency: input.currency,
      icon: input.icon ?? null,
      color: input.color ?? null,
    },
  });

  await writeAudit({
    userId,
    action: "account.create",
    entity: "FinanceAccount",
    entityId: account.id,
    metadata: { name: account.name, currency: account.currency },
  });

  return { id: account.id };
}

export async function updateAccount(
  userId: string,
  input: AccountUpdateInput,
): Promise<{ id: string }> {
  const existing = await prisma.financeAccount.findFirst({
    where: { id: input.id, userId },
    select: { id: true, type: true },
  });
  if (!existing) notFound("Account not found");

  const nextType = input.type ?? existing.type;
  const data: Prisma.FinanceAccountUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.type !== undefined) data.type = input.type;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.openingBalance !== undefined)
    data.openingBalance = input.openingBalance;
  if (input.openingBalanceDate !== undefined)
    data.openingBalanceDate = input.openingBalanceDate;
  if (input.icon !== undefined) data.icon = input.icon ?? null;
  if (input.color !== undefined) data.color = input.color ?? null;
  if (input.customTypeLabel !== undefined || input.type !== undefined) {
    data.customTypeLabel =
      nextType === "OTHER" ? (input.customTypeLabel ?? null) : null;
  }

  await prisma.financeAccount.update({ where: { id: existing.id }, data });
  await writeAudit({
    userId,
    action: "account.update",
    entity: "FinanceAccount",
    entityId: existing.id,
  });

  return { id: existing.id };
}

export async function setAccountStatus(
  userId: string,
  id: string,
  status: "ACTIVE" | "ARCHIVED",
): Promise<{ id: string }> {
  const existing = await prisma.financeAccount.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) notFound("Account not found");

  await prisma.financeAccount.update({ where: { id }, data: { status } });
  await writeAudit({
    userId,
    action: status === "ARCHIVED" ? "account.archive" : "account.unarchive",
    entity: "FinanceAccount",
    entityId: id,
  });
  return { id };
}

export async function deleteAccount(
  userId: string,
  id: string,
): Promise<{ id: string }> {
  const existing = await prisma.financeAccount.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) notFound("Account not found");

  const [txns, transfers, portfolios, settlements] = await Promise.all([
    prisma.transaction.count({ where: { accountId: id } }),
    prisma.transfer.count({
      where: {
        OR: [{ fromAccountId: id }, { toAccountId: id }, { feeAccountId: id }],
      },
    }),
    prisma.portfolio.count({ where: { accountId: id } }),
    prisma.investmentTransaction.count({ where: { settlementAccountId: id } }),
  ]);

  if (txns + transfers + portfolios + settlements > 0) {
    conflict("account_has_activity");
  }

  await prisma.financeAccount.delete({ where: { id } });
  await writeAudit({
    userId,
    action: "account.delete",
    entity: "FinanceAccount",
    entityId: id,
  });
  return { id };
}

/** Guard helper for other services: assert an account belongs to the user. */
export async function assertAccountOwned(
  userId: string,
  accountId: string,
): Promise<{ id: string; currency: string }> {
  const account = await prisma.financeAccount.findFirst({
    where: { id: accountId, userId },
    select: { id: true, currency: true, status: true },
  });
  if (!account) throw new AppError("account_not_found", "NOT_FOUND");
  return { id: account.id, currency: account.currency };
}
