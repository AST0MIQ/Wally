import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { describeDb } from "./_db";

// Drive the request guards with a controllable session.
vi.mock("@/server/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { AppError } from "@/server/lib/errors";
import {
  requireCapability,
  requireSuperAdmin,
  getRequestPrincipal,
} from "@/server/lib/guards";
import { countDbSuperAdmins } from "@/server/lib/rbac";
import { seedRbac } from "../../prisma/data/rbac";
import {
  assignRole,
  getUserAccess,
  revokeRole,
  searchAdminUsers,
} from "@/server/services/rbac/user-role.service";
import {
  archiveRole,
  createRole,
  setRolePermissions,
} from "@/server/services/rbac/role.service";
import { assignRoleAction } from "@/app/actions/admin/user-roles";

const mockedAuth = vi.mocked(auth);
const asSession = (user: { id: string; email: string } | null) =>
  mockedAuth.mockResolvedValue((user ? { user } : null) as never);

const uniq = () => Math.random().toString(36).slice(2, 8);

describeDb("RBAC (DB)", () => {
  const created = { users: [] as string[], roles: [] as string[] };
  const roleId: Record<string, string> = {};
  const RID = (key: string): string => {
    const id = roleId[key];
    if (!id) throw new Error(`role ${key} not seeded`);
    return id;
  };
  const ORIGINAL_ADMIN_EMAILS = process.env.ADMIN_EMAILS;

  async function mkUser(email: string) {
    const u = await prisma.user.create({ data: { email } });
    created.users.push(u.id);
    return u;
  }

  beforeAll(async () => {
    process.env.ADMIN_EMAILS = "";
    await seedRbac(prisma);
    const roles = await prisma.accessRole.findMany({ select: { id: true, key: true } });
    Object.assign(roleId, Object.fromEntries(roles.map((r) => [r.key, r.id])));
  });

  afterAll(async () => {
    if (ORIGINAL_ADMIN_EMAILS === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = ORIGINAL_ADMIN_EMAILS;
    await prisma.userRole.deleteMany({ where: { userId: { in: created.users } } });
    await prisma.auditLog.deleteMany({ where: { userId: { in: created.users } } });
    if (created.roles.length) {
      await prisma.rolePermission.deleteMany({ where: { roleId: { in: created.roles } } });
      await prisma.userRole.deleteMany({ where: { roleId: { in: created.roles } } });
      await prisma.accessRole.deleteMany({ where: { id: { in: created.roles } } });
    }
    await prisma.user.deleteMany({ where: { id: { in: created.users } } });
    await prisma.$disconnect();
  });

  // ── seed shape ──────────────────────────────────────────────────────────
  it("seeds six system roles and a full permission catalogue", async () => {
    const roles = await prisma.accessRole.findMany({ where: { isSystem: true } });
    expect(roles.map((r) => r.key).sort()).toEqual(
      ["COMMERCE_ADMIN", "CONTENT_ADMIN", "REWARD_ADMIN", "SUPER_ADMIN", "SUPPORT_ADMIN", "USER"].sort(),
    );
    const perms = await prisma.permission.count();
    expect(perms).toBeGreaterThanOrEqual(23);
  });

  // ── normalized email lookup + pagination ────────────────────────────────
  it("searches users by normalized email, and paginates without loading the table", async () => {
    const tag = `pag-${uniq()}`;
    await mkUser(`alice.${tag}@ex.io`);
    await mkUser(`bob.${tag}@ex.io`);
    await mkUser(`carol.${tag}@ex.io`);

    // no query → never returns rows (won't scan the whole table)
    expect((await searchAdminUsers({})).rows).toEqual([]);

    // mixed case + surrounding whitespace still matches
    const page1 = await searchAdminUsers({ q: `  ${tag.toUpperCase()}@EX.IO `, limit: 2 });
    expect(page1.rows.length).toBe(2);
    expect(page1.nextCursor).toBeTruthy();

    const page2 = await searchAdminUsers({ q: tag, limit: 2, cursor: page1.nextCursor! });
    expect(page2.rows.length).toBe(1);
    const emails = [...page1.rows, ...page2.rows].map((r) => r.email).sort();
    expect(emails).toEqual([`alice.${tag}@ex.io`, `bob.${tag}@ex.io`, `carol.${tag}@ex.io`]);
  });

  // ── multiple roles + permission union ──────────────────────────────────
  it("a user with multiple roles gets the UNION of their permissions", async () => {
    const u = await mkUser(`multi-${uniq()}@ex.io`);
    const admin = await mkUser(`admin-${uniq()}@ex.io`);
    await assignRole(admin.id, u.id, RID("CONTENT_ADMIN"));
    await assignRole(admin.id, u.id, RID("SUPPORT_ADMIN"));

    const access = await getUserAccess(u.id);
    expect(access!.roles.map((r) => r.key).sort()).toEqual(["CONTENT_ADMIN", "SUPPORT_ADMIN"]);
    // from CONTENT_ADMIN
    expect(access!.effectivePermissions).toContain("collections.write");
    // from SUPPORT_ADMIN
    expect(access!.effectivePermissions).toContain("audit.read");
    expect(access!.effectivePermissions).toContain("entitlements.grant");
    // neither grants access control
    expect(access!.effectivePermissions).not.toContain("roles.assign");
    expect(access!.isSuperAdmin).toBe(false);
  });

  // ── assignment / revocation + audit ────────────────────────────────────
  it("assign + revoke are idempotent-safe and fully audited", async () => {
    const u = await mkUser(`ar-${uniq()}@ex.io`);
    const admin = await mkUser(`admin-${uniq()}@ex.io`);

    await assignRole(admin.id, u.id, RID("REWARD_ADMIN"));
    await assignRole(admin.id, u.id, RID("REWARD_ADMIN")); // idempotent — no 2nd row/audit
    expect(await prisma.userRole.count({ where: { userId: u.id, roleId: RID("REWARD_ADMIN") } })).toBe(1);

    await revokeRole(admin.id, u.id, RID("REWARD_ADMIN"));
    expect(await prisma.userRole.count({ where: { userId: u.id } })).toBe(0);

    const audits = await prisma.auditLog.findMany({
      where: { userId: admin.id, entity: "UserRole" },
      orderBy: { createdAt: "asc" },
    });
    expect(audits.map((a) => a.action)).toEqual(["role.assign", "role.revoke"]);
    for (const a of audits) {
      expect(a.metadata).toMatchObject({ targetUserId: u.id, roleKey: "REWARD_ADMIN" });
    }
  });

  // ── permission change takes effect immediately ────────────────────────
  it("editing a role's permissions changes a holder's effective set on the next read", async () => {
    const u = await mkUser(`imm-${uniq()}@ex.io`);
    const admin = await mkUser(`admin-${uniq()}@ex.io`);
    const role = await createRole(admin.id, {
      key: `IMM_${uniq().toUpperCase()}`,
      name: "Immediate",
      description: undefined,
      permissionKeys: ["assets.read"],
    });
    created.roles.push(role.id);
    await assignRole(admin.id, u.id, role.id);

    let access = await getUserAccess(u.id);
    expect(access!.effectivePermissions).toEqual(["assets.read"]);

    await setRolePermissions(admin.id, role.id, ["assets.read", "collections.read"]);
    access = await getUserAccess(u.id);
    expect(access!.effectivePermissions.sort()).toEqual(["assets.read", "collections.read"]);

    const change = await prisma.auditLog.findFirst({
      where: { userId: admin.id, action: "rolePermission.change", entityId: role.id },
    });
    expect(change?.metadata).toMatchObject({ added: ["collections.read"], removed: [] });
  });

  // ── archived-role restrictions ────────────────────────────────────────
  it("an archived role cannot be assigned and does not grant its permissions", async () => {
    const u = await mkUser(`arch-${uniq()}@ex.io`);
    const admin = await mkUser(`admin-${uniq()}@ex.io`);
    const role = await createRole(admin.id, {
      key: `ARCH_${uniq().toUpperCase()}`,
      name: "Archivable",
      description: undefined,
      permissionKeys: ["audit.read"],
    });
    created.roles.push(role.id);

    await assignRole(admin.id, u.id, role.id);
    expect((await getUserAccess(u.id))!.effectivePermissions).toContain("audit.read");

    await archiveRole(admin.id, role.id);

    // holder keeps the row, but the archived role contributes nothing
    const access = await getUserAccess(u.id);
    expect(access!.effectivePermissions).not.toContain("audit.read");

    // and it can't be freshly assigned to someone else
    const u2 = await mkUser(`arch2-${uniq()}@ex.io`);
    await expect(assignRole(admin.id, u2.id, role.id)).rejects.toThrow(AppError);
    await expect(assignRole(admin.id, u2.id, role.id)).rejects.toMatchObject({
      message: "role_archived",
    });
  });

  it("a system role cannot be archived or have its permissions edited", async () => {
    const admin = await mkUser(`admin-${uniq()}@ex.io`);
    await expect(archiveRole(admin.id, RID("CONTENT_ADMIN"))).rejects.toMatchObject({
      message: "system_role_locked",
    });
    await expect(
      setRolePermissions(admin.id, RID("CONTENT_ADMIN"), ["assets.read"]),
    ).rejects.toMatchObject({ message: "system_role_locked" });
  });

  // ── bootstrap access ──────────────────────────────────────────────────
  it("an ADMIN_EMAILS bootstrap admin is SUPER_ADMIN with zero DB roles", async () => {
    const email = `boot-${uniq()}@ex.io`;
    const u = await mkUser(email);
    process.env.ADMIN_EMAILS = `other@x.io, ${email.toUpperCase()} `;
    try {
      const access = await getUserAccess(u.id);
      expect(access!.roles).toEqual([]);
      expect(access!.isBootstrap).toBe(true);
      expect(access!.isSuperAdmin).toBe(true);
      expect(access!.effectivePermissions).toContain("roles.assign");

      asSession({ id: u.id, email });
      await expect(requireSuperAdmin()).resolves.toBeTruthy();
      await expect(requireCapability("audit:read")).resolves.toBeTruthy();
    } finally {
      process.env.ADMIN_EMAILS = "";
    }
  });

  // ── unauthenticated / unauthorized / direct invocation ────────────────
  it("guards reject unauthenticated and under-privileged callers", async () => {
    // unauthenticated → requireUser redirects (throws NEXT_REDIRECT)
    asSession(null);
    await expect(requireCapability("admin:read")).rejects.toThrow();

    // authenticated but no roles → not even console access → redirect
    const nobody = await mkUser(`nobody-${uniq()}@ex.io`);
    asSession({ id: nobody.id, email: nobody.email });
    await expect(requireCapability("admin:read")).rejects.toThrow();

    // CONTENT_ADMIN: passes its own capability, FORBIDDEN on one it lacks
    const admin = await mkUser(`admin-${uniq()}@ex.io`);
    const ca = await mkUser(`ca-${uniq()}@ex.io`);
    await assignRole(admin.id, ca.id, RID("CONTENT_ADMIN"));
    asSession({ id: ca.id, email: ca.email });
    await expect(requireCapability("cosmetics:write")).resolves.toBeTruthy();
    await expect(requireCapability("audit:read")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const p = await getRequestPrincipal();
    expect(p.isSuperAdmin).toBe(false);
  });

  it("calling a SUPER_ADMIN-only Server Action directly is refused without UI", async () => {
    const admin = await mkUser(`admin-${uniq()}@ex.io`);
    const ca = await mkUser(`ca-${uniq()}@ex.io`);
    const target = await mkUser(`t-${uniq()}@ex.io`);
    await assignRole(admin.id, ca.id, RID("CONTENT_ADMIN"));

    // a non-super admin → normalized fail result, no mutation
    asSession({ id: ca.id, email: ca.email });
    const res = await assignRoleAction({ userId: target.id, roleId: RID("SUPPORT_ADMIN") });
    expect(res.ok).toBe(false);
    expect(await prisma.userRole.count({ where: { userId: target.id } })).toBe(0);

    // unauthenticated → the wrapper rethrows the redirect
    asSession(null);
    await expect(
      assignRoleAction({ userId: target.id, roleId: RID("SUPPORT_ADMIN") }),
    ).rejects.toThrow();
  });

  // ── final active SUPER_ADMIN protection ──────────────────────────────
  it("refuses to remove the last database-backed SUPER_ADMIN (bootstrap not counted)", async () => {
    const admin = await mkUser(`admin-${uniq()}@ex.io`);
    const a = await mkUser(`sa-a-${uniq()}@ex.io`);
    const b = await mkUser(`sa-b-${uniq()}@ex.io`);

    expect(await countDbSuperAdmins()).toBe(0);
    await assignRole(admin.id, a.id, RID("SUPER_ADMIN"));
    expect(await countDbSuperAdmins()).toBe(1);

    // only one → cannot revoke it
    await expect(revokeRole(admin.id, a.id, RID("SUPER_ADMIN"))).rejects.toMatchObject({
      message: "last_super_admin",
    });
    expect(await countDbSuperAdmins()).toBe(1);

    // add a second → now the first can go
    await assignRole(admin.id, b.id, RID("SUPER_ADMIN"));
    await revokeRole(admin.id, a.id, RID("SUPER_ADMIN"));
    expect(await countDbSuperAdmins()).toBe(1);

    // ...but not the last remaining one
    await expect(revokeRole(admin.id, b.id, RID("SUPER_ADMIN"))).rejects.toMatchObject({
      message: "last_super_admin",
    });
    expect(await countDbSuperAdmins()).toBe(1);

    await prisma.userRole.deleteMany({ where: { roleId: RID("SUPER_ADMIN") } });
  });

  it("concurrent revocations of the final two SUPER_ADMINs cannot both succeed", async () => {
    const admin = await mkUser(`admin-${uniq()}@ex.io`);
    const a = await mkUser(`race-a-${uniq()}@ex.io`);
    const b = await mkUser(`race-b-${uniq()}@ex.io`);
    await assignRole(admin.id, a.id, RID("SUPER_ADMIN"));
    await assignRole(admin.id, b.id, RID("SUPER_ADMIN"));
    expect(await countDbSuperAdmins()).toBe(2);

    const results = await Promise.allSettled([
      revokeRole(admin.id, a.id, RID("SUPER_ADMIN")),
      revokeRole(admin.id, b.id, RID("SUPER_ADMIN")),
    ]);
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter(
      (r) => r.status === "rejected" && (r.reason as AppError)?.message === "last_super_admin",
    ).length;
    expect(ok).toBe(1);
    expect(failed).toBe(1);
    expect(await countDbSuperAdmins()).toBe(1);

    await prisma.userRole.deleteMany({ where: { roleId: RID("SUPER_ADMIN") } });
  });
});
