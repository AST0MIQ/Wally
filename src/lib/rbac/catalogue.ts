/**
 * RBAC catalogue — the permission vocabulary and the six seeded system roles.
 * Pure data, no imports: consumed by the seed (`prisma/data/rbac.ts`), the
 * capability bridge (`src/server/lib/authz.ts`), the authorization module
 * (`src/server/lib/rbac.ts`) and the Access Control UI.
 *
 * Permission keys are `resource.action` strings and are the ONLY authorization
 * primitive the app checks. Once shipped a key is never renamed or removed —
 * that would silently rewrite authorization history. Add keys; deprecate,
 * don't delete.
 *
 * System-role permission sets are LOCKED to this file: `seedRbac` reconciles
 * each system role to exactly the list here on every run. Custom roles created
 * in the Admin Console are never touched by the seed.
 */

export const PERMISSIONS = [
  { key: "admin.access", resource: "admin", action: "access", description: "Enter the Admin Console" },

  { key: "collections.read", resource: "collections", action: "read", description: "View cosmetic collections" },
  { key: "collections.write", resource: "collections", action: "write", description: "Create and edit collections" },
  { key: "collections.publish", resource: "collections", action: "publish", description: "Publish / hide / archive collections" },
  { key: "collections.delete", resource: "collections", action: "delete", description: "Hard-delete a draft collection" },

  { key: "assets.read", resource: "assets", action: "read", description: "View cosmetic assets" },
  { key: "assets.write", resource: "assets", action: "write", description: "Create and edit assets" },
  { key: "assets.publish", resource: "assets", action: "publish", description: "Publish / hide / archive assets" },
  { key: "assets.delete", resource: "assets", action: "delete", description: "Hard-delete a draft asset" },

  { key: "rewards.read", resource: "rewards", action: "read", description: "View reward rules" },
  { key: "rewards.write", resource: "rewards", action: "write", description: "Create, edit and toggle reward rules" },

  { key: "entitlements.read", resource: "entitlements", action: "read", description: "View a user's entitlements and loadout" },
  { key: "entitlements.grant", resource: "entitlements", action: "grant", description: "Grant an asset or collection to a user" },
  { key: "entitlements.revoke", resource: "entitlements", action: "revoke", description: "Revoke a user's entitlement" },

  { key: "users.read", resource: "users", action: "read", description: "Search the registered-user directory" },

  { key: "commerce.read", resource: "commerce", action: "read", description: "View products and orders" },
  { key: "commerce.write", resource: "commerce", action: "write", description: "Manage products and orders" },

  { key: "roles.read", resource: "roles", action: "read", description: "View roles, permissions and admin users" },
  { key: "roles.write", resource: "roles", action: "write", description: "Create, edit and archive roles and their permissions" },
  { key: "roles.assign", resource: "roles", action: "assign", description: "Assign and revoke a user's roles (SUPER_ADMIN only)" },

  { key: "settings.read", resource: "settings", action: "read", description: "View runtime configuration" },
  { key: "settings.write", resource: "settings", action: "write", description: "Change runtime configuration" },

  { key: "audit.read", resource: "audit", action: "read", description: "Read the audit log" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const PERMISSION_KEYS: PermissionKey[] = PERMISSIONS.map((p) => p.key);

export function isPermissionKey(x: string): x is PermissionKey {
  return (PERMISSION_KEYS as string[]).includes(x);
}

/** Catalogue grouped by resource, in declaration order — for the read-only UI. */
export function permissionsByResource(): {
  resource: string;
  permissions: { key: PermissionKey; action: string; description: string }[];
}[] {
  const groups = new Map<
    string,
    { key: PermissionKey; action: string; description: string }[]
  >();
  for (const p of PERMISSIONS) {
    if (!groups.has(p.resource)) groups.set(p.resource, []);
    groups.get(p.resource)!.push({ key: p.key, action: p.action, description: p.description });
  }
  return [...groups.entries()].map(([resource, permissions]) => ({ resource, permissions }));
}

/** The one system role whose NAME confers privilege (narrow bypass). */
export const SUPER_ADMIN_ROLE_KEY = "SUPER_ADMIN";

const K = (keys: PermissionKey[]) => keys;

const CONTENT: PermissionKey[] = K([
  "admin.access",
  "collections.read", "collections.write", "collections.publish", "collections.delete",
  "assets.read", "assets.write", "assets.publish", "assets.delete",
  "rewards.read",
  "entitlements.read",
]);

const REWARD: PermissionKey[] = K([
  "admin.access",
  "rewards.read", "rewards.write",
  "entitlements.read", "entitlements.grant", "entitlements.revoke",
  "collections.read", "assets.read",
]);

const SUPPORT: PermissionKey[] = K([
  "admin.access",
  "users.read",
  "entitlements.read", "entitlements.grant", "entitlements.revoke",
  "audit.read",
  "collections.read", "assets.read",
]);

const COMMERCE: PermissionKey[] = K([
  "admin.access",
  "commerce.read", "commerce.write",
  "entitlements.read",
  "users.read",
]);

export type SystemRoleDef = {
  key: string;
  name: string;
  description: string;
  permissions: PermissionKey[];
};

export const SYSTEM_ROLES: SystemRoleDef[] = [
  {
    key: "USER",
    name: "User",
    description: "Baseline registered user. Carries no Admin Console permissions.",
    permissions: [],
  },
  {
    key: "CONTENT_ADMIN",
    name: "Content Admin",
    description: "Authors cosmetic collections and assets.",
    permissions: CONTENT,
  },
  {
    key: "REWARD_ADMIN",
    name: "Reward Admin",
    description: "Manages reward rules and grants entitlements.",
    permissions: REWARD,
  },
  {
    key: "SUPPORT_ADMIN",
    name: "Support Admin",
    description:
      "Assists users: inspects accounts (non-financial), grants/revokes entitlements, reads the audit log.",
    permissions: SUPPORT,
  },
  {
    key: "COMMERCE_ADMIN",
    name: "Commerce Admin",
    description: "Manages commerce (Phase 2) and related entitlements.",
    permissions: COMMERCE,
  },
  {
    key: SUPER_ADMIN_ROLE_KEY,
    name: "Super Admin",
    description:
      "Full access, including access control. The only role whose NAME grants privilege.",
    permissions: [...PERMISSION_KEYS],
  },
];

export const SYSTEM_ROLE_KEYS: string[] = SYSTEM_ROLES.map((r) => r.key);

export function isSystemRoleKey(key: string): boolean {
  return SYSTEM_ROLE_KEYS.includes(key);
}
