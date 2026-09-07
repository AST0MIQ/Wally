import { z } from "zod";
import {
  zAmount,
  zAmountNonNegative,
  zCurrency,
  zCuid,
  zDate,
  zIdempotencyKey,
  zOptionalText,
  zQuantity,
  zShortText,
} from "@/lib/validation/common";

export const SECURITY_TYPES = [
  "STOCK",
  "ETF",
  "CRYPTO",
  "FUND",
  "OTHER",
] as const;

export const portfolioCreateSchema = z.object({
  name: zShortText.min(1).default("Investment Portfolio"),
  accountId: zCuid,
  baseCurrency: zCurrency.default("USD"),
});

export const portfolioUpdateSchema = z.object({
  id: zCuid,
  name: zShortText.min(1).optional(),
  baseCurrency: zCurrency.optional(),
});

export const portfolioIdSchema = z.object({ id: zCuid });

export const securitySearchSchema = z.object({
  query: z.string().trim().min(1).max(60),
});

/** Attach a security to a portfolio position via BUY/SELL. */
export const investmentTxnCreateSchema = z.object({
  portfolioId: zCuid,
  type: z.enum(["BUY", "SELL"]),
  // one of: existing securityId, OR a symbol to get-or-create
  securityId: zCuid.optional(),
  symbol: zShortText.optional(),
  securityName: zShortText.optional(),
  securityType: z.enum(SECURITY_TYPES).default("STOCK"),
  securityCurrency: zCurrency.default("USD"),
  quantity: zQuantity,
  price: zAmount,
  fee: zAmountNonNegative.default("0"),
  tradeDate: zDate.default(() => new Date()),
  settlementAccountId: zCuid.optional(),
  note: zOptionalText(2000),
  idempotencyKey: zIdempotencyKey,
});

export const investmentHoldingImportSchema = z.object({
  portfolioId: zCuid,
  items: z.array(z.object({
    symbol: zShortText.min(1),
    securityCurrency: zCurrency.default("USD"),
    quantity: zQuantity,
    price: zAmount,
    idempotencyKey: zIdempotencyKey,
  })).min(1).max(50),
});

export const investmentTxnUpdateSchema = z.object({
  id: zCuid,
  type: z.enum(["BUY", "SELL"]).optional(),
  quantity: zQuantity.optional(),
  price: zAmount.optional(),
  fee: zAmountNonNegative.optional(),
  tradeDate: zDate.optional(),
  settlementAccountId: zCuid.nullable().optional(),
  note: z.string().trim().max(2000).nullable().optional(),
});

export const investmentTxnIdSchema = z.object({ id: zCuid });

export const manualPriceSchema = z.object({
  securityId: zCuid,
  price: zAmount,
  asOf: zDate.default(() => new Date()),
});

export type PortfolioCreateInput = z.infer<typeof portfolioCreateSchema>;
export type InvestmentTxnCreateInput = z.infer<
  typeof investmentTxnCreateSchema
>;
