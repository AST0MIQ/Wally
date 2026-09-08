import { describe, expect, it } from "vitest";

import {
  PERMISSION_KEYS,
  PERMISSIONS,
  SUPER_ADMIN_ROLE_KEY,
  SYSTEM_ROLES,
  isPermissionKey,
  isSystemRoleKey,
  permissionsByResource,
} from "@/lib/rbac/catalogue";

describe("rbac catalogue", () => {
  it("permission keys are unique and shaped resource.action", () => {
    expect(new Set(PERMISSION_KEYS).size).toBe(PERMISSION_KEYS.length);
    for (const p of PERMISSIONS) {
      expect(p.key).toBe(`${p.resource}.${p.action}`);
      expect(p.description.length).toBeGreaterThan(0);
    }
  });

  it("every system role references only real permission keys", () => {
    for (const role of SYSTEM_ROLES) {
      for (const k of role.permissions) expect(isPermissionKey(k)).toBe(true);
    }
  });

  it("SUPER_ADMIN holds every permission; USER holds none", () => {
    const sa = SYSTEM_ROLES.find((r) => r.key === SUPER_ADMIN_ROLE_KEY)!;
    expect([...sa.permissions].sort()).toEqual([...PERMISSION_KEYS].sort());
    const user = SYSTEM_ROLES.find((r) => r.key === "USER")!;
    expect(user.permissions).toEqual([]);
  });

  it("the six required system roles exist", () => {
    expect(SYSTEM_ROLES.map((r) => r.key).sort()).toEqual(
      [
        "COMMERCE_ADMIN",
        "CONTENT_ADMIN",
        "REWARD_ADMIN",
        "SUPER_ADMIN",
        "SUPPORT_ADMIN",
        "USER",
      ].sort(),
    );
    expect(isSystemRoleKey("SUPER_ADMIN")).toBe(true);
    expect(isSystemRoleKey("MARKETING_ADMIN")).toBe(false);
  });

  it("every admin system role can enter the console (admin.access)", () => {
    for (const role of SYSTEM_ROLES) {
      if (role.key === "USER") continue;
      expect(role.permissions).toContain("admin.access");
    }
  });

  it("permissionsByResource covers the whole catalogue once", () => {
    const flat = permissionsByResource().flatMap((g) => g.permissions.map((p) => p.key));
    expect(flat.sort()).toEqual([...PERMISSION_KEYS].sort());
  });
});
