import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";
import { conflict, forbidden, notFound } from "@/server/lib/errors";
import { serializableTx } from "@/server/lib/tx";
import {
  parseAssetConfig,
  type AssetConfig,
} from "@/lib/cosmetics/config";
import { EQUIPMENT_SLOTS, type EquipmentSlot } from "@/lib/cosmetics/slots";
import { hasEntitlement } from "@/server/services/cosmetics/entitlement.service";

type Db = Prisma.TransactionClient;

export type ResolvedSlotAsset = {
  assetId: string;
  slug: string;
  slot: EquipmentSlot;
  configVersion: number;
  config: AssetConfig;
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
  return serializableTx(async (tx) => {
    const asset = await tx.cosmeticAsset.findUnique({
      where: { id: assetId },
      select: { slot: true, status: true },
    });
    if (!asset) notFound("asset_not_found");
    if (asset.slot !== slot) conflict("wrong_slot");
    if (asset.status !== "PUBLISHED") conflict("asset_not_published");
    if (!(await hasEntitlement(userId, assetId, tx))) forbidden("not_owned");

    // composite FK [assetId, slot] -> CosmeticAsset[id, slot] is the DB-level
    // second line of defense for the slot match.
    return tx.userEquippedAsset.upsert({
      where: { userId_slot: { userId, slot } },
      create: { userId, slot, assetId },
      update: { assetId, equippedAt: new Date() },
    });
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
 * Apply a whole collection. Everything — the collection row, its membership,
 * every asset's PUBLISHED status and the user's entitlement — is read INSIDE
 * the transaction at application time. A hidden / archived / draft collection
 * or asset, or a single missing entitlement, fails the whole operation and the
 * loadout is left unchanged. Deterministic by slot (the DB guarantees one asset
 * per slot per collection). [S1] [S4] [S6]
 */
export async function applyCollection(
  userId: string,
  collectionId: string,
): Promise<ApplyCollectionResult> {
  return serializableTx(async (tx) => {
    const collection = await tx.cosmeticCollection.findUnique({
      where: { id: collectionId },
      include: {
        assets: {
          orderBy: { slot: "asc" },
          include: { asset: { select: { id: true, status: true } } },
        },
      },
    });
    if (!collection) notFound("collection_not_found");
    if (collection.status !== "PUBLISHED") conflict("collection_not_published");
    const now = new Date();
    if (collection.availableFrom && collection.availableFrom > now) conflict("collection_not_available_yet");
    if (collection.availableTo && collection.availableTo <= now) conflict("collection_no_longer_available");
    if (collection.assets.length === 0) conflict("collection_empty");

    // every asset must be PUBLISHED *now* and owned *now* — check all first
    for (const link of collection.assets) {
      if (link.asset.status !== "PUBLISHED") {
        conflict("collection_has_unpublished_assets");
      }
      if (!(await hasEntitlement(userId, link.assetId, tx))) {
        forbidden("collection_not_fully_owned");
      }
    }

    const before = await tx.userEquippedAsset.findMany({
      where: {
        userId,
        slot: { in: collection.assets.map((a) => a.slot) },
      },
      select: { slot: true, assetId: true },
    });
    const beforeBySlot = new Map(before.map((b) => [b.slot, b.assetId]));

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
  return serializableTx(async (tx) => {
    const { count } = await tx.userEquippedAsset.deleteMany({ where: { userId } });
    return { cleared: count };
  });
}
