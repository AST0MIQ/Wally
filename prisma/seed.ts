/**
 * Global seed script (`pnpm db:seed`).
 *
 *  - Per-user default categories are seeded on first sign-in
 *    (see src/server/services/onboarding.ts).
 *  - Securities / FX rates are populated by cron jobs (Phase 2+).
 *  - Cosmetics: "Wally Classic" canonical defaults are seeded in every
 *    environment; demo collections only in development or when
 *    COSMETICS_SEED_DEMO=true.
 *  - RBAC: the permission catalogue and the six system roles are seeded in
 *    every environment (idempotent). No role is assigned to any user here —
 *    day-one access is the ADMIN_EMAILS bootstrap; a bootstrap admin then
 *    assigns database-backed roles in Admin Console → Access Control.
 */
import { PrismaClient } from "@prisma/client";

import { seedCosmeticDefaults } from "./data/cosmetics-defaults";
import { seedCosmeticDemo } from "./data/cosmetics-demo";
import { seedRbac } from "./data/rbac";

const prisma = new PrismaClient();

async function main() {
  await seedRbac(prisma);
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
