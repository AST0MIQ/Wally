/**
 * Central, server-only authorization module for database-backed RBAC.
 *
 * A user holds many roles (`UserRole`); each non-archived role grants a set of
 * permissions (`RolePermission` → `Permission`). A principal's effective
 * permission set is the UNION across all of their non-archived roles. The only
 * `resource.action` keys that exist are the seeded catalogue
 * (`@/lib/rbac/catalogue`).
 *
 * Role NAMES are never consulted for authorization, with exactly two narrow
 * exceptions, both surfaced as `isSuperAdmin`:
 *   1. holding the non-archived `SUPER_ADMIN` system role, and
 *   2. the `ADMIN_EMAILS` bootstrap (see `rbac-bootstrap.ts`).
 * A SUPER_ADMIN principal satisfies every permission check.
 *
 * No authorization cache: `getPrincipal` resolves from the database on every
 * request, wrapped only in React `cache()` so repeated guard calls inside one
 * request/render hit the DB once. A role assignment, revocation or
 * role-permission change therefore takes effect on the caller's very next
 * request with no explicit invalidation.
 *
 * The request-principal guards that combine this with the session live in
 * `src/server/lib/guards.ts`; this module must not import them (cycle).
 */
import { cache } from "react";

import { prisma } from "@/server/db";
import {
  PERMISSION_KEYS,
  SUPER_ADMIN_ROLE_KEY,
  type PermissionKey,
} from "@/lib/rbac/catalogue";
import { isBootstrapEmail, normalizeEmail } from "@/server/lib/rbac-bootstrap";

export type Principal = {
  userId: string;
  email: string;
  /** Keys of the non-archived roles the user currently holds. */
  roleKeys: string[];
  /** Effective permissions — union across all non-archived roles. */
  permissions: ReadonlySet<string>;
  /** Email is in ADMIN_EMAILS. */
  isBootstrap: boolean;
  /** Holds the non-archived SUPER_ADMIN role, or is a bootstrap admin. */
  isSuperAdmin: boolean;
  /** May load the Admin Console shell at all (individual pages still gate). */
  canAccessAdmin: boolean;
};

// ── Pure core (unit-tested without a database) ─────────────────────────────

export type RoleForEval = {
  key: string;
  archivedAt: Date | string | null;
  permissionKeys: string[];
};

/** Union the permission keys of every NON-archived role. */
export function unionPermissions(roles: RoleForEval[]): Set<string> {
  const out = new Set<string>();
  for (const r of roles) {
    if (r.archivedAt != null) continue;
    for (const k of r.permissionKeys) out.add(k);
  }
  return out;
}

/**
 * Build a Principal from already-loaded roles + bootstrap status. Shared by
 * the DB path below and by tests. A SUPER_ADMIN (by role or bootstrap) is
 * expanded to the full catalogue so `principalHas` needs no special case.
 */
export function evaluatePrincipal(input: {
  userId: string;
  email: string;
  roles: RoleForEval[];
  isBootstrap: boolean;
}): Principal {
  const activeRoles = input.roles.filter((r) => r.archivedAt == null);
  const roleKeys = activeRoles.map((r) => r.key);
  const permissions = unionPermissions(input.roles);

  const isSuperAdmin =
    input.isBootstrap || roleKeys.includes(SUPER_ADMIN_ROLE_KEY);
  if (isSuperAdmin) for (const k of PERMISSION_KEYS) permissions.add(k);

  return {
    userId: input.userId,
    email: normalizeEmail(input.email),
    roleKeys,
    permissions,
    isBootstrap: input.isBootstrap,
    isSuperAdmin,
    canAccessAdmin: isSuperAdmin || permissions.size > 0,
  };
}

export function principalHas(principal: Principal, key: PermissionKey): boolean {
  return principal.isSuperAdmin || principal.permissions.has(key);
}

export function principalHasAny(
  principal: Principal,
  keys: readonly PermissionKey[],
): boolean {
  return (
    principal.isSuperAdmin || keys.some((k) => principal.permissions.has(k))
  );
}

// ── Database resolution (request-scoped memo, no cross-request cache) ───────

async function resolvePrincipal(
  userId: string,
  email: string,
): Promise<Principal> {
  const rows = await prisma.userRole.findMany({
    where: { userId, role: { archivedAt: null } },
    select: {
      role: {
        select: {
          key: true,
          archivedAt: true,
          permissions: { select: { permission: { select: { key: true } } } },
        },
      },
    },
  });

  const roles: RoleForEval[] = rows.map((r) => ({
    key: r.role.key,
    archivedAt: r.role.archivedAt,
    permissionKeys: r.role.permissions.map((p) => p.permission.key),
  }));

  return evaluatePrincipal({
    userId,
    email,
    roles,
    isBootstrap: isBootstrapEmail(email),
  });
}

/**
 * Resolve the caller's principal. Memoized per-request via `cache()` keyed on
 * the primitive args, so N guard calls in one request cost one query; a new
 * request always re-reads, so RBAC changes are effective immediately.
 */
export const getPrincipal = cache(resolvePrincipal);

/** Count of database-backed SUPER_ADMIN assignments (bootstrap NOT counted). */
export async function countDbSuperAdmins(
  db: Pick<typeof prisma, "userRole"> = prisma,
): Promise<number> {
  return db.userRole.count({
    where: { role: { key: SUPER_ADMIN_ROLE_KEY, archivedAt: null } },
  });
}
