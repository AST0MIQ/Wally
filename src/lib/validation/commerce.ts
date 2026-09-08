import { z } from "zod";
import { zCuid, zOptionalText, zShortText } from "@/lib/validation/common";
import { zSlug } from "@/lib/validation/cosmetics";

export const productSchema = z.object({
  slug: zSlug,
  name: zShortText.min(2),
  description: zOptionalText(500),
  price: z.coerce.number().positive().max(1_000_000),
  currency: z.string().trim().toUpperCase().length(3).default("THB"),
  grantsCollectionId: zCuid.optional(),
  grantsAssetId: zCuid.optional(),
}).refine((x) => Boolean(x.grantsCollectionId) !== Boolean(x.grantsAssetId), { message: "choose_one_reward", path: ["grantsAssetId"] });
export const productIdSchema = z.object({ id: zCuid });
export const productStatusSchema = productIdSchema.extend({ status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]) });
export const checkoutSchema = z.object({ productId: zCuid });
