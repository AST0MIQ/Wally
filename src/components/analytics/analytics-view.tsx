"use client";
import { PageHeader } from "@/components/ui/page-header";

import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { formatCurrency } from "@/lib/format";
import { categoryLabel } from "@/lib/category-i18n";
import type { AnalyticsData } from "@/server/services/analytics.service";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export function AnalyticsView({ data }: { data: AnalyticsData }) {
  const locale = useLocale() as Locale;
  const ui = useTranslations("ui");
  const t = useTranslations("analytics");
  const tCat = useTranslations("categories");
  const base = data.baseCurrency;
  const fmt = (n: number | string) => formatCurrency(n, base, locale);

  const catName = (c: {
    name: string | null;
    systemKey: string | null;
  }) =>
    c.name ? categoryLabel(tCat, { systemKey: c.systemKey, name: c.name }) : "—";

  const hasData =
    Number(data.expenseThisMonth) > 0 || Number(data.incomeThisMonth) > 0;

  if (!hasData) {
    return (
      <section className="flex flex-col gap-5">
        <PageHeader title={t("title")} description={ui("analytics")} />
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
    // no base month
  } else if (Math.abs(data.expenseDeltaPct) < 1) {
    insights.push(t("expenseFlat"));
  } else if (data.expenseDeltaPct > 0) {
    insights.push(t("expenseUp", { pct: Math.round(data.expenseDeltaPct) }));
  } else {
    insights.push(
      t("expenseDown", { pct: Math.round(Math.abs(data.expenseDeltaPct)) }),
    );
  }

  const netMonth = Number(data.netThisMonth);
  if (netMonth > 0)
    insights.push(t("incomeOverExpense", { amount: fmt(netMonth) }));
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

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={ui("analytics")} />

      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((line, i) => (
          <Card key={i} className="p-4 text-sm">
            {line}
          </Card>
        ))}
        {data.netWorthDelta === null && (
          <p className="px-1 text-xs text-muted-foreground">
            {t("noComparison")}
          </p>
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
        <p className="text-xs text-muted-foreground">{t("vsLastMonth")}</p>
      </Card>
    </section>
  );
}
