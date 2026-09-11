/**
 * Round every stored money amount to two decimals.
 *
 *   pnpm money:backfill [email] [--apply]
 *
 * Money is two decimals everywhere now, enforced at the validation boundary
 * (zAmount in src/lib/validation/common.ts). Rows written before that can hold
 * more: an investment settlement stored quantity * price +/- fee at full
 * precision, so 2.831873 shares at 328.63 wrote 930.63744 and left sub-cent
 * dust in the cash balance. A balance of 935.1478 displays as US$935.15 and no
 * field accepts more than two decimals, so the dust can be neither seen nor
 * spent.
 *
 * Only amounts of money are touched. Share quantities, per-unit prices and FX
 * rates keep their precision — rounding those would zero out a sub-cent
 * holding and shift every cost basis.
 *
 * Safe to run repeatedly. Dry run by default: pass --apply to write.
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { money, roundTo } from "../src/lib/money";

const prisma = new PrismaClient();

type Fix = { table: string; id: string; field: string; from: string; to: string };

function drift(value: Prisma.Decimal | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const current = money(value);
  const rounded = roundTo(current);
  return rounded.equals(current) ? null : rounded.toString();
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const email = args.find((a) => !a.startsWith("--"));
  const scope = email ? { user: { email } } : {};

  const fixes: Fix[] = [];

  const accounts = await prisma.financeAccount.findMany({
    where: scope,
    select: { id: true, openingBalance: true },
  });
  for (const row of accounts) {
    const to = drift(row.openingBalance);
    if (to) fixes.push({ table: "financeAccount", id: row.id, field: "openingBalance", from: row.openingBalance.toString(), to });
  }

  const txns = await prisma.transaction.findMany({
    where: { ...scope, deletedAt: null },
    select: { id: true, amount: true },
  });
  for (const row of txns) {
    const to = drift(row.amount);
    if (to) fixes.push({ table: "transaction", id: row.id, field: "amount", from: row.amount.toString(), to });
  }

  const transfers = await prisma.transfer.findMany({
    where: { ...scope, deletedAt: null },
    select: { id: true, fromAmount: true, toAmount: true, fee: true },
  });
  for (const row of transfers) {
    for (const field of ["fromAmount", "toAmount", "fee"] as const) {
      const to = drift(row[field]);
      if (to) fixes.push({ table: "transfer", id: row.id, field, from: row[field].toString(), to });
    }
  }

  const trades = await prisma.investmentTransaction.findMany({
    where: { ...scope, deletedAt: null },
    select: { id: true, amount: true, fee: true },
  });
  for (const row of trades) {
    for (const field of ["amount", "fee"] as const) {
      const to = drift(row[field]);
      if (to) fixes.push({ table: "investmentTransaction", id: row.id, field, from: row[field].toString(), to });
    }
  }

  if (fixes.length === 0) {
    console.log("Every stored amount is already at two decimals.");
    return;
  }

  const byTable = new Map<string, number>();
  for (const f of fixes) byTable.set(f.table, (byTable.get(f.table) ?? 0) + 1);
  console.log(`${fixes.length} amounts carry more than two decimals:`);
  for (const [table, count] of byTable) console.log(`  ${table}: ${count}`);
  console.log("\nfirst few:");
  for (const f of fixes.slice(0, 5)) {
    console.log(`  ${f.table}.${f.field} ${f.from} -> ${f.to}`);
  }

  if (!apply) {
    console.log("\ndry run — pass --apply to write these changes.");
    return;
  }

  for (const f of fixes) {
    const data = { [f.field]: f.to };
    if (f.table === "financeAccount") await prisma.financeAccount.update({ where: { id: f.id }, data });
    else if (f.table === "transaction") await prisma.transaction.update({ where: { id: f.id }, data });
    else if (f.table === "transfer") await prisma.transfer.update({ where: { id: f.id }, data });
    else await prisma.investmentTransaction.update({ where: { id: f.id }, data });
  }
  console.log(`\nrounded ${fixes.length} amounts.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
