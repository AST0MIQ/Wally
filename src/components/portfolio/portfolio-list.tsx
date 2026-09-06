"use client";

import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { formatMoney } from "@/lib/format";
import type { AccountLite } from "@/server/services/account.service";
import type { PortfolioSummary } from "@/server/services/portfolio.service";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PortfolioForm } from "@/components/portfolio/portfolio-form";

export function PortfolioList({
  portfolios,
  accounts,
}: {
  portfolios: PortfolioSummary[];
  accounts: AccountLite[];
}) {
  const ui = useTranslations("ui");
  const locale = useLocale() as Locale;
  const t = useTranslations("portfolio");
  const ta = useTranslations("accounts");

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
      <PageHeader title={t("title")} description={ui("portfolio")} action={addButton} />

      {accounts.length === 0 ? (
        <EmptyState title={t("empty")} description={t("noAccounts")} action={<Link href="/accounts" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-white">{ta("add")}</Link>} />
      ) : portfolios.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyHint")}
          action={addButton}
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {portfolios.map((p) => {
            const pnl = Number(p.totalUnrealizedPnL);
            return (
              <li key={p.id}>
                <Link href={`/portfolio/${p.id}`} className="block rounded-2xl">
                  <Card className="interactive-lift relative flex flex-col gap-5 overflow-hidden p-6">
                    <span className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-primary"><TrendingUp className="size-5" /></span>
                    <div className="flex flex-col gap-5 pr-12">
                      <div>
                        <p className="text-base font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.accountName} · {p.holdingCount} {t("holdings")}
                        </p>
                      </div>
                      <p className="balance-mask text-3xl font-semibold">
                        {formatMoney(
                          p.totalMarketValue,
                          p.baseCurrency,
                          locale,
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4 text-sm">
                      <span className="text-muted-foreground">
                        {t("cost")}{" "}
                        {formatMoney(p.totalCost, p.baseCurrency, locale)}
                      </span>
                      <span
                        className={cn(
                          "balance-mask font-medium",
                          pnl > 0 && "text-positive",
                          pnl < 0 && "text-negative",
                        )}
                      >
                        {pnl >= 0 ? "+" : ""}
                        {formatMoney(
                          p.totalUnrealizedPnL,
                          p.baseCurrency,
                          locale,
                        )}{" "}
                        ({Number(p.totalUnrealizedPnLPct).toFixed(2)}%)
                      </span>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
