"use client";

import Link from "next/link";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

import type { Locale } from "@/i18n/config";
import { formatCurrency } from "@/lib/format";
import { categoryLabel } from "@/lib/category-i18n";
import { parseFxSlip, type ParsedFxSlip } from "@/lib/fx-slip";
import type { AccountLite } from "@/server/services/account.service";
import type { CategoryNode } from "@/server/services/category.service";
import { createTransactionAction } from "@/app/actions/transactions";
import { createTransferAction } from "@/app/actions/transfers";
import { useAction } from "@/hooks/use-action";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Numpad, applyKey } from "@/components/transactions/numpad";

export type QuickAddMode = "EXPENSE" | "INCOME" | "TRANSFER";

const LS_ACCOUNT = "wally:lastAccount";
const LS_CATEGORY = "wally:lastCategory";

function readLS(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLS(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function QuickAddSheet({
  open,
  onOpenChange,
  accounts,
  categories,
  defaultKind = "EXPENSE",
  defaultFromAccountId,
  defaultToAccountId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: AccountLite[];
  categories: CategoryNode[];
  defaultKind?: QuickAddMode;
  defaultFromAccountId?: string;
  defaultToAccountId?: string;
}) {
  const t = useTranslations("quickAdd");
  const ui = useTranslations("ui");
  const tt = useTranslations("transactions");
  const ta = useTranslations("accounts");
  const tc = useTranslations("common");
  const tCat = useTranslations("categories");
  const locale = useLocale() as Locale;

  const [mode, setMode] = useState<QuickAddMode>(defaultKind);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [rate, setRate] = useState("");
  const [fee, setFee] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [slipPreview, setSlipPreview] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrState, setOcrState] = useState<"IDLE" | "READING" | "READY" | "ERROR">("IDLE");
  const idemRef = useRef<string>(crypto.randomUUID());
  /** which of the two linked fields the user last drove: "received" amount or "rate" */
  const fxDriverRef = useRef<"received" | "rate">("received");

  const createTxn = useAction(createTransactionAction);
  const createTransfer = useAction(createTransferAction);
  const busy = createTxn.pending || createTransfer.pending;

  // initialise defaults when opened
  useEffect(() => {
    if (!open) return;
    setMode(defaultKind);
    setAmount("");
    setToAmount("");
    setRate("");
    fxDriverRef.current = "received";
    setFee("");
    setNote("");
    setShowMore(false);
    setDate(todayISO());
    setSlipPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setOcrProgress(0);
    setOcrState("IDLE");
    idemRef.current = crypto.randomUUID();

    const lastAcc = readLS(LS_ACCOUNT);
    const initialAcc =
      lastAcc && accounts.some((a) => a.id === lastAcc)
        ? lastAcc
        : (accounts[0]?.id ?? "");
    setAccountId(initialAcc);
    const initialFrom = accounts.some((a) => a.id === defaultFromAccountId)
      ? defaultFromAccountId!
      : initialAcc;
    setFromAccountId(initialFrom);
    setToAccountId(
      accounts.some((a) => a.id === defaultToAccountId && a.id !== initialFrom)
        ? defaultToAccountId!
        : (accounts.find((a) => a.id !== initialFrom)?.id ?? ""),
    );
  }, [open, defaultKind, defaultFromAccountId, defaultToAccountId, accounts]);

  // category default per kind
  useEffect(() => {
    if (!open || mode === "TRANSFER") return;
    const last = readLS(`${LS_CATEGORY}:${mode}`);
    const pool = categories.filter((c) => c.kind === mode);
    const initial =
      last && pool.some((c) => c.id === last) ? last : (pool[0]?.id ?? "");
    setCategoryId(initial);
    setSubcategoryId("");
  }, [open, mode, categories]);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);
  const currency = (mode === "TRANSFER" ? fromAccount?.currency : selectedAccount?.currency) ?? "THB";
  const crossCurrency =
    mode === "TRANSFER" &&
    !!fromAccount &&
    !!toAccount &&
    fromAccount.currency !== toAccount.currency;

  const fmtNumber = (value: number, digits: number) =>
    Number.isFinite(value) && value > 0 ? String(Number(value.toFixed(digits))) : "";

  // The "amount received" and "exchange rate" fields describe the same fact, so
  // editing either keeps the other in sync. `toAmount` is what actually gets saved.
  function editToAmount(next: string) {
    fxDriverRef.current = "received";
    setToAmount(next);
    const from = Number(amount) || 0;
    setRate(from > 0 && Number(next) > 0 ? fmtNumber(Number(next) / from, 6) : "");
  }
  function editRate(next: string) {
    fxDriverRef.current = "rate";
    setRate(next);
    const from = Number(amount) || 0;
    setToAmount(from > 0 && Number(next) > 0 ? fmtNumber(from * Number(next), 2) : "");
  }

  // When the sent amount changes, refresh whichever linked field the user isn't driving.
  useEffect(() => {
    if (!crossCurrency) return;
    const from = Number(amount) || 0;
    if (fxDriverRef.current === "rate" && Number(rate) > 0) {
      setToAmount(from > 0 ? fmtNumber(from * Number(rate), 2) : "");
    } else if (Number(toAmount) > 0) {
      setRate(from > 0 ? fmtNumber(Number(toAmount) / from, 6) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, crossCurrency]);

  async function readFxSlip(file: File) {
    setSlipPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setOcrState("READING");
    setOcrProgress(0);
    let worker: Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>> | undefined;
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
      const parsed = parseFxSlip(result.data.text);
      const applied = applyFxSlip(parsed);
      setOcrState(applied ? "READY" : "ERROR");
    } catch {
      setOcrState("ERROR");
    } finally {
      await worker?.terminate();
    }
  }

  function applyFxSlip(parsed: ParsedFxSlip): boolean {
    const from = parsed.fromCurrency
      ? accounts.find((a) => a.currency === parsed.fromCurrency)
      : undefined;
    const to = parsed.toCurrency
      ? accounts.find((a) => a.currency === parsed.toCurrency && a.id !== from?.id)
      : undefined;
    if (from) setFromAccountId(from.id);
    if (to) setToAccountId(to.id);

    if (parsed.fromAmount) setAmount(parsed.fromAmount);
    if (parsed.toAmount) {
      fxDriverRef.current = "received";
      setToAmount(parsed.toAmount);
    }
    if (parsed.fromAmount && parsed.toAmount) {
      setRate(fmtNumber(Number(parsed.toAmount) / Number(parsed.fromAmount), 6));
    } else if (parsed.rate) {
      setRate(parsed.rate);
    }
    if (parsed.date) setDate(parsed.date);
    if (parsed.orderNo) {
      setNote((current) => current || `FX ${parsed.orderNo}`);
      setShowMore(true);
    }
    return Boolean(parsed.fromAmount || parsed.toAmount);
  }

  const kindCategories = useMemo(
    () => categories.filter((c) => c.kind === mode),
    [categories, mode],
  );
  const selectedCategory = kindCategories.find((c) => c.id === categoryId);

  const amountValue = Number(amount) || 0;
  const canSave =
    mode === "TRANSFER"
      ? amountValue > 0 &&
        !!fromAccountId &&
        !!toAccountId &&
        fromAccountId !== toAccountId &&
        (!crossCurrency || Number(toAmount) > 0)
      : amountValue > 0 && !!accountId;

  async function handleSave() {
    if (!canSave) return;

    if (mode === "TRANSFER") {
      const res = await createTransfer.run(
        {
          fromAccountId,
          toAccountId,
          fromAmount: amount,
          toAmount: crossCurrency ? toAmount : undefined,
          fee: fee || "0",
          date: new Date(date),
          note: note || undefined,
          idempotencyKey: idemRef.current,
        },
        { successMessage: t("savedTransfer"), onSuccess: () => onOpenChange(false) },
      );
      if (res.ok) writeLS(LS_ACCOUNT, fromAccountId);
      return;
    }

    const res = await createTxn.run(
      {
        kind: mode,
        amount,
        accountId,
        categoryId: categoryId || undefined,
        subcategoryId: subcategoryId || undefined,
        date: new Date(date),
        note: note || undefined,
        idempotencyKey: idemRef.current,
      },
      { successMessage: t("saved"), onSuccess: () => onOpenChange(false) },
    );
    if (res.ok) {
      writeLS(LS_ACCOUNT, accountId);
      if (categoryId) writeLS(`${LS_CATEGORY}:${mode}`, categoryId);
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg" footer={
        <Button
          size="lg"
          className="w-full"
          disabled={!canSave || busy}
          onClick={handleSave}
        >
          {busy ? tc("saving") : tc("save")}
        </Button>
      }>
        <div className="mb-5 flex items-center justify-between"><DrawerTitle className="text-xl font-semibold">{t("title")}</DrawerTitle><DrawerClose asChild><Button variant="ghost" size="icon" aria-label={tc("close")}><X /></Button></DrawerClose></div>
        {accounts.length === 0 && <p className="mb-4 rounded-lg bg-accent p-4 text-sm">{ui("accountFirst")} <Link href="/accounts" onClick={() => onOpenChange(false)} className="font-medium text-primary underline">{ta("add")}</Link></p>}
        {mode === "TRANSFER" && accounts.length === 1 && <p role="status" className="mb-4 text-sm text-muted-foreground">{ui("transferAccounts")}</p>}

        {/* mode switch */}
        <div className="mb-4 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          {(["EXPENSE", "INCOME", "TRANSFER"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md py-2 text-sm font-medium transition-colors",
                mode === m
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {t(`mode.${m}`)}
            </button>
          ))}
        </div>

        {/* amount */}
        <div className="mb-4 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {currency}
          </p>
          <span id="quick-amount-label" className="sr-only">{tt("amount")}</span>
          <output
            id="quick-amount"
            aria-labelledby="quick-amount-label"
            aria-live="polite"
            className={cn(
              "block min-h-14 w-full rounded-lg bg-transparent py-2 text-center text-4xl font-semibold tracking-tight tabular-nums",
              mode === "EXPENSE" && "text-negative",
              mode === "INCOME" && "text-positive",
            )}
          >
            {amount || "0"}
          </output>
          {amountValue > 0 && (
            <p className="text-sm text-muted-foreground">
              {formatCurrency(amountValue, currency, locale)}
            </p>
          )}
        </div>

        <Numpad
          className="mb-4"
          onKey={(k) => setAmount((cur) => applyKey(cur, k))}
        />

        {mode === "TRANSFER" ? (
          <div className="flex flex-col gap-3">
            {accounts.length >= 2 && (
              <label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
                {ocrState === "READING" ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
                <span className="flex-1">
                  {ocrState === "READING" ? t("readingSlip", { progress: ocrProgress }) : t("uploadSlip")}
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
                  capture="environment"
                  className="sr-only"
                  disabled={ocrState === "READING"}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void readFxSlip(file);
                    event.target.value = "";
                  }}
                />
              </label>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("from")}>
                <Select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("to")}>
                <Select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                >
                  {accounts
                    .filter((a) => a.id !== fromAccountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.currency})
                      </option>
                    ))}
                </Select>
              </Field>
            </div>
            {crossCurrency && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("toAmount", { currency: toAccount?.currency ?? "" })}>
                    <Input
                      inputMode="decimal"
                      value={toAmount}
                      onChange={(e) => editToAmount(e.target.value)}
                    />
                  </Field>
                  <Field label={t("rate")}>
                    <Input
                      inputMode="decimal"
                      value={rate}
                      onChange={(e) => editRate(e.target.value)}
                    />
                  </Field>
                </div>
                {Number(rate) > 0 && (
                  <p className="-mt-1 text-xs text-muted-foreground">
                    1 {fromAccount?.currency} = {rate} {toAccount?.currency}
                    {" · "}
                    1 {toAccount?.currency} = {fmtNumber(1 / Number(rate), 6)} {fromAccount?.currency}
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            {/* category grid */}
            <div className="mb-3 grid grid-cols-4 gap-2">
              {kindCategories.map((c) => (
                <button
                  key={c.id}
                  aria-pressed={categoryId === c.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(c.id);
                    setSubcategoryId("");
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs",
                    categoryId === c.id
                      ? "border-primary bg-accent"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <span className="text-lg">{c.icon || "🏷️"}</span>
                  <span className="line-clamp-2 leading-snug">{categoryLabel(tCat, c)}</span>
                </button>
              ))}
            </div>

            {selectedCategory && selectedCategory.subcategories.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {selectedCategory.subcategories.map((s) => (
                  <button
                    key={s.id}
                    aria-pressed={subcategoryId === s.id}
                    type="button"
                    onClick={() =>
                      setSubcategoryId((cur) => (cur === s.id ? "" : s.id))
                    }
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs",
                      subcategoryId === s.id
                        ? "border-primary bg-accent"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    {categoryLabel(tCat, s)}
                  </button>
                ))}
              </div>
            )}

            {/* account chips */}
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {accounts.map((a) => (
                <button
                  key={a.id}
                  aria-pressed={accountId === a.id}
                  type="button"
                  onClick={() => setAccountId(a.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm",
                    accountId === a.id
                      ? "border-primary bg-accent"
                      : "border-border hover:bg-muted",
                  )}
                >
                  <span>{a.icon || "🏦"}</span>
                  {a.name}
                </button>
              ))}
            </div>
          </>
        )}

        {/* more */}
        <button
          type="button"
          aria-expanded={showMore}
          onClick={() => setShowMore((v) => !v)}
          className="mb-2 self-start text-sm text-muted-foreground hover:text-foreground"
        >
          {showMore ? tc("close") : t("more")}
        </button>
        {showMore && (
          <div className="mb-3 flex flex-col gap-3">
            <Field label={t("date")}>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            {mode === "TRANSFER" && (
              <Field label={t("fee")}>
                <Input
                  inputMode="decimal"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                />
              </Field>
            )}
            <Field label={t("note")}>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
          </div>
        )}


      </DrawerContent>
    </Drawer>
  );
}
