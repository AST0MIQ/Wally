"use client";

import { ChevronRight, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/label";
import { AddTransactionButton } from "@/components/transactions/add-transaction-button";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import type { Locale } from "@/i18n/config";
import { formatDate } from "@/lib/format";
import { categoryLabel } from "@/lib/category-i18n";
import type { AccountLite } from "@/server/services/account.service";
import type { CategoryNode } from "@/server/services/category.service";
import type { FeedItem, FeedPage } from "@/server/services/transaction.service";
import { loadTransactionsAction } from "@/app/actions/transactions-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { useCosmeticCardTheme } from "@/components/cosmetics/use-cosmetic-card-theme";
import { EditSheet } from "@/components/transactions/edit-sheet";

export type FeedFilters = {
  type: "ALL" | "INCOME" | "EXPENSE" | "TRANSFER";
  accountId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

export function TransactionsView({
  initialPage,
  filters,
  accounts,
  categories,
}: {
  initialPage: FeedPage;
  filters: FeedFilters;
  accounts: AccountLite[];
  categories: CategoryNode[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const locale = useLocale() as Locale;
  const t = useTranslations("transactions");
  const tc = useTranslations("common");
  const ui = useTranslations("ui");
  const transactionTheme = useCosmeticCardTheme("TRANSACTION_CARD");
  const [loadError, setLoadError] = useState(false);
  const hasFilters = !!(filters.search || filters.accountId || filters.categoryId || filters.dateFrom || filters.dateTo || filters.type !== "ALL");
  const tCat = useTranslations("categories");

  const [items, setItems] = useState<FeedItem[]>(initialPage.items);
  const [cursor, setCursor] = useState<string | null>(initialPage.nextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editing, setEditing] = useState<FeedItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    setLoadError(false);
    setItems(initialPage.items);
    setCursor(initialPage.nextCursor);
  }, [initialPage]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("cursor");
    if (key === "type") next.delete("categoryId");
    router.push(`${pathname}${next.size ? `?${next}` : ""}`);
  }

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    setLoadError(false);
    try {
      const page = await loadTransactionsAction({ ...filters, cursor });
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      setLoadError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  const groups = useMemo(() => groupByDate(items), [items]);

  const showCategoryFilter =
    filters.type === "INCOME" || filters.type === "EXPENSE";
  const categoryPool = categories.filter((c) =>
    filters.type === "INCOME"
      ? c.kind === "INCOME"
      : filters.type === "EXPENSE"
        ? c.kind === "EXPENSE"
        : true,
  );

  return (
    <section className="flex flex-col gap-5">
      <PageHeader title={t("title")} description={ui("transactions")} />

      {/* filters */}
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
        <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); setParam("search", String(data.get("search") ?? "")); }}>
        <Field label={tc("search")} className="min-w-0 flex-1">
        <Input
          key={filters.search ?? ""}
          name="search"
          defaultValue={filters.search ?? ""}
          placeholder={t("searchPlaceholder")}
        />
        </Field>
        <Button type="submit" variant="secondary" aria-label={tc("search")}><Search /></Button>
        </form>
        <details open={hasFilters || undefined} className="group">
          <summary className="flex list-none items-center gap-1.5 text-sm font-medium text-muted-foreground [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-4 shrink-0 transition-transform duration-200 group-open:rotate-90" />
            {tc("filter")}
          </summary>
        <div className="grid mt-4 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t("type")}>
            <Select
            value={filters.type}
            onChange={(e) => setParam("type", e.target.value)}
          >
            <option value="ALL">{t("allTypes")}</option>
            <option value="INCOME">{t("income")}</option>
            <option value="EXPENSE">{t("expense")}</option>
            <option value="TRANSFER">{t("transfer")}</option>
          </Select></Field>

          <Field label={t("account")}>
            <Select
            value={filters.accountId ?? ""}
            onChange={(e) => setParam("accountId", e.target.value)}
          >
            <option value="">{t("allAccounts")}</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select></Field>

          {showCategoryFilter && (
            <Field label={t("category")}>
            <Select
              value={filters.categoryId ?? ""}
              onChange={(e) => setParam("categoryId", e.target.value)}
            >
              <option value="">{t("allCategories")}</option>
              {categoryPool.map((c) => (
                <option key={c.id} value={c.id}>
                  {categoryLabel(tCat, c)}
                </option>
              ))}
            </Select></Field>
          )}

          <Field label={t("dateFrom")}>          <DateInput
            value={filters.dateFrom ?? ""}
            onChange={(e) => setParam("dateFrom", e.target.value)}
            aria-label={t("dateFrom")}
          /></Field>
          <Field label={t("dateTo")}>          <DateInput
            value={filters.dateTo ?? ""}
            onChange={(e) => setParam("dateTo", e.target.value)}
            aria-label={t("dateTo")}
          /></Field>
        </div>
        </details>
        {hasFilters && <Button variant="ghost" className="self-start" onClick={() => router.push(pathname)}>{tc("clear")}</Button>}
      </div>

      {items.length === 0 ? (
        <EmptyState title={hasFilters ? ui("filteredEmpty") : t("empty")} description={hasFilters ? ui("filteredHint") : t("emptyHint")} action={hasFilters ? <Button variant="secondary" onClick={() => router.push(pathname)}>{tc("clear")}</Button> : <AddTransactionButton />} />
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((g) => (
            <div key={g.date} className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3 sm:p-5">
              <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {formatDate(g.date, locale, { dateStyle: "full" })}
              </p>
              {g.items.map((item) => (
                <TransactionRow
                  key={`${item.type}-${item.id}`}
                  item={item}
                  cosmeticTheme={transactionTheme}
                  onClick={() => {
                    setEditing(item);
                    setEditOpen(true);
                  }}
                />
              ))}
            </div>
          ))}

          {loadError && <p role="alert" className="text-center text-sm text-negative">{ui("loadError")}</p>}
          {cursor && (
            <Button
              variant="secondary"
              onClick={loadMore}
              disabled={loadingMore}
              className="self-center"
            >
              {loadingMore ? tc("loading") : tc("loadMore")}
            </Button>
          )}
        </div>
      )}

      <EditSheet
        item={editing}
        open={editOpen}
        onOpenChange={setEditOpen}
        accounts={accounts}
        categories={categories}
      />
    </section>
  );
}

function groupByDate(items: FeedItem[]): { date: string; items: FeedItem[] }[] {
  const map = new Map<string, FeedItem[]>();
  for (const item of items) {
    const key = item.date.slice(0, 10);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return Array.from(map, ([date, list]) => ({ date, items: list }));
}
