"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { COMMON_CURRENCIES } from "@/lib/currency";
import type { AccountLite } from "@/server/services/account.service";
import type { PortfolioSummary } from "@/server/services/portfolio.service";
import {
  createPortfolioAction,
  updatePortfolioAction,
} from "@/app/actions/portfolios";
import { useAction } from "@/hooks/use-action";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function PortfolioForm({
  accounts,
  portfolio,
  trigger,
}: {
  accounts: AccountLite[];
  portfolio?: PortfolioSummary;
  trigger: ReactNode;
}) {
  const isEdit = Boolean(portfolio);
  const t = useTranslations("portfolio");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(portfolio?.name ?? "Investment Portfolio");
  const [accountId, setAccountId] = useState(
    portfolio?.accountId ?? accounts[0]?.id ?? "",
  );
  const [baseCurrency, setBaseCurrency] = useState(
    portfolio?.baseCurrency ?? "USD",
  );

  const create = useAction(createPortfolioAction);
  const update = useAction(updatePortfolioAction);
  const busy = create.pending || update.pending;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (isEdit) {
      await update.run(
        { id: portfolio!.id, name, baseCurrency },
        { successMessage: t("updated"), onSuccess: () => setOpen(false) },
      );
    } else {
      await create.run(
        { name, accountId, baseCurrency },
        { successMessage: t("created"), onSuccess: () => setOpen(false) },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("add")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label={t("name")}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </Field>
          {!isEdit && (
            <Field label={t("account")}>
              <Select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label={t("baseCurrency")}>
            <Select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
            >
              {COMMON_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </Select>
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={busy || !accountId}>
              {busy ? tc("saving") : isEdit ? tc("update") : tc("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
