import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";
import { conflict, forbidden, notFound } from "@/server/lib/errors";
import {
  parseAssetConfig,
  type AssetConfigV1,
} from "@/lib/cosmetics/config";
import { EQUIPMENT_SLOTS, type EquipmentSlot } from "@/lib/cosmetics/slots";
import { hasEntitlement } from "@/server/services/cosmetics/entitlement.service";

type Db = Prisma.TransactionClient;

export type ResolvedSlotAsset = {
  assetId: string;
  slug: string;
  slot: EquipmentSlot;
  configVersion: number;
  config: AssetConfigV1;
};

export type ResolvedLoadout = Record<EquipmentSlot, ResolvedSlotAsset | null>;

function emptyLoadout(): ResolvedLoadout {
  return Object.fromEntries(
    EQUIPMENT_SLOTS.map((s) => [s, null]),
  ) as ResolvedLoadout;
}

/**
 * The user's equipped cosmetics, ready for the renderer. All-null for a user
 * with no equipped rows (the default — app looks exactly as it does today).
 * A row whose asset is no longer PUBLISHED resolves to null (fallback).
 * Config that fails validation also resolves to null — never render garbage.
 */
export async function getResolvedLoadout(
  userId: string,
): Promise<ResolvedLoadout> {
  const rows = await prisma.userEquippedAsset.findMany({
    where: { userId },
    include: {
      asset: {
        select: {
          id: true,
          slug: true,
          slot: true,
          status: true,
          configVersion: true,
          config: true,
        },
      },
    },
  });

  const loadout = emptyLoadout();
  for (const row of rows) {
    const a = row.asset;
    if (a.status !== "PUBLISHED") continue;
    try {
      loadout[row.slot as EquipmentSlot] = {
        assetId: a.id,
        slug: a.slug,
        slot: a.slot as EquipmentSlot,
        configVersion: a.configVersion,
        config: parseAssetConfig(a.configVersion, a.config),
      };
    } catch {
      // malformed stored config — treat as unequipped
    }
  }
  return loadout;
}

export async function equip(userId: string, slot: EquipmentSlot, assetId: string) {
  const asset = await prisma.cosmeticAsset.findUnique({
    where: { id: assetId },
    select: { slot: true, status: true },
  });
  if (!asset) notFound("asset_not_found");
  if (asset.slot !== slot) conflict("wrong_slot");
  if (asset.status !== "PUBLISHED") conflict("asset_not_published");
  if (!(await hasEntitlement(userId, assetId))) forbidden("not_owned");

  return prisma.userEquippedAsset.upsert({
    where: { userId_slot: { userId, slot } },
    create: { userId, slot, assetId },
    update: { assetId, equippedAt: new Date() },
  });
}

export async function unequip(userId: string, slot: EquipmentSlot) {
  await prisma.userEquippedAsset.deleteMany({ where: { userId, slot } });
}

export type ApplyCollectionResult = {
  equipped: { slot: EquipmentSlot; assetId: string }[];
  /** slots that had a different asset before this apply */
  replaced: { slot: EquipmentSlot; fromAssetId: string }[];
};

/**
 * Apply a whole collection. Deterministic by slot (the DB guarantees one asset
 * per slot per collection). Verifies the collection is PUBLISHED and the user
 * owns EVERY asset before changing anything — a single missing entitlement
 * fails the whole transaction. [S1] [S4]
 */
export async function applyCollection(
  userId: string,
  collectionId: string,
): Promise<ApplyCollectionResult> {
  const collection = await prisma.cosmeticCollection.findUnique({
    where: { id: collectionId },
    include: {
      assets: {
        orderBy: { slot: "asc" },
        select: { assetId: true, slot: true },
      },
    },
  });
  if (!collection) notFound("collection_not_found");
  if (collection.status !== "PUBLISHED") conflict("collection_not_published");
  if (collection.assets.length === 0) conflict("collection_empty");

  return prisma.$transaction(async (tx: Db) => {
    // 1) verify ownership of every asset first — nothing changes on failure
    for (const { assetId } of collection.assets) {
      if (!(await hasEntitlement(userId, assetId, tx))) {
        forbidden("collection_not_fully_owned");
      }
    }

    // 2) snapshot current loadout for the "replaced" report
    const before = await tx.userEquippedAsset.findMany({
      where: {
        userId,
        slot: { in: collection.assets.map((a) => a.slot) },
      },
      select: { slot: true, assetId: true },
    });
    const beforeBySlot = new Map(before.map((b) => [b.slot, b.assetId]));

    // 3) equip one asset per slot
    const equipped: ApplyCollectionResult["equipped"] = [];
    const replaced: ApplyCollectionResult["replaced"] = [];
    for (const { assetId, slot } of collection.assets) {
      const prev = beforeBySlot.get(slot);
      if (prev && prev !== assetId) {
        replaced.push({ slot: slot as EquipmentSlot, fromAssetId: prev });
      }
      await tx.userEquippedAsset.upsert({
        where: { userId_slot: { userId, slot } },
        create: { userId, slot, assetId },
        update: { assetId, equippedAt: new Date() },
      });
      equipped.push({ slot: slot as EquipmentSlot, assetId });
    }
    return { equipped, replaced };
  });
}

/** Remove every equipped cosmetic — deterministic fallback to the stock look. */
export async function resetToDefaults(userId: string) {
  return prisma.$transaction(async (tx: Db) => {
    const { count } = await tx.userEquippedAsset.deleteMany({ where: { userId } });
    return { cleared: count };
  });
}
