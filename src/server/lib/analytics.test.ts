import { describe, expect, it } from "vitest";

import { monthRange, pctDelta } from "./analytics";

describe("monthRange (Asia/Bangkok, UTC+7)", () => {
  // 2026-03-10 05:00 UTC == 2026-03-10 12:00 Bangkok
  const now = new Date("2026-03-10T05:00:00.000Z");

  it("current month starts at 1st 00:00 Bangkok (= prev day 17:00 UTC)", () => {
    const r = monthRange("Asia/Bangkok", 0, now);
    expect(r.key).toBe("2026-03");
    expect(r.start.toISOString()).toBe("2026-02-28T17:00:00.000Z");
    expect(r.end.toISOString()).toBe("2026-03-31T17:00:00.000Z");
  });

  it("offset -1 is the previous month", () => {
    const r = monthRange("Asia/Bangkok", -1, now);
    expect(r.key).toBe("2026-02");
    expect(r.start.toISOString()).toBe("2026-01-31T17:00:00.000Z");
    expect(r.end.toISOString()).toBe("2026-02-28T17:00:00.000Z");
  });

  it("wraps year boundary", () => {
    const jan = new Date("2026-01-05T05:00:00.000Z");
    const r = monthRange("Asia/Bangkok", -1, jan);
    expect(r.key).toBe("2025-12");
  });
});

describe("pctDelta", () => {
  it("computes percent change", () => {
    expect(pctDelta(120, 100)).toBe(20);
    expect(pctDelta(80, 100)).toBe(-20);
  });
  it("returns null when there is no base", () => {
    expect(pctDelta(50, 0)).toBeNull();
  });
  it("returns 0 when both are zero", () => {
    expect(pctDelta(0, 0)).toBe(0);
  });
});
