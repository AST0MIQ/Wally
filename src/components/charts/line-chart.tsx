"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Point = { label: string; value: number };

/**
 * Minimal responsive area/line chart (no dependency). Renders into a
 * 0..100 x 0..100 viewBox and scales with its container. Drag a finger or
 * the mouse across it to read the value at each point.
 */
export function LineChart({
  data,
  formatValue,
  valueLocale,
  maskValues = false,
  height = 160,
  className,
}: {
  data: Point[];
  /** Client-only: full control over the displayed value. */
  formatValue?: (n: number) => string;
  /** Server-safe alternative to `formatValue` — locale for `toLocaleString`. */
  valueLocale?: string;
  /** Blur the displayed numbers when the "hide amounts" switch is on. */
  maskValues?: boolean;
  height?: number;
  className?: string;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = range * 0.12;
  const lo = min - pad;
  const hi = max + pad;

  const x = (i: number) => (i / (data.length - 1)) * 100;
  const y = (v: number) => 100 - ((v - lo) / (hi - lo)) * 100;

  const line = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const area = `0,100 ${line} 100,100`;

  const first = data[0]!;
  const last = data[data.length - 1]!;

  const pickFromClientX = (clientX: number) => {
    const el = overlayRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rel = (clientX - rect.left) / rect.width;
    const idx = Math.round(Math.min(1, Math.max(0, rel)) * (data.length - 1));
    setActive(idx);
  };

  const fmt =
    formatValue ?? ((v: number) => v.toLocaleString(valueLocale || undefined));
  const activePoint = active != null ? data[active] : null;
  const footerValue = activePoint ?? last;

  return (
    <div className={className}>
      <div className="relative" style={{ height }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ width: "100%", height }}
          role="img"
          aria-label={data
            .map(
              (p) =>
                `${p.label}: ${formatValue ? formatValue(p.value) : p.value}`,
            )
            .join(", ")}
        >
          <polygon points={area} fill="var(--color-primary)" opacity="0.06" />
          <polyline
            points={line}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
            className="transition-all duration-500"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle
            cx={x(data.length - 1)}
            cy={y(last.value)}
            r="1.8"
            fill="var(--color-primary)"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Scrub layer — pointer events cover both touch and mouse. */}
        <div
          ref={overlayRef}
          className="absolute inset-0 cursor-crosshair touch-pan-y"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            pickFromClientX(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 0 && e.pointerType === "mouse") return;
            pickFromClientX(e.clientX);
          }}
          onPointerUp={() => setActive(null)}
          onPointerCancel={() => setActive(null)}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") setActive(null);
          }}
        >
          {activePoint && (
            <>
              <div
                className="pointer-events-none absolute top-0 bottom-0 w-px -translate-x-1/2 bg-[var(--color-primary)] opacity-60"
                style={{ left: `${x(active!)}%` }}
              />
              <div
                className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-[var(--color-primary)]"
                style={{ left: `${x(active!)}%`, top: `${y(activePoint.value)}%` }}
              />
              <div
                className="pointer-events-none absolute top-1 z-[1] -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-center shadow-sm"
                style={{
                  left: `${Math.min(88, Math.max(12, x(active!)))}%`,
                }}
              >
                <span className="block text-[10px] leading-tight text-muted-foreground">
                  {activePoint.label}
                </span>
                <span
                  className={cn(
                    "block text-xs font-semibold leading-tight",
                    maskValues && "balance-mask",
                  )}
                >
                  {fmt(activePoint.value)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{first.label}</span>
        <span
          className={cn(
            "font-medium text-foreground",
            maskValues && "balance-mask inline-block",
          )}
        >
          {fmt(footerValue.value)}
        </span>
        <span>{last.label}</span>
      </div>
    </div>
  );
}
