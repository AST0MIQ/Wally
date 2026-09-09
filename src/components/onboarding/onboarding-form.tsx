"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Wallet } from "lucide-react";

import { setBaseCurrency } from "@/app/actions/preferences";
import { completeOnboarding } from "@/app/actions/onboarding";
import { COMMON_CURRENCIES } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LanguageSwitcher } from "@/components/nav/language-switcher";

export function OnboardingForm({ defaultCurrency }: { defaultCurrency: string }) {
  const t = useTranslations("onboarding.setup");
  const router = useRouter();
  const [currency, setCurrency] = useState(defaultCurrency);
  const [pending, startTransition] = useTransition();

  function finish(withCurrency: boolean) {
    startTransition(async () => {
      if (withCurrency) await setBaseCurrency(currency);
      await completeOnboarding();
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-white">
          <Wallet className="size-7" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">{t("language")}</label>
          <LanguageSwitcher />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="onboarding-currency" className="text-sm font-medium">
            {t("currency")}
          </label>
          <Select
            id="onboarding-currency"
            value={currency}
            disabled={pending}
            onChange={(event) => setCurrency(event.target.value)}
          >
            {COMMON_CURRENCIES.map(({ code }) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">{t("currencyHint")}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button size="lg" disabled={pending} onClick={() => finish(true)}>
          {t("start")}
        </Button>
        <button
          type="button"
          disabled={pending}
          onClick={() => finish(false)}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          {t("skip")}
        </button>
      </div>
    </>
  );
}
