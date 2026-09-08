import { prisma } from "@/server/db";
import { auditInTx } from "@/server/lib/audit";
import { conflict, notFound } from "@/server/lib/errors";
import { serializableTx } from "@/server/lib/tx";
import { countDbSuperAdmins, evaluatePrincipal } from "@/server/lib/rbac";
import { isBootstrapEmail, normalizeEmail } from "@/server/lib/rbac-bootstrap";
import { SUPER_ADMIN_ROLE_KEY } from "@/lib/rbac/catalogue";

export type AdminUserSearchRow = {
  id: string;
  email: string;
  name: string | null;
  roleKeys: string[];
};

/**
 * Paginated registered-user search by normalized email. Never loads the whole
 * user table: an empty / whitespace query returns no rows (the caller shows a
 * "type an email" hint). Cursor is the last row id.
 */
export async function searchAdminUsers(opts: {
  q?: string;
  cursor?: string;
  limit?: number;
}): Promise<{ rows: AdminUserSearchRow[]; nextCursor: string | null }> {
  const q = normalizeEmail(opts.q);
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  if (q.length < 1) return { rows: [], nextCursor: null };

  const rows = await prisma.user.findMany({
    where: { email: { contains: q, mode: "insensitive" } },
    orderBy: [{ email: "asc" }, { id: "asc" }],
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      email: true,
      name: true,
      userRoles: {
        where: { role: { archivedAt: null } },
        select: { role: { select: { key: true } } },
      },
    },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return {
    rows: page.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      roleKeys: u.userRoles.map((r) => r.role.key).sort(),
    })),
    nextCursor: hasMore ? page[page.length - 1]!.id : null,
  };
}

export type UserAccess = {
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
    lastLoginAt: Date | null;
  };
  roles: {
    id: string;
    key: string;
    name: string;
    isSystem: boolean;
    archivedAt: Date | null;
    assignedAt: Date;
    assignedBy: { id: string; email: string; name: string | null } | null;
  }[];
  /** Effective permissions — union across non-archived roles, sorted. */
  effectivePermissions: string[];
  isBootstrap: boolean;
  isSuperAdmin: boolean;
};

/** A user's current roles + freshly-computed effective permissions. */
export async function getUserAccess(userId: string): Promise<UserAccess | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      lastLoginAt: true,
      userRoles: {
        orderBy: { assignedAt: "asc" },
        select: {
          assignedAt: true,
          assignedBy: { select: { id: true, email: true, name: true } },
          role: {
            select: {
              id: true,
              key: true,
              name: true,
              isSystem: true,
              archivedAt: true,
              permissions: { select: { permission: { select: { key: true } } } },
            },
          },
        },
      },
    },
  });
  if (!user) return null;

  const principal = evaluatePrincipal({
    userId: user.id,
    email: user.email,
    isBootstrap: isBootstrapEmail(user.email),
    roles: user.userRoles.map((ur) => ({
      key: ur.role.key,
      archivedAt: ur.role.archivedAt,
      permissionKeys: ur.role.permissions.map((p) => p.permission.key),
    })),
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    roles: user.userRoles.map((ur) => ({
      id: ur.role.id,
      key: ur.role.key,
      name: ur.role.name,
      isSystem: ur.role.isSystem,
      archivedAt: ur.role.archivedAt,
      assignedAt: ur.assignedAt,
      assignedBy: ur.assignedBy,
    })),
    effectivePermissions: [...principal.permissions].sort(),
    isBootstrap: principal.isBootstrap,
    isSuperAdmin: principal.isSuperAdmin,
  };
}

/**
 * Assign a role to a user (idempotent on [userId, roleId]). Rejects an
 * archived role. SERIALIZABLE + audited.
 */
export async function assignRole(
  adminId: string,
  userId: string,
  roleId: string,
) {
  return serializableTx(async (tx) => {
    const [target, role] = await Promise.all([
      tx.user.findUnique({ where: { id: userId }, select: { id: true } }),
      tx.accessRole.findUnique({ where: { id: roleId } }),
    ]);
    if (!target) notFound("user_not_found");
    if (!role) notFound("role_not_found");
    if (role.archivedAt) conflict("role_archived");

    const existing = await tx.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
      select: { id: true },
    });
    if (existing) return existing; // idempotent — no duplicate audit row

    const assignment = await tx.userRole.create({
      data: { userId, roleId, assignedByUserId: adminId },
    });
    await auditInTx(tx, {
      userId: adminId,
      action: "role.assign",
      entity: "UserRole",
      entityId: assignment.id,
      metadata: { targetUserId: userId, roleId, roleKey: role.key },
    });
    return assignment;
  });
}

/**
 * Revoke a user's role. If the role is SUPER_ADMIN, the revocation is refused
 * when it would leave zero database-backed SUPER_ADMIN assignments —
 * ADMIN_EMAILS bootstrap admins do NOT count. The check runs AFTER the delete
 * inside a SERIALIZABLE transaction, so two concurrent revocations of the last
 * two SUPER_ADMINs cannot both succeed: one hits a serialization failure and
 * retries, then sees the count fall to zero and rolls back with
 * `last_super_admin`.
 */
export async function revokeRole(
  adminId: string,
  userId: string,
  roleId: string,
) {
  return serializableTx(async (tx) => {
    const assignment = await tx.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
      select: { id: true, role: { select: { key: true } } },
    });
    if (!assignment) notFound("assignment_not_found");

    const isSuper = assignment.role.key === SUPER_ADMIN_ROLE_KEY;

    // Friendly fast path (still re-checked below inside the tx).
    if (isSuper) {
      const before = await countDbSuperAdmins(tx);
      if (before <= 1) conflict("last_super_admin");
    }

    await tx.userRole.delete({ where: { id: assignment.id } });

    if (isSuper) {
      const remaining = await countDbSuperAdmins(tx);
      if (remaining < 1) conflict("last_super_admin"); // rolls back the delete
    }

    await auditInTx(tx, {
      userId: adminId,
      action: "role.revoke",
      entity: "UserRole",
      entityId: assignment.id,
      metadata: { targetUserId: userId, roleId, roleKey: assignment.role.key },
    });
  });
}
