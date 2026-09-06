"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, ChevronRight, Landmark, Sparkles, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { intlLocaleTag } from "@/i18n/config";
import { formatDate, formatMoney } from "@/lib/format";
import { categoryLabel } from "@/lib/category-i18n";
import type { DashboardData } from "@/server/services/dashboard.service";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/charts/stat-card";
import { LineChart } from "@/components/charts/line-chart";
import { IncomeExpenseBars } from "@/components/charts/income-expense-bars";
import { CategoryBars } from "@/components/charts/category-bars";

export function DashboardView({ data, firstName }: { data: DashboardData; firstName?: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("dashboard");
  const ui = useTranslations("ui");
  const tCat = useTranslations("categories");
  const base = data.baseCurrency;
  const money = (value: number | string, digits = 0) => formatMoney(value, base, locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
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
  const hasAnything = nw.accounts.length > 0 || netWorth !== 0 || data.recent.length > 0;

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

  return <section className="flex flex-col gap-8 pb-4">
    <PageHeader title={t("title")} description={ui("overview")} eyebrow={<>{t("greeting")}{firstName ? `, ${firstName}` : ""}</>} />

    <section className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(145deg,#1d4ed8_0%,#2563eb_54%,#3b82f6_100%)] px-6 py-5 text-white shadow-[0_20px_48px_-36px_rgb(37_99_235_/_0.65)] sm:px-8 sm:py-6">
      <div className="relative grid gap-5 lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:gap-14">
        <div>
        <p className="flex items-center gap-2 text-sm text-blue-100"><Sparkles className="size-4" />{t("netWorth")}</p>
        <p className="balance-mask mt-3 text-[2.5rem] font-semibold leading-none sm:text-[3.5rem]">{money(nw.netWorth, 2)}</p>
        </div>
        <div>
        <div className="grid grid-cols-2 gap-6 border-t border-white/15 pt-5 lg:border-t-0 lg:pt-0">
          <div><p className="text-xs text-blue-100">{t("cash")}</p><p className="balance-mask mt-1 text-lg font-semibold">{money(nw.totalCash)}</p></div>
          <div><p className="text-xs text-blue-100">{t("investment")}</p><p className="balance-mask mt-1 text-lg font-semibold">{money(nw.totalInvestment)}</p></div>
        </div>
        {netWorth > 0 && <div className="mt-4" aria-label={`${t("cash")} ${cashPct.toFixed(0)}%, ${t("investment")} ${(100 - cashPct).toFixed(0)}%`}>
          <div className="flex h-1.5 overflow-hidden rounded-full bg-white/20"><span className="bg-white/85" style={{ width: `${cashPct}%` }} /><span className="bg-cyan-200/70" style={{ width: `${100 - cashPct}%` }} /></div>
          <div className="mt-2 flex justify-between text-[11px] text-blue-100"><span>{t("cash")} {cashPct.toFixed(0)}%</span><span>{t("investment")} {(100 - cashPct).toFixed(0)}%</span></div>
        </div>}
        {nw.approx && <Badge variant="neutral" className="mt-4 border-white/20 bg-white/10 text-white">≈ {t("approxFx")}</Badge>}
        </div>
      </div>
    </section>

    <section>
      <SectionHeading title={t("monthlyHealth")} />
      <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-3 sm:gap-x-8">
        <StatCard quiet label={t("incomeThisMonth")} value={money(data.thisMonth.income)} tone="positive" icon={<ArrowDownLeft className="size-4" />} sub={comparison(data.thisMonth.income, data.lastMonth.income)} />
        <StatCard quiet label={t("expenseThisMonth")} value={money(data.thisMonth.expense)} tone="negative" icon={<ArrowUpRight className="size-4" />} sub={comparison(data.thisMonth.expense, data.lastMonth.expense, true)} />
        <StatCard quiet label={t("netCashFlow")} value={`${net > 0 ? "+" : ""}${money(data.thisMonth.net)}`} tone={net > 0 ? "positive" : net < 0 ? "negative" : "neutral"} icon={<TrendingUp className="size-4" />} className="col-span-2 sm:col-span-1" />
      </div>
    </section>

    <div className="grid min-w-0 gap-x-8 gap-y-10 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section className="order-1 min-w-0">
        <SectionHeading title={t("accountBreakdown")} href="/accounts" label={t("viewAll")} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {nw.accounts.map((account) => <Link key={account.id} href={`/accounts/${account.id}`} className="interactive-lift group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4">
            <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: account.color ?? "#2563eb" }} />
            <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl text-lg" style={{ backgroundColor: `${account.color ?? "#2563eb"}18` }}>{account.icon || <Landmark className="size-5 text-primary" />}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{account.name}</p><p className="text-xs text-muted-foreground">{account.currency}</p></div></div>
            <p className="balance-mask mt-5 text-2xl font-semibold">{account.currency === base ? money(account.balanceBase) : formatMoney(account.balanceNative, account.currency, locale)}</p>
          </Link>)}
        </div>
      </section>

      {nw.portfolios.length > 0 && <section className="order-4 min-w-0 xl:order-2">
        <SectionHeading title={t("investmentBreakdown")} href="/portfolio" label={t("viewAll")} />
        <Link href="/portfolio" className="interactive-lift mt-4 block rounded-2xl bg-slate-900 p-5 text-white dark:bg-slate-800">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-slate-400">{t("portfolioValue")}</p><p className="balance-mask mt-1 text-3xl font-semibold">{money(nw.totalInvestment)}</p></div><span className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-blue-300"><TrendingUp className="size-5" /></span></div>
          {investmentGainPct !== null && <p className={cn("mt-3 text-sm", investmentGain >= 0 ? "text-emerald-300" : "text-rose-300")}>{investmentGain >= 0 ? "+" : ""}{money(investmentGain)} · {investmentGain >= 0 ? "+" : ""}{investmentGainPct.toFixed(1)}%</p>}
          <div className="soft-divider mt-5 border-t border-white/10">{nw.portfolios.map((portfolio) => <div key={portfolio.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="truncate text-slate-300">{portfolio.name}</span><span className="balance-mask shrink-0">{money(portfolio.marketValueBase)}</span></div>)}</div>
        </Link>
      </section>}

      <section className="order-2 min-w-0 xl:order-3">
        <SectionHeading title={t("recent")} href="/transactions" label={t("viewAll")} />
        {data.recent.length === 0 ? <EmptyState className="mt-4" title={t("empty")} description={t("emptyCta")} /> : <ul className="soft-divider mt-3">
          {data.recent.map((item) => {
            const isIncome = item.type === "INCOME";
            const isTransfer = item.type === "TRANSFER";
            const title = isTransfer ? `${item.fromAccountName} → ${item.toAccountName}` : item.description || (item.categoryName ? categoryLabel(tCat, { systemKey: item.categorySystemKey, name: item.categoryName }) : item.accountName);
            const meta = isTransfer ? t("transfer") : [item.categoryName ? categoryLabel(tCat, { systemKey: item.categorySystemKey, name: item.categoryName }) : null, item.accountName].filter(Boolean).join(" · ");
            return <li key={`${item.type}-${item.id}`}><Link href="/transactions" className="group flex items-center gap-3 rounded-xl px-2 py-3.5 transition-colors duration-200 hover:bg-card">
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl text-base", isIncome ? "bg-emerald-500/10 text-positive" : isTransfer ? "bg-blue-500/10 text-primary" : "bg-rose-500/10 text-negative")} style={!isTransfer && !isIncome && item.categoryColor ? { backgroundColor: `${item.categoryColor}18` } : undefined}>{isTransfer ? <ArrowLeftRight className="size-4" /> : item.categoryIcon || (isIncome ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />)}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{title}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{meta} · {formatDate(item.date, locale, { month: "short", day: "numeric" })}</span></span>
              <span className={cn("balance-mask shrink-0 text-sm font-semibold", isIncome ? "text-positive" : isTransfer ? "text-muted-foreground" : "text-negative")}>{isIncome ? "+" : isTransfer ? "" : "−"}{isTransfer ? formatMoney(item.fromAmount, item.fromCurrency, locale) : formatMoney(item.amount, item.currency, locale)}</span>
            </Link></li>;
          })}
        </ul>}
      </section>

      <section className="order-3 min-w-0 xl:order-4">
        <SectionHeading title={t("expenseByCategory")} secondary />
        <div className="mt-5">{data.expenseByCategory.length > 0 ? <CategoryBars rows={data.expenseByCategory.map((category) => ({ key: category.categoryId ?? "none", label: category.name ? categoryLabel(tCat, { systemKey: category.systemKey, name: category.name }) : t("uncategorized"), icon: category.icon, color: category.color, amount: Number(category.amount), pct: category.pct }))} formatValue={(value) => money(value)} /> : <p className="py-8 text-sm text-muted-foreground">{ui("noSpending")}</p>}</div>
      </section>
    </div>

    <details className="group border-t border-border pt-5">
      <summary className="inline-flex items-center gap-2 text-sm font-medium text-primary">{ui("moreInsights")} <ChevronRight className="size-4 transition-transform duration-200 group-open:rotate-90" /></summary>
      <div className="mt-6 grid items-start gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-card p-5"><h2 className="text-base font-semibold">{t("netWorthHistory")}</h2>{data.netWorthHistory.length >= 2 ? <LineChart className="mt-4" data={data.netWorthHistory.map((point) => ({ label: formatDate(point.date, locale, { month: "short", day: "numeric" }), value: Number(point.netWorth) }))} formatValue={(value) => money(value)} /> : <p className="py-8 text-center text-sm text-muted-foreground">{t("collectingHistory")}</p>}</div>
        <div className="rounded-2xl border border-border/70 bg-card p-5"><h2 className="text-base font-semibold">{t("incomeVsExpense")}</h2><div className="mt-3 flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-positive" />{t("incomeThisMonth")}</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-negative" />{t("expenseThisMonth")}</span></div><IncomeExpenseBars data={data.incomeExpense.map((month) => ({ label: monthLabel(month.key), income: Number(month.income), expense: Number(month.expense) }))} formatValue={(value) => money(value)} /></div>
        <div className="rounded-2xl border border-border/70 bg-card p-5"><h2 className="text-base font-semibold">{t("monthlyComparison")}</h2><div className="soft-divider mt-3"><CompareRow label={t("incomeThisMonth")} current={money(data.thisMonth.income)} previous={money(data.lastMonth.income)} /><CompareRow label={t("expenseThisMonth")} current={money(data.thisMonth.expense)} previous={money(data.lastMonth.expense)} /><CompareRow label={t("netCashFlow")} current={money(data.thisMonth.net)} previous={money(data.lastMonth.net)} /></div></div>
      </div>
    </details>
  </section>;
}

function SectionHeading({ title, href, label, secondary = false }: { title: string; href?: string; label?: string; secondary?: boolean }) {
  return <div className={cn("flex items-center justify-between gap-4", secondary && "min-h-11")}><h2 className={cn("font-semibold tracking-tight", secondary ? "text-base text-muted-foreground" : "text-lg")}>{title}</h2>{href && <Link href={href} className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-primary hover:text-blue-700">{label}<ChevronRight className="size-3.5" /></Link>}</div>;
}

function CompareRow({ label, current, previous }: { label: string; current: string; previous: string }) {
  return <div className="grid grid-cols-[1fr_auto] gap-3 py-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="balance-mask text-right font-medium">{current}<span className="mt-0.5 block text-xs font-normal text-muted-foreground">{previous}</span></span></div>;
}
