import { describe, expect, it } from "vitest";

import {
  recomputeStreak,
  registerActivity,
  streakProgress,
  tierIndex,
  wallDayStart,
  type StreakState,
} from "./streak";

const TZ = "Asia/Bangkok"; // UTC+7, fixed offset

/** UTC midnight Date for a Bangkok calendar day. */
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
/** An instant during the afternoon of a Bangkok calendar day. */
const noonBkk = (iso: string) => new Date(`${iso}T05:00:00.000Z`);

describe("wallDayStart", () => {
  it("maps a late-evening UTC instant to the local calendar day", () => {
    // 2026-09-06 20:00 UTC == 2026-09-07 03:00 Bangkok
    expect(wallDayStart(TZ, new Date("2026-09-06T20:00:00.000Z")).toISOString()).toBe(
      "2026-09-07T00:00:00.000Z",
    );
  });
});

describe("tierIndex", () => {
  it("returns -1 below the first milestone", () => {
    expect(tierIndex(0)).toBe(-1);
    expect(tierIndex(6)).toBe(-1);
  });
  it("steps up at each threshold", () => {
    expect(tierIndex(7)).toBe(0);
    expect(tierIndex(29)).toBe(0);
    expect(tierIndex(30)).toBe(1);
    expect(tierIndex(365)).toBe(4);
    expect(tierIndex(5000)).toBe(7);
  });
});

describe("streakProgress", () => {
  it("fills toward the next tier", () => {
    const p = streakProgress(15); // between 7 and 30
    expect(p.tierIndex).toBe(0);
    expect(p.nextTier?.days).toBe(30);
    expect(p.daysToNext).toBe(15);
    expect(Math.round(p.progressPct)).toBe(35); // (15-7)/(30-7)
  });
  it("caps at 100 with no next tier", () => {
    const p = streakProgress(2000);
    expect(p.nextTier).toBeNull();
    expect(p.progressPct).toBe(100);
  });
});

describe("recomputeStreak", () => {
  const base: StreakState = {
    count: 10,
    best: 10,
    lastDate: day("2026-09-06"),
    freezeAt: null,
  };

  it("is unchanged when logged today", () => {
    expect(recomputeStreak(base, TZ, noonBkk("2026-09-06"))).toEqual(base);
  });

  it("is unchanged the day after (streak still live)", () => {
    expect(recomputeStreak(base, TZ, noonBkk("2026-09-07"))).toEqual(base);
  });

  it("spends the freeze to bridge a single missed day", () => {
    const r = recomputeStreak(base, TZ, noonBkk("2026-09-08"));
    expect(r.count).toBe(10);
    expect(r.lastDate?.toISOString()).toBe(day("2026-09-07").toISOString());
    expect(r.freezeAt).not.toBeNull();
  });

  it("breaks when a day is missed and the freeze was already used this month", () => {
    const used: StreakState = { ...base, freezeAt: day("2026-09-02") };
    const r = recomputeStreak(used, TZ, noonBkk("2026-09-08"));
    expect(r.count).toBe(0);
    expect(r.lastDate).toBeNull();
    expect(r.best).toBe(10);
  });

  it("breaks on a two-plus day gap regardless of freeze", () => {
    const r = recomputeStreak(base, TZ, noonBkk("2026-09-09"));
    expect(r.count).toBe(0);
    expect(r.best).toBe(10);
  });
});

describe("registerActivity", () => {
  it("starts a streak from nothing", () => {
    const { state, reachedTier } = registerActivity(
      { count: 0, best: 0, lastDate: null, freezeAt: null },
      TZ,
      noonBkk("2026-09-07"),
    );
    expect(state.count).toBe(1);
    expect(state.best).toBe(1);
    expect(state.lastDate?.toISOString()).toBe(day("2026-09-07").toISOString());
    expect(reachedTier).toBe(-1);
  });

  it("is idempotent within the same day", () => {
    const start: StreakState = {
      count: 3,
      best: 5,
      lastDate: day("2026-09-07"),
      freezeAt: null,
    };
    const { state } = registerActivity(start, TZ, noonBkk("2026-09-07"));
    expect(state).toEqual(start);
  });

  it("increments on a consecutive day and tracks best", () => {
    const { state } = registerActivity(
      { count: 5, best: 5, lastDate: day("2026-09-06"), freezeAt: null },
      TZ,
      noonBkk("2026-09-07"),
    );
    expect(state.count).toBe(6);
    expect(state.best).toBe(6);
  });

  it("reports the tier when a milestone is crossed", () => {
    const { state, reachedTier } = registerActivity(
      { count: 6, best: 6, lastDate: day("2026-09-06"), freezeAt: null },
      TZ,
      noonBkk("2026-09-07"),
    );
    expect(state.count).toBe(7);
    expect(reachedTier).toBe(0);
  });

  it("restarts at 1 after the streak broke", () => {
    const { state } = registerActivity(
      { count: 20, best: 20, lastDate: day("2026-09-01"), freezeAt: null },
      TZ,
      noonBkk("2026-09-07"),
    );
    expect(state.count).toBe(1);
    expect(state.best).toBe(20);
  });
});
