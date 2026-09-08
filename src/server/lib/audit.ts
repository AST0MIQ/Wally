import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db";

type Db = PrismaClient | Prisma.TransactionClient;

export type AuditInput = {
  userId: string;
  action: string; // e.g. "transaction.create"
  entity: string; // e.g. "Transaction"
  entityId: string;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Append an audit record for a financial mutation. Best-effort: never throws
 * into the caller's happy path.
 */
export async function writeAudit(
  input: AuditInput,
  db: Db = prisma,
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        metadata: input.metadata,
      },
    });
  } catch {
    // auditing must not break the mutation
  }
}

/**
 * Write an audit record **inside a transaction**. Unlike `writeAudit`, this
 * THROWS on failure so a material admin action rolls back if it cannot be
 * recorded — a mutation and its audit row commit together or not at all.
 * This is the single audit-writing path for admin/cosmetics operations.
 */
export async function auditInTx(
  tx: Prisma.TransactionClient,
  input: AuditInput,
): Promise<void> {
  await tx.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata,
    },
  });
}
