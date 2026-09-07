"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, ArchiveRestore, GripVertical, LayoutGrid, Check } from "lucide-react";

import type { Locale } from "@/i18n/config";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AccountWithBalance } from "@/server/services/account.service";
import {
  reorderAccountsAction,
  unarchiveAccountAction,
} from "@/app/actions/accounts";
import { useAction } from "@/hooks/use-action";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountForm } from "@/components/accounts/account-form";
import { useQuickAdd } from "@/components/transactions/quick-add-provider";

export function AccountsView({
  accounts,
  baseCurrency,
  convertedBalances,
}: {
  accounts: AccountWithBalance[];
  baseCurrency: string;
  convertedBalances: Record<string, string>;
}) {
  const ui = useTranslations("ui");
  const locale = useLocale() as Locale;
  const t = useTranslations("accounts");
  const tc = useTranslations("common");
  const router = useRouter();
  const { open: openQuickAdd } = useQuickAdd();
  const [showArchived, setShowArchived] = useState(false);
  const [arranging, setArranging] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [accountOrder, setAccountOrder] = useState(() => accounts.map((account) => account.id));
  const dragRef = useRef<string | null>(null);
  const suppressClickRef = useRef(false);

  const unarchive = useAction(unarchiveAccountAction);
  const reorder = useAction(reorderAccountsAction);

  useEffect(() => {
    setAccountOrder(accounts.map((account) => account.id));
  }, [accounts]);

  const { active, archived } = useMemo(
    () => ({
      active: accounts
        .filter((a) => a.status === "ACTIVE")
        .sort((a, b) => accountOrder.indexOf(a.id) - accountOrder.indexOf(b.id)),
      archived: accounts.filter((a) => a.status === "ARCHIVED"),
    }),
    [accounts, accountOrder],
  );

  const typeLabel = (a: AccountWithBalance) =>
    a.type === "OTHER" && a.customTypeLabel
      ? a.customTypeLabel
      : t(`types.${a.type}`);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={ui("accounts")} action={
        <div className="flex gap-2">
          {active.length > 1 && (
            <Button
              variant={arranging ? "primary" : "secondary"}
              size="sm"
              onClick={() => setArranging((value) => !value)}
            >
              {arranging ? <Check /> : <LayoutGrid />}
              {arranging ? t("doneArranging") : t("arrange")}
            </Button>
          )}
          <AccountForm
            trigger={
              <Button size="sm">
                <Plus className="size-4" />
                {t("add")}
              </Button>
            }
          />
        </div>
      } />

      {active.length === 0 && archived.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyHint")}
          action={
            <AccountForm
              trigger={
                <Button size="sm">
                  <Plus className="size-4" />
                  {t("add")}
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="rounded-[2rem] bg-[radial-gradient(circle_at_15%_20%,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_34%),radial-gradient(circle_at_85%_55%,color-mix(in_srgb,var(--accent)_75%,transparent),transparent_38%)] p-3 sm:p-5">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {active.map((a) => (
            <li key={a.id} data-account-id={a.id}>
              <Card
                onClick={(event) => {
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
                  if (arranging) return;
                  if ((event.target as HTMLElement).closest("a,button")) return;
                  router.push(`/accounts/${a.id}`);
                }}
                onPointerDown={(event) => {
                  if ((event.target as HTMLElement).closest("a,button")) return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  dragRef.current = a.id;
                  setDraggingId(a.id);
                }}
                onPointerUp={(event) => {
                  const sourceId = dragRef.current;
                  const target = document
                    .elementFromPoint(event.clientX, event.clientY)
                    ?.closest<HTMLElement>("[data-account-id]")
                    ?.dataset.accountId;
                  dragRef.current = null;
                  setDraggingId(null);
                  if (!sourceId || !target || sourceId === target) return;
                  suppressClickRef.current = true;
                  if (arranging) {
                    const next = active.map((account) => account.id);
                    const sourceIndex = next.indexOf(sourceId);
                    const targetIndex = next.indexOf(target);
                    next.splice(sourceIndex, 1);
                    next.splice(targetIndex, 0, sourceId);
                    setAccountOrder(next);
                    void reorder.run(
                      { ids: next },
                      { successMessage: t("reorderedToast"), refresh: false },
                    );
                  } else {
                    openQuickAdd({ mode: "TRANSFER", fromAccountId: sourceId, toAccountId: target });
                  }
                }}
                onPointerCancel={() => {
                  dragRef.current = null;
                  setDraggingId(null);
                }}
                className={cn(
                  "interactive-lift relative flex aspect-[0.92] touch-none select-none flex-col overflow-hidden p-4",
                  draggingId === a.id && "z-10 scale-[1.03] rotate-1 opacity-80 ring-2 ring-primary shadow-xl",
                )}
              >
                <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: a.color ?? "#2563eb" }} />
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="flex size-12 shrink-0 items-center justify-center rounded-full text-xl"
                    style={{ backgroundColor: (a.color ?? "#2563EB") + "20" }}
                  >
                    {a.icon || "🏦"}
                  </span>
                  <GripVertical className="size-5 text-muted-foreground/55" aria-label={arranging ? t("dragToReorder") : t("dragToTransfer")} />
                </div>
                <div className="mt-3 min-w-0">
                  <p className="line-clamp-2 font-medium leading-snug">{a.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{typeLabel(a)} · {a.currency}</p>
                </div>
                <div className="mt-auto pt-3">
                <span className="balance-mask block text-xl font-semibold sm:text-2xl">
                  {formatMoney(a.balance, a.currency, locale)}
                </span>
                {a.currency !== baseCurrency && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {t("baseEquivalent", {
                      amount: formatMoney(convertedBalances[a.id] ?? a.balance, baseCurrency, locale),
                    })}
                  </span>
                )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-end justify-between gap-4 px-1">
          <div>
            <p className="text-sm text-muted-foreground">{t("totalBalance")}</p>
            <p className="balance-mask text-3xl font-semibold">
              {formatMoney(
                active.reduce((sum, account) => sum + Number(convertedBalances[account.id] ?? account.balance), 0),
                baseCurrency,
                locale,
              )}
            </p>
          </div>
          <p className="max-w-36 text-right text-xs text-muted-foreground">{arranging ? t("dragToReorder") : t("dragToTransfer")}</p>
        </div>
        </div>
      )}

      {archived.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-expanded={showArchived}
            onClick={() => setShowArchived((v) => !v)}
            className="self-start text-sm text-muted-foreground hover:text-foreground"
          >
            {t("showArchived")} ({archived.length})
          </button>
          {showArchived && (
            <ul className="flex flex-col gap-2">
              {archived.map((a) => (
                <li key={a.id}>
                  <Card className="flex flex-wrap items-center gap-3 p-4 opacity-70">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                      {a.icon || "🏦"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("archived")} · {a.currency}
                      </p>
                    </div>
                    <span className="shrink-0 text-right font-semibold tabular-nums">
                      {formatMoney(a.balance, a.currency, locale)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={tc("unarchive")}
                      disabled={unarchive.pending}
                      onClick={() =>
                        unarchive.run(
                          { id: a.id },
                          { successMessage: t("unarchivedToast") },
                        )
                      }
                    >
                      <ArchiveRestore className="size-4" />
                    </Button>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
