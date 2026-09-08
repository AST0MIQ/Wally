import { describe, expect, it } from "vitest";

import {
  adminUserSearchSchema,
  assignRoleSchema,
  roleCreateSchema,
  setRolePermissionsSchema,
  zRoleKey,
} from "@/lib/validation/rbac";

describe("rbac validation", () => {
  it("zRoleKey accepts UPPER_SNAKE and rejects the rest", () => {
    expect(zRoleKey.parse("marketing_admin")).toBe("MARKETING_ADMIN");
    expect(zRoleKey.safeParse("1BAD").success).toBe(false);
    expect(zRoleKey.safeParse("has space").success).toBe(false);
    expect(zRoleKey.safeParse("a").success).toBe(false);
  });

  it("roleCreateSchema dedupes permission keys and rejects unknown ones", () => {
    const ok = roleCreateSchema.parse({
      key: "X_ADMIN",
      name: "X Admin",
      permissionKeys: ["assets.read", "assets.read", "collections.read"],
    });
    expect(ok.permissionKeys.sort()).toEqual(["assets.read", "collections.read"]);
    expect(ok.description).toBeUndefined();

    expect(
      roleCreateSchema.safeParse({
        key: "X_ADMIN",
        name: "X Admin",
        permissionKeys: ["assets.read", "not.a.real.key"],
      }).success,
    ).toBe(false);
  });

  it("roleCreateSchema requires a 2+ char name", () => {
    expect(
      roleCreateSchema.safeParse({ key: "X_ADMIN", name: "x" }).success,
    ).toBe(false);
  });

  it("setRolePermissionsSchema requires an id and a key array", () => {
    expect(
      setRolePermissionsSchema.safeParse({
        id: "clabc",
        permissionKeys: ["audit.read"],
      }).success,
    ).toBe(true);
  });

  it("assignRoleSchema requires both ids", () => {
    expect(assignRoleSchema.safeParse({ userId: "u1" }).success).toBe(false);
    expect(
      assignRoleSchema.safeParse({ userId: "u1", roleId: "r1" }).success,
    ).toBe(true);
  });

  it("adminUserSearchSchema clamps the page size and defaults it", () => {
    expect(adminUserSearchSchema.parse({}).limit).toBe(20);
    expect(adminUserSearchSchema.safeParse({ limit: 999 }).success).toBe(false);
  });
});
