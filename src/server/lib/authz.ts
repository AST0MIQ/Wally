/**
 * Capability → permission bridge for the Admin Console.
 *
 * The console was built Phase 1 against a small `Capability` vocabulary
 * (`cosmetics:write`, `audit:read`, …) used by `requireCapability()` in
 * pages and by `adminAction({ capability })`. Database-backed RBAC keeps
 * those call sites unchanged: every `Capability` now maps to one or more
 * `resource.action` permission keys (see prisma/data/rbac.ts) and a
 * capability is satisfied when the caller's unioned permissions include
 * ANY of them (or the caller is a SUPER_ADMIN / bootstrap admin).
 *
 * This file is pure (no session / DB imports) so it stays trivially
 * unit-testable. The enforcement that combines it with the request
 * principal lives in `src/server/lib/guards.ts`. Hiding navigation is
 * never authorization.
 */
import type { PermissionKey } from "@/lib/rbac/catalogue";

/** @deprecated legacy 3-tier ladder — kept only for existing pure unit tests. */
export type AdminCapabilityRole = "USER" | "CONTENT_ADMIN" | "SUPER_ADMIN";

const ROLE_RANK: Record<AdminCapabilityRole, number> = {
  USER: 0,
  CONTENT_ADMIN: 1,
  SUPER_ADMIN: 2,
};

/** @deprecated Phase-1 mapping off the boolean `User.role`. Not the enforcement
 *  path any more — `guards.ts` resolves a DB-backed principal. */
export function roleOf(user: { role: "USER" | "ADMIN" }): AdminCapabilityRole {
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
  | "user:read"
  | "roles:read"
  | "roles:write"
  | "roles:assign";

/**
 * Each capability is satisfied by ANY of these permission keys. A page or
 * action guarded by the capability passes when the principal's unioned
 * permissions intersect this list (SUPER_ADMIN / bootstrap bypass all).
 */
export const CAPABILITY_PERMISSIONS: Record<Capability, PermissionKey[]> = {
  "admin:read": ["admin.access"],
  "cosmetics:write": ["collections.write", "assets.write"],
  "cosmetics:publish": ["collections.publish", "assets.publish"],
  "entitlement:grant": ["entitlements.grant"],
  "entitlement:revoke": ["entitlements.revoke"],
  "rewardRule:write": ["rewards.write"],
  "audit:read": ["audit.read"],
  "user:read": ["users.read"],
  "roles:read": ["roles.read"],
  "roles:write": ["roles.write"],
  "roles:assign": ["roles.assign"],
};

/** @deprecated retained for `authz.test.ts` only. */
const CAPABILITY_MIN_ROLE: Record<Capability, AdminCapabilityRole> = {
  "admin:read": "CONTENT_ADMIN",
  "cosmetics:write": "CONTENT_ADMIN",
  "cosmetics:publish": "CONTENT_ADMIN",
  "entitlement:grant": "CONTENT_ADMIN",
  "entitlement:revoke": "CONTENT_ADMIN",
  "rewardRule:write": "SUPER_ADMIN",
  "audit:read": "SUPER_ADMIN",
  "user:read": "CONTENT_ADMIN",
  "roles:read": "SUPER_ADMIN",
  "roles:write": "SUPER_ADMIN",
  "roles:assign": "SUPER_ADMIN",
};

/** @deprecated pure legacy check — enforcement now goes through `guards.ts`. */
export function can(
  user: { role: "USER" | "ADMIN" },
  capability: Capability,
): boolean {
  return ROLE_RANK[roleOf(user)] >= ROLE_RANK[CAPABILITY_MIN_ROLE[capability]];
}

/** @deprecated */
export function minRoleFor(capability: Capability): AdminCapabilityRole {
  return CAPABILITY_MIN_ROLE[capability];
}
