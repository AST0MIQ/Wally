import { z } from "zod";
import { isCurrencyCode } from "@/lib/currency";

export const zCuid = z.string().min(1).max(64);

export const zCurrency = z
  .string()
  .trim()
  .toUpperCase()
  .refine(isCurrencyCode, "invalid currency code");

/** Positive money amount as a string with up to 4 fraction digits. */
export const zAmount = z
  .string()
  .trim()
  .regex(/^\d{1,15}(\.\d{1,4})?$/, "invalid amount")
  .refine((v) => Number(v) > 0, "amount must be greater than 0");

/** Non-negative money amount (e.g. fees, opening balance). */
export const zAmountNonNegative = z
  .string()
  .trim()
  .regex(/^\d{1,15}(\.\d{1,4})?$/, "invalid amount");

/** Share quantity — up to 10 fraction digits, must be > 0. */
export const zQuantity = z
  .string()
  .trim()
  .regex(/^\d{1,15}(\.\d{1,10})?$/, "invalid quantity")
  .refine((v) => Number(v) > 0, "quantity must be greater than 0");

/** Accept an ISO date string or yyyy-mm-dd; coerce to Date. */
export const zDate = z.coerce.date();

export const zShortText = z.string().trim().max(200);
export const zLongText = z.string().trim().max(2000);

/** Optional string that turns "" into undefined. */
export const zOptionalText = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const zIdempotencyKey = z.string().trim().min(8).max(128).optional();

export const zHexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "invalid color");

/** A single emoji-ish icon token (kept short; not strictly validated). */
export const zIcon = z.string().trim().min(1).max(16);

export const zCursorPagination = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
