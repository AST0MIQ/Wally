import { z } from "zod";
import {
  zAmountNonNegative,
  zCurrency,
  zCuid,
  zDate,
  zHexColor,
  zIcon,
  zShortText,
} from "@/lib/validation/common";

export const ACCOUNT_TYPES = [
  "CASH",
  "BANK",
  "EWALLET",
  "SAVINGS",
  "INVESTMENT",
  "OTHER",
] as const;

export const accountCreateSchema = z.object({
  name: zShortText.min(1, "name is required"),
  type: z.enum(ACCOUNT_TYPES).default("BANK"),
  customTypeLabel: zShortText.optional().transform((v) => v || undefined),
  openingBalance: zAmountNonNegative.default("0"),
  openingBalanceDate: zDate.default(() => new Date()),
  currency: zCurrency,
  icon: zIcon.optional(),
  color: zHexColor.optional(),
});

export const accountUpdateSchema = accountCreateSchema.partial().extend({
  id: zCuid,
});

export const accountIdSchema = z.object({ id: zCuid });

export type AccountCreateInput = z.infer<typeof accountCreateSchema>;
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;
