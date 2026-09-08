import { prisma } from "@/server/db";

export type AuditLogRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: unknown;
  createdAt: Date;
  actor: { id: string; email: string; name: string | null } | null;
};

/** Paged audit log reader for the Admin Console (guarded by `audit:read`). */
export async function listAuditLogs(opts: {
  action?: string;
  entity?: string;
  cursor?: string;
  limit?: number;
}): Promise<{ rows: AuditLogRow[]; nextCursor: string | null; actions: string[]; entities: string[] }> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);

  const [rows, actionGroups, entityGroups] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        action: opts.action || undefined,
        entity: opts.entity || undefined,
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      include: { user: { select: { id: true, email: true, name: true } } },
    }),
    prisma.auditLog.groupBy({ by: ["action"], _count: { _all: true } }),
    prisma.auditLog.groupBy({ by: ["entity"], _count: { _all: true } }),
  ]);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    rows: page.map((r) => ({
      id: r.id,
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      metadata: r.metadata,
      createdAt: r.createdAt,
      actor: r.user ? { id: r.user.id, email: r.user.email, name: r.user.name } : null,
    })),
    nextCursor: hasMore ? page[page.length - 1]!.id : null,
    actions: actionGroups.map((a) => a.action).sort(),
    entities: entityGroups.map((e) => e.entity).sort(),
  };
}
