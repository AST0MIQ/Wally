"use server";

import { revalidatePath } from "next/cache";

import { adminAction } from "@/server/lib/admin-action";
import {
  grantAssetSchema,
  grantCollectionSchema,
  bulkGrantAssetsSchema,
  revokeEntitlementSchema,
} from "@/lib/validation/cosmetics";
import {
  grantAsset,
  grantCollection,
  bulkGrantAssets,
  revokeEntitlement,
} from "@/server/services/cosmetics/entitlement.service";

function revalidateUser(userId: string) {
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users/entitlements");
  revalidatePath("/admin");
}

export const grantAssetAction = adminAction(
  grantAssetSchema,
  async ({ input, admin }) => {
    await grantAsset(admin.id, input.userId, input.assetId, {
      acquisitionType: input.acquisitionType,
      sourceRef: input.sourceRef,
      expiresAt: input.expiresAt,
    });
    revalidateUser(input.userId);
  },
  { name: "entitlement.grantAsset", capability: "entitlement:grant" },
);

export const grantCollectionAction = adminAction(
  grantCollectionSchema,
  async ({ input, admin }) => {
    await grantCollection(admin.id, input.userId, input.collectionId, {
      acquisitionType: input.acquisitionType,
      sourceRef: input.sourceRef,
      expiresAt: input.expiresAt,
    });
    revalidateUser(input.userId);
  },
  { name: "entitlement.grantCollection", capability: "entitlement:grant" },
);

export const bulkGrantAssetsAction = adminAction(
  bulkGrantAssetsSchema,
  async ({ input, admin }) => {
    await bulkGrantAssets(admin.id, input.userId, input.assetIds, {
      acquisitionType: input.acquisitionType,
      sourceRef: input.sourceRef,
      expiresAt: input.expiresAt,
    });
    revalidateUser(input.userId);
  },
  { name: "entitlement.bulkGrant", capability: "entitlement:grant" },
);

export const revokeEntitlementAction = adminAction(
  revokeEntitlementSchema,
  async ({ input, admin }) => {
    await revokeEntitlement(
      admin.id,
      input.userId,
      input.assetId,
      input.reason,
    );
    revalidateUser(input.userId);
  },
  { name: "entitlement.revoke", capability: "entitlement:revoke" },
);
