"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { formatDate } from "@/lib/format";

type DateInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
> & {
  /** ISO `yyyy-mm-dd`, or "" when unset */
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** shown when `value` is empty */
  placeholder?: string;
};

/**
 * Date field that keeps the app's own (Gregorian) formatting on screen and the
 * same height as a text `Input`. A transparent native `<input type="date">`
 * sits on top so tapping still opens the platform picker — this avoids iOS
 * rendering its taller system control with the device calendar (e.g. "BE 2569").
 */
export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, placeholder, className, id, ...props }, ref) => {
    const locale = useLocale() as Locale;
    return (
      <div
        className={cn(
          "relative flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-sm",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring",
          className,
        )}
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {value ? formatDate(value, locale) : (placeholder ?? "—")}
        </span>
        <Calendar className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          ref={ref}
          id={id}
          type="date"
          value={value}
          onChange={onChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          {...props}
        />
      </div>
    );
  },
);
DateInput.displayName = "DateInput";
