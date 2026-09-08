"use server";

import { revalidatePath } from "next/cache";

import { adminAction } from "@/server/lib/admin-action";
import {
  assetCreateSchema,
  assetUpdateSchema,
  assetIdSchema,
  setAssetStatusSchema,
  duplicateAssetSchema,
  collectionCreateSchema,
  collectionUpdateSchema,
  collectionIdSchema,
  setCollectionStatusSchema,
  attachAssetSchema,
  detachAssetSchema,
  duplicateAssetSchema as duplicateCollectionSchema,
} from "@/lib/validation/cosmetics";
import * as assets from "@/server/services/cosmetics/asset.service";
import * as collections from "@/server/services/cosmetics/collection.service";

function revalidateAppearance() {
  revalidatePath("/admin");
  revalidatePath("/admin/appearance/assets");
  revalidatePath("/admin/appearance/collections");
}

// ── Assets ───────────────────────────────────────────────────
export const createAssetAction = adminAction(
  assetCreateSchema,
  async ({ input, admin }) => {
    const a = await assets.createAsset(admin.id, input);
    revalidateAppearance();
    return { id: a.id };
  },
  { name: "asset.create", capability: "cosmetics:write" },
);

export const updateAssetAction = adminAction(
  assetUpdateSchema,
  async ({ input, admin }) => {
    await assets.updateAsset(admin.id, input);
    revalidateAppearance();
    revalidatePath(`/admin/appearance/assets/${input.id}`);
  },
  { name: "asset.update", capability: "cosmetics:write" },
);

export const setAssetStatusAction = adminAction(
  setAssetStatusSchema,
  async ({ input, admin }) => {
    await assets.setAssetStatus(admin.id, input.id, input.status);
    revalidateAppearance();
    revalidatePath(`/admin/appearance/assets/${input.id}`);
  },
  { name: "asset.status", capability: "cosmetics:publish" },
);

export const duplicateAssetAction = adminAction(
  duplicateAssetSchema,
  async ({ input, admin }) => {
    const a = await assets.duplicateAsset(admin.id, input.id, input.slug);
    revalidateAppearance();
    return { id: a.id };
  },
  { name: "asset.duplicate", capability: "cosmetics:write" },
);

export const deleteAssetAction = adminAction(
  assetIdSchema,
  async ({ input, admin }) => {
    await assets.deleteAsset(admin.id, input.id);
    revalidateAppearance();
  },
  { name: "asset.delete", capability: "cosmetics:write" },
);

// ── Collections ──────────────────────────────────────────────
export const createCollectionAction = adminAction(
  collectionCreateSchema,
  async ({ input, admin }) => {
    const c = await collections.createCollection(admin.id, input);
    revalidateAppearance();
    return { id: c.id };
  },
  { name: "collection.create", capability: "cosmetics:write" },
);

export const updateCollectionAction = adminAction(
  collectionUpdateSchema,
  async ({ input, admin }) => {
    await collections.updateCollection(admin.id, input);
    revalidateAppearance();
    revalidatePath(`/admin/appearance/collections/${input.id}`);
  },
  { name: "collection.update", capability: "cosmetics:write" },
);

export const setCollectionStatusAction = adminAction(
  setCollectionStatusSchema,
  async ({ input, admin }) => {
    await collections.setCollectionStatus(admin.id, input.id, input.status);
    revalidateAppearance();
    revalidatePath(`/admin/appearance/collections/${input.id}`);
  },
  { name: "collection.status", capability: "cosmetics:publish" },
);

export const deleteCollectionAction = adminAction(
  collectionIdSchema,
  async ({ input, admin }) => {
    await collections.deleteCollection(admin.id, input.id);
    revalidateAppearance();
  },
  { name: "collection.delete", capability: "cosmetics:write" },
);

export const duplicateCollectionAction = adminAction(
  duplicateCollectionSchema,
  async ({ input, admin }) => {
    const c = await collections.duplicateCollection(admin.id, input.id, input.slug);
    revalidateAppearance();
    return { id: c.id };
  },
  { name: "collection.duplicate", capability: "cosmetics:write" },
);

export const attachAssetAction = adminAction(
  attachAssetSchema,
  async ({ input, admin }) => {
    await collections.attachAsset(
      admin.id,
      input.collectionId,
      input.assetId,
      input.sortOrder,
    );
    revalidatePath(`/admin/appearance/collections/${input.collectionId}`);
  },
  { name: "collection.attach", capability: "cosmetics:write" },
);

export const detachAssetAction = adminAction(
  detachAssetSchema,
  async ({ input, admin }) => {
    await collections.detachAsset(admin.id, input.collectionId, input.assetId);
    revalidatePath(`/admin/appearance/collections/${input.collectionId}`);
  },
  { name: "collection.detach", capability: "cosmetics:write" },
);
