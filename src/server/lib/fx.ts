import { prisma } from "@/server/db";
import { Decimal, money, toPlain, type DecimalInput } from "@/lib/money";
import { getForexRates } from "@/server/lib/finnhub";

/**
 * Multi-currency FX. All rates are stored relative to a single pivot (USD):
 * a `FxRate` row means "1 USD = <rate> <quote>" as of `asOf` (UTC date).
 *
 * convert(amount, from, to, asOf):
 *   USD_value = amount / rate(from)
 *   result    = USD_value * rate(to)
 *
 * Historical accuracy: each transaction is converted using the rate as of its
 * own date. When no rate on/before that date exists we fall back to the
 * nearest available rate and flag the result `approx` (see ARCHITECTURE.md §N6).
 */
export const FX_PIVOT = "USD";

export type FxConversion = {
  amount: string;
  /** effective from→to rate used */
  rate: string;
  asOf: string;
  approx: boolean;
};

export function dayFloorUTC(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

async function pivotRate(
  quote: string,
  asOf: Date,
): Promise<{ rate: Decimal; asOf: Date; stale: boolean } | null> {
  if (quote === FX_PIVOT) return { rate: money(1), asOf, stale: false };
  const day = dayFloorUTC(asOf);

  const onOrBefore = await prisma.fxRate.findFirst({
    where: { base: FX_PIVOT, quote, asOf: { lte: day } },
    orderBy: { asOf: "desc" },
  });
  if (onOrBefore) {
    return {
      rate: money(onOrBefore.rate),
      asOf: onOrBefore.asOf,
      stale: onOrBefore.asOf.getTime() < day.getTime(),
    };
  }

  const earliest = await prisma.fxRate.findFirst({
    where: { base: FX_PIVOT, quote },
    orderBy: { asOf: "asc" },
  });
  if (earliest) {
    return { rate: money(earliest.rate), asOf: earliest.asOf, stale: true };
  }
  return null;
}

export async function convert(
  amount: DecimalInput,
  from: string,
  to: string,
  asOf: Date = new Date(),
): Promise<FxConversion> {
  const day = dayFloorUTC(asOf);
  if (from === to) {
    return {
      amount: toPlain(money(amount)),
      rate: "1",
      asOf: day.toISOString(),
      approx: false,
    };
  }

  const [rf, rt] = await Promise.all([
    pivotRate(from, asOf),
    pivotRate(to, asOf),
  ]);

  if (!rf || !rt) {
    // No rate data at all for one side — return the nominal amount, flagged.
    return {
      amount: toPlain(money(amount)),
      rate: "1",
      asOf: day.toISOString(),
      approx: true,
    };
  }

  const usdValue = money(amount).div(rf.rate);
  const out = usdValue.mul(rt.rate);
  const effective = rt.rate.div(rf.rate);
  const asOfUsed = rf.asOf.getTime() < rt.asOf.getTime() ? rf.asOf : rt.asOf;

  return {
    amount: toPlain(out),
    rate: toPlain(effective),
    asOf: asOfUsed.toISOString(),
    approx: rf.stale || rt.stale,
  };
}

// ── Rate ingestion (frankfurter.app — ECB data, free, no key) ─────────
const FRANKFURTER = "https://api.frankfurter.app";

export type RateFetchResult = {
  dates: string[];
  currencies: string[];
  rowsWritten: number;
};

/** Currencies we need rates for: everything users actually hold + base set. */
export async function currenciesInUse(): Promise<string[]> {
  const [accountRows, userRows] = await Promise.all([
    prisma.financeAccount.findMany({
      distinct: ["currency"],
      select: { currency: true },
    }),
    prisma.user.findMany({
      distinct: ["baseCurrency"],
      select: { baseCurrency: true },
    }),
  ]);
  const set = new Set<string>(["THB", "EUR", "GBP", "JPY"]);
  for (const r of accountRows) set.add(r.currency);
  for (const r of userRows) set.add(r.baseCurrency);
  set.delete(FX_PIVOT);
  return [...set];
}

async function upsertRates(
  date: string,
  rates: Record<string, number>,
  source: string,
): Promise<number> {
  const asOf = new Date(`${date}T00:00:00.000Z`);
  const entries = Object.entries(rates);
  await prisma.$transaction(
    entries.map(([quote, rate]) =>
      prisma.fxRate.upsert({
        where: {
          base_quote_asOf: { base: FX_PIVOT, quote, asOf },
        },
        create: {
          base: FX_PIVOT,
          quote,
          rate: rate.toString(),
          asOf,
          source,
        },
        update: { rate: rate.toString(), source },
      }),
    ),
  );
  return entries.length;
}

/** Fetch & store the latest USD→* rates. Used by the daily cron. */
export async function refreshLatestRates(
  currencies?: string[],
): Promise<RateFetchResult> {
  const list = currencies ?? (await currenciesInUse());
  if (list.length === 0) return { dates: [], currencies: [], rowsWritten: 0 };

  const url = `${FRANKFURTER}/latest?from=${FX_PIVOT}&to=${list.join(",")}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`frankfurter ${res.status}`);
  const data = (await res.json()) as { date: string; rates: Record<string, number> };

  const rows = await upsertRates(data.date, data.rates, "frankfurter");
  return { dates: [data.date], currencies: list, rowsWritten: rows };
}

/** Refresh intraday FX when the configured provider supports it. */
export async function refreshLiveRates(currencies?: string[]): Promise<RateFetchResult> {
  const list = currencies ?? (await currenciesInUse());
  const wanted = list.filter((currency) => currency !== FX_PIVOT);
  if (wanted.length === 0) return { dates: [], currencies: [], rowsWritten: 0 };

  const recent = await prisma.fxRate.findFirst({
    where: { base: FX_PIVOT, quote: { in: wanted }, source: "finnhub-live" },
    orderBy: { fetchedAt: "desc" },
    select: { fetchedAt: true },
  });
  if (recent && Date.now() - recent.fetchedAt.getTime() < 5 * 60_000) {
    return { dates: [], currencies: wanted, rowsWritten: 0 };
  }

  const feed = await getForexRates();
  if (!feed) return { dates: [], currencies: wanted, rowsWritten: 0 };
  const rates = Object.fromEntries(
    wanted.flatMap((currency) => {
      const rate = feed.rates[currency];
      return typeof rate === "number" && rate > 0 ? [[currency, rate]] : [];
    }),
  );
  if (Object.keys(rates).length === 0) return { dates: [], currencies: wanted, rowsWritten: 0 };
  const date = dayFloorUTC(feed.asOf).toISOString().slice(0, 10);
  const rows = await upsertRates(date, rates, "finnhub-live");
  return { dates: [date], currencies: Object.keys(rates), rowsWritten: rows };
}

/** Backfill a historical window (one timeseries request). */
export async function backfillRates(
  fromDate: string,
  toDate: string,
  currencies?: string[],
): Promise<RateFetchResult> {
  const list = currencies ?? (await currenciesInUse());
  if (list.length === 0) return { dates: [], currencies: [], rowsWritten: 0 };

  const url = `${FRANKFURTER}/${fromDate}..${toDate}?from=${FX_PIVOT}&to=${list.join(",")}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`frankfurter ${res.status}`);
  const data = (await res.json()) as {
    rates: Record<string, Record<string, number>>;
  };

  let rows = 0;
  const dates = Object.keys(data.rates).sort();
  for (const date of dates) {
    const dayRates = data.rates[date];
    if (dayRates) rows += await upsertRates(date, dayRates, "frankfurter");
  }
  return { dates, currencies: list, rowsWritten: rows };
}
