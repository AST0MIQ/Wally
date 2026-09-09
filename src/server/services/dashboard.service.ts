import { prisma } from "@/server/db";
import {
  computeNetWorth,
  getNetWorthHistory,
  type NetWorthBreakdown,
  type NetWorthPoint,
} from "@/server/lib/networth";
import {
  amountByCategory,
  incomeExpenseSeries,
  monthRange,
  sumFlows,
  type CategorySlice,
  type Flows,
  type MonthlyFlow,
} from "@/server/lib/analytics";
import { listTransactions, type FeedItem } from "@/server/services/transaction.service";
export type DashboardData = {
  baseCurrency: string;
  netWorth: NetWorthBreakdown;
  thisMonth: Flows;
  lastMonth: Flows;
  expenseByCategory: CategorySlice[];
  incomeExpense: MonthlyFlow[];
  netWorthHistory: NetWorthPoint[];
  recentTransactions: FeedItem[];
};

export async function getDashboard(userId: string): Promise<DashboardData> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { baseCurrency: true, timezone: true },
  });
  const { baseCurrency: base, timezone: tz } = user;

  const cur = monthRange(tz, 0);
  const prev = monthRange(tz, -1);

  const [
    netWorth,
    thisMonth,
    lastMonth,
    expenseByCategory,
    incomeExpense,
    netWorthHistory,
    recentTransactions,
  ] = await Promise.all([
    computeNetWorth(userId),
    sumFlows(userId, cur.start, cur.end, base),
    sumFlows(userId, prev.start, prev.end, base, prev.end),
    amountByCategory(userId, cur.start, cur.end, base, "EXPENSE"),
    incomeExpenseSeries(userId, tz, base, 6),
    getNetWorthHistory(userId, 120),
    listTransactions(userId, {
      limit: 5,
      type: "ALL",
      sort: "date",
      direction: "desc",
    }),
  ]);

  return {
    baseCurrency: base,
    netWorth,
    thisMonth,
    lastMonth,
    expenseByCategory: expenseByCategory.slice(0, 6),
    incomeExpense,
    netWorthHistory,
    recentTransactions: recentTransactions.items,
  };
}
