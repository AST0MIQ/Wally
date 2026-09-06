"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

import type { AccountLite } from "@/server/services/account.service";
import type { SecuritySearchResult } from "@/server/services/security.service";
import {
  createInvestmentTxnAction,
  searchSecuritiesAction,
} from "@/app/actions/portfolios";
import { useAction } from "@/hooks/use-action";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function TradeSheet({
  portfolioId,
  open,
  onOpenChange,
  accounts,
  finnhubEnabled,
  defaultType = "BUY",
}: {
  portfolioId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  accounts: AccountLite[];
  finnhubEnabled: boolean;
  defaultType?: "BUY" | "SELL";
}) {
  const t = useTranslations("portfolio");
  const tc = useTranslations("common");

  const [type, setType] = useState<"BUY" | "SELL">(defaultType);
  const [symbol, setSymbol] = useState("");
  const [securityName, setSecurityName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SecuritySearchResult[]>([]);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [fee, setFee] = useState("");
  const [tradeDate, setTradeDate] = useState(todayISO());
  const [settlementAccountId, setSettlementAccountId] = useState("");
  const [note, setNote] = useState("");
  const idemRef = useRef(crypto.randomUUID());

  const create = useAction(createInvestmentTxnAction);

  useEffect(() => {
    if (!open) return;
    setType(defaultType);
    setSymbol("");
    setSecurityName("");
    setQuery("");
    setResults([]);
    setQuantity("");
    setPrice("");
    setFee("");
    setTradeDate(todayISO());
    setSettlementAccountId("");
    setNote("");
    idemRef.current = crypto.randomUUID();
  }, [open, defaultType]);

  // debounced security search
  useEffect(() => {
    if (!finnhubEnabled || query.trim().length < 1) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setResults(await searchSecuritiesAction({ query }));
    }, 300);
    return () => clearTimeout(handle);
  }, [query, finnhubEnabled]);

  const canSave =
    symbol.trim().length > 0 &&
    Number(quantity) > 0 &&
    Number(price) > 0;

  async function save() {
    if (!canSave) return;
    await create.run(
      {
        portfolioId,
        type,
        symbol: symbol.trim().toUpperCase(),
        securityName: securityName || undefined,
        quantity,
        price,
        fee: fee || "0",
        tradeDate: new Date(tradeDate),
        settlementAccountId: settlementAccountId || undefined,
        note: note || undefined,
        idempotencyKey: idemRef.current,
      },
      { successMessage: tc("save"), onSuccess: () => onOpenChange(false) },
    );
  }

  const estimate = Number(quantity) * Number(price);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg">
        <DrawerTitle className="mb-4 text-lg font-semibold">
          {t("addTrade")}
        </DrawerTitle>

        <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {(["BUY", "SELL"] as const).map((tt) => (
            <button
              key={tt}
              type="button"
              onClick={() => setType(tt)}
              className={cn(
                "rounded-md py-2 text-sm font-medium",
                type === tt ? "bg-card shadow-sm" : "text-muted-foreground",
              )}
            >
              {tt === "BUY" ? t("buy") : t("sell")}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {finnhubEnabled ? (
            <Field label={t("searchSecurity")}>
              <Input
                value={query || symbol}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSymbol(e.target.value);
                }}
                placeholder="AAPL"
              />
              {results.length > 0 && (
                <ul className="mt-1 max-h-40 overflow-y-auto rounded-md border border-border">
                  {results.map((r) => (
                    <li key={r.symbol}>
                      <button
                        type="button"
                        onClick={() => {
                          setSymbol(r.symbol);
                          setSecurityName(r.description);
                          setQuery(r.symbol);
                          setResults([]);
                        }}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <span className="font-medium">{r.displaySymbol}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {r.description}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Field>
          ) : (
            <Field label={t("manualSymbol")} hint={t("searchDisabled")}>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="AAPL"
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("quantity")}>
              <Input
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
            <Field label={t("price")}>
              <Input
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
          </div>

          {estimate > 0 && (
            <p className="text-sm text-muted-foreground">
              ≈ {estimate.toLocaleString()}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("fee")}>
              <Input
                inputMode="decimal"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </Field>
            <Field label={t("tradeDate")}>
              <Input
                type="date"
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
              />
            </Field>
          </div>

          <Field label={t("settlementAccount")} hint={t("settlementHint")}>
            <Select
              value={settlementAccountId}
              onChange={(e) => setSettlementAccountId(e.target.value)}
            >
              <option value="">{t("settlementNone")}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </Select>
          </Field>

          <Field label={tc("none")}>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={tc("optional")}
            />
          </Field>

          <Button
            size="lg"
            className="mt-1 w-full"
            disabled={!canSave || create.pending}
            onClick={save}
          >
            {create.pending ? tc("saving") : tc("save")}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
