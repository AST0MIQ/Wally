import { z } from "zod";

import { zCuid, zOptionalText, zShortText } from "@/lib/validation/common";
import { assetConfigV1Schema } from "@/lib/cosmetics/config";
import { EQUIPMENT_SLOTS } from "@/lib/cosmetics/slots";

export const zSlug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "use lowercase-kebab-case")
  .min(2)
  .max(64);

export const zEquipmentSlot = z.enum(EQUIPMENT_SLOTS);
export const zRarity = z.enum(["COMMON", "RARE", "EPIC", "SPECIAL", "LIMITED"]);
export const zStatus = z.enum(["DRAFT", "PUBLISHED", "HIDDEN", "ARCHIVED"]);
export const zAcquisitionType = z.enum([
  "DEFAULT",
  "STREAK_REWARD",
  "RANK_REWARD",
  "ACHIEVEMENT",
  "PURCHASE",
  "LIMITED_EVENT",
  "ADMIN_GRANT",
]);
export const zRewardTrigger = z.enum([
  "STREAK_MILESTONE",
  "RANK_MILESTONE",
  "ACHIEVEMENT",
  "MANUAL",
]);

// ── Collections ──────────────────────────────────────────────
export const collectionCreateSchema = z.object({
  slug: zSlug,
  name: zShortText.min(2),
  description: zOptionalText(500),
  rarity: zRarity.default("COMMON"),
  isApplicableAsSet: z.boolean().default(true),
  coverUrl: zOptionalText(300),
});

export const collectionUpdateSchema = collectionCreateSchema
  .partial()
  .extend({ id: zCuid });

export const collectionIdSchema = z.object({ id: zCuid });
export const setCollectionStatusSchema = z.object({
  id: zCuid,
  status: zStatus,
});
export const attachAssetSchema = z.object({
  collectionId: zCuid,
  assetId: zCuid,
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});
export const detachAssetSchema = z.object({
  collectionId: zCuid,
  assetId: zCuid,
});

// ── Assets ───────────────────────────────────────────────────
export const assetCreateSchema = z.object({
  slug: zSlug,
  name: zShortText.min(2),
  description: zOptionalText(500),
  slot: zEquipmentSlot, // immutable after create
  rarity: zRarity.default("COMMON"),
  acquisitionType: zAcquisitionType.default("ADMIN_GRANT"),
  previewUrl: zOptionalText(300),
  config: assetConfigV1Schema,
});

/** No `slot`; `config` only honoured while the asset is still DRAFT. */
export const assetUpdateSchema = z.object({
  id: zCuid,
  name: zShortText.min(2).optional(),
  description: zOptionalText(500),
  rarity: zRarity.optional(),
  acquisitionType: zAcquisitionType.optional(),
  previewUrl: zOptionalText(300),
  config: assetConfigV1Schema.optional(),
});

export const assetIdSchema = z.object({ id: zCuid });
export const setAssetStatusSchema = z.object({ id: zCuid, status: zStatus });
export const duplicateAssetSchema = z.object({ id: zCuid, slug: zSlug });

// ── Entitlements (admin) ─────────────────────────────────────
export const grantAssetSchema = z.object({
  userId: zCuid,
  assetId: zCuid,
  acquisitionType: zAcquisitionType.default("ADMIN_GRANT"),
  sourceRef: zOptionalText(200),
  expiresAt: z.coerce.date().optional(),
});
export const grantCollectionSchema = z.object({
  userId: zCuid,
  collectionId: zCuid,
  acquisitionType: zAcquisitionType.default("ADMIN_GRANT"),
  sourceRef: zOptionalText(200),
  expiresAt: z.coerce.date().optional(),
});
export const revokeEntitlementSchema = z.object({
  userId: zCuid,
  assetId: zCuid,
  reason: zOptionalText(200),
});

// ── Reward rules ─────────────────────────────────────────────
export const rewardRuleCreateSchema = z
  .object({
    key: zSlug,
    name: zShortText.min(2),
    description: zOptionalText(500),
    trigger: zRewardTrigger,
    threshold: z.coerce.number().int().min(0).max(100000).optional(),
    grantsCollectionId: zCuid.optional(),
    grantsAssetId: zCuid.optional(),
    isActive: z.boolean().default(false),
  })
  .refine(
    (r) => Boolean(r.grantsCollectionId) !== Boolean(r.grantsAssetId),
    { message: "reward must grant exactly one target", path: ["grantsAssetId"] },
  );

export const rewardRuleUpdateSchema = z
  .object({
    id: zCuid,
    name: zShortText.min(2).optional(),
    description: zOptionalText(500),
    trigger: zRewardTrigger.optional(),
    threshold: z.coerce.number().int().min(0).max(100000).nullable().optional(),
    grantsCollectionId: zCuid.nullable().optional(),
    grantsAssetId: zCuid.nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (r) =>
      r.grantsCollectionId === undefined && r.grantsAssetId === undefined
        ? true
        : Boolean(r.grantsCollectionId) !== Boolean(r.grantsAssetId),
    { message: "reward must grant exactly one target", path: ["grantsAssetId"] },
  );

export const rewardRuleIdSchema = z.object({ id: zCuid });

// ── User loadout actions ─────────────────────────────────────
export const equipSchema = z.object({ slot: zEquipmentSlot, assetId: zCuid });
export const unequipSchema = z.object({ slot: zEquipmentSlot });
export const applyCollectionSchema = z.object({ collectionId: zCuid });

export type AssetCreateInput = z.infer<typeof assetCreateSchema>;
export type CollectionCreateInput = z.infer<typeof collectionCreateSchema>;
