import { prisma } from "@/server/db";
import { auditInTx } from "@/server/lib/audit";
import { conflict, notFound } from "@/server/lib/errors";
import { serializableTx } from "@/server/lib/tx";
import { isSystemRoleKey, SYSTEM_ROLE_KEYS } from "@/lib/rbac/catalogue";
import type { RoleCreateInput } from "@/lib/validation/rbac";

export type RoleRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  permissionKeys: string[];
  userCount: number;
};

const roleSelect = {
  id: true,
  key: true,
  name: true,
  description: true,
  isSystem: true,
  archivedAt: true,
  createdAt: true,
  permissions: { select: { permission: { select: { key: true } } } },
  _count: { select: { users: true } },
} as const;

function toRow(r: {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  permissions: { permission: { key: string } }[];
  _count: { users: number };
}): RoleRow {
  return {
    id: r.id,
    key: r.key,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    archivedAt: r.archivedAt,
    createdAt: r.createdAt,
    permissionKeys: r.permissions.map((p) => p.permission.key).sort(),
    userCount: r._count.users,
  };
}

/** System roles first (seed order), then custom roles, archived sink to the end. */
export async function listRoles(): Promise<RoleRow[]> {
  const rows = (await prisma.accessRole.findMany({ select: roleSelect })).map(toRow);
  const sysOrder = (k: string) => {
    const i = SYSTEM_ROLE_KEYS.indexOf(k);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return rows.sort((a, b) => {
    if (!!a.archivedAt !== !!b.archivedAt) return a.archivedAt ? 1 : -1;
    if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
    if (a.isSystem && b.isSystem) return sysOrder(a.key) - sysOrder(b.key);
    return a.name.localeCompare(b.name);
  });
}

export async function getRole(id: string): Promise<RoleRow | null> {
  const r = await prisma.accessRole.findUnique({ where: { id }, select: roleSelect });
  return r ? toRow(r) : null;
}

async function permIdsForKeys(
  tx: { permission: typeof prisma.permission },
  keys: string[],
): Promise<string[]> {
  if (keys.length === 0) return [];
  const rows = await tx.permission.findMany({
    where: { key: { in: keys } },
    select: { id: true, key: true },
  });
  if (rows.length !== new Set(keys).size) {
    conflict("unknown_permission_key");
  }
  return rows.map((r) => r.id);
}

export async function createRole(adminId: string, input: RoleCreateInput) {
  if (isSystemRoleKey(input.key)) conflict("reserved_role_key");

  return serializableTx(async (tx) => {
    const existing = await tx.accessRole.findUnique({ where: { key: input.key } });
    if (existing) conflict("role_key_taken");

    const permIds = await permIdsForKeys(tx, input.permissionKeys);
    const role = await tx.accessRole.create({
      data: {
        key: input.key,
        name: input.name,
        description: input.description,
        isSystem: false,
        permissions: {
          create: permIds.map((permissionId) => ({
            permissionId,
            grantedByUserId: adminId,
          })),
        },
      },
    });
    await auditInTx(tx, {
      userId: adminId,
      action: "role.create",
      entity: "AccessRole",
      entityId: role.id,
      metadata: { key: role.key, name: role.name, permissionKeys: input.permissionKeys },
    });
    return role;
  });
}

/** Metadata only. System roles are seed-defined and fully locked. */
export async function updateRole(
  adminId: string,
  patch: { id: string; name?: string; description?: string },
) {
  return serializableTx(async (tx) => {
    const current = await tx.accessRole.findUnique({ where: { id: patch.id } });
    if (!current) notFound("role_not_found");
    if (current.isSystem) conflict("system_role_locked");

    const role = await tx.accessRole.update({
      where: { id: patch.id },
      data: { name: patch.name, description: patch.description },
    });
    await auditInTx(tx, {
      userId: adminId,
      action: "role.update",
      entity: "AccessRole",
      entityId: role.id,
      metadata: {
        key: role.key,
        before: { name: current.name, description: current.description },
        after: { name: role.name, description: role.description },
      },
    });
    return role;
  });
}

/**
 * Replace a custom role's permission set. System roles are locked (their set
 * is reconciled by the seed). Archived roles cannot be edited. Audited with
 * the exact added/removed key lists.
 */
export async function setRolePermissions(
  adminId: string,
  id: string,
  permissionKeys: string[],
) {
  return serializableTx(async (tx) => {
    const role = await tx.accessRole.findUnique({
      where: { id },
      select: {
        id: true,
        key: true,
        isSystem: true,
        archivedAt: true,
        permissions: { select: { permission: { select: { id: true, key: true } } } },
      },
    });
    if (!role) notFound("role_not_found");
    if (role.isSystem) conflict("system_role_locked");
    if (role.archivedAt) conflict("role_archived");

    const wantIds = new Set(await permIdsForKeys(tx, permissionKeys));
    const haveIds = new Set(role.permissions.map((p) => p.permission.id));
    const haveKeyById = new Map(role.permissions.map((p) => [p.permission.id, p.permission.key]));

    const toAdd = [...wantIds].filter((x) => !haveIds.has(x));
    const toRemove = [...haveIds].filter((x) => !wantIds.has(x));
    if (toAdd.length === 0 && toRemove.length === 0) return role;

    if (toRemove.length) {
      await tx.rolePermission.deleteMany({
        where: { roleId: id, permissionId: { in: toRemove } },
      });
    }
    if (toAdd.length) {
      await tx.rolePermission.createMany({
        data: toAdd.map((permissionId) => ({
          roleId: id,
          permissionId,
          grantedByUserId: adminId,
        })),
        skipDuplicates: true,
      });
    }

    const keyOf = async (ids: string[]) => {
      const missing = ids.filter((x) => !haveKeyById.has(x));
      const extra = missing.length
        ? await tx.permission.findMany({
            where: { id: { in: missing } },
            select: { id: true, key: true },
          })
        : [];
      const m = new Map<string, string>(haveKeyById);
      for (const e of extra) m.set(e.id, e.key);
      return ids.map((x) => m.get(x)!).filter(Boolean).sort();
    };

    await auditInTx(tx, {
      userId: adminId,
      action: "rolePermission.change",
      entity: "AccessRole",
      entityId: id,
      metadata: {
        roleKey: role.key,
        added: await keyOf(toAdd),
        removed: await keyOf(toRemove),
      },
    });
    return role;
  });
}

export async function archiveRole(adminId: string, id: string) {
  return serializableTx(async (tx) => {
    const role = await tx.accessRole.findUnique({ where: { id } });
    if (!role) notFound("role_not_found");
    if (role.isSystem) conflict("system_role_locked");
    if (role.archivedAt) return role;

    const updated = await tx.accessRole.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    await auditInTx(tx, {
      userId: adminId,
      action: "role.archive",
      entity: "AccessRole",
      entityId: id,
      metadata: { key: role.key },
    });
    return updated;
  });
}

export async function unarchiveRole(adminId: string, id: string) {
  return serializableTx(async (tx) => {
    const role = await tx.accessRole.findUnique({ where: { id } });
    if (!role) notFound("role_not_found");
    if (!role.archivedAt) return role;

    const updated = await tx.accessRole.update({
      where: { id },
      data: { archivedAt: null },
    });
    await auditInTx(tx, {
      userId: adminId,
      action: "role.unarchive",
      entity: "AccessRole",
      entityId: id,
      metadata: { key: role.key },
    });
    return updated;
  });
}

/**
 * Hard delete — only a custom role with zero current assignments AND no
 * historical assignment references in the (append-only) audit log. Authoring
 * events (role.create / role.update / rolePermission.change) do not block —
 * they belong to the role being removed. Anything with assignment history
 * must be archived instead.
 */
export async function deleteRole(adminId: string, id: string) {
  return serializableTx(async (tx) => {
    const role = await tx.accessRole.findUnique({
      where: { id },
      select: { id: true, key: true, isSystem: true, _count: { select: { users: true } } },
    });
    if (!role) notFound("role_not_found");
    if (role.isSystem) conflict("system_role_locked");
    if (role._count.users > 0) conflict("role_has_references");

    const assignmentHistory = await tx.auditLog.count({
      where: {
        action: { in: ["role.assign", "role.revoke"] },
        metadata: { path: ["roleId"], equals: id },
      },
    });
    if (assignmentHistory > 0) conflict("role_has_references");

    await tx.rolePermission.deleteMany({ where: { roleId: id } });
    await tx.accessRole.delete({ where: { id } });
    await auditInTx(tx, {
      userId: adminId,
      action: "role.delete",
      entity: "AccessRole",
      entityId: id,
      metadata: { key: role.key },
    });
  });
}
