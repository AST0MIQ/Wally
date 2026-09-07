/**
 * Logging streak — consecutive wall-clock days on which the user recorded
 * at least one thing (a transaction or transfer). Pure, timezone-aware,
 * and injectable `now` for tests. Persistence lives in the service layer.
 */

export type StreakState = {
  count: number;
  best: number;
  /** UTC midnight of the last counted wall-clock day, or null */
  lastDate: Date | null;
  /** when the monthly "forgive one missed day" was last spent, or null */
  freezeAt: Date | null;
};

export type Tier = { key: string; days: number };

/** Milestone ladder, ascending. Index into this array is the "tier index". */
export const STREAK_TIERS: readonly Tier[] = [
  { key: "spark", days: 7 },
  { key: "habit", days: 30 },
  { key: "real", days: 90 },
  { key: "beast", days: 180 },
  { key: "year", days: 365 },
  { key: "year2", days: 730 },
  { key: "year3", days: 1095 },
  { key: "year5", days: 1825 },
] as const;

/**
 * Visual identity of each tier. Deliberately distinct step-to-step so the
 * ladder feels like real progression. `ring` drives <StreakRing>, `card`
 * drives the dashboard hero card, `badge`/`sparkles` are shared decoration.
 * Index matches STREAK_TIERS; use `TIER_FX_BASE` for count below tier 0.
 */
export type RingStyle =
  | "track" // pre-tier: faint ring + progress arc
  | "segmented" // 7d  — accent, ticked
  | "solid" // 30d — accent, clean line
  | "comet" // 90d — accent gradient + orbiting spark
  | "blaze" // 180d — accent, pulsing glow
  | "gold" // 1y
  | "ruby" // 2y
  | "diamond" // 3y
  | "platinum"; // 5y

export type CardStyle =
  | "none"
  | "sheen"
  | "sheen-glow"
  | "border"
  | "gold"
  | "ruby"
  | "diamond"
  | "platinum";

/** Colour family for the ring's twinkling sparkles. */
export type SparkColor = "amber" | "ruby" | "diamond" | "platinum";

export type TierFx = {
  ring: RingStyle;
  card: CardStyle;
  badge: "none" | "star" | "year";
  sparkles: number;
  spark: SparkColor;
};

export const TIER_FX_BASE: TierFx = {
  ring: "track",
  card: "none",
  badge: "none",
  sparkles: 0,
  spark: "amber",
};

export const STREAK_TIER_FX: readonly TierFx[] = [
  { ring: "segmented", card: "none", badge: "none", sparkles: 0, spark: "amber" }, // spark 7d
  { ring: "solid", card: "sheen", badge: "none", sparkles: 0, spark: "amber" }, // habit 30d
  { ring: "comet", card: "sheen-glow", badge: "none", sparkles: 0, spark: "amber" }, // real 90d
  { ring: "blaze", card: "border", badge: "star", sparkles: 1, spark: "amber" }, // beast 180d
  { ring: "gold", card: "gold", badge: "year", sparkles: 1, spark: "amber" }, // 1y — gold
  { ring: "ruby", card: "ruby", badge: "year", sparkles: 2, spark: "ruby" }, // 2y — ruby
  { ring: "diamond", card: "diamond", badge: "year", sparkles: 3, spark: "diamond" }, // 3y — diamond
  { ring: "platinum", card: "platinum", badge: "year", sparkles: 5, spark: "platinum" }, // 5y — platinum
] as const;

export function tierFx(tierIndex: number): TierFx {
  return STREAK_TIER_FX[tierIndex] ?? TIER_FX_BASE;
}

const DAY_MS = 86_400_000;

// ── Timezone helpers ───────────────────────────────────────────────
/** Minutes to add to a UTC instant to get its wall-clock time in `tz`. */
function tzOffsetMinutes(tz: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const p = Object.fromEntries(
    dtf.formatToParts(at).map((x) => [x.type, x.value]),
  ) as Record<string, string>;
  const asUTC = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour === "24" ? "0" : p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return Math.round((asUTC - at.getTime()) / 60000);
}

/** UTC midnight Date that stands for the wall-clock calendar day of `at` in `tz`. */
export function wallDayStart(tz: string, at: Date): Date {
  const off = tzOffsetMinutes(tz, at);
  const wall = new Date(at.getTime() + off * 60000);
  return new Date(
    Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate()),
  );
}

/** Whole days between two `wallDayStart` values (b - a). */
function dayDiff(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

function sameMonth(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth()
  );
}

// ── Core transitions ──────────────────────────────────────────────
/**
 * Age a streak forward to `now` assuming no activity has been recorded since
 * `lastDate`. Applies the monthly freeze to bridge a single missed day.
 */
export function recomputeStreak(
  state: StreakState,
  tz: string,
  now: Date = new Date(),
): StreakState {
  const { count, best, lastDate, freezeAt } = state;
  if (!lastDate || count === 0) return state;

  const today = wallDayStart(tz, now);
  const gap = dayDiff(wallDayStart(tz, lastDate), today);

  // logged today, or streak is still "live" (they can still log today)
  if (gap <= 1) return state;

  // exactly one missed day → spend the freeze if it hasn't been used this month
  if (gap === 2) {
    const freezeSpentThisMonth = freezeAt != null && sameMonth(freezeAt, today);
    if (!freezeSpentThisMonth) {
      return {
        count,
        best,
        lastDate: new Date(today.getTime() - DAY_MS), // bridged to yesterday
        freezeAt: now,
      };
    }
  }

  // streak broken
  return { count: 0, best, lastDate: null, freezeAt };
}

/**
 * Record activity for "now". Returns the next state plus the tier index newly
 * reached on this call (or -1). Callers persist the returned state.
 */
export function registerActivity(
  state: StreakState,
  tz: string,
  now: Date = new Date(),
): { state: StreakState; reachedTier: number } {
  const aged = recomputeStreak(state, tz, now);
  const today = wallDayStart(tz, now);

  let count: number;
  if (aged.lastDate && dayDiff(wallDayStart(tz, aged.lastDate), today) === 0) {
    // already counted today
    return { state: aged, reachedTier: -1 };
  } else if (
    aged.lastDate &&
    dayDiff(wallDayStart(tz, aged.lastDate), today) === 1
  ) {
    count = aged.count + 1;
  } else {
    count = 1;
  }

  const prevTier = tierIndex(aged.count);
  const nextState: StreakState = {
    count,
    best: Math.max(aged.best, count),
    lastDate: today,
    freezeAt: aged.freezeAt,
  };
  const newTier = tierIndex(count);
  return { state: nextState, reachedTier: newTier > prevTier ? newTier : -1 };
}

// ── Tier math ─────────────────────────────────────────────────────
/** Highest tier index whose threshold `count` has met, or -1. */
export function tierIndex(count: number): number {
  let idx = -1;
  for (let i = 0; i < STREAK_TIERS.length; i += 1) {
    if (count >= STREAK_TIERS[i]!.days) idx = i;
  }
  return idx;
}

export type StreakProgress = {
  tierIndex: number;
  currentTier: Tier | null;
  nextTier: Tier | null;
  daysToNext: number | null;
  /** 0..100 progress from the current tier threshold to the next */
  progressPct: number;
};

export function streakProgress(count: number): StreakProgress {
  const idx = tierIndex(count);
  const currentTier = idx >= 0 ? STREAK_TIERS[idx]! : null;
  const nextTier = STREAK_TIERS[idx + 1] ?? null;
  if (!nextTier) {
    return {
      tierIndex: idx,
      currentTier,
      nextTier: null,
      daysToNext: null,
      progressPct: 100,
    };
  }
  const floor = currentTier?.days ?? 0;
  const span = nextTier.days - floor;
  const progressPct = Math.max(
    0,
    Math.min(100, ((count - floor) / span) * 100),
  );
  return {
    tierIndex: idx,
    currentTier,
    nextTier,
    daysToNext: Math.max(0, nextTier.days - count),
    progressPct,
  };
}
