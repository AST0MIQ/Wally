"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { formatMoney } from "@/lib/format";
import { categoryLabel } from "@/lib/category-i18n";
import type { FeedItem } from "@/server/services/transaction.service";

export function TransactionRow({
  item,
  onClick,
}: {
  item: FeedItem;
  onClick: () => void;
}) {
  const locale = useLocale() as Locale;
  const tCat = useTranslations("categories");
  const tt = useTranslations("transactions");

  if (item.type === "TRANSFER") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full items-center gap-3 rounded-xl px-3 py-4 text-left transition-all duration-200 hover:bg-muted/70 active:scale-[0.995]"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted">
          <ArrowLeftRight className="size-4 text-muted-foreground" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {tt("transfer")}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {item.fromAccountName} → {item.toAccountName}
          </span>
        </span>
        <span className="shrink-0 text-right text-sm tabular-nums text-muted-foreground">
          {formatMoney(item.fromAmount, item.fromCurrency, locale)}
        </span>
      </button>
    );
  }

  const isIncome = item.type === "INCOME";
  const catName = item.categoryName
    ? categoryLabel(tCat, {
        systemKey: item.categorySystemKey,
        name: item.categoryName,
      })
    : tt("allCategories");
  const subName = item.subcategoryName
    ? categoryLabel(tCat, {
        systemKey: item.subcategorySystemKey,
        name: item.subcategoryName,
      })
    : null;
  const secondary = [catName === tt("allCategories") ? null : catName, subName]
    .filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-4 text-left transition-all duration-200 hover:bg-muted/70 active:scale-[0.995]"
    >
      <span
        className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl text-base", isIncome ? "bg-emerald-500/10 text-positive" : "bg-negative/10 text-negative")}
        style={item.categoryColor ? { backgroundColor: `${item.categoryColor}18` } : undefined}
      >
        {item.categoryIcon || item.accountIcon || (isIncome ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {item.description || catName}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {item.accountName}
          {secondary ? ` · ${secondary}` : ""}
        </span>
      </span>
      <span
        className={cn(
          "shrink-0 text-right text-sm font-semibold tabular-nums",
          isIncome ? "text-positive" : "text-negative",
        )}
      >
        {isIncome ? "+" : "−"}
        {formatMoney(item.amount, item.currency, locale)}
      </span>
    </button>
  );
}
