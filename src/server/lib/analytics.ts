import { prisma } from "@/server/db";
import { convert } from "@/server/lib/fx";
import { money, sum, toPlain, ZERO, type Decimal } from "@/lib/money";

// ── Timezone-aware month boundaries (fixed-offset zones like Asia/Bangkok) ──
function tzOffsetMinutes(tz: string, at: Date = new Date()): number {
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

export type MonthRange = { start: Date; end: Date; key: string };

/** `offset` 0 = current month, -1 = last month, etc. `now` is injectable for tests. */
export function monthRange(tz: string, offset = 0, now: Date = new Date()): MonthRange {
  const off = tzOffsetMinutes(tz, now);
  const wallNow = new Date(now.getTime() + off * 60000);
  const y = wallNow.getUTCFullYear();
  const m = wallNow.getUTCMonth() + offset;
  const startWall = Date.UTC(y, m, 1);
  const endWall = Date.UTC(y, m + 1, 1);
  const startDate = new Date(startWall);
  return {
    start: new Date(startWall - off * 60000),
    end: new Date(endWall - off * 60000),
    key: `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, "0")}`,
  };
}

// ── Flows (income / expense) converted to base currency ──────────────
export type Flows = { income: string; expense: string; net: string };

export async function sumFlows(
  userId: string,
  from: Date,
  to: Date,
  base: string,
  convertAsOf: Date = to,
): Promise<Flows> {
  const groups = await prisma.transaction.groupBy({
    by: ["currency", "kind"],
    where: { userId, deletedAt: null, date: { gte: from, lt: to } },
    _sum: { amount: true },
  });

  let income = ZERO;
  let expense = ZERO;
  for (const g of groups) {
    const conv = await convert(
      g._sum.amount ?? 0,
      g.currency,
      base,
      convertAsOf,
    );
    if (g.kind === "INCOME") income = income.plus(money(conv.amount));
    else expense = expense.plus(money(conv.amount));
  }

  return {
    income: toPlain(income),
    expense: toPlain(expense),
    net: toPlain(income.minus(expense)),
  };
}

// ── Expense (or income) by category ─────────────────────────────────
export type CategorySlice = {
  categoryId: string | null;
  name: string | null;
  systemKey: string | null;
  icon: string | null;
  color: string | null;
  amount: string;
  pct: number;
};

export async function amountByCategory(
  userId: string,
  from: Date,
  to: Date,
  base: string,
  kind: "EXPENSE" | "INCOME" = "EXPENSE",
  convertAsOf: Date = to,
): Promise<CategorySlice[]> {
  const groups = await prisma.transaction.groupBy({
    by: ["categoryId", "currency"],
    where: { userId, deletedAt: null, kind, date: { gte: from, lt: to } },
    _sum: { amount: true },
  });

  const byCategory = new Map<string | null, Decimal>();
  for (const g of groups) {
    const conv = await convert(
      g._sum.amount ?? 0,
      g.currency,
      base,
      convertAsOf,
    );
    const prev = byCategory.get(g.categoryId) ?? ZERO;
    byCategory.set(g.categoryId, prev.plus(money(conv.amount)));
  }

  const catIds = [...byCategory.keys()].filter((k): k is string => k !== null);
  const cats = await prisma.category.findMany({
    where: { id: { in: catIds } },
    select: {
      id: true,
      name: true,
      systemKey: true,
      icon: true,
      color: true,
    },
  });
  const catMap = new Map(cats.map((c) => [c.id, c]));

  const total = sum([...byCategory.values()]);
  const slices: CategorySlice[] = [...byCategory.entries()]
    .map(([categoryId, amt]) => {
      const meta = categoryId ? catMap.get(categoryId) : undefined;
      return {
        categoryId,
        name: meta?.name ?? null,
        systemKey: meta?.systemKey ?? null,
        icon: meta?.icon ?? null,
        color: meta?.color ?? null,
        amount: toPlain(amt),
        pct: total.gt(0) ? Number(amt.div(total).mul(100)) : 0,
      };
    })
    .filter((s) => Number(s.amount) > 0)
    .sort((a, b) => Number(b.amount) - Number(a.amount));

  return slices;
}

// ── Income vs Expense series ────────────────────────────────────────
export type MonthlyFlow = {
  key: string;
  income: string;
  expense: string;
  net: string;
};

/** Percent change from `previous` to `current`; null when there is no base. */
export function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export async function incomeExpenseSeries(
  userId: string,
  tz: string,
  base: string,
  months = 6,
): Promise<MonthlyFlow[]> {
  const out: MonthlyFlow[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const r = monthRange(tz, -i);
    const f = await sumFlows(userId, r.start, r.end, base, r.end);
    out.push({ key: r.key, income: f.income, expense: f.expense, net: f.net });
  }
  return out;
}
