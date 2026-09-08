import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";
import { auditInTx } from "@/server/lib/audit";
import { conflict, notFound } from "@/server/lib/errors";
import type { CollectionCreateInput } from "@/lib/validation/cosmetics";

type Db = Prisma.TransactionClient;

export async function listCollections(filter: { status?: string } = {}) {
  return prisma.cosmeticCollection.findMany({
    where: filter.status
      ? { status: filter.status as Prisma.EnumCosmeticStatusFilter["equals"] }
      : {},
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { assets: true, entitlementSources: true } },
    },
  });
}

export async function getCollection(id: string) {
  const c = await prisma.cosmeticCollection.findUnique({
    where: { id },
    include: {
      assets: {
        orderBy: { sortOrder: "asc" },
        include: {
          asset: {
            select: { id: true, slug: true, name: true, slot: true, status: true, rarity: true },
          },
        },
      },
    },
  });
  if (!c) notFound("collection_not_found");
  return c;
}

export async function createCollection(
  adminId: string,
  input: CollectionCreateInput,
) {
  return prisma.$transaction(async (tx: Db) => {
    const c = await tx.cosmeticCollection.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description,
        rarity: input.rarity,
        isApplicableAsSet: input.isApplicableAsSet,
        coverUrl: input.coverUrl,
        createdByAdminId: adminId,
      },
    });
    await auditInTx(tx, {
      userId: adminId,
      action: "cosmeticCollection.create",
      entity: "CosmeticCollection",
      entityId: c.id,
      metadata: { slug: c.slug },
    });
    return c;
  });
}

export async function updateCollection(
  adminId: string,
  patch: { id: string } & Partial<CollectionCreateInput>,
) {
  return prisma.$transaction(async (tx: Db) => {
    const current = await tx.cosmeticCollection.findUnique({
      where: { id: patch.id },
    });
    if (!current) notFound("collection_not_found");

    const c = await tx.cosmeticCollection.update({
      where: { id: patch.id },
      data: {
        name: patch.name,
        description: patch.description,
        rarity: patch.rarity,
        isApplicableAsSet: patch.isApplicableAsSet,
        coverUrl: patch.coverUrl,
      },
    });
    await auditInTx(tx, {
      userId: adminId,
      action: "cosmeticCollection.update",
      entity: "CosmeticCollection",
      entityId: c.id,
    });
    return c;
  });
}

/**
 * DRAFT -> PUBLISHED requires every attached asset to already be PUBLISHED, so
 * applying a collection can never silently skip a draft/hidden asset. [S4]
 * HIDDEN / ARCHIVED are always allowed regardless of references. [S5]
 */
export async function setCollectionStatus(
  adminId: string,
  id: string,
  status: "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED",
) {
  return prisma.$transaction(async (tx: Db) => {
    const current = await tx.cosmeticCollection.findUnique({
      where: { id },
      include: { assets: { include: { asset: { select: { status: true } } } } },
    });
    if (!current) notFound("collection_not_found");

    if (status === "PUBLISHED") {
      const unpublished = current.assets.filter(
        (a) => a.asset.status !== "PUBLISHED",
      );
      if (current.assets.length === 0 || unpublished.length > 0) {
        conflict("collection_has_unpublished_assets");
      }
    }

    const c = await tx.cosmeticCollection.update({
      where: { id },
      data: { status },
    });
    await auditInTx(tx, {
      userId: adminId,
      action: `cosmeticCollection.${status.toLowerCase()}`,
      entity: "CosmeticCollection",
      entityId: id,
      metadata: { from: current.status, to: status },
    });
    return c;
  });
}

/**
 * Attach an asset. At most one per slot per collection [S1]. Membership can
 * only change while the collection is DRAFT — a published/hidden/archived
 * collection's contents are frozen so it never re-skins users who applied it. [S5]
 */
export async function attachAsset(
  adminId: string,
  collectionId: string,
  assetId: string,
  sortOrder = 0,
) {
  try {
    return await prisma.$transaction(async (tx: Db) => {
      const [collection, asset] = await Promise.all([
        tx.cosmeticCollection.findUnique({ where: { id: collectionId } }),
        tx.cosmeticAsset.findUnique({ where: { id: assetId } }),
      ]);
      if (!collection) notFound("collection_not_found");
      if (!asset) notFound("asset_not_found");
      if (collection.status !== "DRAFT") conflict("collection_membership_frozen");

      const link = await tx.collectionAsset.create({
        data: { collectionId, assetId, slot: asset.slot, sortOrder },
      });
      await auditInTx(tx, {
        userId: adminId,
        action: "collectionAsset.attach",
        entity: "CollectionAsset",
        entityId: link.id,
        metadata: { collectionId, assetId, slot: asset.slot },
      });
      return link;
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // unique on [collectionId, assetId] OR [collectionId, slot]
      const target = String(err.meta?.target ?? "");
      conflict(
        target.includes("slot")
          ? "slot_taken_in_collection"
          : "asset_already_in_collection",
      );
    }
    throw err;
  }
}

export async function detachAsset(
  adminId: string,
  collectionId: string,
  assetId: string,
) {
  return prisma.$transaction(async (tx: Db) => {
    const collection = await tx.cosmeticCollection.findUnique({
      where: { id: collectionId },
      select: { status: true },
    });
    if (!collection) notFound("collection_not_found");
    if (collection.status !== "DRAFT") conflict("collection_membership_frozen");

    const link = await tx.collectionAsset.findUnique({
      where: { collectionId_assetId: { collectionId, assetId } },
    });
    if (!link) notFound("not_in_collection");

    await tx.collectionAsset.delete({ where: { id: link.id } });
    await auditInTx(tx, {
      userId: adminId,
      action: "collectionAsset.detach",
      entity: "CollectionAsset",
      entityId: link.id,
      metadata: { collectionId, assetId },
    });
  });
}

/** Hard delete — only a DRAFT with zero references. Otherwise archive. [S5] */
export async function deleteCollection(adminId: string, id: string) {
  return prisma.$transaction(async (tx: Db) => {
    const c = await tx.cosmeticCollection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { assets: true, entitlementSources: true, rewardRules: true },
        },
      },
    });
    if (!c) notFound("collection_not_found");

    const refs =
      c._count.assets + c._count.entitlementSources + c._count.rewardRules;
    if (c.status !== "DRAFT" || refs > 0) {
      conflict("collection_has_references");
    }

    await tx.cosmeticCollection.delete({ where: { id } });
    await auditInTx(tx, {
      userId: adminId,
      action: "cosmeticCollection.delete",
      entity: "CosmeticCollection",
      entityId: id,
      metadata: { slug: c.slug },
    });
  });
}
