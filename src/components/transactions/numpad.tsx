"use client";

import { useTranslations } from "next-intl";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyAmountKey } from "@/lib/amount-input";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];

export const applyKey = applyAmountKey;

export function Numpad({
  onKey,
  className,
}: {
  onKey: (key: string) => void;
  className?: string;
}) {
  const t = useTranslations("common");
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {KEYS.map((k) => (
        <button
          key={k}
          aria-label={k === "back" ? t("delete") : k}
          type="button"
          onClick={() => onKey(k)}
          className="flex h-14 items-center justify-center rounded-lg bg-muted text-xl font-medium text-foreground transition-colors active:bg-accent"
        >
          {k === "back" ? <Delete className="size-5" /> : k}
        </button>
      ))}
    </div>
  );
}
