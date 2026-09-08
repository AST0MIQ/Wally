import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";
import { auditInTx } from "@/server/lib/audit";
import { conflict, notFound } from "@/server/lib/errors";
import { serializableTx } from "@/server/lib/tx";
import { wasEverPublished } from "@/lib/cosmetics/lifecycle";
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
  // Explicit select (not `include`) so `publishedAt` is ALWAYS in the payload.
  // If a stale Prisma client that predates the column ever runs this, the
  // query throws a validation error here — loud — instead of silently
  // returning `undefined` and mis-freezing a fresh DRAFT.
  const c = await prisma.cosmeticCollection.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      coverUrl: true,
      rarity: true,
      status: true,
      isApplicableAsSet: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      assets: {
        orderBy: { sortOrder: "asc" },
        select: {
          assetId: true,
          slot: true,
          sortOrder: true,
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
  return serializableTx(async (tx) => {
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
  return serializableTx(async (tx) => {
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
 * DRAFT -> PUBLISHED requires every attached asset to already be PUBLISHED
 * (cross-row invariant — needs Serializable, not a single conditional write),
 * so applying a collection can never silently skip a draft/hidden asset. [S4]
 * The first PUBLISHED stamps `publishedAt`, which freezes membership forever —
 * even a later PUBLISHED -> DRAFT. HIDDEN / ARCHIVED are always allowed. [S5]
 */
export async function setCollectionStatus(
  adminId: string,
  id: string,
  status: "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED",
) {
  return serializableTx(async (tx) => {
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
      data: {
        status,
        publishedAt:
          status === "PUBLISHED" && !wasEverPublished(current)
            ? new Date()
            : current.publishedAt,
      },
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
 * only change while the collection has NEVER been published (`publishedAt`
 * null) — once published, contents are frozen forever, even after a
 * PUBLISHED -> DRAFT round-trip. A revised set needs `duplicateCollection`. [S5]
 */
export async function attachAsset(
  adminId: string,
  collectionId: string,
  assetId: string,
  sortOrder = 0,
) {
  try {
    return await serializableTx(async (tx) => {
      const [collection, asset] = await Promise.all([
        tx.cosmeticCollection.findUnique({ where: { id: collectionId } }),
        tx.cosmeticAsset.findUnique({ where: { id: assetId } }),
      ]);
      if (!collection) notFound("collection_not_found");
      if (!asset) notFound("asset_not_found");
      if (wasEverPublished(collection)) conflict("collection_membership_frozen");

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
  return serializableTx(async (tx) => {
    const collection = await tx.cosmeticCollection.findUnique({
      where: { id: collectionId },
      select: { publishedAt: true },
    });
    if (!collection) notFound("collection_not_found");
    if (wasEverPublished(collection)) conflict("collection_membership_frozen");

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

/**
 * Copy a collection (usually a published one) into a fresh editable DRAFT,
 * membership included, so a revised set can be built without ever mutating the
 * published original. Mirrors `duplicateAsset`. [S5]
 */
export async function duplicateCollection(
  adminId: string,
  id: string,
  slug: string,
) {
  return serializableTx(async (tx) => {
    const src = await tx.cosmeticCollection.findUnique({
      where: { id },
      include: { assets: { orderBy: { sortOrder: "asc" } } },
    });
    if (!src) notFound("collection_not_found");

    const copy = await tx.cosmeticCollection.create({
      data: {
        slug,
        name: `${src.name} (copy)`,
        description: src.description,
        coverUrl: src.coverUrl,
        rarity: src.rarity,
        isApplicableAsSet: src.isApplicableAsSet,
        sortOrder: src.sortOrder,
        createdByAdminId: adminId,
        status: "DRAFT",
        publishedAt: null,
        assets: {
          create: src.assets.map((a) => ({
            assetId: a.assetId,
            slot: a.slot,
            sortOrder: a.sortOrder,
          })),
        },
      },
    });
    await auditInTx(tx, {
      userId: adminId,
      action: "cosmeticCollection.duplicate",
      entity: "CosmeticCollection",
      entityId: copy.id,
      metadata: { from: id, assetCount: src.assets.length },
    });
    return copy;
  });
}

/** Hard delete — only a DRAFT that has NEVER been published + zero references. [S5] */
export async function deleteCollection(adminId: string, id: string) {
  return serializableTx(async (tx) => {
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
    if (c.status !== "DRAFT" || wasEverPublished(c) || refs > 0) {
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
