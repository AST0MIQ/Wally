/**
 * Capability-based authorization for the Admin Console — **pure** (no session /
 * DB imports) so it stays trivially unit-testable.
 *
 * Phase 1 uses the existing boolean `User.role` (`USER` | `ADMIN`) but routes
 * every check through a capability ladder so database-backed roles
 * (`CONTENT_ADMIN`, `SUPER_ADMIN`) can be introduced later without touching
 * call sites. The server guard that combines this with the session lives in
 * `src/server/lib/guards.ts` (`requireCapability`). Hiding navigation is never
 * authorization — `/admin/*` routes, Server Actions and any Route Handlers all
 * enforce it server-side.
 */

type RoleLike = { role: "USER" | "ADMIN" };

export type AdminCapabilityRole = "USER" | "CONTENT_ADMIN" | "SUPER_ADMIN";

const ROLE_RANK: Record<AdminCapabilityRole, number> = {
  USER: 0,
  CONTENT_ADMIN: 1,
  SUPER_ADMIN: 2,
};

/**
 * Map the current identity onto the capability ladder. Phase 1: any `ADMIN`
 * is a `SUPER_ADMIN`. Later: read a real `adminRole` column here.
 */
export function roleOf(user: RoleLike): AdminCapabilityRole {
  return user.role === "ADMIN" ? "SUPER_ADMIN" : "USER";
}

export type Capability =
  | "admin:read"
  | "cosmetics:write"
  | "cosmetics:publish"
  | "entitlement:grant"
  | "entitlement:revoke"
  | "rewardRule:write"
  | "audit:read"
  | "user:read";

const CAPABILITY_MIN_ROLE: Record<Capability, AdminCapabilityRole> = {
  "admin:read": "CONTENT_ADMIN",
  "cosmetics:write": "CONTENT_ADMIN",
  "cosmetics:publish": "CONTENT_ADMIN",
  "entitlement:grant": "CONTENT_ADMIN",
  "entitlement:revoke": "CONTENT_ADMIN",
  "rewardRule:write": "SUPER_ADMIN",
  "audit:read": "SUPER_ADMIN",
  "user:read": "CONTENT_ADMIN",
};

export function can(user: RoleLike, capability: Capability): boolean {
  return ROLE_RANK[roleOf(user)] >= ROLE_RANK[CAPABILITY_MIN_ROLE[capability]];
}

/** Lowest capability role that satisfies `capability` (for admin UI hints). */
export function minRoleFor(capability: Capability): AdminCapabilityRole {
  return CAPABILITY_MIN_ROLE[capability];
}
