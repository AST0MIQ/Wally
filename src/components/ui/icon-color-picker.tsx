"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ICON_SUGGESTIONS, SWATCHES } from "@/lib/palette";
import { Input } from "@/components/ui/input";

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTranslations("accounts");
  return (
    <div className="flex flex-col gap-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 8))}
        placeholder="🙂"
        className="w-16 text-center text-lg"
        aria-label={t("icon")}
      />
      <div className="flex flex-wrap gap-1">
        {ICON_SUGGESTIONS.map((icon) => (
          <button
            key={icon}
            aria-pressed={value === icon}
            type="button"
            onClick={() => onChange(icon)}
            className={cn(
              "flex size-11 items-center justify-center rounded-md border text-base",
              value === icon
                ? "border-primary bg-accent"
                : "border-border hover:bg-muted",
            )}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SWATCHES.map((color) => (
        <button
          key={color}
          aria-pressed={value === color}
          type="button"
          onClick={() => onChange(color)}
          aria-label={color}
          className={cn(
            "size-11 rounded-full ring-offset-2 ring-offset-background",
            value === color && "ring-2 ring-ring",
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
