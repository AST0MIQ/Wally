import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";

/**
 * PostgreSQL's default READ COMMITTED isolation does **not** make an
 * interactive transaction free of time-of-check/time-of-use races: a value
 * read early in the transaction can be changed by a concurrent commit before
 * the later write. For cosmetics invariants that another request can change
 * concurrently (published-config / published-membership immutability, the
 * "every asset is PUBLISHED" publish guard, grant/apply consistency) we run
 * the whole read-check-write in a SERIALIZABLE transaction and retry on a
 * serialization failure (`P2034`).
 */
const RETRYABLE_CODES = new Set(["P2034"]);
const RETRYABLE_PG = new Set(["40001", "40P01"]);

export async function serializableTx<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  attempts = 4,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (err) {
      const code =
        err instanceof Prisma.PrismaClientKnownRequestError ? err.code : "";
      const pg =
        (err as { meta?: { code?: string } } | undefined)?.meta?.code ?? "";
      if (attempt < attempts && (RETRYABLE_CODES.has(code) || RETRYABLE_PG.has(pg))) {
        lastErr = err;
        // tiny jittered backoff
        await new Promise((r) => setTimeout(r, 5 * attempt + Math.random() * 10));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}
