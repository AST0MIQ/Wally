import { prisma } from "@/server/db";
import { permissionsByResource, type PermissionKey } from "@/lib/rbac/catalogue";

export type PermissionCatalogueGroup = {
  resource: string;
  permissions: {
    key: PermissionKey;
    action: string;
    description: string;
    /** how many roles currently grant this permission */
    roleCount: number;
  }[];
};

/**
 * The readable permission catalogue, grouped by resource in a stable order.
 * Descriptions and ordering come from the static catalogue (never renamed);
 * `roleCount` is a live figure for the Admin Console.
 */
export async function listPermissionCatalogue(): Promise<PermissionCatalogueGroup[]> {
  const counts = await prisma.rolePermission.groupBy({
    by: ["permissionId"],
    _count: { _all: true },
  });
  const perms = await prisma.permission.findMany({
    select: { id: true, key: true },
  });
  const countByKey = new Map<string, number>();
  const idToKey = new Map(perms.map((p) => [p.id, p.key]));
  for (const c of counts) {
    const key = idToKey.get(c.permissionId);
    if (key) countByKey.set(key, c._count._all);
  }

  return permissionsByResource().map((g) => ({
    resource: g.resource,
    permissions: g.permissions.map((p) => ({
      ...p,
      roleCount: countByKey.get(p.key) ?? 0,
    })),
  }));
}
