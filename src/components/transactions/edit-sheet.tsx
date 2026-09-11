"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { formatMoney } from "@/lib/format";
import { categoryLabel } from "@/lib/category-i18n";
import { exceedsAvailable } from "@/lib/amount-input";
import type { AccountLite } from "@/server/services/account.service";
import type { CategoryNode } from "@/server/services/category.service";
import type { FeedItem } from "@/server/services/transaction.service";
import {
  deleteTransactionAction,
  updateTransactionAction,
} from "@/app/actions/transactions";
import {
  deleteTransferAction,
  updateTransferAction,
} from "@/app/actions/transfers";
import { useAction } from "@/hooks/use-action";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Field } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { confirm } from "@/components/ui/confirm";

export function EditSheet({
  item,
  open,
  onOpenChange,
  accounts,
  categories,
}: {
  item: FeedItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  accounts: AccountLite[];
  categories: CategoryNode[];
}) {
  if (!item) return null;
  return item.type === "TRANSFER" ? (
    <TransferEdit
      item={item}
      open={open}
      onOpenChange={onOpenChange}
      accounts={accounts}
    />
  ) : (
    <TxnEdit
      item={item}
      open={open}
      onOpenChange={onOpenChange}
      accounts={accounts}
      categories={categories}
    />
  );
}

function TxnEdit({
  item,
  open,
  onOpenChange,
  accounts,
  categories,
}: {
  item: Extract<FeedItem, { type: "INCOME" | "EXPENSE" }>;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  accounts: AccountLite[];
  categories: CategoryNode[];
}) {
  const t = useTranslations("transactions");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const tCat = useTranslations("categories");

  const [kind, setKind] = useState<"INCOME" | "EXPENSE">(item.type);
  const [amount, setAmount] = useState(item.amount);
  const [accountId, setAccountId] = useState(item.accountId);
  const [categoryId, setCategoryId] = useState(item.categoryId ?? "");
  const [subcategoryId, setSubcategoryId] = useState(item.subcategoryId ?? "");
  const [date, setDate] = useState(item.date.slice(0, 10));
  const [description, setDescription] = useState(item.description ?? "");
  const [note, setNote] = useState(item.note ?? "");

  useEffect(() => {
    setKind(item.type);
    setAmount(item.amount);
    setAccountId(item.accountId);
    setCategoryId(item.categoryId ?? "");
    setSubcategoryId(item.subcategoryId ?? "");
    setDate(item.date.slice(0, 10));
    setDescription(item.description ?? "");
    setNote(item.note ?? "");
  }, [item]);

  const update = useAction(updateTransactionAction);
  const del = useAction(deleteTransactionAction);

  const pool = categories.filter((c) => c.kind === kind);
  const selectedCat = pool.find((c) => c.id === categoryId);

  // An expense can't push its account below zero (its own prior amount is
  // added back since it will be replaced).
  const editAccount = accounts.find((a) => a.id === accountId);
  const editAvailable =
    Number(editAccount?.balance ?? 0) +
    (item.type === "EXPENSE" && accountId === item.accountId
      ? Number(item.amount)
      : 0);
  const overBalance =
    kind === "EXPENSE" &&
    Number(amount) > 0 &&
    exceedsAvailable(Number(amount), editAvailable);

  async function save() {
    await update.run(
      {
        id: item.id,
        kind,
        amount,
        accountId,
        categoryId: categoryId || null,
        subcategoryId: subcategoryId || null,
        date: new Date(date),
        description: description || null,
        note: note || null,
      },
      { successMessage: t("updated"), onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg">
        <DrawerTitle className="mb-4 text-lg font-semibold">
          {t("editTitle")}
        </DrawerTitle>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["EXPENSE", "INCOME"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKind(k);
                  setCategoryId("");
                  setSubcategoryId("");
                }}
                className={cn(
                  "rounded-md py-1.5 text-sm font-medium",
                  kind === k
                    ? "bg-card shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {k === "EXPENSE" ? t("expense") : t("income")}
              </button>
            ))}
          </div>

          <Field label={t("amount")}>
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={overBalance}
            />
            {overBalance && (
              <p className="mt-1 text-xs font-medium text-negative">
                {t("insufficientBalance", {
                  balance: formatMoney(editAvailable, editAccount?.currency ?? "THB", locale),
                })}
              </p>
            )}
          </Field>

          <Field label={t("account")}>
            <Select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("category")}>
              <Select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId("");
                }}
              >
                <option value="">{t("allCategories")}</option>
                {pool.map((c) => (
                  <option key={c.id} value={c.id}>
                    {categoryLabel(tCat, c)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={tc("none")}>
              <Select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                disabled={!selectedCat || selectedCat.subcategories.length === 0}
              >
                <option value="">—</option>
                {selectedCat?.subcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {categoryLabel(tCat, s)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label={t("dateFrom")}>
            <DateInput
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>

          <Field label={t("description")}>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label={t("note")}>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>

          <div className="mt-2 flex gap-2">
            <Button
              variant="destructive"
              aria-label={tc("delete")}
              size="icon"
              disabled={del.pending}
              onClick={async () => {
                const ok = await confirm({
                  title: t("deleteConfirm"),
                  tone: "danger",
                  confirmText: tc("delete"),
                });
                if (!ok) return;
                del.run(
                  { id: item.id },
                  {
                    successMessage: t("deleted"),
                    onSuccess: () => onOpenChange(false),
                  },
                );
              }}
            >
              <Trash2 className="size-4" />
            </Button>
            <Button
              className="flex-1"
              disabled={update.pending || overBalance}
              onClick={save}
            >
              {update.pending ? tc("saving") : tc("update")}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function TransferEdit({
  item,
  open,
  onOpenChange,
  accounts,
}: {
  item: Extract<FeedItem, { type: "TRANSFER" }>;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  accounts: AccountLite[];
}) {
  const t = useTranslations("transactions");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;

  const [fromAccountId, setFromAccountId] = useState(item.fromAccountId);
  const [toAccountId, setToAccountId] = useState(item.toAccountId);
  const [fromAmount, setFromAmount] = useState(item.fromAmount);
  const [toAmount, setToAmount] = useState(item.toAmount);
  const [fee, setFee] = useState(item.fee);
  const [date, setDate] = useState(item.date.slice(0, 10));
  const [note, setNote] = useState(item.note ?? "");

  useEffect(() => {
    setFromAccountId(item.fromAccountId);
    setToAccountId(item.toAccountId);
    setFromAmount(item.fromAmount);
    setToAmount(item.toAmount);
    setFee(item.fee);
    setDate(item.date.slice(0, 10));
    setNote(item.note ?? "");
  }, [item]);

  const update = useAction(updateTransferAction);
  const del = useAction(deleteTransferAction);

  // The sending account must stay >= 0 (this transfer's own outflow is added
  // back since it will be replaced).
  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const fromAvailable =
    Number(fromAccount?.balance ?? 0) +
    (fromAccountId === item.fromAccountId
      ? Number(item.fromAmount) + Number(item.fee)
      : 0);
  const overBalance =
    Number(fromAmount) > 0 &&
    exceedsAvailable(Number(fromAmount) + (Number(fee) || 0), fromAvailable);

  async function save() {
    await update.run(
      {
        id: item.id,
        fromAccountId,
        toAccountId,
        fromAmount,
        toAmount,
        fee: fee || "0",
        date: new Date(date),
        note: note || null,
      },
      { successMessage: t("updated"), onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg">
        <DrawerTitle className="mb-4 text-lg font-semibold">
          {t("editTransferTitle")}
        </DrawerTitle>

        <div className="flex flex-col gap-3">
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

          <div className="grid grid-cols-2 gap-3">
            <Field label={`${t("from")} ${t("amount")}`}>
              <Input
                inputMode="decimal"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                aria-invalid={overBalance}
              />
            </Field>
            <Field label={`${t("to")} ${t("amount")}`}>
              <Input
                inputMode="decimal"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
              />
            </Field>
          </div>
          {overBalance && (
            <p className="-mt-1 text-xs font-medium text-negative">
              {t("insufficientBalance", {
                balance: formatMoney(fromAvailable, fromAccount?.currency ?? "THB", locale),
              })}
            </p>
          )}

          <Field label={t("fee")}>
            <Input
              inputMode="decimal"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
            />
          </Field>
          <Field label={t("dateFrom")}>
            <DateInput
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label={t("note")}>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>

          <div className="mt-2 flex gap-2">
            <Button
              variant="destructive"
              aria-label={tc("delete")}
              size="icon"
              disabled={del.pending}
              onClick={async () => {
                const ok = await confirm({
                  title: t("deleteTransferConfirm"),
                  tone: "danger",
                  confirmText: tc("delete"),
                });
                if (!ok) return;
                del.run(
                  { id: item.id },
                  {
                    successMessage: t("deleted"),
                    onSuccess: () => onOpenChange(false),
                  },
                );
              }}
            >
              <Trash2 className="size-4" />
            </Button>
            <Button
              className="flex-1"
              disabled={update.pending || overBalance}
              onClick={save}
            >
              {update.pending ? tc("saving") : tc("update")}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
