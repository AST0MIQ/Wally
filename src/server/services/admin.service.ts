import { prisma } from "@/server/db";
import { monthRange } from "@/server/lib/analytics";
import { APP_VERSION } from "@/lib/version";

const ADMIN_TZ = "Asia/Bangkok";

export type MixSlice = { key: string; count: number };

export type AdminStats = {
  totalUsers: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  prevMonthUsers: number;
  /** signed in within the last 7 days */
  active7d: number;
  /** signed in within the last 30 days */
  activeUsers: number;
  adminCount: number;
  /** users whose lastSeenVersion matches the deployed build */
  onLatestVersion: number;
  latestVersion: string;
  /** activation funnel — distinct users who have created at least one … */
  withAccount: number;
  withTransaction: number;
  withPortfolio: number;
  localeMix: MixSlice[];
  themeMix: MixSlice[];
  currencyMix: MixSlice[];
  accentMix: MixSlice[];
  signups: { date: string; count: number }[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toMix(
  rows: Array<Record<string, unknown> & { _count: { _all: number } }>,
  field: string,
): MixSlice[] {
  return rows
    .map((r) => ({ key: String(r[field] ?? "—"), count: r._count._all }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Aggregate user & adoption statistics only — no access to any user's financial
 * data or its contents (see docs/ARCHITECTURE.md §16, §D). Everything here is a
 * COUNT or a preference distribution; never an amount.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const month = monthRange(ADMIN_TZ, 0);
  const prevMonth = monthRange(ADMIN_TZ, -1);

  const daysIntoMonth = Math.floor((now.getTime() - month.start.getTime()) / DAY_MS);
  const startOfToday = new Date(month.start.getTime() + daysIntoMonth * DAY_MS);
  const active7 = new Date(now.getTime() - 7 * DAY_MS);
  const active30 = new Date(now.getTime() - 30 * DAY_MS);
  const week = new Date(now.getTime() - 7 * DAY_MS);
  const signupsSinceDay = new Date(
    Date.UTC(
      new Date(now.getTime() - 29 * DAY_MS).getUTCFullYear(),
      new Date(now.getTime() - 29 * DAY_MS).getUTCMonth(),
      new Date(now.getTime() - 29 * DAY_MS).getUTCDate(),
    ),
  );

  const [
    totalUsers,
    newToday,
    newThisWeek,
    newThisMonth,
    prevMonthUsers,
    active7d,
    activeUsers,
    adminCount,
    onLatestVersion,
    withAccount,
    withTransaction,
    withPortfolio,
    localeRows,
    themeRows,
    currencyRows,
    accentRows,
    recent,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.user.count({ where: { createdAt: { gte: week } } }),
    prisma.user.count({ where: { createdAt: { gte: month.start } } }),
    prisma.user.count({
      where: { createdAt: { gte: prevMonth.start, lt: month.start } },
    }),
    prisma.user.count({ where: { lastLoginAt: { gte: active7 } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: active30 } } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { lastSeenVersion: APP_VERSION } }),
    prisma.user.count({ where: { financeAccounts: { some: {} } } }),
    prisma.user.count({ where: { transactions: { some: {} } } }),
    prisma.user.count({ where: { portfolios: { some: {} } } }),
    prisma.user.groupBy({ by: ["locale"], _count: { _all: true } }),
    prisma.user.groupBy({ by: ["theme"], _count: { _all: true } }),
    prisma.user.groupBy({ by: ["baseCurrency"], _count: { _all: true } }),
    prisma.user.groupBy({ by: ["accent"], _count: { _all: true } }),
    prisma.user.findMany({
      where: { createdAt: { gte: signupsSinceDay } },
      select: { createdAt: true },
    }),
  ]);

  const buckets = new Map<string, number>();
  for (let i = 29; i >= 0; i -= 1) {
    buckets.set(new Date(now.getTime() - i * DAY_MS).toISOString().slice(0, 10), 0);
  }
  for (const u of recent) {
    const key = u.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return {
    totalUsers,
    newToday,
    newThisWeek,
    newThisMonth,
    prevMonthUsers,
    active7d,
    activeUsers,
    adminCount,
    onLatestVersion,
    latestVersion: APP_VERSION,
    withAccount,
    withTransaction,
    withPortfolio,
    localeMix: toMix(localeRows, "locale"),
    themeMix: toMix(themeRows, "theme"),
    currencyMix: toMix(currencyRows, "baseCurrency"),
    accentMix: toMix(accentRows, "accent"),
    signups: [...buckets].map(([date, count]) => ({ date, count })),
  };
}
