import { describe, expect, it } from "vitest";

import { computeHolding, marketMetrics, quantityAsOf } from "./holdings";

const d = (s: string) => new Date(s);

function txn(
  type: "BUY" | "SELL",
  quantity: string,
  price: string,
  fee = "0",
  date = "2020-01-01",
) {
  return {
    type,
    quantity,
    price,
    fee,
    tradeDate: d(date),
    createdAt: d(date),
  };
}

describe("computeHolding — average cost", () => {
  it("accumulates BUYs into an average cost", () => {
    const h = computeHolding([
      txn("BUY", "10", "100", "0", "2020-01-01"),
      txn("BUY", "10", "200", "0", "2020-02-01"),
    ]);
    expect(h.quantity.toString()).toBe("20");
    expect(h.avgCost.toString()).toBe("150");
    expect(h.costBasis.toString()).toBe("3000");
  });

  it("includes fees in cost basis", () => {
    const h = computeHolding([txn("BUY", "10", "100", "5")]);
    expect(h.costBasis.toString()).toBe("1005");
    expect(h.avgCost.toString()).toBe("100.5");
  });

  it("realizes P&L on SELL at average cost, keeps avg cost for remainder", () => {
    const h = computeHolding([
      txn("BUY", "10", "100", "0", "2020-01-01"), // avg 100
      txn("SELL", "4", "150", "0", "2020-03-01"), // proceeds 600, cost 400 -> +200
    ]);
    expect(h.quantity.toString()).toBe("6");
    expect(h.avgCost.toString()).toBe("100");
    expect(h.costBasis.toString()).toBe("600");
    expect(h.realizedPnL.toString()).toBe("200");
  });

  it("handles fractional shares", () => {
    const h = computeHolding([txn("BUY", "2.4187", "459.53", "0")]);
    // 2.4187 * 459.53 = 1111.465211 exactly
    expect(h.costBasis.toString()).toBe("1111.465211");
    expect(h.avgCost.toString()).toBe("459.53");
  });

  it("SELL fee reduces realized P&L", () => {
    const h = computeHolding([
      txn("BUY", "1", "100"),
      txn("SELL", "1", "120", "3", "2020-04-01"),
    ]);
    expect(h.quantity.toString()).toBe("0");
    expect(h.realizedPnL.toString()).toBe("17"); // 120 - 3 - 100
  });
});

describe("marketMetrics", () => {
  it("computes market value and unrealized P&L", () => {
    const h = computeHolding([txn("BUY", "10", "100")]);
    const m = marketMetrics(h, "130");
    expect(m.marketValue.toString()).toBe("1300");
    expect(m.unrealizedPnL.toString()).toBe("300");
    expect(m.unrealizedPnLPct.toString()).toBe("30");
  });

  it("is zero-safe with no position", () => {
    const h = computeHolding([]);
    const m = marketMetrics(h, "100");
    expect(m.marketValue.toString()).toBe("0");
    expect(m.unrealizedPnLPct.toString()).toBe("0");
  });
});

describe("quantityAsOf", () => {
  it("ignores trades after the cutoff date", () => {
    const txns = [
      txn("BUY", "10", "100", "0", "2020-01-01"),
      txn("BUY", "5", "100", "0", "2020-06-01"),
    ];
    expect(quantityAsOf(txns, d("2020-03-01")).toString()).toBe("10");
    expect(quantityAsOf(txns, d("2020-07-01")).toString()).toBe("15");
  });
});
