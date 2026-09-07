import { prisma } from "@/server/db";
import {
  getProfile,
  getQuote,
  searchSecurities as finnhubSearch,
  type SecuritySearchResult,
} from "@/server/lib/finnhub";
import { toPlain } from "@/lib/money";

export type { SecuritySearchResult } from "@/server/lib/finnhub";

export async function searchSecurities(
  query: string,
): Promise<SecuritySearchResult[]> {
  return finnhubSearch(query);
}

type SecurityInput = {
  symbol: string;
  name?: string;
  type?: "STOCK" | "ETF" | "CRYPTO" | "FUND" | "OTHER";
  currency?: string;
};

/** Global reference row — shared across users (see ARCHITECTURE.md §H). */
export async function getOrCreateSecurity(
  input: SecurityInput,
): Promise<{ id: string; symbol: string; currency: string; name: string }> {
  const symbol = input.symbol.trim().toUpperCase();
  const requestedCurrency = input.currency?.trim().toUpperCase();
  const existing = await prisma.security.findFirst({
    where: {
      symbol,
      ...(requestedCurrency ? { currency: requestedCurrency } : {}),
    },
  });
  if (existing) {
    return {
      id: existing.id,
      symbol: existing.symbol,
      currency: existing.currency,
      name: existing.name,
    };
  }

  // enrich from Finnhub if available
  const profile = await getProfile(symbol);
  const currency = requestedCurrency || profile.currency || "USD";
  const symbolCollision = await prisma.security.findFirst({
    where: { symbol },
    select: { id: true },
  });
  const created = await prisma.security.create({
    data: {
      symbol,
      exchange: symbolCollision ? `CCY:${currency}` : null,
      name: input.name || profile.name || symbol,
      type: input.type ?? "STOCK",
      currency,
      finnhubSymbol: symbol,
    },
  });
  return {
    id: created.id,
    symbol: created.symbol,
    currency: created.currency,
    name: created.name,
  };
}

export type LatestPrice = {
  price: string;
  asOf: string;
  source: string;
} | null;

export async function getLatestPrice(securityId: string): Promise<LatestPrice> {
  const row = await prisma.securityPrice.findFirst({
    where: { securityId },
    orderBy: { asOf: "desc" },
  });
  if (!row) return null;
  return {
    price: toPlain(row.price),
    asOf: row.asOf.toISOString(),
    source: row.source,
  };
}

export async function getLatestPrices(
  securityIds: string[],
): Promise<Map<string, LatestPrice>> {
  const out = new Map<string, LatestPrice>();
  if (securityIds.length === 0) return out;
  const rows = await prisma.securityPrice.findMany({
    where: { securityId: { in: securityIds } },
    orderBy: { asOf: "desc" },
  });
  for (const r of rows) {
    if (out.has(r.securityId)) continue; // first = latest
    out.set(r.securityId, {
      price: toPlain(r.price),
      asOf: r.asOf.toISOString(),
      source: r.source,
    });
  }
  for (const id of securityIds) if (!out.has(id)) out.set(id, null);
  return out;
}

function dayFloor(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/**
 * Best price for each security as of a date: the newest row on/before `asOf`,
 * else the earliest available (flagged stale by the caller via asOf compare).
 */
export async function getPricesAsOf(
  securityIds: string[],
  asOf: Date,
): Promise<Map<string, LatestPrice>> {
  const out = new Map<string, LatestPrice>();
  if (securityIds.length === 0) return out;
  const day = dayFloor(asOf);

  const onOrBefore = await prisma.securityPrice.findMany({
    where: { securityId: { in: securityIds }, asOf: { lte: day } },
    orderBy: { asOf: "desc" },
  });
  for (const r of onOrBefore) {
    if (out.has(r.securityId)) continue;
    out.set(r.securityId, {
      price: toPlain(r.price),
      asOf: r.asOf.toISOString(),
      source: r.source,
    });
  }

  const missing = securityIds.filter((id) => !out.has(id));
  if (missing.length > 0) {
    const earliest = await prisma.securityPrice.findMany({
      where: { securityId: { in: missing } },
      orderBy: { asOf: "asc" },
    });
    for (const r of earliest) {
      if (out.has(r.securityId)) continue;
      out.set(r.securityId, {
        price: toPlain(r.price),
        asOf: r.asOf.toISOString(),
        source: r.source,
      });
    }
  }

  for (const id of securityIds) if (!out.has(id)) out.set(id, null);
  return out;
}

/** Manual price override — wins over Finnhub when `asOf` is newer. */
export async function setManualPrice(
  securityId: string,
  price: string,
  asOf: Date,
): Promise<void> {
  const security = await prisma.security.findUnique({
    where: { id: securityId },
    select: { currency: true },
  });
  if (!security) throw new Error("security_not_found");
  const day = dayFloor(asOf);
  await prisma.securityPrice.upsert({
    where: {
      securityId_asOf_source: { securityId, asOf: day, source: "manual" },
    },
    create: {
      securityId,
      price,
      currency: security.currency,
      asOf: day,
      source: "manual",
    },
    update: { price },
  });
}

export type PriceRefreshResult = {
  securities: number;
  updated: number;
  skipped: number;
};

const LIVE_PRICE_TTL_MS = 60_000;

export async function refreshSecurityPrices(
  securityIds: string[],
): Promise<PriceRefreshResult> {
  const securities = await prisma.security.findMany({
    where: { id: { in: securityIds } },
    select: {
      id: true,
      currency: true,
      finnhubSymbol: true,
      symbol: true,
      prices: {
        where: { source: "finnhub" },
        orderBy: { fetchedAt: "desc" },
        take: 1,
        select: { fetchedAt: true },
      },
    },
  });

  let updated = 0;
  let skipped = 0;
  for (const security of securities) {
    const lastFetch = security.prices[0]?.fetchedAt;
    if (lastFetch && Date.now() - lastFetch.getTime() < LIVE_PRICE_TTL_MS) {
      skipped += 1;
      continue;
    }
    const quote = await getQuote(security.finnhubSymbol || security.symbol);
    if (!quote) {
      skipped += 1;
      continue;
    }
    await prisma.securityPrice.upsert({
      where: {
        securityId_asOf_source: {
          securityId: security.id,
          asOf: quote.asOf,
          source: "finnhub",
        },
      },
      create: {
        securityId: security.id,
        price: quote.price.toString(),
        currency: security.currency,
        asOf: quote.asOf,
        source: "finnhub",
      },
      update: { price: quote.price.toString() },
    });
    updated += 1;
  }
  return { securities: securities.length, updated, skipped };
}

/** Cron: refresh Finnhub quotes for every security currently held. */
export async function refreshHeldSecurityPrices(): Promise<PriceRefreshResult> {
  const held = await prisma.investmentTransaction.findMany({
    where: { deletedAt: null },
    distinct: ["securityId"],
    select: { securityId: true, security: { select: { finnhubSymbol: true, symbol: true } } },
  });

  return refreshSecurityPrices(held.map((row) => row.securityId));
}

export async function refreshUserSecurityPrices(userId: string): Promise<PriceRefreshResult> {
  const held = await prisma.investmentTransaction.findMany({
    where: { userId, deletedAt: null },
    distinct: ["securityId"],
    select: { securityId: true },
  });
  return refreshSecurityPrices(held.map((row) => row.securityId));
}
