import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { requireUser } from "@/server/lib/guards";
import { getAccount } from "@/server/services/account.service";
import { AppError } from "@/server/lib/errors";
import { formatCurrency, formatDate, formatMoney } from "@/lib/format";
import type { Locale } from "@/i18n/config";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AccountForm } from "@/components/accounts/account-form";

export const metadata: Metadata = { title: "Account" };

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("accounts");
  const tc = await getTranslations("common");
  const tt = await getTranslations("transactions");

  let account;
  try {
    account = await getAccount(user.id, id);
  } catch (err) {
    if (err instanceof AppError && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  const typeLabel =
    account.type === "OTHER" && account.customTypeLabel
      ? account.customTypeLabel
      : t(`types.${account.type}`);

  return (
    <section className="flex flex-col gap-6">
      <Link
        href="/accounts"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {t("title")}
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex size-12 items-center justify-center rounded-full text-2xl"
            style={{ backgroundColor: (account.color ?? "#64748B") + "22" }}
          >
            {account.icon || "🏦"}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {account.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {typeLabel} · {account.currency}
            </p>
          </div>
        </div>
        <AccountForm
          account={account}
          trigger={<Button variant="secondary" size="sm">{tc("edit")}</Button>}
        />
      </header>

      <Card className="overflow-hidden border-primary/15 bg-[linear-gradient(145deg,var(--card),var(--accent))]">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">
              {t("balance")}
            </span>
            <span className="balance-mask text-3xl font-semibold">
              {formatMoney(account.balance, account.currency, locale)}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-sm text-muted-foreground">
            <span>{t("openingBalance")}</span>
            <span className="tabular-nums">
              {formatCurrency(
                account.openingBalance,
                account.currency,
                locale,
              )}{" "}
              · {formatDate(account.openingBalanceDate, locale)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Link
        href={`/transactions?accountId=${account.id}`}
        className={buttonVariants({ variant: "secondary" })}
      >
        {tt("viewForAccount")}
      </Link>
    </section>
  );
}
