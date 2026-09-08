import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";
import { auditInTx } from "@/server/lib/audit";
import { conflict, notFound } from "@/server/lib/errors";
import type { EquipmentSlot } from "@/lib/cosmetics/slots";

type Db = Prisma.TransactionClient;

export type GrantOpts = {
  acquisitionType?:
    | "DEFAULT"
    | "STREAK_REWARD"
    | "RANK_REWARD"
    | "ACHIEVEMENT"
    | "PURCHASE"
    | "LIMITED_EVENT"
    | "ADMIN_GRANT";
  sourceRef?: string;
  sourceCollectionId?: string;
  grantedByAdminId?: string;
  expiresAt?: Date;
};

/** True when the user may equip this asset: a DEFAULT asset (owned by all) or
 *  an ACTIVE, unexpired entitlement. */
export async function hasEntitlement(
  userId: string,
  assetId: string,
  db: Db | typeof prisma = prisma,
): Promise<boolean> {
  const asset = await db.cosmeticAsset.findUnique({
    where: { id: assetId },
    select: { acquisitionType: true },
  });
  if (!asset) return false;
  if (asset.acquisitionType === "DEFAULT") return true;

  const ent = await db.userEntitlement.findUnique({
    where: { userId_assetId: { userId, assetId } },
    select: { status: true, expiresAt: true },
  });
  if (!ent || ent.status !== "ACTIVE") return false;
  if (ent.expiresAt && ent.expiresAt.getTime() <= Date.now()) return false;
  return true;
}

/** Idempotent single-asset grant. Re-granting un-revokes and refreshes. */
async function grantAssetInTx(
  tx: Db,
  userId: string,
  assetId: string,
  opts: GrantOpts,
) {
  const asset = await tx.cosmeticAsset.findUnique({
    where: { id: assetId },
    select: { status: true },
  });
  if (!asset) notFound("asset_not_found");
  if (asset.status !== "PUBLISHED") conflict("asset_not_published");

  const acquisitionType = opts.acquisitionType ?? "ADMIN_GRANT";
  return tx.userEntitlement.upsert({
    where: { userId_assetId: { userId, assetId } },
    create: {
      userId,
      assetId,
      acquisitionType,
      sourceRef: opts.sourceRef,
      sourceCollectionId: opts.sourceCollectionId,
      grantedByAdminId: opts.grantedByAdminId,
      expiresAt: opts.expiresAt,
      status: "ACTIVE",
    },
    update: {
      // idempotent: keep firstGrantedAt, refresh the rest, clear any revocation
      status: "ACTIVE",
      acquisitionType,
      sourceRef: opts.sourceRef,
      sourceCollectionId: opts.sourceCollectionId,
      grantedByAdminId: opts.grantedByAdminId,
      grantedAt: new Date(),
      expiresAt: opts.expiresAt ?? null,
      revokedAt: null,
      revokedByAdminId: null,
    },
  });
}

export async function grantAsset(
  adminId: string,
  userId: string,
  assetId: string,
  opts: GrantOpts = {},
) {
  return prisma.$transaction(async (tx: Db) => {
    const ent = await grantAssetInTx(tx, userId, assetId, {
      ...opts,
      grantedByAdminId: adminId,
    });
    await auditInTx(tx, {
      userId: adminId,
      action: "entitlement.grant",
      entity: "UserEntitlement",
      entityId: ent.id,
      metadata: { targetUserId: userId, assetId, acquisitionType: ent.acquisitionType },
    });
    return ent;
  });
}

/** Grant every asset in a published collection, in one transaction. [S4] */
export async function grantCollection(
  adminId: string,
  userId: string,
  collectionId: string,
  opts: GrantOpts = {},
) {
  const collection = await prisma.cosmeticCollection.findUnique({
    where: { id: collectionId },
    include: { assets: { select: { assetId: true } } },
  });
  if (!collection) notFound("collection_not_found");
  if (collection.status !== "PUBLISHED") conflict("collection_not_published");
  if (collection.assets.length === 0) conflict("collection_empty");

  return prisma.$transaction(async (tx: Db) => {
    for (const { assetId } of collection.assets) {
      await grantAssetInTx(tx, userId, assetId, {
        ...opts,
        sourceCollectionId: collectionId,
        grantedByAdminId: adminId,
      });
    }
    await auditInTx(tx, {
      userId: adminId,
      action: "entitlement.grantCollection",
      entity: "CosmeticCollection",
      entityId: collectionId,
      metadata: { targetUserId: userId, assetCount: collection.assets.length },
    });
    return { granted: collection.assets.length };
  });
}

export async function revokeEntitlement(
  adminId: string,
  userId: string,
  assetId: string,
  reason?: string,
) {
  const ent = await prisma.userEntitlement.findUnique({
    where: { userId_assetId: { userId, assetId } },
    include: { asset: { select: { slot: true } } },
  });
  if (!ent) notFound("entitlement_not_found");

  return prisma.$transaction(async (tx: Db) => {
    await tx.userEntitlement.update({
      where: { id: ent.id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokedByAdminId: adminId,
      },
    });
    // if the revoked asset is currently equipped, take it off (same tx)
    await tx.userEquippedAsset.deleteMany({
      where: { userId, slot: ent.asset.slot, assetId },
    });
    await auditInTx(tx, {
      userId: adminId,
      action: "entitlement.revoke",
      entity: "UserEntitlement",
      entityId: ent.id,
      metadata: { targetUserId: userId, assetId, reason },
    });
  });
}

export type InventoryAsset = {
  assetId: string;
  slug: string;
  name: string;
  slot: EquipmentSlot;
  rarity: string;
  status: string;
  owned: boolean;
  equipped: boolean;
  acquisitionType: string;
  sourceCollectionId: string | null;
  expiresAt: Date | null;
};

/** What a user sees at /cosmetics: everything published, tagged owned/locked/equipped. */
export async function listUserInventory(userId: string): Promise<{
  items: InventoryAsset[];
  equippedBySlot: Partial<Record<EquipmentSlot, string>>;
}> {
  const [assets, entitlements, equipped] = await Promise.all([
    prisma.cosmeticAsset.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ slot: "asc" }, { rarity: "asc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        slot: true,
        rarity: true,
        status: true,
        acquisitionType: true,
      },
    }),
    prisma.userEntitlement.findMany({
      where: { userId, status: "ACTIVE" },
      select: { assetId: true, sourceCollectionId: true, expiresAt: true },
    }),
    prisma.userEquippedAsset.findMany({
      where: { userId },
      select: { slot: true, assetId: true },
    }),
  ]);

  const owned = new Map(entitlements.map((e) => [e.assetId, e]));
  const equippedSet = new Set(equipped.map((e) => e.assetId));
  const equippedBySlot: Partial<Record<EquipmentSlot, string>> = {};
  for (const e of equipped) equippedBySlot[e.slot as EquipmentSlot] = e.assetId;

  const items: InventoryAsset[] = assets.map((a) => {
    const ent = owned.get(a.id);
    const isOwned = a.acquisitionType === "DEFAULT" || Boolean(ent);
    return {
      assetId: a.id,
      slug: a.slug,
      name: a.name,
      slot: a.slot as EquipmentSlot,
      rarity: a.rarity,
      status: a.status,
      owned: isOwned,
      equipped: equippedSet.has(a.id),
      acquisitionType: a.acquisitionType,
      sourceCollectionId: ent?.sourceCollectionId ?? null,
      expiresAt: ent?.expiresAt ?? null,
    };
  });

  return { items, equippedBySlot };
}
