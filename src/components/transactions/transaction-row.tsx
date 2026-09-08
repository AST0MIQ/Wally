"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { formatMoney } from "@/lib/format";
import { categoryLabel } from "@/lib/category-i18n";
import type { FeedItem } from "@/server/services/transaction.service";
import type { CosmeticCardTheme } from "@/components/cosmetics/use-cosmetic-card-theme";
import { CosmeticCardFx } from "@/components/cosmetics/cosmetic-card-fx";

export function TransactionRow({
  item,
  onClick,
  cosmeticTheme,
}: {
  item: FeedItem;
  onClick: () => void;
  cosmeticTheme: CosmeticCardTheme;
}) {
  const locale = useLocale() as Locale;
  const tCat = useTranslations("categories");
  const tt = useTranslations("transactions");
  const theme = cosmeticTheme;

  if (item.type === "TRANSFER") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn("group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-4 text-left transition-all duration-200 active:scale-[0.995]", theme.active ? theme.className : "hover:bg-muted/70")}
        style={theme.style}
      >
        <CosmeticCardFx slot="TRANSACTION_CARD" />
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
      className={cn("group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-4 text-left transition-all duration-200 active:scale-[0.995]", theme.active ? theme.className : "hover:bg-muted/70")}
      style={theme.style}
    >
      <CosmeticCardFx slot="TRANSACTION_CARD" />
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
