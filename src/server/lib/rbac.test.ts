import { afterEach, describe, expect, it } from "vitest";

import {
  evaluatePrincipal,
  principalHas,
  principalHasAny,
  unionPermissions,
  type RoleForEval,
} from "@/server/lib/rbac";

const ORIGINAL = process.env.ADMIN_EMAILS;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.ADMIN_EMAILS;
  else process.env.ADMIN_EMAILS = ORIGINAL;
});

const role = (
  key: string,
  permissionKeys: string[],
  archivedAt: Date | null = null,
): RoleForEval => ({ key, permissionKeys, archivedAt });

describe("unionPermissions", () => {
  it("unions permissions across roles and ignores archived roles", () => {
    const out = unionPermissions([
      role("A", ["collections.read", "collections.write"]),
      role("B", ["assets.read", "collections.read"]),
      role("C", ["audit.read"], new Date()), // archived → contributes nothing
    ]);
    expect([...out].sort()).toEqual([
      "assets.read",
      "collections.read",
      "collections.write",
    ]);
  });

  it("is empty for no roles", () => {
    expect(unionPermissions([]).size).toBe(0);
  });
});

describe("evaluatePrincipal", () => {
  it("multiple roles → the caller holds the union of their permissions", () => {
    const p = evaluatePrincipal({
      userId: "u1",
      email: "u1@w.io",
      isBootstrap: false,
      roles: [
        role("CONTENT_ADMIN", ["admin.access", "collections.write"]),
        role("SUPPORT_ADMIN", ["admin.access", "entitlements.grant", "audit.read"]),
      ],
    });
    expect(p.roleKeys.sort()).toEqual(["CONTENT_ADMIN", "SUPPORT_ADMIN"]);
    expect(principalHas(p, "collections.write")).toBe(true);
    expect(principalHas(p, "audit.read")).toBe(true);
    expect(principalHas(p, "roles.assign")).toBe(false);
    expect(p.isSuperAdmin).toBe(false);
    expect(p.canAccessAdmin).toBe(true);
  });

  it("holding the SUPER_ADMIN role grants every permission", () => {
    const p = evaluatePrincipal({
      userId: "u2",
      email: "u2@w.io",
      isBootstrap: false,
      roles: [role("SUPER_ADMIN", [])], // seed fills its perms, but role-name alone must suffice
    });
    expect(p.isSuperAdmin).toBe(true);
    expect(principalHas(p, "roles.assign")).toBe(true);
    expect(principalHas(p, "settings.write")).toBe(true);
  });

  it("bootstrap email → SUPER_ADMIN even with zero roles", () => {
    const p = evaluatePrincipal({
      userId: "u3",
      email: "Root@Wally.io",
      isBootstrap: true,
      roles: [],
    });
    expect(p.isSuperAdmin).toBe(true);
    expect(p.isBootstrap).toBe(true);
    expect(p.canAccessAdmin).toBe(true);
    expect(principalHas(p, "audit.read")).toBe(true);
  });

  it("an archived SUPER_ADMIN assignment does NOT confer super-admin", () => {
    const p = evaluatePrincipal({
      userId: "u4",
      email: "u4@w.io",
      isBootstrap: false,
      roles: [role("SUPER_ADMIN", ["roles.assign"], new Date())],
    });
    expect(p.isSuperAdmin).toBe(false);
    expect(p.roleKeys).toEqual([]);
    expect(principalHas(p, "roles.assign")).toBe(false);
    expect(p.canAccessAdmin).toBe(false);
  });

  it("no roles and not bootstrap → cannot access the console", () => {
    const p = evaluatePrincipal({
      userId: "u5",
      email: "u5@w.io",
      isBootstrap: false,
      roles: [role("USER", [])],
    });
    expect(p.canAccessAdmin).toBe(false);
    expect(p.isSuperAdmin).toBe(false);
  });

  it("principalHasAny needs only one matching key", () => {
    const p = evaluatePrincipal({
      userId: "u6",
      email: "u6@w.io",
      isBootstrap: false,
      roles: [role("X", ["assets.write"])],
    });
    expect(principalHasAny(p, ["collections.write", "assets.write"])).toBe(true);
    expect(principalHasAny(p, ["collections.write", "collections.publish"])).toBe(false);
  });
});
