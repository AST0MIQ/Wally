"use server";

import { revalidatePath } from "next/cache";

import { action } from "@/server/lib/action";
import { AppError } from "@/server/lib/errors";
import { requireUser } from "@/server/lib/guards";
import { rateLimit, RATE_LIMITS } from "@/server/lib/rate-limit";
import {
  investmentHoldingImportSchema,
  investmentTxnCreateSchema,
  investmentTxnIdSchema,
  investmentTxnUpdateSchema,
  manualPriceSchema,
  portfolioCreateSchema,
  portfolioIdSchema,
  portfolioUpdateSchema,
  securitySearchSchema,
} from "@/lib/validation/investment";
import {
  createInvestmentTransaction,
  createPortfolio,
  deleteInvestmentTransaction,
  deletePortfolio,
  updateInvestmentTransaction,
  updatePortfolio,
} from "@/server/services/portfolio.service";
import {
  searchSecurities,
  setManualPrice,
  type SecuritySearchResult,
} from "@/server/services/security.service";

function revalidatePortfolio(id?: string) {
  revalidatePath("/portfolio");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/portfolio/${id}`);
}

export const createPortfolioAction = action(
  portfolioCreateSchema,
  async ({ input, user }) => {
    const r = await createPortfolio(user.id, input);
    revalidatePortfolio();
    return r;
  },
);

export const updatePortfolioAction = action(
  portfolioUpdateSchema,
  async ({ input, user }) => {
    const r = await updatePortfolio(user.id, input);
    revalidatePortfolio(input.id);
    return r;
  },
);

export const deletePortfolioAction = action(
  portfolioIdSchema,
  async ({ input, user }) => {
    const r = await deletePortfolio(user.id, input.id);
    revalidatePortfolio();
    return r;
  },
);

export const createInvestmentTxnAction = action(
  investmentTxnCreateSchema,
  async ({ input, user }) => {
    const r = await createInvestmentTransaction(user.id, input);
    revalidatePortfolio(input.portfolioId);
    revalidatePath("/accounts");
    return r;
  },
);

export const createHoldingImportAction = action(
  investmentHoldingImportSchema,
  async ({ input, user }) => {
    const results: { symbol: string; ok: boolean; error?: string }[] = [];
    for (const item of input.items) {
      try {
        await createInvestmentTransaction(user.id, {
          portfolioId: input.portfolioId,
          type: "BUY",
          symbol: item.symbol,
          securityType: "STOCK",
          securityCurrency: item.securityCurrency,
          quantity: item.quantity,
          price: item.price,
          fee: "0",
          tradeDate: new Date(),
          idempotencyKey: item.idempotencyKey,
        });
        results.push({ symbol: item.symbol, ok: true });
      } catch (error) {
        results.push({ symbol: item.symbol, ok: false, error: error instanceof AppError ? error.message : "unexpected_error" });
      }
    }
    revalidatePortfolio(input.portfolioId);
    return { results, created: results.filter((row) => row.ok).length, failed: results.filter((row) => !row.ok).length };
  },
);

export const updateInvestmentTxnAction = action(
  investmentTxnUpdateSchema,
  async ({ input, user }) => {
    const r = await updateInvestmentTransaction(user.id, input);
    revalidatePortfolio();
    revalidatePath("/accounts");
    return r;
  },
);

export const deleteInvestmentTxnAction = action(
  investmentTxnIdSchema,
  async ({ input, user }) => {
    const r = await deleteInvestmentTransaction(user.id, input.id);
    revalidatePortfolio();
    revalidatePath("/accounts");
    return r;
  },
);

export const setManualPriceAction = action(
  manualPriceSchema,
  async ({ input, user }) => {
    void user;
    await setManualPrice(input.securityId, input.price, input.asOf);
    revalidatePortfolio();
    return { ok: true };
  },
);

/** Security search — plain query action (auth-gated + rate-limited). */
export async function searchSecuritiesAction(
  raw: unknown,
): Promise<SecuritySearchResult[]> {
  const user = await requireUser();
  const rl = rateLimit(`search:${user.id}`, RATE_LIMITS.search);
  if (!rl.ok) return [];
  const parsed = securitySearchSchema.safeParse(raw);
  if (!parsed.success) return [];
  return searchSecurities(parsed.data.query);
}
