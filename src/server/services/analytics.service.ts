import { prisma } from "@/server/db";
import { computeNetWorth } from "@/server/lib/networth";
import {
  amountByCategory,
  monthRange,
  pctDelta,
  sumFlows,
  type CategorySlice,
} from "@/server/lib/analytics";
import { toPlain, money } from "@/lib/money";

export type CategoryTrend = CategorySlice & {
  prevAmount: string;
  deltaPct: number | null;
};

export type AnalyticsData = {
  baseCurrency: string;
  monthKey: string;
  expenseThisMonth: string;
  incomeThisMonth: string;
  netThisMonth: string;
  expenseDeltaPct: number | null;
  incomeDeltaPct: number | null;
  topCategory: CategoryTrend | null;
  categories: CategoryTrend[];
  netWorthNow: string;
  netWorthPrev: string | null;
  netWorthDelta: string | null;
};

export async function getAnalytics(userId: string): Promise<AnalyticsData> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { baseCurrency: true, timezone: true },
  });
  const base = user.baseCurrency;
  const tz = user.timezone;

  const cur = monthRange(tz, 0);
  const prev = monthRange(tz, -1);

  const [flowsCur, flowsPrev, catsCur, catsPrev, nw] = await Promise.all([
    sumFlows(userId, cur.start, cur.end, base),
    sumFlows(userId, prev.start, prev.end, base, prev.end),
    amountByCategory(userId, cur.start, cur.end, base, "EXPENSE"),
    amountByCategory(userId, prev.start, prev.end, base, "EXPENSE", prev.end),
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
    monthKey: cur.key,
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
    netWorthNow: nw.netWorth,
    netWorthPrev: prevSnap ? toPlain(prevSnap.totalNetWorth) : null,
    netWorthDelta: prevSnap
      ? toPlain(money(nw.netWorth).minus(prevSnap.totalNetWorth))
      : null,
  };
}
