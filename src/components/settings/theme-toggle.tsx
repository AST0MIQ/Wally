"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { THEME_COOKIE, type ThemeChoice } from "@/i18n/config";
import { setTheme } from "@/app/actions/preferences";

const OPTIONS: { value: ThemeChoice; icon: typeof Sun }[] = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
];

function readCookie(): ThemeChoice {
  if (typeof document === "undefined") return "system";
  const m = document.cookie.match(/(?:^|;\s*)wally-theme=(light|dark|system)/);
  return (m?.[1] as ThemeChoice) ?? "system";
}

function apply(choice: ThemeChoice) {
  const el = document.documentElement;
  if (choice === "system") el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", choice);
}

export function ThemeToggle() {
  const t = useTranslations("settings");
  const [choice, setChoice] = useState<ThemeChoice>("system");
  const [, startTransition] = useTransition();

  useEffect(() => {
    setChoice(readCookie());
  }, []);

  function select(next: ThemeChoice) {
    setChoice(next);
    apply(next);
    // optimistic cookie so a reload before the action resolves is consistent
    document.cookie = `${THEME_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    startTransition(() => setTheme(next));
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background p-1">
      {OPTIONS.map(({ value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={choice === value}
          onClick={() => select(value)}
          className={cn(
            "flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors",
            choice === value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" />
          {t(
            value === "light"
              ? "themeLight"
              : value === "dark"
                ? "themeDark"
                : "themeSystem",
          )}
        </button>
      ))}
    </div>
  );
}
