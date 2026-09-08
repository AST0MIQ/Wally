import type { Capability } from "@/server/lib/authz";

/**
 * Route → capability map for the Admin Console. Every `/admin/*` page calls
 * `requireCapability(capabilityForRoute(pathname))` server-side — UI visibility
 * is never authorization. Ordered most-specific first.
 *
 * This is the seam for DB-backed RBAC: when real roles land, only
 * `CAPABILITY_MIN_ROLE` (authz.ts) and `roleOf()` change — this map stays.
 */
export const ADMIN_ROUTE_CAPABILITIES: ReadonlyArray<
  readonly [prefix: string, capability: Capability]
> = [
  ["/admin/appearance/collections", "cosmetics:write"],
  ["/admin/appearance/assets", "cosmetics:write"],
  ["/admin/appearance/studio", "cosmetics:write"],
  ["/admin/appearance/preview", "cosmetics:write"],
  ["/admin/appearance/media", "cosmetics:write"],
  ["/admin/appearance", "cosmetics:write"],
  ["/admin/access/users", "roles:read"],
  ["/admin/access/roles", "roles:read"],
  ["/admin/access/permissions", "roles:read"],
  ["/admin/access/invitations", "roles:read"],
  ["/admin/access", "roles:read"],
  ["/admin/rewards/rules", "rewardRule:write"],
  ["/admin/rewards/rank-streak", "admin:read"],
  ["/admin/rewards", "admin:read"],
  ["/admin/users/entitlements", "user:read"],
  ["/admin/users/loadouts", "user:read"],
  ["/admin/users", "user:read"],
  ["/admin/operations/audit", "audit:read"],
  ["/admin/operations", "admin:read"],
  ["/admin/commerce", "admin:read"],
  ["/admin", "admin:read"],
];

export function capabilityForRoute(pathname: string): Capability {
  for (const [prefix, capability] of ADMIN_ROUTE_CAPABILITIES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return capability;
    }
  }
  return "admin:read";
}
