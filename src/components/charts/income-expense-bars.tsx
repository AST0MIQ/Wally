"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type Row = { label: string; income: number; expense: number };

export function IncomeExpenseBars({
  data,
  formatValue,
  maskValues = false,
}: {
  data: Row[];
  formatValue: (n: number) => string;
  /** Blur amounts (tooltip + hover title) when "hide amounts" is on. */
  maskValues?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const caption = (d: Row) =>
    maskValues
      ? d.label
      : `${d.label} · +${formatValue(d.income)} / −${formatValue(d.expense)}`;

  return (
    <div className="relative">
      <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
        {data.map((d, i) => {
          const selected = active === i;
          return (
            <button
              key={d.label}
              type="button"
              aria-pressed={selected}
              onClick={() => setActive(selected ? null : i)}
              className={cn(
                "flex h-full min-w-0 flex-1 flex-col items-center gap-1 rounded-md outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring",
                selected && "bg-muted/60",
              )}
              aria-label={caption(d)}
              title={caption(d)}
            >
              <div className="flex min-h-0 w-full flex-1 items-end justify-center gap-1">
                <Bar height={(d.income / max) * 100} className="bg-positive/80" />
                <Bar height={(d.expense / max) * 100} className="bg-negative/80" />
              </div>
              <span
                className={cn(
                  "text-xs",
                  selected ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {d.label}
              </span>
            </button>
          );
        })}
      </div>

      {active != null && data[active] && (
        <div
          className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-border bg-card px-2.5 py-1.5 text-center shadow-lg"
          style={{
            left: `${Math.min(90, Math.max(10, ((active + 0.5) / data.length) * 100))}%`,
          }}
        >
          <span className="block text-[10px] font-medium leading-tight text-muted-foreground">
            {data[active].label}
          </span>
          <span
            className={cn(
              "block text-xs font-semibold leading-tight text-positive",
              maskValues && "balance-mask",
            )}
          >
            +{formatValue(data[active].income)}
          </span>
          <span
            className={cn(
              "block text-xs font-semibold leading-tight text-negative",
              maskValues && "balance-mask",
            )}
          >
            −{formatValue(data[active].expense)}
          </span>
        </div>
      )}
    </div>
  );
}

function Bar({ height, className }: { height: number; className?: string }) {
  return (
    <div
      className={cn("w-3 sm:w-5 rounded-t-md", className)}
      style={{ height: `${Math.max(height, 1)}%` }}
    />
  );
}
