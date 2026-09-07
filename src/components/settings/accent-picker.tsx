"use client";

import { useEffect, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { setAccent } from "@/app/actions/preferences";
import { ACCENT_COOKIE, accentChoices, type AccentChoice } from "@/i18n/config";
import { cn } from "@/lib/utils";

const COLORS: Record<AccentChoice, string> = {
  red: "#ef4444",
  orange: "#f97316",
  amber: "#ca8a04",
  lime: "#84cc16",
  emerald: "#10b981",
  teal: "#14b8a6",
  blue: "#3b82f6",
  violet: "#8b5cf6",
  rose: "#d946ef",
};

const LABEL_KEY = {
  red: "accentRed",
  orange: "accentOrange",
  amber: "accentAmber",
  lime: "accentLime",
  emerald: "accentEmerald",
  teal: "accentTeal",
  blue: "accentBlue",
  violet: "accentViolet",
  rose: "accentRose",
} as const satisfies Record<AccentChoice, string>;

export function AccentPicker() {
  const t = useTranslations("settings");
  const [choice, setChoice] = useState<AccentChoice>("blue");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const value = document.documentElement.dataset.accent as AccentChoice | undefined;
    if (value && accentChoices.includes(value)) setChoice(value);
  }, []);

  function select(next: AccentChoice) {
    setChoice(next);
    document.documentElement.dataset.accent = next;
    document.cookie = `${ACCENT_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    startTransition(() => setAccent(next));
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {accentChoices.map((color) => (
        <button
          key={color}
          type="button"
          aria-pressed={choice === color}
          onClick={() => select(color)}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border px-2 py-2 text-xs font-medium",
            choice === color ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground",
          )}
        >
          <span className="flex size-5 items-center justify-center rounded-full text-white" style={{ backgroundColor: COLORS[color] }}>
            {choice === color && <Check className="size-3.5" />}
          </span>
          {t(LABEL_KEY[color])}
        </button>
      ))}
    </div>
  );
}
