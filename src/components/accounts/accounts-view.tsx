"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";

import type { Locale } from "@/i18n/config";
import { formatMoney } from "@/lib/format";
import type { AccountWithBalance } from "@/server/services/account.service";
import {
  archiveAccountAction,
  deleteAccountAction,
  unarchiveAccountAction,
} from "@/app/actions/accounts";
import { useAction } from "@/hooks/use-action";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountForm } from "@/components/accounts/account-form";

export function AccountsView({ accounts }: { accounts: AccountWithBalance[] }) {
  const ui = useTranslations("ui");
  const locale = useLocale() as Locale;
  const t = useTranslations("accounts");
  const tc = useTranslations("common");
  const [showArchived, setShowArchived] = useState(false);

  const archive = useAction(archiveAccountAction);
  const unarchive = useAction(unarchiveAccountAction);
  const remove = useAction(deleteAccountAction);

  const { active, archived } = useMemo(
    () => ({
      active: accounts.filter((a) => a.status === "ACTIVE"),
      archived: accounts.filter((a) => a.status === "ARCHIVED"),
    }),
    [accounts],
  );

  const typeLabel = (a: AccountWithBalance) =>
    a.type === "OTHER" && a.customTypeLabel
      ? a.customTypeLabel
      : t(`types.${a.type}`);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={ui("accounts")} action={<AccountForm
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              {t("add")}
            </Button>
          }
        />} />

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
        <ul className="grid gap-4 lg:grid-cols-2">
          {active.map((a) => (
            <li key={a.id}>
              <Card className="interactive-lift relative grid grid-cols-[52px_minmax(0,1fr)] items-center gap-3 overflow-hidden p-5">
                <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: a.color ?? "#2563eb" }} />
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-xl"
                  style={{ backgroundColor: (a.color ?? "#2563EB") + "18" }}
                >
                  {a.icon || "🏦"}
                </span>
                <Link
                  href={`/accounts/${a.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate text-base font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {typeLabel(a)} · {a.currency}
                  </p>
                </Link>
                <Link href={`/accounts/${a.id}`} className="col-span-2 mt-4 block rounded-xl focus-visible:outline-none">
                <span className="balance-mask block text-3xl font-semibold">
                  {formatMoney(a.balance, a.currency, locale)}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{t("balance")}</span>
                </Link>
                <div className="col-span-2 mt-1 flex items-center justify-end gap-1 border-t border-border/70 pt-2">
                  <AccountForm
                    account={a}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={tc("edit")}>
                        <Pencil className="size-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={tc("archive")}
                    disabled={archive.pending}
                    onClick={() =>
                      archive.run(
                        { id: a.id },
                        { successMessage: t("archivedToast") },
                      )
                    }
                  >
                    <Archive className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={tc("delete")}
                    disabled={remove.pending}
                    onClick={() => {
                      if (!window.confirm(t("deleteConfirm"))) return;
                      remove.run(
                        { id: a.id },
                        { successMessage: t("deletedToast") },
                      );
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
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
