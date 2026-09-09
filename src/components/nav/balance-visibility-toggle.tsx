"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { BALANCES_COOKIE } from "@/i18n/config";
import { setBalancesHidden } from "@/app/actions/preferences";

function readHidden(): boolean {
  if (typeof document === "undefined") return false;
  return /(?:^|;\s*)wally-balances=hidden/.test(document.cookie);
}

function apply(hidden: boolean) {
  const el = document.documentElement;
  if (hidden) el.setAttribute("data-balances", "hidden");
  else el.removeAttribute("data-balances");
}

/**
 * One global switch that masks every monetary amount in the app (anything with
 * the `.balance-mask` class — net worth, cash, investments, every portfolio and
 * account figure). State lives in the `wally-balances` cookie so it survives
 * reloads with no flash of visible balances.
 */
export function BalanceVisibilityToggle({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const [hidden, setHidden] = useState(false);
  const [, startTransition] = useTransition();

  // Sync from the SSR-applied attribute / cookie once mounted.
  useEffect(() => {
    setHidden(readHidden());
  }, []);

  function toggle() {
    const next = !hidden;
    setHidden(next);
    apply(next);
    // optimistic cookie so a reload before the action resolves is consistent
    document.cookie = `${BALANCES_COOKIE}=${next ? "hidden" : "shown"};path=/;max-age=31536000;samesite=lax`;
    startTransition(() => setBalancesHidden(next));
  }

  const label = hidden ? t("showAmounts") : t("hideAmounts");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={hidden}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-muted hover:text-foreground md:size-9",
        className,
      )}
    >
      {hidden ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
    </button>
  );
}
