"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { setLocale } from "@/app/actions/preferences";
import { locales, type Locale } from "@/i18n/config";

const LABELS: Record<Locale, string> = { th: "ไทย", en: "English" };

/**
 * Language picker — radio cards (same visual family as the accent picker):
 * full-card click target, a check badge on the active choice.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const active = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {locales.map((loc) => {
        const selected = loc === active;
        return (
          <button
            key={loc}
            type="button"
            aria-pressed={selected}
            disabled={pending || selected}
            onClick={() => startTransition(() => setLocale(loc))}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors disabled:cursor-default",
              selected
                ? "border-primary bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border",
              )}
            >
              {selected && <Check className="size-3.5" />}
            </span>
            {LABELS[loc]}
          </button>
        );
      })}
    </div>
  );
}
