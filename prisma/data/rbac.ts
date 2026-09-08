/**
 * Idempotently seed the RBAC catalogue and system roles. Called from
 * `prisma/seed.ts` and from the RBAC integration tests. Never assigns a role
 * to any user and never touches a custom (non-system) role.
 */
import type { PrismaClient } from "@prisma/client";

import { PERMISSIONS, SYSTEM_ROLES } from "@/lib/rbac/catalogue";

export async function seedRbac(prisma: PrismaClient): Promise<void> {
  // 1. Permission catalogue — upsert by key.
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      create: { key: p.key, resource: p.resource, action: p.action, description: p.description },
      update: { resource: p.resource, action: p.action, description: p.description },
    });
  }
  const permByKey = new Map(
    (await prisma.permission.findMany({ select: { id: true, key: true } })).map(
      (r) => [r.key, r.id] as const,
    ),
  );

  // 2. System roles — upsert by key; force isSystem and clear any archive.
  for (const role of SYSTEM_ROLES) {
    const row = await prisma.accessRole.upsert({
      where: { key: role.key },
      create: {
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: true,
      },
      update: {
        name: role.name,
        description: role.description,
        isSystem: true,
        archivedAt: null,
      },
    });

    // 3. Reconcile the role's permissions to exactly `role.permissions`.
    const want = new Set(role.permissions.map((k) => permByKey.get(k)!));
    const have = new Set(
      (
        await prisma.rolePermission.findMany({
          where: { roleId: row.id },
          select: { permissionId: true },
        })
      ).map((r) => r.permissionId),
    );
    const toAdd = [...want].filter((id) => !have.has(id));
    const toRemove = [...have].filter((id) => !want.has(id));
    if (toAdd.length) {
      await prisma.rolePermission.createMany({
        data: toAdd.map((permissionId) => ({ roleId: row.id, permissionId })),
        skipDuplicates: true,
      });
    }
    if (toRemove.length) {
      await prisma.rolePermission.deleteMany({
        where: { roleId: row.id, permissionId: { in: toRemove } },
      });
    }
  }
}
