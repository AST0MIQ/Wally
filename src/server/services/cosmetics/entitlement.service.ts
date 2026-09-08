import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";
import { auditInTx } from "@/server/lib/audit";
import { conflict, notFound } from "@/server/lib/errors";
import { serializableTx } from "@/server/lib/tx";
import { parseAssetConfig, type AssetConfigV1 } from "@/lib/cosmetics/config";
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
  return serializableTx(async (tx) => {
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

/**
 * Grant every asset in a published collection. Collection status, membership
 * and each asset's status are re-read INSIDE the serializable transaction that
 * does the grants + audit, so a concurrent hide/archive/detach is seen. [S4]
 */
export async function grantCollection(
  adminId: string,
  userId: string,
  collectionId: string,
  opts: GrantOpts = {},
) {
  return serializableTx(async (tx) => {
    const collection = await tx.cosmeticCollection.findUnique({
      where: { id: collectionId },
      include: { assets: { select: { assetId: true } } },
    });
    if (!collection) notFound("collection_not_found");
    if (collection.status !== "PUBLISHED") conflict("collection_not_published");
    if (collection.assets.length === 0) conflict("collection_empty");

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
  return serializableTx(async (tx) => {
    // read the entitlement + its asset slot INSIDE the tx so revocation, the
    // conditional unequip and the audit all act on one consistent state
    const ent = await tx.userEntitlement.findUnique({
      where: { userId_assetId: { userId, assetId } },
      include: { asset: { select: { slot: true } } },
    });
    if (!ent) notFound("entitlement_not_found");

    await tx.userEntitlement.update({
      where: { id: ent.id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokedByAdminId: adminId,
      },
    });
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
  /** every collection this asset actually belongs to (CollectionAsset) */
  collectionIds: string[];
  expiresAt: Date | null;
  /** validated on the server — the client never sees raw stored config */
  configVersion: number;
  config: AssetConfigV1;
  previewUrl: string | null;
};

/** ACTIVE + not past its expiry — matches hasEntitlement(). */
function entitlementOwns(e: { status: string; expiresAt: Date | null }, now: number) {
  return (
    e.status === "ACTIVE" && (e.expiresAt === null || e.expiresAt.getTime() > now)
  );
}

/** What a user sees at /cosmetics: everything published, tagged owned/locked/equipped. */
export async function listUserInventory(userId: string): Promise<{
  items: InventoryAsset[];
  equippedBySlot: Partial<Record<EquipmentSlot, string>>;
}> {
  const now = Date.now();
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
        configVersion: true,
        config: true,
        previewUrl: true,
        collections: { select: { collectionId: true } },
      },
    }),
    prisma.userEntitlement.findMany({
      where: { userId },
      select: { assetId: true, status: true, expiresAt: true },
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
    const isOwned =
      a.acquisitionType === "DEFAULT" ||
      (ent ? entitlementOwns(ent, now) : false);
    let config: AssetConfigV1 = {};
    try {
      config = parseAssetConfig(a.configVersion, a.config);
    } catch {
      /* malformed stored config -> render nothing */
    }
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
      collectionIds: a.collections.map((c) => c.collectionId),
      expiresAt: ent?.expiresAt ?? null,
      configVersion: a.configVersion,
      config,
      previewUrl: a.previewUrl,
    };
  });

  return { items, equippedBySlot };
}

export type ApplicableCollectionSlot = {
  slot: EquipmentSlot;
  assetId: string;
  assetName: string;
  assetStatus: string;
  owned: boolean;
  configVersion: number;
  config: AssetConfigV1;
  previewUrl: string | null;
};

export type ApplicableCollection = {
  id: string;
  slug: string;
  name: string;
  rarity: string;
  /** owns every asset AND every asset is PUBLISHED */
  applicable: boolean;
  fullyOwned: boolean;
  slots: ApplicableCollectionSlot[];
};

/**
 * Published, set-applicable collections + whether the user owns every asset in
 * each and every asset is still PUBLISHED (so the /cosmetics UI can enable
 * "Apply" and render a composite preview + replace diff). Ownership matches
 * hasEntitlement() including expiry.
 */
export async function listApplicableCollections(
  userId: string,
): Promise<ApplicableCollection[]> {
  const now = Date.now();
  const [collections, entitlements] = await Promise.all([
    prisma.cosmeticCollection.findMany({
      where: { status: "PUBLISHED", isApplicableAsSet: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        assets: {
          orderBy: { slot: "asc" },
          include: {
            asset: {
              select: {
                id: true,
                name: true,
                status: true,
                acquisitionType: true,
                configVersion: true,
                config: true,
                previewUrl: true,
              },
            },
          },
        },
      },
    }),
    prisma.userEntitlement.findMany({
      where: { userId },
      select: { assetId: true, status: true, expiresAt: true },
    }),
  ]);

  const ownedMap = new Map(entitlements.map((e) => [e.assetId, e]));
  const ownsAsset = (assetId: string, acquisitionType: string) =>
    acquisitionType === "DEFAULT" ||
    (() => {
      const e = ownedMap.get(assetId);
      return e ? entitlementOwns(e, now) : false;
    })();

  return collections
    .filter((c) => c.assets.length > 0)
    .map((c) => {
      const slots: ApplicableCollectionSlot[] = c.assets.map((a) => {
        let config: AssetConfigV1 = {};
        try {
          config = parseAssetConfig(a.asset.configVersion, a.asset.config);
        } catch {
          /* ignore malformed config in preview */
        }
        return {
          slot: a.slot as EquipmentSlot,
          assetId: a.assetId,
          assetName: a.asset.name,
          assetStatus: a.asset.status,
          owned: ownsAsset(a.assetId, a.asset.acquisitionType),
          configVersion: a.asset.configVersion,
          config,
          previewUrl: a.asset.previewUrl,
        };
      });
      const fullyOwned = slots.every((s) => s.owned);
      const allPublished = slots.every((s) => s.assetStatus === "PUBLISHED");
      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        rarity: c.rarity,
        applicable: fullyOwned && allPublished,
        fullyOwned,
        slots,
      };
    });
}
