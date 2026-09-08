"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import {
  createAccountAction,
  updateAccountAction,
} from "@/app/actions/accounts";
import { useAction } from "@/hooks/use-action";
import { COMMON_CURRENCIES } from "@/lib/currency";
import { ACCOUNT_TYPES } from "@/lib/validation/account";
import type { AccountWithBalance } from "@/server/services/account.service";

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
import { DateInput } from "@/components/ui/date-input";
import { Select } from "@/components/ui/select";
import { ColorPicker, IconPicker } from "@/components/ui/icon-color-picker";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Digits + a single dot; drop leading zeros so "0" + "12" reads "12", not "012". */
function sanitizeAmount(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
  return cleaned.replace(/^0+(?=\d)/, "");
}

export function AccountForm({
  account,
  trigger,
}: {
  account?: AccountWithBalance;
  trigger: ReactNode;
}) {
  const isEdit = Boolean(account);
  const t = useTranslations("accounts");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);

  const create = useAction(createAccountAction);
  const update = useAction(updateAccountAction);
  const busy = create.pending || update.pending;
  const fieldErrors = isEdit ? update.fieldErrors : create.fieldErrors;

  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState(account?.type ?? "BANK");
  const [customTypeLabel, setCustomTypeLabel] = useState(
    account?.customTypeLabel ?? "",
  );
  const [currency, setCurrency] = useState(account?.currency ?? "THB");
  const [openingBalance, setOpeningBalance] = useState(
    account?.openingBalance && account.openingBalance !== "0"
      ? account.openingBalance
      : "",
  );
  const [openingBalanceDate, setOpeningBalanceDate] = useState(
    account?.openingBalanceDate?.slice(0, 10) ?? todayISO(),
  );
  const [icon, setIcon] = useState(account?.icon ?? "");
  const [color, setColor] = useState(account?.color ?? "");

  const currencyOptions = COMMON_CURRENCIES.map((c) => c.code);
  if (!currencyOptions.includes(currency)) currencyOptions.unshift(currency);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      type: type as (typeof ACCOUNT_TYPES)[number],
      customTypeLabel: customTypeLabel || undefined,
      openingBalance: openingBalance || "0",
      openingBalanceDate: new Date(openingBalanceDate),
      currency,
      icon: icon || undefined,
      color: color || undefined,
    };

    const result = isEdit
      ? await update.run(
          { id: account!.id, ...payload },
          { successMessage: t("updated"), onSuccess: () => setOpen(false) },
        )
      : await create.run(payload, {
          successMessage: t("created"),
          onSuccess: () => setOpen(false),
        });

    if (!result.ok && !isEdit) {
      // keep dialog open to show errors
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("add")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field
            label={t("name")}
            error={fieldErrors.name?.[0]}
            htmlFor="acc-name"
          >
            <Input
              id="acc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              required
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("type")} htmlFor="acc-type">
              <Select
                id="acc-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {ACCOUNT_TYPES.map((tt) => (
                  <option key={tt} value={tt}>
                    {t(`types.${tt}`)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={t("currency")} htmlFor="acc-cur">
              <Select
                id="acc-cur"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {currencyOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {type === "OTHER" && (
            <Field label={t("customType")} htmlFor="acc-custom">
              <Input
                id="acc-custom"
                value={customTypeLabel}
                onChange={(e) => setCustomTypeLabel(e.target.value)}
              />
            </Field>
          )}

          <Field
            label={t("openingBalance")}
            error={fieldErrors.openingBalance?.[0]}
            htmlFor="acc-ob"
          >
            <Input
              id="acc-ob"
              inputMode="decimal"
              placeholder="0"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(sanitizeAmount(e.target.value))}
            />
          </Field>
          <Field label={t("openingBalanceDate")} htmlFor="acc-obd">
            <DateInput
              id="acc-obd"
              value={openingBalanceDate}
              onChange={(e) => setOpeningBalanceDate(e.target.value)}
            />
          </Field>

          <Field label={`${t("icon")} (${tc("optional")})`}>
            <IconPicker value={icon} onChange={setIcon} />
          </Field>

          <Field label={`${t("color")} (${tc("optional")})`}>
            <ColorPicker value={color} onChange={setColor} />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy
                ? tc("saving")
                : isEdit
                  ? tc("update")
                  : tc("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
