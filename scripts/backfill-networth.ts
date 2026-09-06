/**
 * Backfill daily net-worth snapshots for a user.
 *
 *   pnpm tsx scripts/backfill-networth.ts <email> [days]
 *
 * Recomputes net worth as of each day (uses FX + security prices on/before
 * that date), so run `pnpm fx:backfill` first for historical accuracy.
 */
import { PrismaClient } from "@prisma/client";
import { backfillNetWorthSnapshots } from "../src/server/lib/networth";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const days = Number(process.argv[3] ?? 120);
  if (!email) {
    console.error("usage: pnpm tsx scripts/backfill-networth.ts <email> [days]");
    process.exit(1);
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  const r = await backfillNetWorthSnapshots(user.id, days);
  console.log(`[backfill-networth] ${email}: ${r.days + 1} daily snapshots`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
