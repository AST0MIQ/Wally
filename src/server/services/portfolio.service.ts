import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { writeAudit } from "@/server/lib/audit";
import { AppError, conflict, notFound } from "@/server/lib/errors";
import { assertAccountOwned } from "@/server/services/account.service";
import {
  getLatestPrices,
  getOrCreateSecurity,
  type LatestPrice,
} from "@/server/services/security.service";
import {
  computeHolding,
  marketMetrics,
  quantityAsOf,
  type InvTxnLike,
} from "@/server/lib/holdings";
import { money, sum, toPlain, ZERO } from "@/lib/money";
import type {
  InvestmentTxnCreateInput,
  PortfolioCreateInput,
} from "@/lib/validation/investment";

// ── Types ────────────────────────────────────────────────────────────
export type HoldingRow = {
  securityId: string;
  symbol: string;
  name: string;
  currency: string;
  quantity: string;
  avgCost: string;
  costBasis: string;
  currentPrice: string | null;
  priceAsOf: string | null;
  priceSource: string | null;
  marketValue: string;
  unrealizedPnL: string;
  unrealizedPnLPct: string;
  realizedPnL: string;
  portfolioPct: string;
};

export type PortfolioSummary = {
  id: string;
  name: string;
  accountId: string;
  accountName: string;
  baseCurrency: string;
  totalCost: string;
  totalMarketValue: string;
  totalUnrealizedPnL: string;
  totalUnrealizedPnLPct: string;
  totalRealizedPnL: string;
  holdingCount: number;
};

export type PortfolioDetail = PortfolioSummary & {
  holdings: HoldingRow[];
};

// ── Holdings computation ─────────────────────────────────────────────
async function computePortfolioHoldings(portfolioId: string): Promise<{
  holdings: HoldingRow[];
  totals: {
    cost: string;
    marketValue: string;
    unrealizedPnL: string;
    unrealizedPnLPct: string;
    realizedPnL: string;
  };
}> {
  const txns = await prisma.investmentTransaction.findMany({
    where: { portfolioId, deletedAt: null },
    include: {
      security: {
        select: { id: true, symbol: true, name: true, currency: true },
      },
    },
    orderBy: [{ tradeDate: "asc" }, { createdAt: "asc" }],
  });

  const bySecurity = new Map<
    string,
    { security: (typeof txns)[number]["security"]; txns: InvTxnLike[] }
  >();
  for (const t of txns) {
    const entry = bySecurity.get(t.securityId) ?? {
      security: t.security,
      txns: [],
    };
    entry.txns.push({
      type: t.type,
      quantity: t.quantity,
      price: t.price,
      fee: t.fee,
      tradeDate: t.tradeDate,
      createdAt: t.createdAt,
    });
    bySecurity.set(t.securityId, entry);
  }

  const priceMap = await getLatestPrices([...bySecurity.keys()]);

  const raw = [...bySecurity.entries()].map(([securityId, { security, txns: list }]) => {
    const h = computeHolding(list);
    const price: LatestPrice = priceMap.get(securityId) ?? null;
    // Missing market data is unknown, not a zero price. Use cost as a neutral
    // valuation until a quote arrives so the UI never reports a false -100%.
    const m = marketMetrics(h, price ? price.price : h.avgCost);
    return { securityId, security, h, price, m };
  });

  const openPositions = raw.filter((r) => r.h.quantity.gt(0));
  const totalMarketValue = sum(openPositions.map((r) => r.m.marketValue));
  const totalCost = sum(openPositions.map((r) => r.h.costBasis));
  const totalRealized = sum(raw.map((r) => r.h.realizedPnL));
  const totalUnrealized = totalMarketValue.minus(totalCost);

  const holdings: HoldingRow[] = openPositions
    .map((r) => ({
      securityId: r.securityId,
      symbol: r.security.symbol,
      name: r.security.name,
      currency: r.security.currency,
      quantity: toPlain(r.h.quantity),
      avgCost: toPlain(r.h.avgCost),
      costBasis: toPlain(r.h.costBasis),
      currentPrice: r.price ? r.price.price : null,
      priceAsOf: r.price ? r.price.asOf : null,
      priceSource: r.price ? r.price.source : null,
      marketValue: toPlain(r.m.marketValue),
      unrealizedPnL: toPlain(r.m.unrealizedPnL),
      unrealizedPnLPct: toPlain(r.m.unrealizedPnLPct),
      realizedPnL: toPlain(r.h.realizedPnL),
      portfolioPct: totalMarketValue.gt(0)
        ? toPlain(r.m.marketValue.div(totalMarketValue).mul(100))
        : "0",
    }))
    .sort((a, b) => Number(b.marketValue) - Number(a.marketValue));

  return {
    holdings,
    totals: {
      cost: toPlain(totalCost),
      marketValue: toPlain(totalMarketValue),
      unrealizedPnL: toPlain(totalUnrealized),
      unrealizedPnLPct: totalCost.gt(0)
        ? toPlain(totalUnrealized.div(totalCost).mul(100))
        : "0",
      realizedPnL: toPlain(totalRealized),
    },
  };
}

// ── Queries ──────────────────────────────────────────────────────────
export async function listPortfolios(
  userId: string,
): Promise<PortfolioSummary[]> {
  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: { account: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return Promise.all(
    portfolios.map(async (p) => {
      const { holdings, totals } = await computePortfolioHoldings(p.id);
      return {
        id: p.id,
        name: p.name,
        accountId: p.accountId,
        accountName: p.account.name,
        baseCurrency: p.baseCurrency,
        totalCost: totals.cost,
        totalMarketValue: totals.marketValue,
        totalUnrealizedPnL: totals.unrealizedPnL,
        totalUnrealizedPnLPct: totals.unrealizedPnLPct,
        totalRealizedPnL: totals.realizedPnL,
        holdingCount: holdings.length,
      };
    }),
  );
}

export async function getPortfolio(
  userId: string,
  id: string,
): Promise<PortfolioDetail> {
  const p = await prisma.portfolio.findFirst({
    where: { id, userId },
    include: { account: { select: { name: true } } },
  });
  if (!p) notFound("Portfolio not found");

  const { holdings, totals } = await computePortfolioHoldings(p.id);
  return {
    id: p.id,
    name: p.name,
    accountId: p.accountId,
    accountName: p.account.name,
    baseCurrency: p.baseCurrency,
    totalCost: totals.cost,
    totalMarketValue: totals.marketValue,
    totalUnrealizedPnL: totals.unrealizedPnL,
    totalUnrealizedPnLPct: totals.unrealizedPnLPct,
    totalRealizedPnL: totals.realizedPnL,
    holdingCount: holdings.length,
    holdings,
  };
}

export type InvTxnRow = {
  id: string;
  type: "BUY" | "SELL";
  symbol: string;
  securityName: string;
  quantity: string;
  price: string;
  fee: string;
  amount: string;
  currency: string;
  tradeDate: string;
  settlementAccountId: string | null;
  note: string | null;
};

export async function listInvestmentTransactions(
  userId: string,
  portfolioId: string,
  opts: { cursor?: string; limit?: number } = {},
): Promise<{ items: InvTxnRow[]; nextCursor: string | null }> {
  const portfolio = await prisma.portfolio.findFirst({
    where: { id: portfolioId, userId },
    select: { id: true },
  });
  if (!portfolio) notFound("Portfolio not found");

  const limit = Math.min(Math.max(opts.limit ?? 30, 1), 100);
  const rows = await prisma.investmentTransaction.findMany({
    where: { portfolioId, deletedAt: null },
    include: { security: { select: { symbol: true, name: true } } },
    orderBy: [{ tradeDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  return {
    items: page.map((t) => ({
      id: t.id,
      type: t.type,
      symbol: t.security.symbol,
      securityName: t.security.name,
      quantity: toPlain(t.quantity),
      price: toPlain(t.price),
      fee: toPlain(t.fee),
      amount: toPlain(t.amount),
      currency: t.currency,
      tradeDate: t.tradeDate.toISOString(),
      settlementAccountId: t.settlementAccountId,
      note: t.note,
    })),
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
  };
}

// ── Mutations ────────────────────────────────────────────────────────
export async function createPortfolio(
  userId: string,
  input: PortfolioCreateInput,
): Promise<{ id: string }> {
  await assertAccountOwned(userId, input.accountId);
  const p = await prisma.portfolio.create({
    data: {
      userId,
      name: input.name,
      accountId: input.accountId,
      baseCurrency: input.baseCurrency,
    },
  });
  await writeAudit({
    userId,
    action: "portfolio.create",
    entity: "Portfolio",
    entityId: p.id,
  });
  return { id: p.id };
}

export async function updatePortfolio(
  userId: string,
  input: { id: string; name?: string; baseCurrency?: string },
): Promise<{ id: string }> {
  const existing = await prisma.portfolio.findFirst({
    where: { id: input.id, userId },
    select: { id: true },
  });
  if (!existing) notFound("Portfolio not found");
  await prisma.portfolio.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.baseCurrency !== undefined
        ? { baseCurrency: input.baseCurrency }
        : {}),
    },
  });
  await writeAudit({
    userId,
    action: "portfolio.update",
    entity: "Portfolio",
    entityId: existing.id,
  });
  return { id: existing.id };
}

export async function deletePortfolio(
  userId: string,
  id: string,
): Promise<{ id: string }> {
  const existing = await prisma.portfolio.findFirst({
    where: { id, userId },
    select: { id: true, _count: { select: { transactions: true } } },
  });
  if (!existing) notFound("Portfolio not found");
  if (existing._count.transactions > 0) conflict("portfolio_has_transactions");
  await prisma.portfolio.delete({ where: { id } });
  await writeAudit({
    userId,
    action: "portfolio.delete",
    entity: "Portfolio",
    entityId: id,
  });
  return { id };
}

export async function createInvestmentTransaction(
  userId: string,
  input: InvestmentTxnCreateInput,
): Promise<{ id: string; deduped: boolean }> {
  if (input.idempotencyKey) {
    const existing = await prisma.investmentTransaction.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true, userId: true },
    });
    if (existing) {
      if (existing.userId !== userId) {
        throw new AppError("idempotency_conflict", "CONFLICT");
      }
      return { id: existing.id, deduped: true };
    }
  }

  const portfolio = await prisma.portfolio.findFirst({
    where: { id: input.portfolioId, userId },
    select: { id: true },
  });
  if (!portfolio) notFound("Portfolio not found");

  // resolve security
  let securityId = input.securityId ?? "";
  let securityCurrency = input.securityCurrency;
  if (!securityId) {
    if (!input.symbol) throw new AppError("security_required", "BAD_REQUEST");
    const sec = await getOrCreateSecurity({
      symbol: input.symbol,
      name: input.securityName,
      type: input.securityType,
      currency: input.securityCurrency,
    });
    securityId = sec.id;
    securityCurrency = sec.currency;
  } else {
    const sec = await prisma.security.findUnique({
      where: { id: securityId },
      select: { currency: true },
    });
    if (!sec) throw new AppError("security_not_found", "NOT_FOUND");
    securityCurrency = sec.currency;
  }

  // no-oversell check for SELL
  if (input.type === "SELL") {
    const priorTxns = await prisma.investmentTransaction.findMany({
      where: { portfolioId: portfolio.id, securityId, deletedAt: null },
      select: {
        type: true,
        quantity: true,
        price: true,
        fee: true,
        tradeDate: true,
        createdAt: true,
      },
    });
    const held = quantityAsOf(priorTxns, input.tradeDate);
    if (money(input.quantity).gt(held)) {
      throw new AppError("oversell", "BAD_REQUEST");
    }
  }

  if (input.settlementAccountId) {
    const acc = await assertAccountOwned(userId, input.settlementAccountId);
    if (acc.currency !== securityCurrency) {
      // settlement moves cash 1:1 into balance.ts (no FX there), so the
      // account and the security must share a currency.
      throw new AppError("settlement_currency_mismatch", "BAD_REQUEST");
    }
  }

  const gross = money(input.quantity).mul(money(input.price));
  const fee = money(input.fee ?? "0");
  const amount =
    input.type === "BUY" ? gross.plus(fee) : gross.minus(fee);

  const txn = await prisma.investmentTransaction.create({
    data: {
      userId,
      portfolioId: portfolio.id,
      securityId,
      type: input.type,
      quantity: input.quantity,
      price: input.price,
      fee: fee.toString(),
      amount: amount.toString(),
      currency: securityCurrency,
      tradeDate: input.tradeDate,
      settlementAccountId: input.settlementAccountId ?? null,
      note: input.note ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
    },
  });

  await writeAudit({
    userId,
    action: "investment.create",
    entity: "InvestmentTransaction",
    entityId: txn.id,
    metadata: { type: input.type, quantity: input.quantity },
  });

  return { id: txn.id, deduped: false };
}

export async function updateInvestmentTransaction(
  userId: string,
  input: {
    id: string;
    type?: "BUY" | "SELL";
    quantity?: string;
    price?: string;
    fee?: string;
    tradeDate?: Date;
    settlementAccountId?: string | null;
    note?: string | null;
  },
): Promise<{ id: string }> {
  const existing = await prisma.investmentTransaction.findFirst({
    where: { id: input.id, userId, deletedAt: null },
  });
  if (!existing) notFound("Transaction not found");

  if (input.settlementAccountId) {
    const acc = await assertAccountOwned(userId, input.settlementAccountId);
    if (acc.currency !== existing.currency) {
      throw new AppError("settlement_currency_mismatch", "BAD_REQUEST");
    }
  }

  const type = input.type ?? existing.type;
  const quantity = money(input.quantity ?? existing.quantity);
  const price = money(input.price ?? existing.price);
  const fee = money(input.fee ?? existing.fee);
  const gross = quantity.mul(price);
  const amount = type === "BUY" ? gross.plus(fee) : gross.minus(fee);

  await prisma.investmentTransaction.update({
    where: { id: existing.id },
    data: {
      type,
      quantity: quantity.toString(),
      price: price.toString(),
      fee: fee.toString(),
      amount: amount.toString(),
      ...(input.tradeDate !== undefined ? { tradeDate: input.tradeDate } : {}),
      ...(input.settlementAccountId !== undefined
        ? { settlementAccountId: input.settlementAccountId }
        : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
    },
  });
  await writeAudit({
    userId,
    action: "investment.update",
    entity: "InvestmentTransaction",
    entityId: existing.id,
  });
  return { id: existing.id };
}

export async function deleteInvestmentTransaction(
  userId: string,
  id: string,
): Promise<{ id: string }> {
  const existing = await prisma.investmentTransaction.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) notFound("Transaction not found");
  await prisma.investmentTransaction.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await writeAudit({
    userId,
    action: "investment.delete",
    entity: "InvestmentTransaction",
    entityId: id,
  });
  return { id };
}
