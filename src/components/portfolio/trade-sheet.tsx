"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ImageIcon, Loader2, Upload } from "lucide-react";
import { parseInvestmentSlip } from "@/lib/investment-slip";

import type { AccountLite } from "@/server/services/account.service";
import type { SecuritySearchResult } from "@/server/services/security.service";
import {
  createInvestmentTxnAction,
  searchSecuritiesAction,
} from "@/app/actions/portfolios";
import { useAction } from "@/hooks/use-action";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
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
  defaultType = "HOLDING",
}: {
  portfolioId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  accounts: AccountLite[];
  finnhubEnabled: boolean;
  defaultType?: "HOLDING" | "BUY" | "SELL";
}) {
  const t = useTranslations("portfolio");
  const tc = useTranslations("common");

  const [type, setType] = useState<"HOLDING" | "BUY" | "SELL">(defaultType);
  const [symbol, setSymbol] = useState("");
  const [securityName, setSecurityName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SecuritySearchResult[]>([]);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [slipAmount, setSlipAmount] = useState("");
  const [fee, setFee] = useState("");
  const autoPriceRef = useRef(false);
  const [tradeDate, setTradeDate] = useState(todayISO());
  const [settlementAccountId, setSettlementAccountId] = useState("");
  const [note, setNote] = useState("");
  const [slipPreview, setSlipPreview] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrState, setOcrState] = useState<"IDLE" | "READING" | "READY" | "ERROR">("IDLE");
  const idemRef = useRef(crypto.randomUUID());
  const slipPreviewRef = useRef("");

  const create = useAction(createInvestmentTxnAction);
  const isHolding = type === "HOLDING";

  useEffect(() => {
    if (!open) return;
    setType(defaultType);
    setSymbol("");
    setSecurityName("");
    setQuery("");
    setResults([]);
    setQuantity("");
    setPrice("");
    setSlipAmount("");
    autoPriceRef.current = false;
    setFee("");
    setTradeDate(todayISO());
    setSettlementAccountId("");
    setNote("");
    if (slipPreviewRef.current) URL.revokeObjectURL(slipPreviewRef.current);
    slipPreviewRef.current = "";
    setSlipPreview("");
    setOcrProgress(0);
    setOcrState("IDLE");
    idemRef.current = crypto.randomUUID();
  }, [open, defaultType]);

  async function readSlip(file: File) {
    if (slipPreviewRef.current) URL.revokeObjectURL(slipPreviewRef.current);
    const previewUrl = URL.createObjectURL(file);
    slipPreviewRef.current = previewUrl;
    setSlipPreview(previewUrl);
    setOcrState("READING");
    setOcrProgress(0);
    let worker: Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>> | undefined;
    try {
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker(["tha", "eng"], undefined, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            setOcrProgress(Math.round(message.progress * 100));
          }
        },
      });
      const result = await worker.recognize(file);

      const parsed = parseInvestmentSlip(result.data.text);
      if (parsed.type) setType(parsed.type);
      if (parsed.symbol) {
        setSymbol(parsed.symbol);
        setQuery(parsed.symbol);
      }
      if (parsed.quantity) setQuantity(parsed.quantity);
      if (parsed.price) {
        setPrice(parsed.price);
        autoPriceRef.current = false;
      }
      // Pending market-order slips carry only a gross trade value. Keep it so
      // that price per share can be derived once the user types the quantity.
      if (parsed.amount && !parsed.price) {
        setSlipAmount(parsed.amount);
        if (parsed.quantity && Number(parsed.quantity) > 0) {
          setPrice(String(Number(parsed.amount) / Number(parsed.quantity)));
          autoPriceRef.current = true;
        }
      }
      if (parsed.fee) setFee(parsed.fee);
      if (parsed.tradeDate) setTradeDate(parsed.tradeDate);
      setOcrState(
        parsed.symbol || parsed.quantity || parsed.price || parsed.amount ? "READY" : "ERROR",
      );
    } catch {
      setOcrState("ERROR");
    } finally {
      await worker?.terminate();
    }
  }

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

  // Derive price per share from a pending-slip gross value once a quantity is
  // known. Only touch the price while it is still auto-managed (untouched by
  // the user or previously auto-filled).
  useEffect(() => {
    if (!slipAmount || Number(slipAmount) <= 0) return;
    if (!(autoPriceRef.current || price === "")) return;
    if (Number(quantity) > 0) {
      setPrice(String(Number(slipAmount) / Number(quantity)));
      autoPriceRef.current = true;
    }
  }, [slipAmount, quantity, price]);

  const canSave =
    symbol.trim().length > 0 &&
    Number(quantity) > 0 &&
    Number(price) > 0;

  async function save() {
    if (!canSave) return;
    await create.run(
      {
        portfolioId,
        type: type === "HOLDING" ? "BUY" : type,
        symbol: symbol.trim().toUpperCase(),
        securityName: securityName || undefined,
        quantity,
        price,
        fee: isHolding ? "0" : (fee || "0"),
        tradeDate: isHolding ? new Date() : new Date(tradeDate),
        settlementAccountId: isHolding ? undefined : (settlementAccountId || undefined),
        note: isHolding ? undefined : (note || undefined),
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
          {isHolding ? t("addHolding") : t("addTrade")}
        </DrawerTitle>

        {!isHolding && <label className="mb-4 flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
          {ocrState === "READING" ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
          <span className="flex-1">
            {ocrState === "READING"
              ? t("readingSlip", { progress: ocrProgress })
              : isHolding ? t("uploadHolding") : t("uploadSlip")}
            {ocrState === "READY" && <small className="mt-1 block font-normal text-muted-foreground">{t("slipReady")}</small>}
            {ocrState === "ERROR" && <small className="mt-1 block font-normal text-negative">{t("slipFailed")}</small>}
          </span>
          {slipPreview ? (
            <img src={slipPreview} alt="" className="size-11 rounded-lg object-cover" />
          ) : (
            <ImageIcon className="size-5 text-muted-foreground" />
          )}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={ocrState === "READING"}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void readSlip(file);
              event.target.value = "";
            }}
          />
        </label>}

        {!isHolding && <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
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
        </div>}

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
            <Field label={isHolding ? t("remainingShares") : t("quantity")}>
              <Input
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
            <Field
              label={isHolding ? t("costPerShare") : t("price")}
              hint={slipAmount ? t("priceFromAmount", { amount: slipAmount }) : undefined}
            >
              <Input
                inputMode="decimal"
                value={price}
                onChange={(e) => {
                  autoPriceRef.current = false;
                  setPrice(e.target.value);
                }}
              />
            </Field>
          </div>

          {estimate > 0 && (
            <p className="text-sm text-muted-foreground">
              ≈ {estimate.toLocaleString()}
            </p>
          )}

          {!isHolding && <div className="grid grid-cols-2 gap-3">
            <Field label={t("fee")}>
              <Input
                inputMode="decimal"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </Field>
            <Field label={t("tradeDate")}>
              <DateInput
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
              />
            </Field>
          </div>}

          {!isHolding && <Field label={t("settlementAccount")} hint={t("settlementHint")}>
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
          </Field>}

          {!isHolding && <Field label={tc("none")}>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={tc("optional")}
            />
          </Field>}

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
