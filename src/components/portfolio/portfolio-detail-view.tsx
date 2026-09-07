"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, Plus, Trash2, Upload } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { formatCurrency, formatDate } from "@/lib/format";
import type { AccountLite } from "@/server/services/account.service";
import type {
  InvTxnRow,
  PortfolioDetail,
} from "@/server/services/portfolio.service";
import {
  deleteInvestmentTxnAction,
  deletePortfolioAction,
  setManualPriceAction,
} from "@/app/actions/portfolios";
import { useAction } from "@/hooks/use-action";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { PortfolioForm } from "@/components/portfolio/portfolio-form";
import { TradeSheet } from "@/components/portfolio/trade-sheet";
import { ImportHoldingsSheet } from "@/components/portfolio/import-holdings-sheet";
import { MarketRefreshButton } from "@/components/market/market-refresh-button";
import { confirm } from "@/components/ui/confirm";

export function PortfolioDetailView({
  detail,
  secondary,
  history,
  accounts,
  finnhubEnabled,
}: {
  detail: PortfolioDetail;
  secondary?: {
    currency: string;
    marketValue: string;
    cost: string;
    unrealizedPnL: string;
    approx: boolean;
  } | null;
  history: InvTxnRow[];
  accounts: AccountLite[];
  finnhubEnabled: boolean;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("portfolio");
  const tc = useTranslations("common");
  const ccy = detail.baseCurrency;

  const [tradeOpen, setTradeOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [tradeType, setTradeType] = useState<"HOLDING" | "BUY" | "SELL">("HOLDING");
  const [activeTab, setActiveTab] = useState<"HOLDINGS" | "HISTORY">("HOLDINGS");
  const [expandedHolding, setExpandedHolding] = useState<string | null>(null);

  const del = useAction(deletePortfolioAction);
  const delTxn = useAction(deleteInvestmentTxnAction);

  const unrealized = Number(detail.totalUnrealizedPnL);
  const realized = Number(detail.totalRealizedPnL);
  const latestPriceAt = detail.holdings
    .map((holding) => holding.priceAsOf)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  function openTrade(type: "HOLDING" | "BUY" | "SELL") {
    setTradeType(type);
    setTradeOpen(true);
  }

  return (
    <section className="flex flex-col gap-5">
      <Link
        href="/portfolio"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {t("title")}
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{detail.name}</h1>
          <p className="text-sm text-muted-foreground">{detail.accountName}</p>
        </div>
        <div className="flex gap-1">
          <PortfolioForm
            accounts={accounts}
            portfolio={detail}
            trigger={
              <Button variant="secondary" size="sm">
                {tc("edit")}
              </Button>
            }
          />
          {history.length === 0 && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={tc("delete")}
              disabled={del.pending}
              onClick={async () => {
                const ok = await confirm({
                  title: t("deletePortfolioConfirm"),
                  tone: "danger",
                  confirmText: tc("delete"),
                });
                if (!ok) return;
                del.run({ id: detail.id });
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </header>

      <Card className="overflow-hidden p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("totalValue")}</p>
            <p className="balance-mask mt-1.5 text-3xl font-bold tracking-tight">
              {formatCurrency(detail.totalMarketValue, ccy, locale)}
            </p>
            {secondary && (
              <p className="balance-mask mt-0.5 text-sm text-muted-foreground">
                ≈ {formatCurrency(secondary.marketValue, secondary.currency, locale)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {latestPriceAt && (
              <p className="text-right text-xs text-muted-foreground">
                {t("updatedAt", {
                  time: new Date(latestPriceAt).toLocaleTimeString(locale === "th" ? "th-TH" : "en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                })}
              </p>
            )}
            <MarketRefreshButton />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className={cn("font-semibold", unrealized > 0 && "text-positive", unrealized < 0 && "text-negative")}>
            {unrealized >= 0 ? "+" : ""}{formatCurrency(detail.totalUnrealizedPnL, ccy, locale)}
            {" "}({Number(detail.totalUnrealizedPnLPct).toFixed(2)}%)
          </span>
          <span className="text-sm text-muted-foreground">
            {t("cost")} {formatCurrency(detail.totalCost, ccy, locale)}
          </span>
        </div>
        {realized !== 0 && (
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">{t("realized")}</span>
            <span className={cn("font-semibold", realized > 0 && "text-positive", realized < 0 && "text-negative")}>
              {realized >= 0 ? "+" : ""}{formatCurrency(detail.totalRealizedPnL, ccy, locale)}
            </span>
          </div>
        )}
      </Card>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => openTrade("BUY")}>
          {t("trade")}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          {t("addAssetShort")}
        </Button>
      </div>

      <div className="grid grid-cols-2 border-b border-border">
        {(["HOLDINGS", "HISTORY"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "border-b-2 px-3 py-3 text-sm font-semibold",
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground",
            )}
          >
            {tab === "HOLDINGS" ? t("holdingsTab") : t("historyTab")}
          </button>
        ))}
      </div>

      {activeTab === "HOLDINGS" ? (
        detail.holdings.length === 0 ? (
          <EmptyState title={t("noHoldings")} action={<Button onClick={() => openTrade("HOLDING")}>{t("addHolding")}</Button>} />
        ) : (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t("holdingsTab")} ({detail.holdings.length})</h2>
            {detail.holdings.map((h) => {
              const pnl = Number(h.unrealizedPnL);
              const expanded = expandedHolding === h.securityId;
              return (
                <Card key={h.securityId} className="overflow-hidden p-0">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 p-3 text-left"
                    aria-expanded={expanded}
                    onClick={() => setExpandedHolding(expanded ? null : h.securityId)}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {h.symbol.slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{h.symbol}</p>
                        <span className="text-xs font-medium text-primary">◔ {Number(h.portfolioPct).toFixed(1)}%</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {Number(h.quantity).toLocaleString(undefined, { maximumFractionDigits: 4 })} {t("shares")}
                        {" · avg "}{formatCurrency(h.avgCost, h.currency, locale)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold">{formatCurrency(h.marketValue, h.currency, locale)}</p>
                      <p className={cn("mt-0.5 text-sm font-semibold", pnl > 0 && "text-positive", pnl < 0 && "text-negative")}>
                        {pnl >= 0 ? "+" : ""}{Number(h.unrealizedPnLPct).toFixed(2)}%
                      </p>
                    </div>
                    <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                  </button>
                  {expanded && (
                    <div className="grid grid-cols-2 gap-x-5 gap-y-4 border-t border-border bg-muted/25 px-4 py-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">{t("remainingShares")}</p>
                        <p className="mt-1 font-medium">{Number(h.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("price")}</p>
                        <div className="mt-1 flex items-center font-medium">
                          {h.currentPrice ? formatCurrency(h.currentPrice, h.currency, locale) : "—"}
                          <SetPriceDialog securityId={h.securityId} symbol={h.symbol} />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("costPerShare")}</p>
                        <p className="mt-1 font-medium">{formatCurrency(h.avgCost, h.currency, locale)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("cost")}</p>
                        <p className="mt-1 font-medium">{formatCurrency(h.costBasis, h.currency, locale)}</p>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )
      ) : history.length === 0 ? (
        <EmptyState title={t("noHistory")} />
      ) : (
          <ul className="flex flex-col gap-3">
            {history.map((x) => (
              <li
                key={x.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <Badge variant={x.type === "BUY" ? "positive" : "negative"}>
                  {x.type === "BUY" ? t("buy") : t("sell")}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{x.symbol}</p>
                  <p className="text-xs text-muted-foreground">
                    {Number(x.quantity).toLocaleString(undefined, {
                      maximumFractionDigits: 4,
                    })}{" "}
                    @ {formatCurrency(x.price, x.currency, locale)} ·{" "}
                    {formatDate(x.tradeDate, locale)}
                  </p>
                </div>
                <span className="text-sm tabular-nums">
                  {formatCurrency(x.amount, x.currency, locale)}
                </span>
                <button
                  type="button"
                  aria-label={tc("delete")}
                  className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-negative"
                  onClick={async () => {
                    const ok = await confirm({
                      title: t("deleteTradeConfirm"),
                      tone: "danger",
                      confirmText: tc("delete"),
                    });
                    if (!ok) return;
                    delTxn.run(
                      { id: x.id },
                      { successMessage: t("deleted") },
                    );
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
      )}

      <TradeSheet
        portfolioId={detail.id}
        open={tradeOpen}
        onOpenChange={setTradeOpen}
        accounts={accounts}
        finnhubEnabled={finnhubEnabled}
        defaultType={tradeType}
      />
      <ImportHoldingsSheet portfolioId={detail.id} open={importOpen} onOpenChange={setImportOpen} />

      <Drawer open={addOpen} onOpenChange={setAddOpen}>
        <DrawerContent className="mx-auto max-w-lg">
          <div className="mb-4 flex items-center justify-between">
            <DrawerTitle className="text-lg font-semibold">{t("addHolding")}</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" aria-label={tc("close")}>
                <ChevronDown />
              </Button>
            </DrawerClose>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setAddOpen(false);
                openTrade("HOLDING");
              }}
              className="flex items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Plus className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{t("addOne")}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{t("addOneHint")}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={() => {
                setAddOpen(false);
                setImportOpen(true);
              }}
              className="flex items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Upload className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{t("importCtaShort")}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{t("importHint")}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </div>
        </DrawerContent>
      </Drawer>

    </section>
  );
}

function SetPriceDialog({
  securityId,
  symbol,
  cta,
}: {
  securityId: string;
  symbol: string;
  cta?: string;
}) {
  const t = useTranslations("portfolio");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const set = useAction(setManualPriceAction);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`${t("manualPrice")} · ${symbol}`}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-xs text-primary underline-offset-2 hover:bg-accent hover:underline"
        >
          {cta ?? "✎"}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("manualPrice")} · {symbol}
          </DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            await set.run(
              { securityId, price, asOf: new Date(asOf) },
              { successMessage: tc("save"), onSuccess: () => setOpen(false) },
            );
          }}
        >
          <Field label={t("price")}>
            <Input
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              autoFocus
              required
            />
          </Field>
          <Field label={t("tradeDate")}>
            <Input
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={set.pending || !price}>
              {set.pending ? tc("saving") : tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
