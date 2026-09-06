import { Decimal, money, ZERO, type DecimalInput } from "@/lib/money";

/**
 * Average-cost holdings engine (see docs/ARCHITECTURE.md §O).
 *
 * Holdings are ALWAYS derived from the ordered list of BUY / SELL
 * transactions — never stored as a mutable "current quantity".
 */
export type InvTxnLike = {
  type: "BUY" | "SELL";
  quantity: DecimalInput;
  price: DecimalInput;
  fee: DecimalInput;
  tradeDate: Date;
  createdAt: Date;
};

export type HoldingCalc = {
  /** current shares held */
  quantity: Decimal;
  /** average cost per share of the current position */
  avgCost: Decimal;
  /** cost basis of the current position (avgCost * quantity) */
  costBasis: Decimal;
  /** cumulative realized P&L from all SELLs */
  realizedPnL: Decimal;
  /** total cash put in via BUYs (qty*price + fee), informational */
  invested: Decimal;
};

function ordered(txns: InvTxnLike[]): InvTxnLike[] {
  return [...txns].sort(
    (a, b) =>
      a.tradeDate.getTime() - b.tradeDate.getTime() ||
      a.createdAt.getTime() - b.createdAt.getTime(),
  );
}

export function computeHolding(txns: InvTxnLike[]): HoldingCalc {
  let qty = ZERO;
  let costBasis = ZERO;
  let realized = ZERO;
  let invested = ZERO;

  for (const t of ordered(txns)) {
    const q = money(t.quantity);
    const p = money(t.price);
    const f = money(t.fee);

    if (t.type === "BUY") {
      costBasis = costBasis.plus(q.mul(p)).plus(f);
      qty = qty.plus(q);
      invested = invested.plus(q.mul(p)).plus(f);
      continue;
    }

    // SELL
    if (qty.lte(0)) {
      // no position to sell against — treat proceeds (net of fee) as realized
      realized = realized.plus(q.mul(p)).minus(f);
      qty = qty.minus(q);
      continue;
    }
    const sellQty = q.gt(qty) ? qty : q;
    const avgBefore = costBasis.div(qty);
    const costOut = avgBefore.mul(sellQty);
    realized = realized.plus(p.mul(sellQty)).minus(f).minus(costOut);
    costBasis = costBasis.minus(costOut);
    qty = qty.minus(sellQty);
  }

  const avgCost = qty.gt(0) ? costBasis.div(qty) : ZERO;
  return { quantity: qty, avgCost, costBasis, realizedPnL: realized, invested };
}

export type MarketMetrics = {
  marketValue: Decimal;
  unrealizedPnL: Decimal;
  unrealizedPnLPct: Decimal;
};

export function marketMetrics(
  holding: Pick<HoldingCalc, "quantity" | "costBasis">,
  currentPrice: DecimalInput,
): MarketMetrics {
  const price = money(currentPrice);
  const marketValue = holding.quantity.mul(price);
  const unrealizedPnL = marketValue.minus(holding.costBasis);
  const unrealizedPnLPct = holding.costBasis.gt(0)
    ? unrealizedPnL.div(holding.costBasis).mul(100)
    : ZERO;
  return { marketValue, unrealizedPnL, unrealizedPnLPct };
}

/** Shares held as of a given date — used to validate SELLs don't oversell. */
export function quantityAsOf(txns: InvTxnLike[], asOf: Date): Decimal {
  return computeHolding(
    txns.filter((t) => t.tradeDate.getTime() <= asOf.getTime()),
  ).quantity;
}
