import { prisma } from "@/server/db";
import { monthRange } from "@/server/lib/analytics";

const ADMIN_TZ = "Asia/Bangkok";

export type AdminStats = {
  totalUsers: number;
  newToday: number;
  newThisMonth: number;
  activeUsers: number;
  signups: { date: string; count: number }[];
};

/**
 * Aggregate user statistics only — no access to any user's financial data
 * (see docs/ARCHITECTURE.md §16, §D).
 */
export async function getAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const month = monthRange(ADMIN_TZ, 0);
  const startOfToday = new Date(month.start);
  // advance month.start to today's date at the same wall offset
  const dayMs = 24 * 60 * 60 * 1000;
  const daysIntoMonth = Math.floor(
    (now.getTime() - month.start.getTime()) / dayMs,
  );
  startOfToday.setTime(month.start.getTime() + daysIntoMonth * dayMs);

  const activeSince = new Date(now.getTime() - 30 * dayMs);
  const signupsSince = new Date(now.getTime() - 29 * dayMs);
  const signupsSinceDay = new Date(
    Date.UTC(
      signupsSince.getUTCFullYear(),
      signupsSince.getUTCMonth(),
      signupsSince.getUTCDate(),
    ),
  );

  const [totalUsers, newToday, newThisMonth, activeUsers, recent] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: { createdAt: { gte: month.start } } }),
      prisma.user.count({
        where: { lastLoginAt: { gte: activeSince } },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: signupsSinceDay } },
        select: { createdAt: true },
      }),
    ]);

  const buckets = new Map<string, number>();
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * dayMs);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const u of recent) {
    const key = u.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return {
    totalUsers,
    newToday,
    newThisMonth,
    activeUsers,
    signups: [...buckets].map(([date, count]) => ({ date, count })),
  };
}
