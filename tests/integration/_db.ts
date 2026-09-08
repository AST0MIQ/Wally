import { beforeAll, describe } from "vitest";

import { prisma } from "@/server/db";

export const hasDb = await prisma
  .$queryRaw`SELECT 1`.then(() => true)
  .catch(() => false);

const REQUIRED = process.env.DB_TESTS_REQUIRED === "1";

/**
 * Use for a DB integration `describe` block.
 *  - `DB_TESTS_REQUIRED=1` (set by `pnpm test:db`): the block ALWAYS runs; a
 *    `beforeAll` fails the suite (non-zero) if the DB is unreachable. A skipped
 *    integration suite can therefore never be reported as passing.
 *  - otherwise: skipped when the DB is unreachable (local/CI without a DB).
 */
export function describeDb(name: string, fn: () => void): void {
  if (REQUIRED) {
    describe(name, () => {
      beforeAll(() => {
        if (!hasDb) {
          throw new Error(
            "DB_TESTS_REQUIRED=1 but PostgreSQL is unreachable — failing (not skipping).",
          );
        }
      });
      fn();
    });
    return;
  }
  describe.skipIf(!hasDb)(name, fn);
}
