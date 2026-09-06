"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";

import { cn } from "@/lib/utils";
import { setLocale } from "@/app/actions/preferences";
import { locales, type Locale } from "@/i18n/config";

const LABELS: Record<Locale, string> = { th: "ไทย", en: "EN" };

export function LanguageSwitcher({ className }: { className?: string }) {
  const active = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-background p-1",
        className,
      )}
    >
      {locales.map((loc) => (
        <button
          key={loc}
          type="button"
          aria-pressed={loc === active}
          disabled={pending || loc === active}
          onClick={() => startTransition(() => setLocale(loc))}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-default",
            loc === active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
