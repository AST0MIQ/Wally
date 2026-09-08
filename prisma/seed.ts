/**
 * Global seed script (`pnpm db:seed`).
 *
 *  - Per-user default categories are seeded on first sign-in
 *    (see src/server/services/onboarding.ts).
 *  - Securities / FX rates are populated by cron jobs (Phase 2+).
 *  - Cosmetics: "Wally Classic" canonical defaults are seeded in every
 *    environment; demo collections only in development or when
 *    COSMETICS_SEED_DEMO=true.
 */
import { PrismaClient } from "@prisma/client";

import { seedCosmeticDefaults } from "./data/cosmetics-defaults";
import { seedCosmeticDemo } from "./data/cosmetics-demo";

const prisma = new PrismaClient();

async function main() {
  await seedCosmeticDefaults(prisma);

  const wantDemo =
    process.env.COSMETICS_SEED_DEMO === "true" ||
    process.env.NODE_ENV === "development";
  if (wantDemo) {
    await seedCosmeticDemo(prisma);
  } else {
    console.log("[seed] cosmetics demo skipped (set COSMETICS_SEED_DEMO=true to include)");
  }
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
