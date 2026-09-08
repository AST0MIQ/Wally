import { prisma } from "@/server/db";

/**
 * Aggregate cosmetics stats + a NON-FINANCIAL user directory for the Admin
 * Console. Like `admin.service.ts` this only ever returns COUNTs and
 * cosmetics/preference data — never a financial amount or row.
 */

export type CosmeticsAdminStats = {
  collections: { total: number; published: number; draft: number };
  assets: { total: number; published: number; draft: number; bySlot: { slot: string; count: number }[] };
  entitlements: { total: number; active: number };
  usersWithLoadout: number;
  rewardRules: { total: number; active: number };
};

export async function getCosmeticsAdminStats(): Promise<CosmeticsAdminStats> {
  const [
    colTotal,
    colPublished,
    colDraft,
    assetTotal,
    assetPublished,
    assetDraft,
    assetBySlot,
    entTotal,
    entActive,
    usersWithLoadout,
    ruleTotal,
    ruleActive,
  ] = await Promise.all([
    prisma.cosmeticCollection.count(),
    prisma.cosmeticCollection.count({ where: { status: "PUBLISHED" } }),
    prisma.cosmeticCollection.count({ where: { status: "DRAFT" } }),
    prisma.cosmeticAsset.count(),
    prisma.cosmeticAsset.count({ where: { status: "PUBLISHED" } }),
    prisma.cosmeticAsset.count({ where: { status: "DRAFT" } }),
    prisma.cosmeticAsset.groupBy({ by: ["slot"], _count: { _all: true } }),
    prisma.userEntitlement.count(),
    prisma.userEntitlement.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { equippedCosmetics: { some: {} } } }),
    prisma.rewardRule.count(),
    prisma.rewardRule.count({ where: { isActive: true } }),
  ]);

  return {
    collections: { total: colTotal, published: colPublished, draft: colDraft },
    assets: {
      total: assetTotal,
      published: assetPublished,
      draft: assetDraft,
      bySlot: assetBySlot
        .map((r) => ({ slot: String(r.slot), count: r._count._all }))
        .sort((a, b) => b.count - a.count),
    },
    entitlements: { total: entTotal, active: entActive },
    usersWithLoadout,
    rewardRules: { total: ruleTotal, active: ruleActive },
  };
}

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  createdAt: Date;
  lastLoginAt: Date | null;
  entitlements: number;
  equipped: number;
};

/** Cursor-paged, non-financial user directory. */
export async function listUsersForAdmin(opts: {
  cursor?: string;
  limit?: number;
  q?: string;
}): Promise<{ rows: AdminUserRow[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(opts.limit ?? 25, 1), 100);
  const rows = await prisma.user.findMany({
    where: opts.q
      ? {
          OR: [
            { email: { contains: opts.q, mode: "insensitive" } },
            { name: { contains: opts.q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { cosmeticEntitlements: true, equippedCosmetics: true } },
    },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return {
    rows: page.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      entitlements: u._count.cosmeticEntitlements,
      equipped: u._count.equippedCosmetics,
    })),
    nextCursor: hasMore ? page[page.length - 1]!.id : null,
  };
}

export async function getAdminUserDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
  if (!user) return null;

  const [entitlements, equipped] = await Promise.all([
    prisma.userEntitlement.findMany({
      where: { userId },
      orderBy: { grantedAt: "desc" },
      include: {
        asset: { select: { id: true, name: true, slug: true, slot: true, rarity: true, status: true } },
        sourceCollection: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.userEquippedAsset.findMany({
      where: { userId },
      include: {
        asset: { select: { id: true, name: true, slug: true, slot: true, status: true } },
      },
    }),
  ]);

  return { user, entitlements, equipped };
}
