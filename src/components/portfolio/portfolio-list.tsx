"use client";

import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { formatMoney, formatMoneyCompact } from "@/lib/format";
import type { AccountLite } from "@/server/services/account.service";
import type { PortfolioSummary } from "@/server/services/portfolio.service";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PortfolioForm } from "@/components/portfolio/portfolio-form";
import { HeroCardFx, heroCardClasses } from "@/components/streak/hero-card-fx";

export function PortfolioList({
  portfolios,
  accounts,
  streakTier = -1,
}: {
  portfolios: PortfolioSummary[];
  accounts: AccountLite[];
  streakTier?: number;
}) {
  const ui = useTranslations("ui");
  const locale = useLocale() as Locale;
  const t = useTranslations("portfolio");
  const ta = useTranslations("accounts");
  const commonCurrency = portfolios[0]?.baseCurrency ?? "USD";
  const canAggregate = portfolios.length > 0 && portfolios.every((p) => p.baseCurrency === commonCurrency);
  const totalValue = portfolios.reduce((sum, p) => sum + Number(p.totalMarketValue), 0);
  const totalCost = portfolios.reduce((sum, p) => sum + Number(p.totalCost), 0);
  const totalPnl = totalValue - totalCost;

  const addButton = (
    <PortfolioForm
      accounts={accounts}
      trigger={
        <Button size="sm" disabled={accounts.length === 0}>
          <Plus className="size-4" />
          {t("add")}
        </Button>
      }
    />
  );

  return (
    <section className="flex flex-col gap-5">
      <PageHeader title={t("title")} description={ui("portfolio")} action={portfolios.length === 0 ? addButton : undefined} />

      {accounts.length === 0 ? (
        <EmptyState title={t("empty")} description={t("noAccounts")} action={<Link href="/accounts" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-white">{ta("add")}</Link>} />
      ) : portfolios.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyHint")}
          action={addButton}
        />
      ) : (
        <>
        {canAggregate && <Card className={cn("brand-gradient relative overflow-hidden border-0 p-6 text-white shadow-lg", heroCardClasses(streakTier))}>
          <HeroCardFx tierIndex={streakTier} />
          <div className="relative z-[1]">
            <p className="text-sm text-white/60">{t("allPortfolioValue")}</p>
            <p
              title={formatMoney(totalValue, commonCurrency, locale)}
              className="balance-mask mt-3 truncate text-3xl font-bold sm:text-4xl"
            >
              {formatMoneyCompact(totalValue, commonCurrency, locale)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className={cn("min-w-0 truncate rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold", totalPnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                {totalPnl >= 0 ? "+" : ""}{formatMoneyCompact(totalPnl, commonCurrency, locale)} ({totalCost > 0 ? ((totalPnl / totalCost) * 100).toFixed(2) : "0.00"}%)
              </span>
              <span className="text-sm text-white/55">{t("unrealized")}</span>
            </div>
          </div>
        </Card>}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t("allPortfolios", { count: portfolios.length })}</h2>
          {addButton}
        </div>
        <ul className="grid gap-3 lg:grid-cols-2">
          {portfolios.map((p) => {
            const pnl = Number(p.totalUnrealizedPnL);
            return (
              <li key={p.id}>
                <Link href={`/portfolio/${p.id}`} className="block rounded-2xl">
                  <Card className="interactive-lift relative flex items-center gap-3 overflow-hidden p-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><TrendingUp className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div>
                        <p className="text-base font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.accountName} · {p.holdingCount} {t("holdings")}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="balance-mask text-lg font-semibold">
                        {formatMoney(
                          p.totalMarketValue,
                          p.baseCurrency,
                          locale,
                        )}
                      </p>
                      <span
                        className={cn(
                          "balance-mask font-medium",
                          pnl > 0 && "text-positive",
                          pnl < 0 && "text-negative",
                        )}
                      >
                        {pnl >= 0 ? "+" : ""}{Number(p.totalUnrealizedPnLPct).toFixed(2)}%
                      </span>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul></>
      )}
    </section>
  );
}
