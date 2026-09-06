/**
 * Global seed script (`pnpm db:seed`).
 *
 * Wally has no global reference data to seed yet:
 *  - Per-user default categories are seeded on first sign-in
 *    (see src/server/services/onboarding.ts).
 *  - Securities / FX rates are populated by cron jobs (Phase 2+).
 *
 * This file is kept as a valid entrypoint for future global seed data.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[seed] No global seed data required for Wally at this stage.");
  console.log("[seed] Default categories are created per-user on first sign-in.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
