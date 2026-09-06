import { z } from "zod";
import { zCuid, zHexColor, zIcon, zShortText } from "@/lib/validation/common";

export const TXN_KINDS = ["INCOME", "EXPENSE"] as const;

export const categoryCreateSchema = z.object({
  name: zShortText.min(1, "name is required"),
  kind: z.enum(TXN_KINDS),
  icon: zIcon.optional(),
  color: zHexColor.optional(),
});

export const categoryUpdateSchema = z.object({
  id: zCuid,
  name: zShortText.min(1).optional(),
  icon: zIcon.optional(),
  color: zHexColor.optional(),
});

export const subcategoryCreateSchema = z.object({
  categoryId: zCuid,
  name: zShortText.min(1, "name is required"),
  icon: zIcon.optional(),
});

export const subcategoryUpdateSchema = z.object({
  id: zCuid,
  name: zShortText.min(1).optional(),
  icon: zIcon.optional(),
});

export const categoryDeleteSchema = z.object({
  id: zCuid,
  /** where to move existing transactions; omit to null them out */
  reassignToCategoryId: zCuid.optional(),
});

export const subcategoryDeleteSchema = z.object({ id: zCuid });

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type SubcategoryCreateInput = z.infer<typeof subcategoryCreateSchema>;
