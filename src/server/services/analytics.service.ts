import { prisma } from "@/server/db";
import { computeNetWorth } from "@/server/lib/networth";
import {
  amountByCategory,
  periodBuckets,
  periodRange,
  periodSeries,
  pctDelta,
  sumFlows,
  type CategorySlice,
  type FlowBucket,
  type Period,
  type SeriesPoint,
} from "@/server/lib/analytics";
import { toPlain, money } from "@/lib/money";

export type { Period } from "@/server/lib/analytics";

export type CategoryTrend = CategorySlice & {
  prevAmount: string;
  deltaPct: number | null;
};

export type AnalyticsData = {
  baseCurrency: string;
  period: Period;
  periodKey: string;
  expenseThisMonth: string;
  incomeThisMonth: string;
  netThisMonth: string;
  expenseDeltaPct: number | null;
  incomeDeltaPct: number | null;
  topCategory: CategoryTrend | null;
  categories: CategoryTrend[];
  buckets: FlowBucket[];
  series: SeriesPoint[];
  /** net saved ÷ income for the current period, as a percent; null when no income */
  savingsRate: number | null;
  netWorthNow: string;
  netWorthCash: string;
  netWorthInvestment: string;
  netWorthPrev: string | null;
  netWorthDelta: string | null;
};

export async function getAnalytics(
  userId: string,
  period: Period = "month",
): Promise<AnalyticsData> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { baseCurrency: true, timezone: true },
  });
  const base = user.baseCurrency;
  const tz = user.timezone;

  const cur = periodRange(tz, period, 0);
  const prev = periodRange(tz, period, -1);

  const [flowsCur, flowsPrev, catsCur, catsPrev, buckets, series, nw] =
    await Promise.all([
      sumFlows(userId, cur.start, cur.end, base),
      sumFlows(userId, prev.start, prev.end, base, prev.end),
      amountByCategory(userId, cur.start, cur.end, base, "EXPENSE"),
      amountByCategory(userId, prev.start, prev.end, base, "EXPENSE", prev.end),
      periodBuckets(userId, tz, base, period),
      periodSeries(userId, tz, base, period),
      computeNetWorth(userId),
    ]);

  const prevByCat = new Map(
    catsPrev.map((c) => [c.categoryId ?? "__none__", c.amount]),
  );

  const categories: CategoryTrend[] = catsCur.map((c) => {
    const prevAmount = prevByCat.get(c.categoryId ?? "__none__") ?? "0";
    return {
      ...c,
      prevAmount,
      deltaPct: pctDelta(Number(c.amount), Number(prevAmount)),
    };
  });

  // net worth ~1 month ago from snapshots
  const since = new Date(prev.start.getTime());
  const prevSnap = await prisma.netWorthSnapshot.findFirst({
    where: { userId, date: { lte: since } },
    orderBy: { date: "desc" },
  });

  return {
    baseCurrency: base,
    period,
    periodKey: cur.key,
    expenseThisMonth: flowsCur.expense,
    incomeThisMonth: flowsCur.income,
    netThisMonth: flowsCur.net,
    expenseDeltaPct: pctDelta(
      Number(flowsCur.expense),
      Number(flowsPrev.expense),
    ),
    incomeDeltaPct: pctDelta(Number(flowsCur.income), Number(flowsPrev.income)),
    topCategory: categories[0] ?? null,
    categories,
    buckets,
    series,
    savingsRate:
      Number(flowsCur.income) > 0
        ? (Number(flowsCur.net) / Number(flowsCur.income)) * 100
        : null,
    netWorthNow: nw.netWorth,
    netWorthCash: nw.totalCash,
    netWorthInvestment: nw.totalInvestment,
    netWorthPrev: prevSnap ? toPlain(prevSnap.totalNetWorth) : null,
    netWorthDelta: prevSnap
      ? toPlain(money(nw.netWorth).minus(prevSnap.totalNetWorth))
      : null,
  };
}
