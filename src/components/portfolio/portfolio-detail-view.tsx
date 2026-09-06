"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { formatCurrency, formatDate, formatMoney } from "@/lib/format";
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
import { PortfolioForm } from "@/components/portfolio/portfolio-form";
import { TradeSheet } from "@/components/portfolio/trade-sheet";

export function PortfolioDetailView({
  detail,
  history,
  accounts,
  finnhubEnabled,
}: {
  detail: PortfolioDetail;
  history: InvTxnRow[];
  accounts: AccountLite[];
  finnhubEnabled: boolean;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("portfolio");
  const tc = useTranslations("common");
  const ccy = detail.baseCurrency;

  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");

  const del = useAction(deletePortfolioAction);
  const delTxn = useAction(deleteInvestmentTxnAction);

  const unrealized = Number(detail.totalUnrealizedPnL);
  const realized = Number(detail.totalRealizedPnL);

  function openTrade(type: "BUY" | "SELL") {
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
              onClick={() => {
                if (!window.confirm(t("deletePortfolioConfirm"))) return;
                del.run({ id: detail.id });
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </header>

      {/* summary */}
      <Card className="grid grid-cols-1 gap-6 border-primary/20 bg-accent p-6 sm:grid-cols-2">
        <Stat label={t("totalValue")}>
          {formatMoney(detail.totalMarketValue, ccy, locale)}
        </Stat>
        <Stat label={t("cost")}>
          {formatMoney(detail.totalCost, ccy, locale)}
        </Stat>
        <Stat
          label={t("unrealized")}
          className={cn(
            unrealized > 0 && "text-positive",
            unrealized < 0 && "text-negative",
          )}
        >
          {unrealized >= 0 ? "+" : ""}
          {formatMoney(detail.totalUnrealizedPnL, ccy, locale)} (
          {Number(detail.totalUnrealizedPnLPct).toFixed(2)}%)
        </Stat>
        <Stat
          label={t("realized")}
          className={cn(
            realized > 0 && "text-positive",
            realized < 0 && "text-negative",
          )}
        >
          {realized >= 0 ? "+" : ""}
          {formatMoney(detail.totalRealizedPnL, ccy, locale)}
        </Stat>
      </Card>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => openTrade("BUY")}>
          <Plus className="size-4" />
          {t("buy")}
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => openTrade("SELL")}
        >
          {t("sell")}
        </Button>
      </div>

      {/* holdings */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("holdings")}
        </h2>
        {detail.holdings.length === 0 ? (
          <EmptyState title={t("noHoldings")} action={<Button onClick={() => openTrade("BUY")}>{t("addTrade")}</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="holdings-table w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">{t("symbol")}</th>
                  <th className="py-2 px-2 text-right font-medium">
                    {t("qty")}
                  </th>
                  <th className="py-2 px-2 text-right font-medium">
                    {t("avgCost")}
                  </th>
                  <th className="py-2 px-2 text-right font-medium">
                    {t("price")}
                  </th>
                  <th className="py-2 px-2 text-right font-medium">
                    {t("marketValue")}
                  </th>
                  <th className="py-2 pl-2 text-right font-medium">P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {detail.holdings.map((h) => {
                  const pnl = Number(h.unrealizedPnL);
                  return (
                    <tr key={h.securityId} className="border-t border-border">
                      <td data-label={t("symbol")} className="py-2 pr-2">
                        <p className="font-medium">{h.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {Number(h.portfolioPct).toFixed(1)}%
                        </p>
                      </td>
                      <td data-label={t("qty")} className="py-2 px-2 text-right tabular-nums">
                        {Number(h.quantity).toLocaleString(undefined, {
                          maximumFractionDigits: 4,
                        })}
                      </td>
                      <td data-label={t("avgCost")} className="py-2 px-2 text-right tabular-nums">
                        {formatCurrency(h.avgCost, h.currency, locale)}
                      </td>
                      <td data-label={t("price")} className="py-2 px-2 text-right tabular-nums">
                        {h.currentPrice ? (
                          <span className="inline-flex items-center gap-1">
                            {formatCurrency(h.currentPrice, h.currency, locale)}
                            <SetPriceDialog
                              securityId={h.securityId}
                              symbol={h.symbol}
                            />
                          </span>
                        ) : (
                          <SetPriceDialog
                            securityId={h.securityId}
                            symbol={h.symbol}
                            cta={t("setPrice")}
                          />
                        )}
                      </td>
                      <td data-label={t("marketValue")} className="py-2 px-2 text-right tabular-nums">
                        {formatCurrency(h.marketValue, h.currency, locale)}
                      </td>
                      <td
                        data-label={t("unrealized")}
                        className={cn(
                          "py-2 pl-2 text-right tabular-nums",
                          pnl > 0 && "text-positive",
                          pnl < 0 && "text-negative",
                        )}
                      >
                        {pnl >= 0 ? "+" : ""}
                        {formatCurrency(h.unrealizedPnL, h.currency, locale)}
                        <span className="block text-xs">
                          {Number(h.unrealizedPnLPct).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* history */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("history")}
        </h2>
        {history.length === 0 ? (
          <EmptyState title={t("noHistory")} />
        ) : (
          <ul className="flex flex-col gap-1">
            {history.map((x) => (
              <li
                key={x.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted"
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
                  onClick={() => {
                    if (!window.confirm(t("deleteTradeConfirm"))) return;
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
      </div>

      <TradeSheet
        portfolioId={detail.id}
        open={tradeOpen}
        onOpenChange={setTradeOpen}
        accounts={accounts}
        finnhubEnabled={finnhubEnabled}
        defaultType={tradeType}
      />
    </section>
  );
}

function Stat({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-2xl font-semibold tracking-tight tabular-nums", className)}>
        {children}
      </span>
    </div>
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
