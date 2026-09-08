import { prisma } from "@/server/db";
import {
  recomputeStreak,
  registerActivity,
  streakProgress,
  wallDayStart,
  STREAK_TIERS,
  tierIndex,
  type StreakState,
} from "@/server/lib/streak";
import { evaluateRewardsForUser } from "@/server/services/cosmetics/reward-rule.service";

export type StreakLadderEntry = { key: string; days: number; earned: boolean };

export type StreakData = {
  count: number;
  best: number;
  tierIndex: number;
  nextKey: string | null;
  daysToNext: number | null;
  progressPct: number;
  ladder: StreakLadderEntry[];
  /** the user has already recorded something today */
  loggedToday: boolean;
  /** tier index to celebrate now (crossed but not yet acknowledged), or -1 */
  pendingCelebration: number;
};

function toState(u: {
  streakCount: number;
  streakBest: number;
  streakLastDate: Date | null;
  streakFreezeAt: Date | null;
}): StreakState {
  return {
    count: u.streakCount,
    best: u.streakBest,
    lastDate: u.streakLastDate,
    freezeAt: u.streakFreezeAt,
  };
}

function persist(userId: string, s: StreakState, celebrated?: number) {
  return prisma.user
    .update({
      where: { id: userId },
      data: {
        streakCount: s.count,
        streakBest: s.best,
        streakLastDate: s.lastDate,
        streakFreezeAt: s.freezeAt,
        ...(celebrated != null ? { streakCelebrated: celebrated } : {}),
      },
    })
    .catch(() => {
      /* best-effort: a stale streak is not worth failing a request over */
    });
}

/** Read the streak for display; lazily ages it forward if a day (or more) lapsed. */
export async function getStreak(userId: string): Promise<StreakData> {
  const u = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      timezone: true,
      streakCount: true,
      streakBest: true,
      streakLastDate: true,
      streakFreezeAt: true,
      streakCelebrated: true,
    },
  });

  const now = new Date();
  const before = toState(u);
  const aged = recomputeStreak(before, u.timezone, now);
  if (
    aged.count !== before.count ||
    aged.lastDate?.getTime() !== before.lastDate?.getTime() ||
    aged.freezeAt?.getTime() !== before.freezeAt?.getTime()
  ) {
    await persist(userId, aged);
  }

  const prog = streakProgress(aged.count);
  const idx = prog.tierIndex;
  const loggedToday =
    aged.lastDate != null &&
    aged.lastDate.getTime() === wallDayStart(u.timezone, now).getTime();

  return {
    count: aged.count,
    best: aged.best,
    tierIndex: idx,
    loggedToday,
    nextKey: prog.nextTier?.key ?? null,
    daysToNext: prog.daysToNext,
    progressPct: prog.progressPct,
    ladder: STREAK_TIERS.map((tier) => ({
      key: tier.key,
      days: tier.days,
      earned: aged.best >= tier.days,
    })),
    pendingCelebration: idx > u.streakCelebrated ? idx : -1,
  };
}

/** Called after the user records a transaction / transfer. Best-effort. */
export async function registerStreakActivity(userId: string): Promise<void> {
  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        timezone: true,
        streakCount: true,
        streakBest: true,
        streakLastDate: true,
        streakFreezeAt: true,
      },
    });
    if (!u) return;
    const { state } = registerActivity(toState(u), u.timezone, new Date());
    await persist(userId, state);
    await evaluateRewardsForUser(userId);
  } catch {
    /* never block a write on streak bookkeeping */
  }
}

/** Mark milestone celebrations up to and including `tier` as seen. */
export async function markStreakCelebrated(
  userId: string,
  tier: number,
): Promise<void> {
  if (tier < 0 || tier >= STREAK_TIERS.length) return;
  await prisma.user
    .update({
      where: { id: userId },
      data: { streakCelebrated: tier },
    })
    .catch(() => {});
}

export { tierIndex };
