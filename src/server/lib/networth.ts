import { prisma } from "@/server/db";
import { computeAccountBalances } from "@/server/lib/balance";
import { convert } from "@/server/lib/fx";
import { getPricesAsOf } from "@/server/services/security.service";
import { computeHolding, type InvTxnLike } from "@/server/lib/holdings";
import { money, roundTo, sum, toPlain, ZERO, type Decimal } from "@/lib/money";

export type NetWorthAccount = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  currency: string;
  balanceNative: string;
  balanceBase: string;
};

export type NetWorthPortfolio = {
  id: string;
  name: string;
  marketValueBase: string;
  costBase: string;
  unrealizedBase: string;
};

export type NetWorthBreakdown = {
  baseCurrency: string;
  asOf: string;
  totalCash: string;
  totalInvestment: string;
  netWorth: string;
  /** true if any FX rate used was stale / missing */
  approx: boolean;
  accounts: NetWorthAccount[];
  portfolios: NetWorthPortfolio[];
};

/**
 * Net worth in the user's base currency, with no double counting:
 *   netWorth = Σ account cash balance (FX→base) + Σ portfolio market value (FX→base)
 *
 * Cash used to buy securities has already left its settlement account
 * (see balance.ts), so adding portfolio market value never counts it twice.
 */
export async function computeNetWorth(
  userId: string,
  opts: { asOf?: Date } = {},
): Promise<NetWorthBreakdown> {
  const asOf = opts.asOf ?? new Date();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { baseCurrency: true },
  });
  const base = user.baseCurrency;

  let approx = false;

  // ── Cash ───────────────────────────────────────────────────────────
  const [accountMeta, balances] = await Promise.all([
    prisma.financeAccount.findMany({
      where: { userId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
        currency: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    computeAccountBalances(userId, { asOf }),
  ]);

  const accounts: NetWorthAccount[] = [];
  for (const a of accountMeta) {
    const native = balances.get(a.id) ?? ZERO;
    const conv = await convert(native, a.currency, base, asOf);
    if (conv.approx) approx = true;
    accounts.push({
      id: a.id,
      name: a.name,
      icon: a.icon,
      color: a.color,
      currency: a.currency,
      balanceNative: toPlain(native),
      balanceBase: conv.amount,
    });
  }
  const totalCash = sum(accounts.map((a) => a.balanceBase));

  // ── Investments ────────────────────────────────────────────────────
  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  const txns = await prisma.investmentTransaction.findMany({
    where: {
      userId,
      deletedAt: null,
      tradeDate: { lte: asOf },
    },
    select: {
      portfolioId: true,
      securityId: true,
      type: true,
      quantity: true,
      price: true,
      fee: true,
      tradeDate: true,
      createdAt: true,
      security: { select: { currency: true } },
    },
  });

  const allSecurityIds = [...new Set(txns.map((t) => t.securityId))];
  const priceMap = await getPricesAsOf(allSecurityIds, asOf);

  const portfolioResults: NetWorthPortfolio[] = [];
  for (const p of portfolios) {
    const bySecurity = new Map<
      string,
      { currency: string; list: InvTxnLike[] }
    >();
    for (const t of txns) {
      if (t.portfolioId !== p.id) continue;
      const e = bySecurity.get(t.securityId) ?? {
        currency: t.security.currency,
        list: [],
      };
      e.list.push({
        type: t.type,
        quantity: t.quantity,
        price: t.price,
        fee: t.fee,
        tradeDate: t.tradeDate,
        createdAt: t.createdAt,
      });
      bySecurity.set(t.securityId, e);
    }

    let mvBase: Decimal = ZERO;
    let costBase: Decimal = ZERO;
    for (const [securityId, { currency, list }] of bySecurity) {
      const h = computeHolding(list);
      if (h.quantity.lte(0)) continue;
      const price = priceMap.get(securityId);
      const mvNative = price
        ? h.quantity.mul(money(price.price))
        : h.costBasis; // fall back to cost basis when no price at all
      const mvConv = await convert(mvNative, currency, base, asOf);
      const costConv = await convert(h.costBasis, currency, base, asOf);
      if (mvConv.approx || costConv.approx) approx = true;
      mvBase = mvBase.plus(money(mvConv.amount));
      costBase = costBase.plus(money(costConv.amount));
    }

    // These are reported figures, not share maths — quantity * price carries
    // far more precision than the two decimals every screen shows. Round once
    // here so a stored snapshot and a live read agree digit for digit.
    portfolioResults.push({
      id: p.id,
      name: p.name,
      marketValueBase: toPlain(roundTo(mvBase)),
      costBase: toPlain(roundTo(costBase)),
      unrealizedBase: toPlain(roundTo(mvBase.minus(costBase))),
    });
  }

  const totalInvestment = sum(
    portfolioResults.map((p) => p.marketValueBase),
  );

  return {
    baseCurrency: base,
    asOf: asOf.toISOString(),
    totalCash: toPlain(roundTo(totalCash)),
    totalInvestment: toPlain(roundTo(totalInvestment)),
    netWorth: toPlain(roundTo(totalCash.plus(totalInvestment))),
    approx,
    accounts,
    portfolios: portfolioResults,
  };
}

// ── Snapshots ────────────────────────────────────────────────────────
function dayFloorUTC(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

export async function snapshotNetWorth(
  userId: string,
  date: Date = new Date(),
): Promise<{ date: string; netWorth: string }> {
  const day = dayFloorUTC(date);
  // snapshot the state as of end-of-that-day
  const asOf = new Date(day.getTime() + 24 * 60 * 60 * 1000 - 1);
  const nw = await computeNetWorth(userId, { asOf });

  await prisma.netWorthSnapshot.upsert({
    where: { userId_date: { userId, date: day } },
    create: {
      userId,
      date: day,
      baseCurrency: nw.baseCurrency,
      totalCash: nw.totalCash,
      totalInvestment: nw.totalInvestment,
      totalNetWorth: nw.netWorth,
    },
    update: {
      baseCurrency: nw.baseCurrency,
      totalCash: nw.totalCash,
      totalInvestment: nw.totalInvestment,
      totalNetWorth: nw.netWorth,
    },
  });

  return { date: day.toISOString(), netWorth: nw.netWorth };
}

export async function snapshotAllUsers(): Promise<{ users: number }> {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) {
    await snapshotNetWorth(u.id).catch((err) =>
      console.error("[snapshotNetWorth]", u.id, err),
    );
  }
  return { users: users.length };
}

/** Recompute daily snapshots for the last `days` days (one-off backfill). */
export async function backfillNetWorthSnapshots(
  userId: string,
  days = 120,
): Promise<{ days: number }> {
  const today = dayFloorUTC(new Date());
  for (let i = days; i >= 0; i -= 1) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    await snapshotNetWorth(userId, d);
  }
  return { days };
}

export type NetWorthPoint = {
  date: string;
  cash: string;
  investment: string;
  netWorth: string;
};

export async function getNetWorthHistory(
  userId: string,
  days = 120,
): Promise<NetWorthPoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await prisma.netWorthSnapshot.findMany({
    where: { userId, date: { gte: dayFloorUTC(since) } },
    orderBy: { date: "asc" },
  });
  return rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    cash: toPlain(r.totalCash),
    investment: toPlain(r.totalInvestment),
    netWorth: toPlain(r.totalNetWorth),
  }));
}
