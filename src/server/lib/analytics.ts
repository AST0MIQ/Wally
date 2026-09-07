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

export type Period = "week" | "month" | "year";

/**
 * Wall-clock start/end for a week (Mon-based), calendar month, or calendar year.
 * `offset` 0 = current, -1 = previous.
 */
export function periodRange(
  tz: string,
  period: Period,
  offset = 0,
  now: Date = new Date(),
): MonthRange {
  const off = tzOffsetMinutes(tz, now);
  const wall = new Date(now.getTime() + off * 60000);
  const y = wall.getUTCFullYear();
  const m = wall.getUTCMonth();
  const d = wall.getUTCDate();

  let startWall: number;
  let endWall: number;
  let key: string;

  if (period === "week") {
    const mondayIndex = (wall.getUTCDay() + 6) % 7; // 0 = Monday
    startWall = Date.UTC(y, m, d - mondayIndex + offset * 7);
    endWall = Date.UTC(y, m, d - mondayIndex + offset * 7 + 7);
    key = new Date(startWall).toISOString().slice(0, 10);
  } else if (period === "year") {
    startWall = Date.UTC(y + offset, 0, 1);
    endWall = Date.UTC(y + offset + 1, 0, 1);
    key = String(y + offset);
  } else {
    startWall = Date.UTC(y, m + offset, 1);
    endWall = Date.UTC(y, m + offset + 1, 1);
    const s = new Date(startWall);
    key = `${s.getUTCFullYear()}-${String(s.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  return {
    start: new Date(startWall - off * 60000),
    end: new Date(endWall - off * 60000),
    key,
  };
}

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

export type FlowBucket = { label: string; income: string; expense: string };

/**
 * Split a period into evenly-labelled sub-buckets for a bar chart:
 * week → 7 days, month → its weeks, year → 12 months.
 */
export async function periodBuckets(
  userId: string,
  tz: string,
  base: string,
  period: Period,
  now: Date = new Date(),
): Promise<FlowBucket[]> {
  const range = periodRange(tz, period, 0, now);
  const off = tzOffsetMinutes(tz, now);
  const startWall = range.start.getTime() + off * 60000;
  const s = new Date(startWall);
  const dayNames = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];
  const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  const edges: { label: string; start: Date; end: Date }[] = [];
  if (period === "week") {
    for (let i = 0; i < 7; i += 1) {
      const a = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate() + i);
      const b = a + 86400000;
      edges.push({ label: dayNames[i]!, start: new Date(a - off * 60000), end: new Date(b - off * 60000) });
    }
  } else if (period === "year") {
    for (let i = 0; i < 12; i += 1) {
      const a = Date.UTC(s.getUTCFullYear(), i, 1);
      const b = Date.UTC(s.getUTCFullYear(), i + 1, 1);
      edges.push({ label: monthNames[i]!, start: new Date(a - off * 60000), end: new Date(b - off * 60000) });
    }
  } else {
    // month → weeks (Mon-aligned) that overlap the month
    const monthStart = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1);
    const monthEnd = Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + 1, 1);
    const firstDow = (new Date(monthStart).getUTCDay() + 6) % 7;
    let cur = monthStart - firstDow * 86400000;
    let w = 1;
    while (cur < monthEnd) {
      const b = cur + 7 * 86400000;
      edges.push({
        label: `W${w}`,
        start: new Date(Math.max(cur, monthStart) - off * 60000),
        end: new Date(Math.min(b, monthEnd) - off * 60000),
      });
      cur = b;
      w += 1;
    }
  }

  return Promise.all(
    edges.map(async (e) => {
      const f = await sumFlows(userId, e.start, e.end, base, e.end);
      return { label: e.label, income: f.income, expense: f.expense };
    }),
  );
}

// ── Net cashflow across the last N whole periods (trend line) ────────
export type SeriesPoint = {
  key: string;
  label: string;
  income: string;
  expense: string;
  net: string;
};

const TH_MONTH_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

function seriesLabel(period: Period, key: string): string {
  if (period === "year") return key; // "2026"
  if (period === "month") {
    const mo = Number(key.slice(5, 7));
    return TH_MONTH_SHORT[mo - 1] ?? key;
  }
  // week → "d/m" of the Monday
  const [, m, d] = key.split("-");
  return `${Number(d)}/${Number(m)}`;
}

/**
 * The last `count` whole periods (oldest → newest, current period last),
 * each with income / expense / net converted to base. Feeds the trend chart.
 */
export async function periodSeries(
  userId: string,
  tz: string,
  base: string,
  period: Period,
  count = period === "week" ? 8 : period === "year" ? 5 : 6,
  now: Date = new Date(),
): Promise<SeriesPoint[]> {
  const offsets: number[] = [];
  for (let i = count - 1; i >= 0; i -= 1) offsets.push(-i);

  return Promise.all(
    offsets.map(async (offset) => {
      const r = periodRange(tz, period, offset, now);
      const f = await sumFlows(userId, r.start, r.end, base, r.end);
      return {
        key: r.key,
        label: seriesLabel(period, r.key),
        income: f.income,
        expense: f.expense,
        net: f.net,
      };
    }),
  );
}
