import { z } from "zod";
import { isCurrencyCode } from "@/lib/currency";

export const zCuid = z.string().min(1).max(64);

export const zCurrency = z
  .string()
  .trim()
  .toUpperCase()
  .refine(isCurrencyCode, "invalid currency code");

/**
 * Money is two decimal places, everywhere.
 *
 * Every amount field in the UI shows two and the numpad accepts two, so
 * anything finer can be neither displayed nor spent — it just becomes dust in
 * a balance. Amounts are therefore rounded here, at the one boundary every
 * write passes through, rather than at each call site where the next one added
 * would forget.
 *
 * Extra digits are accepted and rounded rather than rejected: they arrive from
 * derived figures (an FX conversion, a slip parse), and failing the write would
 * be worse than normalising it.
 */
const MONEY_DECIMALS = 2;

function roundMoney(value: string): string {
  // Decimal-string rounding, not parseFloat: 1.005 must go to 1.01, and large
  // amounts must not lose their low digits to a binary float.
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = (negative ? value.slice(1) : value).split(".");
  if (fraction.length <= MONEY_DECIMALS) return value;
  const keep = fraction.slice(0, MONEY_DECIMALS);
  const roundUp = Number(fraction[MONEY_DECIMALS]) >= 5;
  let digits = BigInt(`${whole}${keep}`);
  if (roundUp) digits += 1n;
  const text = digits.toString().padStart(MONEY_DECIMALS + 1, "0");
  const head = text.slice(0, -MONEY_DECIMALS);
  const tail = text.slice(-MONEY_DECIMALS);
  return `${negative ? "-" : ""}${head}.${tail}`;
}

/** Positive money amount. Accepts up to 4 fraction digits, stores 2. */
export const zAmount = z
  .string()
  .trim()
  .regex(/^\d{1,15}(\.\d{1,4})?$/, "invalid amount")
  .transform(roundMoney)
  // After rounding, so 0.004 is rejected rather than stored as 0.00.
  .refine((v) => Number(v) > 0, "amount must be greater than 0");

/** Non-negative money amount (e.g. fees, opening balance). Stores 2 digits. */
export const zAmountNonNegative = z
  .string()
  .trim()
  .regex(/^\d{1,15}(\.\d{1,4})?$/, "invalid amount")
  .transform(roundMoney);

/**
 * A price per unit — not an amount of money in an account. Securities can
 * quote below a cent, so this keeps the column's full precision; rounding it
 * would zero out a cheap holding and shift every cost basis.
 */
export const zUnitPrice = z
  .string()
  .trim()
  .regex(/^\d{1,15}(\.\d{1,6})?$/, "invalid price")
  .refine((v) => Number(v) > 0, "price must be greater than 0");

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
