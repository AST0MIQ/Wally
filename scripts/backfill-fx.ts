/**
 * Backfill historical USD→* FX rates (one frankfurter timeseries request).
 *
 *   pnpm tsx scripts/backfill-fx.ts [days]
 *
 * Default window: 420 days back to today.
 */
import { backfillRates } from "../src/server/lib/fx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const days = Number(process.argv[2] ?? 420);
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

  const result = await backfillRates(isoDate(from), isoDate(to));
  console.log(
    `[backfill-fx] ${result.rowsWritten} rows · ${result.currencies.length} currencies · ${result.dates.length} days`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
