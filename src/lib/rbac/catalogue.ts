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
  { key: "admin.access", resource: "admin", action: "access", description: "เข้าใช้งานหน้าผู้ดูแลระบบ" },

  { key: "collections.read", resource: "collections", action: "read", description: "ดูคอลเลกชันไอเทม" },
  { key: "collections.write", resource: "collections", action: "write", description: "สร้างและแก้ไขคอลเลกชัน" },
  { key: "collections.publish", resource: "collections", action: "publish", description: "เผยแพร่ ซ่อน หรือเก็บคอลเลกชันเข้าคลัง" },
  { key: "collections.delete", resource: "collections", action: "delete", description: "ลบคอลเลกชันฉบับร่างออกถาวร" },

  { key: "assets.read", resource: "assets", action: "read", description: "ดูไอเทม" },
  { key: "assets.write", resource: "assets", action: "write", description: "สร้างและแก้ไขไอเทม" },
  { key: "assets.publish", resource: "assets", action: "publish", description: "เผยแพร่ ซ่อน หรือเก็บไอเทมเข้าคลัง" },
  { key: "assets.delete", resource: "assets", action: "delete", description: "ลบไอเทมฉบับร่างออกถาวร" },

  { key: "rewards.read", resource: "rewards", action: "read", description: "ดูกติกาการให้รางวัล" },
  { key: "rewards.write", resource: "rewards", action: "write", description: "สร้าง แก้ไข และเปิด/ปิดกติกาการให้รางวัล" },

  { key: "entitlements.read", resource: "entitlements", action: "read", description: "ดูสิทธิ์ครอบครองและชุดแต่งตัวของผู้ใช้" },
  { key: "entitlements.grant", resource: "entitlements", action: "grant", description: "มอบไอเทมหรือคอลเลกชันให้ผู้ใช้" },
  { key: "entitlements.revoke", resource: "entitlements", action: "revoke", description: "เพิกถอนสิทธิ์ครอบครองของผู้ใช้" },

  { key: "users.read", resource: "users", action: "read", description: "ค้นหารายชื่อผู้ใช้ที่ลงทะเบียน" },

  { key: "commerce.read", resource: "commerce", action: "read", description: "ดูสินค้าและคำสั่งซื้อ" },
  { key: "commerce.write", resource: "commerce", action: "write", description: "จัดการสินค้าและคำสั่งซื้อ" },

  { key: "roles.read", resource: "roles", action: "read", description: "ดูชุดสิทธิ์ รายการสิทธิ์ และผู้ดูแลระบบ" },
  { key: "roles.write", resource: "roles", action: "write", description: "สร้าง แก้ไข และเก็บถาวรชุดสิทธิ์พร้อมสิทธิ์ในชุด" },
  { key: "roles.assign", resource: "roles", action: "assign", description: "กำหนดและเพิกถอนชุดสิทธิ์ของผู้ใช้ (เฉพาะ SUPER_ADMIN)" },

  { key: "settings.read", resource: "settings", action: "read", description: "ดูการตั้งค่าระบบ" },
  { key: "settings.write", resource: "settings", action: "write", description: "แก้ไขการตั้งค่าระบบ" },

  { key: "audit.read", resource: "audit", action: "read", description: "ดูบันทึกการตรวจสอบ" },
] as const;

/** Human-readable Thai label for each permission `resource` group. */
export const RESOURCE_LABELS: Record<string, string> = {
  admin: "ผู้ดูแลระบบ",
  collections: "คอลเลกชัน",
  assets: "ไอเทม",
  rewards: "รางวัล",
  entitlements: "สิทธิ์ครอบครอง",
  users: "ผู้ใช้",
  commerce: "การขาย",
  roles: "ชุดสิทธิ์การใช้งาน",
  settings: "การตั้งค่า",
  audit: "การตรวจสอบ",
};

export function resourceLabel(resource: string): string {
  return RESOURCE_LABELS[resource] ?? resource;
}

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
  "users.read",
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
