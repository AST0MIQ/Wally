"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { formatCurrency } from "@/lib/format";
import { categoryLabel } from "@/lib/category-i18n";
import type { AnalyticsData, Period } from "@/server/services/analytics.service";

import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IncomeExpenseBars } from "@/components/charts/income-expense-bars";
import { CategoryBars } from "@/components/charts/category-bars";
import { LineChart } from "@/components/charts/line-chart";

const PERIODS: Period[] = ["week", "month", "year"];

function PeriodTabs({ active }: { active: Period }) {
  const t = useTranslations("analytics");
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const label: Record<Period, string> = {
    week: t("periodWeek"),
    month: t("periodMonth"),
    year: t("periodYear"),
  };

  return (
    <div
      role="tablist"
      aria-label={t("period")}
      className="flex gap-1 rounded-full bg-muted p-1 text-sm font-medium"
    >
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          role="tab"
          aria-selected={p === active}
          onClick={() => {
            const params = new URLSearchParams(search);
            params.set("period", p);
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
          }}
          className={cn(
            "min-h-9 flex-1 rounded-full px-3 transition-colors",
            p === active
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          {label[p]}
        </button>
      ))}
    </div>
  );
}

export function AnalyticsView({ data }: { data: AnalyticsData }) {
  const locale = useLocale() as Locale;
  const ui = useTranslations("ui");
  const t = useTranslations("analytics");
  const tCat = useTranslations("categories");
  const base = data.baseCurrency;
  const fmt = (n: number | string) => formatCurrency(n, base, locale);
  const fmtSigned = (n: number) => (n >= 0 ? `+${fmt(n)}` : `−${fmt(-n)}`);

  const catName = (c: { name: string | null; systemKey: string | null }) =>
    c.name ? categoryLabel(tCat, { systemKey: c.systemKey, name: c.name }) : "—";

  const income = Number(data.incomeThisMonth);
  const expense = Number(data.expenseThisMonth);
  const netMonth = Number(data.netThisMonth);
  const hasData = expense > 0 || income > 0;

  if (!hasData) {
    return (
      <section className="flex flex-col gap-5">
        <PageHeader title={t("title")} description={ui("analytics")} />
        <PeriodTabs active={data.period} />
        <NetWorthCard data={data} fmt={fmt} fmtSigned={fmtSigned} t={t} />
        <EmptyState title={t("empty")} description={t("emptyHint")} />
      </section>
    );
  }

  const insights: string[] = [];
  if (data.topCategory) {
    insights.push(
      t("spentOn", {
        amount: fmt(data.topCategory.amount),
        category: catName(data.topCategory),
      }),
    );
    insights.push(t("topCategoryIs", { category: catName(data.topCategory) }));
  }
  if (data.expenseDeltaPct === null) {
    // no base period
  } else if (Math.abs(data.expenseDeltaPct) < 1) {
    insights.push(t("expenseFlat"));
  } else if (data.expenseDeltaPct > 0) {
    insights.push(t("expenseUp", { pct: Math.round(data.expenseDeltaPct) }));
  } else {
    insights.push(
      t("expenseDown", { pct: Math.round(Math.abs(data.expenseDeltaPct)) }),
    );
  }
  if (netMonth > 0) insights.push(t("incomeOverExpense", { amount: fmt(netMonth) }));
  else if (netMonth < 0)
    insights.push(t("expenseOverIncome", { amount: fmt(-netMonth) }));
  if (data.netWorthDelta !== null) {
    const d = Number(data.netWorthDelta);
    insights.push(
      d >= 0
        ? t("netWorthUp", { amount: fmt(d) })
        : t("netWorthDown", { amount: fmt(-d) }),
    );
  }

  const trendPoints = data.series.map((s) => ({
    label: s.label,
    value: Number(s.net),
  }));

  const categoryRows = data.categories.slice(0, 6).map((c) => ({
    key: c.categoryId ?? "none",
    label: catName(c),
    icon: c.icon,
    color: c.color,
    amount: Number(c.amount),
    pct: c.pct,
  }));

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={ui("analytics")} />
      <PeriodTabs active={data.period} />

      <NetWorthCard data={data} fmt={fmt} fmtSigned={fmtSigned} t={t} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t("income")} value={fmt(income)} tone="positive" />
        <StatTile label={t("expense")} value={fmt(expense)} tone="negative" />
        <StatTile
          label={t("net")}
          value={fmtSigned(netMonth)}
          tone={netMonth >= 0 ? "positive" : "negative"}
        />
        <StatTile
          label={t("savingsRate")}
          value={
            data.savingsRate === null ? "—" : `${Math.round(data.savingsRate)}%`
          }
          tone={
            data.savingsRate === null
              ? "neutral"
              : data.savingsRate >= 0
                ? "positive"
                : "negative"
          }
        />
      </div>

      {trendPoints.length >= 2 && (
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="text-sm font-semibold">{t("netTrend")}</h2>
          <LineChart data={trendPoints} formatValue={(n) => fmt(n)} />
        </Card>
      )}

      {data.buckets.length > 0 && (
        <Card className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t("flowChart")}</h2>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-positive" />
                {t("income")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-negative" />
                {t("expense")}
              </span>
            </div>
          </div>
          <IncomeExpenseBars
            data={data.buckets.map((b) => ({
              label: b.label,
              income: Number(b.income),
              expense: Number(b.expense),
            }))}
            formatValue={(n) => fmt(n)}
          />
        </Card>
      )}

      {categoryRows.length > 0 && (
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-sm font-semibold">{t("spendingByCategory")}</h2>
          <CategoryBars rows={categoryRows} formatValue={(n) => fmt(n)} />
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((line, i) => (
          <Card key={i} className="p-4 text-sm">
            {line}
          </Card>
        ))}
        {data.netWorthDelta === null && (
          <p className="px-1 text-xs text-muted-foreground">{t("noComparison")}</p>
        )}
      </div>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-semibold">{t("categoryTrends")}</h2>
        <ul className="flex flex-col divide-y divide-border">
          {data.categories.map((c) => {
            const delta = c.deltaPct;
            return (
              <li
                key={c.categoryId ?? "none"}
                className="flex items-center justify-between gap-2 py-2.5 text-sm"
              >
                <span className="flex items-center gap-2">
                  {c.icon && <span>{c.icon}</span>}
                  <span>{catName(c)}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums">{fmt(c.amount)}</span>
                  {delta !== null && (
                    <span
                      className={cn(
                        "w-14 text-right text-xs tabular-nums",
                        delta > 0.5 && "text-negative",
                        delta < -0.5 && "text-positive",
                        Math.abs(delta) <= 0.5 && "text-muted-foreground",
                      )}
                    >
                      {delta > 0 ? "+" : ""}
                      {Math.round(delta)}%
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">{t("vsPrevPeriod")}</p>
      </Card>
    </section>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "positive" | "negative" | "neutral";
}) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums",
          tone === "positive" && "text-positive",
          tone === "negative" && "text-negative",
        )}
      >
        {value}
      </p>
    </Card>
  );
}

function NetWorthCard({
  data,
  fmt,
  fmtSigned,
  t,
}: {
  data: AnalyticsData;
  fmt: (n: number | string) => string;
  fmtSigned: (n: number) => string;
  t: ReturnType<typeof useTranslations>;
}) {
  const cash = Number(data.netWorthCash);
  const invest = Number(data.netWorthInvestment);
  const total = cash + invest;
  const cashPct = total > 0 ? Math.round((cash / total) * 100) : 0;
  const investPct = total > 0 ? 100 - cashPct : 0;
  const delta = data.netWorthDelta === null ? null : Number(data.netWorthDelta);

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm text-muted-foreground">{t("netWorth")}</span>
        {delta !== null && (
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              delta >= 0 ? "text-positive" : "text-negative",
            )}
          >
            {fmtSigned(delta)} · {t("vsPrevPeriod")}
          </span>
        )}
      </div>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">
        {fmt(data.netWorthNow)}
      </p>

      {total > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="bg-primary" style={{ width: `${cashPct}%` }} />
            <div className="bg-primary/40" style={{ width: `${investPct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {t("cash")} {cashPct}% · {fmt(cash)}
            </span>
            <span>
              {t("investment")} {investPct}% · {fmt(invest)}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
