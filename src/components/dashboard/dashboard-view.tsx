"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Sparkles, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { intlLocaleTag } from "@/i18n/config";
import { formatDate, formatMoney } from "@/lib/format";
import { categoryLabel } from "@/lib/category-i18n";
import type { DashboardData } from "@/server/services/dashboard.service";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/charts/stat-card";
import { LineChart } from "@/components/charts/line-chart";
import { IncomeExpenseBars } from "@/components/charts/income-expense-bars";
import { CategoryBars } from "@/components/charts/category-bars";

const CATEGORY_ROWS = 5;

export function DashboardView({ data, firstName }: { data: DashboardData; firstName?: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("dashboard");
  const ui = useTranslations("ui");
  const tCat = useTranslations("categories");
  const base = data.baseCurrency;
  const money = (value: number | string, digits = 2) => formatMoney(value, base, locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const monthLabel = (key: string) => {
    const [year, month] = key.split("-").map(Number);
    return new Intl.DateTimeFormat(intlLocaleTag[locale], { month: "short" }).format(new Date(Date.UTC(year ?? 2000, (month ?? 1) - 1, 1)));
  };

  const nw = data.netWorth;
  const netWorth = Number(nw.netWorth);
  const cash = Number(nw.totalCash);
  const cashPct = netWorth > 0 ? Math.max(0, Math.min(100, (cash / netWorth) * 100)) : 0;
  const net = Number(data.thisMonth.net);
  const investmentCost = nw.portfolios.reduce((sum, portfolio) => sum + Number(portfolio.costBase), 0);
  const investmentGain = nw.portfolios.reduce((sum, portfolio) => sum + Number(portfolio.unrealizedBase), 0);
  const investmentGainPct = investmentCost > 0 ? (investmentGain / investmentCost) * 100 : null;
  const hasAnything = nw.accounts.length > 0 || netWorth !== 0;

  const comparison = (current: string, previous: string, invert = false) => {
    const prior = Number(previous);
    if (!Number.isFinite(prior) || !Number.isFinite(Number(current)) || prior <= 0) return null;
    const pct = ((Number(current) - prior) / prior) * 100;
    const favorable = invert ? pct < 0 : pct > 0;
    return <span className={cn("inline-flex items-center gap-1", favorable ? "text-positive" : pct === 0 ? "text-muted-foreground" : "text-negative")}>
      {pct > 0 ? <ArrowUpRight className="size-3.5" /> : pct < 0 ? <ArrowDownLeft className="size-3.5" /> : null}
      {Math.abs(pct).toFixed(1)}% {t("vsLastMonth")}
    </span>;
  };

  if (!hasAnything) return <section className="flex flex-col gap-6">
    <PageHeader title={t("title")} description={ui("overview")} />
    <EmptyState title={t("empty")} description={t("emptyCta")} action={<Link href="/accounts" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-medium text-white">{t("accountBreakdown")} <ChevronRight className="ml-1 size-4" /></Link>} />
  </section>;

  return <section className="flex flex-col gap-9 pb-4">
    <PageHeader title={t("title")} description={ui("overview")} eyebrow={<>{t("greeting")}{firstName ? `, ${firstName}` : ""}</>} />

    {/* Net worth — the one-glance answer */}
    <section className="brand-gradient relative overflow-hidden rounded-3xl px-5 py-5 text-white shadow-[0_20px_48px_-36px_rgb(0_0_0_/_0.55)] sm:px-7">
      <p className="flex items-center gap-1.5 text-xs text-white/70"><Sparkles className="size-3.5" />{t("netWorth")}</p>
      <p className="balance-mask mt-1.5 text-[2rem] font-semibold leading-none sm:text-[2.6rem]">{money(nw.netWorth, 2)}</p>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] text-white/70">{t("cash")}</p>
          <p className="balance-mask mt-0.5 text-base font-semibold">{money(nw.totalCash)}</p>
        </div>
        <div>
          <p className="text-[11px] text-white/70">{t("investment")}</p>
          <p className="balance-mask mt-0.5 text-base font-semibold">
            {money(nw.totalInvestment)}
            {investmentGainPct !== null && (
              <span className={cn("ml-1.5 text-[11px] font-medium", investmentGain >= 0 ? "text-emerald-200" : "text-red-200")}>
                {investmentGain >= 0 ? "+" : ""}{investmentGainPct.toFixed(1)}%
              </span>
            )}
          </p>
        </div>
      </div>

      {netWorth > 0 && (
        <div className="mt-3" aria-label={`${t("cash")} ${cashPct.toFixed(0)}%, ${t("investment")} ${(100 - cashPct).toFixed(0)}%`}>
          <div className="flex h-1.5 overflow-hidden rounded-full bg-white/20">
            <span className="bg-white/85" style={{ width: `${cashPct}%` }} />
            <span className="bg-white/45" style={{ width: `${100 - cashPct}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-white/70">
            <span>{t("cash")} {cashPct.toFixed(0)}%</span>
            <span>{t("investment")} {(100 - cashPct).toFixed(0)}%</span>
          </div>
        </div>
      )}
      {nw.approx && (
        <p className="mt-2.5 text-[11px] text-white/60">≈ {t("approxFx")}</p>
      )}
    </section>

    {/* This month — spending health */}
    <DashSection title={t("monthlyHealth")}>
      <div className="grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-3 sm:gap-x-8">
        <StatCard quiet label={t("incomeThisMonth")} value={money(data.thisMonth.income)} tone="positive" icon={<ArrowDownLeft className="size-4" />} sub={comparison(data.thisMonth.income, data.lastMonth.income)} />
        <StatCard quiet label={t("expenseThisMonth")} value={money(data.thisMonth.expense)} tone="negative" icon={<ArrowUpRight className="size-4" />} sub={comparison(data.thisMonth.expense, data.lastMonth.expense, true)} />
        <StatCard quiet label={t("netCashFlow")} value={`${net > 0 ? "+" : ""}${money(data.thisMonth.net)}`} tone={net > 0 ? "positive" : net < 0 ? "negative" : "neutral"} icon={<TrendingUp className="size-4" />} className="col-span-2 sm:col-span-1" />
      </div>
    </DashSection>

    <DashSection title={t("expenseByCategory")} href="/analytics" label={t("viewAll")}>
      {data.expenseByCategory.length > 0
        ? <CategoryBars rows={data.expenseByCategory.slice(0, CATEGORY_ROWS).map((category) => ({ key: category.categoryId ?? "none", label: category.name ? categoryLabel(tCat, { systemKey: category.systemKey, name: category.name }) : t("uncategorized"), icon: category.icon, color: category.color, amount: Number(category.amount), pct: category.pct }))} formatValue={(value) => money(value)} />
        : <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">{ui("noSpending")}</p>}
    </DashSection>

    {/* Trends — one tab visible at a time, no hidden disclosure */}
    <TrendTabs
      labels={{ trends: t("trends"), netWorthHistory: t("netWorthHistory"), incomeVsExpense: t("incomeVsExpense"), monthlyComparison: t("monthlyComparison"), income: t("incomeThisMonth"), expense: t("expenseThisMonth"), net: t("netCashFlow"), collecting: t("collectingHistory") }}
      history={data.netWorthHistory.map((point) => ({ label: formatDate(point.date, locale, { month: "short", day: "numeric" }), value: Number(point.netWorth) }))}
      incomeExpense={data.incomeExpense.map((month) => ({ label: monthLabel(month.key), income: Number(month.income), expense: Number(month.expense) }))}
      compare={[
        { label: t("incomeThisMonth"), current: money(data.thisMonth.income), previous: money(data.lastMonth.income) },
        { label: t("expenseThisMonth"), current: money(data.thisMonth.expense), previous: money(data.lastMonth.expense) },
        { label: t("netCashFlow"), current: money(data.thisMonth.net), previous: money(data.lastMonth.net) },
      ]}
      formatValue={(value) => money(value)}
    />
  </section>;
}

function DashSection({ title, href, label, children }: { title: string; href?: string; label?: string; children: React.ReactNode }) {
  return <section className="min-w-0">
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {href && <Link href={href} className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-primary hover:text-blue-700">{label}<ChevronRight className="size-3.5" /></Link>}
    </div>
    <div className="mt-4">{children}</div>
  </section>;
}

type TrendTabId = "history" | "flow" | "compare";

function TrendTabs({ labels, history, incomeExpense, compare, formatValue }: {
  labels: Record<string, string>;
  history: { label: string; value: number }[];
  incomeExpense: { label: string; income: number; expense: number }[];
  compare: { label: string; current: string; previous: string }[];
  formatValue: (n: number) => string;
}) {
  const [tab, setTab] = useState<TrendTabId>("history");
  const tabs: { id: TrendTabId; label: string }[] = [
    { id: "history", label: labels.netWorthHistory ?? "" },
    { id: "flow", label: labels.incomeVsExpense ?? "" },
    { id: "compare", label: labels.monthlyComparison ?? "" },
  ];

  return <section className="rounded-3xl border border-border/70 bg-card p-5">
    <h2 className="text-lg font-semibold tracking-tight">{labels.trends}</h2>
    <div role="tablist" aria-label={labels.trends} className="mt-4 flex gap-1 rounded-full bg-muted p-1 text-xs font-medium">
      {tabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={cn("min-h-9 flex-1 rounded-full px-2 transition-colors duration-200", tab === item.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>{item.label}</button>)}
    </div>

    <div className="mt-5">
      {tab === "history" && (history.length >= 2
        ? <LineChart data={history} formatValue={formatValue} />
        : <p className="py-8 text-center text-sm text-muted-foreground">{labels.collecting}</p>)}

      {tab === "flow" && <>
        <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-positive" />{labels.income}</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-negative" />{labels.expense}</span>
        </div>
        <IncomeExpenseBars data={incomeExpense} formatValue={formatValue} />
      </>}

      {tab === "compare" && <div className="soft-divider">
        {compare.map((row) => <div key={row.label} className="grid grid-cols-[1fr_auto] gap-3 py-3 text-sm">
          <span className="text-muted-foreground">{row.label}</span>
          <span className="balance-mask text-right font-medium">{row.current}<span className="mt-0.5 block text-xs font-normal text-muted-foreground">{row.previous}</span></span>
        </div>)}
      </div>}
    </div>
  </section>;
}
