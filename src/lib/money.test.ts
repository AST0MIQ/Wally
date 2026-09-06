import { describe, expect, it } from "vitest";

import { isPositive, money, roundTo, sum, toPlain, ZERO } from "./money";

describe("money", () => {
  it("adds without floating-point drift", () => {
    // 0.1 + 0.2 === 0.30000000000000004 in float
    expect(toPlain(money("0.1").plus(money("0.2")))).toBe("0.3");
  });

  it("sum() totals an iterable", () => {
    expect(toPlain(sum(["10.00", "5.25", "0.75"]))).toBe("16");
    expect(toPlain(sum([]))).toBe("0");
  });

  it("roundTo() uses half-up at the given precision", () => {
    expect(toPlain(roundTo("2.005", 2))).toBe("2.01");
    expect(toPlain(roundTo("2.004", 2))).toBe("2");
    expect(toPlain(roundTo("1234.5", 0))).toBe("1235");
  });

  it("isPositive()", () => {
    expect(isPositive("0.01")).toBe(true);
    expect(isPositive("0")).toBe(false);
    expect(isPositive("-3")).toBe(false);
  });

  it("ZERO is zero", () => {
    expect(toPlain(ZERO)).toBe("0");
  });
});
