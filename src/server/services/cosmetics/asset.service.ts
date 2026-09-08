import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";
import { auditInTx } from "@/server/lib/audit";
import { conflict, notFound } from "@/server/lib/errors";
import { serializableTx } from "@/server/lib/tx";
import { wasEverPublished } from "@/lib/cosmetics/lifecycle";
import { parseAssetConfig, LATEST_CONFIG_VERSION } from "@/lib/cosmetics/config";
import type { EquipmentSlot } from "@/lib/cosmetics/slots";
import type { AssetCreateInput } from "@/lib/validation/cosmetics";

type Db = Prisma.TransactionClient;

export type AssetListFilter = {
  slot?: EquipmentSlot;
  status?: "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED";
  q?: string;
};

export async function listAssets(filter: AssetListFilter = {}) {
  return prisma.cosmeticAsset.findMany({
    where: {
      slot: filter.slot,
      status: filter.status,
      ...(filter.q
        ? {
            OR: [
              { name: { contains: filter.q, mode: "insensitive" } },
              { slug: { contains: filter.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ slot: "asc" }, { name: "asc" }],
    include: { _count: { select: { entitlements: true, equipped: true, collections: true } } },
  });
}

export async function getAsset(id: string) {
  const asset = await prisma.cosmeticAsset.findUnique({
    where: { id },
    include: {
      collections: { include: { collection: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { entitlements: true, equipped: true } },
    },
  });
  if (!asset) notFound("asset_not_found");
  return asset;
}

export async function createAsset(adminId: string, input: AssetCreateInput) {
  // validate the config for its version before it ever hits the DB
  parseAssetConfig(LATEST_CONFIG_VERSION, input.config);

  return serializableTx(async (tx) => {
    const asset = await tx.cosmeticAsset.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        slot: input.slot, // immutable from here — no update path sets it
        rarity: input.rarity,
        acquisitionType: input.acquisitionType,
        previewUrl: input.previewUrl,
        configVersion: LATEST_CONFIG_VERSION,
        config: input.config as Prisma.InputJsonValue,
        createdByAdminId: adminId,
      },
    });
    await auditInTx(tx, {
      userId: adminId,
      action: "cosmeticAsset.create",
      entity: "CosmeticAsset",
      entityId: asset.id,
      metadata: { slug: asset.slug, slot: asset.slot },
    });
    return asset;
  });
}

type AssetUpdatePatch = {
  id: string;
  name?: string;
  description?: string;
  rarity?: "COMMON" | "RARE" | "EPIC" | "SPECIAL" | "LIMITED";
  acquisitionType?:
    | "DEFAULT"
    | "STREAK_REWARD"
    | "RANK_REWARD"
    | "ACHIEVEMENT"
    | "PURCHASE"
    | "LIMITED_EVENT"
    | "ADMIN_GRANT";
  previewUrl?: string;
  config?: unknown;
};

/**
 * Metadata is always editable. `config` (and `configVersion`, `slot`) are
 * FROZEN once the asset has ever been published — a material visual change
 * must go through `duplicateAsset` so it never silently re-skins every user
 * who already equipped it. [S2] [S6]
 */
export async function updateAsset(adminId: string, patch: AssetUpdatePatch) {
  const wantsConfigChange = patch.config !== undefined;
  if (wantsConfigChange) parseAssetConfig(LATEST_CONFIG_VERSION, patch.config);

  const metadata = {
    name: patch.name,
    description: patch.description,
    rarity: patch.rarity,
    acquisitionType: patch.acquisitionType,
    previewUrl: patch.previewUrl,
  };

  return serializableTx(async (tx) => {
    if (wantsConfigChange) {
      // CONDITIONAL WRITE: a single UPDATE whose WHERE encodes the invariant.
      // Under any isolation level this row-locks and only matches an
      // unpublished draft — a concurrent setAssetStatus(PUBLISHED) that commits
      // first makes the WHERE miss (count 0) rather than a lost update.
      const res = await tx.cosmeticAsset.updateMany({
        where: { id: patch.id, status: "DRAFT", publishedAt: null },
        data: { ...metadata, config: patch.config as Prisma.InputJsonValue },
      });
      if (res.count === 0) {
        const exists = await tx.cosmeticAsset.findUnique({
          where: { id: patch.id },
          select: { id: true },
        });
        if (!exists) notFound("asset_not_found");
        conflict("published_asset_config_locked");
      }
    } else {
      const exists = await tx.cosmeticAsset.findUnique({
        where: { id: patch.id },
        select: { id: true },
      });
      if (!exists) notFound("asset_not_found");
      await tx.cosmeticAsset.update({ where: { id: patch.id }, data: metadata });
    }

    const asset = await tx.cosmeticAsset.findUniqueOrThrow({
      where: { id: patch.id },
    });
    await auditInTx(tx, {
      userId: adminId,
      action: "cosmeticAsset.update",
      entity: "CosmeticAsset",
      entityId: asset.id,
      metadata: { configChanged: wantsConfigChange },
    });
    return asset;
  });
}

export async function setAssetStatus(
  adminId: string,
  id: string,
  status: "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED",
) {
  return serializableTx(async (tx) => {
    const current = await tx.cosmeticAsset.findUnique({ where: { id } });
    if (!current) notFound("asset_not_found");

    const asset = await tx.cosmeticAsset.update({
      where: { id },
      data: {
        status,
        // stamp the first publish; presence freezes config forever
        publishedAt:
          status === "PUBLISHED" && !wasEverPublished(current)
            ? new Date()
            : current.publishedAt,
      },
    });
    await auditInTx(tx, {
      userId: adminId,
      action: `cosmeticAsset.${status.toLowerCase()}`,
      entity: "CosmeticAsset",
      entityId: id,
      metadata: { from: current.status, to: status },
    });
    return asset;
  });
}

export async function bulkSetAssetStatus(
  adminId: string,
  ids: string[],
  status: "PUBLISHED" | "HIDDEN" | "ARCHIVED",
) {
  return serializableTx(async (tx) => {
    const rows = await tx.cosmeticAsset.findMany({ where: { id: { in: ids } }, select: { id: true, publishedAt: true } });
    if (rows.length !== new Set(ids).size) notFound("asset_not_found");
    const now = new Date();
    for (const row of rows) {
      await tx.cosmeticAsset.update({
        where: { id: row.id },
        data: { status, publishedAt: status === "PUBLISHED" ? row.publishedAt ?? now : row.publishedAt },
      });
    }
    await auditInTx(tx, { userId: adminId, action: "cosmeticAsset.bulkStatus", entity: "CosmeticAsset", entityId: "bulk", metadata: { ids, status } });
    return { updated: rows.length };
  });
}

/** Clone a (usually published) asset into a fresh editable DRAFT. [S6] */
export async function duplicateAsset(adminId: string, id: string, slug: string) {
  return serializableTx(async (tx) => {
    const src = await tx.cosmeticAsset.findUnique({ where: { id } });
    if (!src) notFound("asset_not_found");

    const copy = await tx.cosmeticAsset.create({
      data: {
        slug,
        name: `${src.name} (copy)`,
        description: src.description,
        slot: src.slot,
        rarity: src.rarity,
        acquisitionType: src.acquisitionType,
        previewUrl: src.previewUrl,
        configVersion: src.configVersion,
        config: src.config as Prisma.InputJsonValue,
        createdByAdminId: adminId,
        status: "DRAFT",
        isCanonicalDefault: false,
      },
    });
    await auditInTx(tx, {
      userId: adminId,
      action: "cosmeticAsset.duplicate",
      entity: "CosmeticAsset",
      entityId: copy.id,
      metadata: { from: id },
    });
    return copy;
  });
}

/** Hard delete — only a DRAFT with zero references. Otherwise archive. [S5] */
export async function deleteAsset(adminId: string, id: string) {
  return serializableTx(async (tx) => {
    const asset = await tx.cosmeticAsset.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            entitlements: true,
            equipped: true,
            collections: true,
            rewardRules: true,
          },
        },
      },
    });
    if (!asset) notFound("asset_not_found");

    const refs =
      asset._count.entitlements +
      asset._count.equipped +
      asset._count.collections +
      asset._count.rewardRules;
    if (asset.status !== "DRAFT" || refs > 0) {
      conflict("asset_has_references");
    }

    // onDelete: Restrict on entitlement/equipped -> asset is the DB-level guard
    await tx.cosmeticAsset.delete({ where: { id } });
    await auditInTx(tx, {
      userId: adminId,
      action: "cosmeticAsset.delete",
      entity: "CosmeticAsset",
      entityId: id,
      metadata: { slug: asset.slug },
    });
  });
}
