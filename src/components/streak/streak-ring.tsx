"use client";

import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  STREAK_TIERS,
  tierFx,
  type RingStyle,
  type SparkColor,
} from "@/server/lib/streak";

type Gem = "gold" | "ruby" | "diamond" | "platinum";

/** [dark, mid, light-highlight] stops for each gem gradient. */
const GEM: Record<Gem, readonly [string, string, string]> = {
  gold: ["#b45309", "#f59e0b", "#fde68a"],
  ruby: ["#881337", "#e11d48", "#fecdd3"],
  // Minecraft-diamond aqua: deep teal → bright cyan → pale ice
  diamond: ["#0e7490", "#22d3ee", "#cffafe"],
  platinum: ["#94a3b8", "#e2e8f0", "#f8fafc"],
};

/** Bright arc colour that sweeps around a gem ring. */
const GLINT: Record<Gem, string> = {
  gold: "#fff7e0",
  ruby: "#ffe0e6",
  diamond: "#ecfeff",
  platinum: "#ffffff",
};

const SPARK: Record<SparkColor, { fill: string; glow: string }> = {
  amber: { fill: "#fde68a", glow: "#fde68a" },
  ruby: { fill: "#fecdd3", glow: "#fda4af" },
  diamond: { fill: "#a5f3fc", glow: "#22d3ee" },
  platinum: { fill: "#f1f5f9", glow: "#cbd5e1" },
};

const SPARKLE_ANGLES: Record<number, number[]> = {
  0: [],
  1: [-30],
  2: [-30, 150],
  3: [-30, 90, 210],
  5: [-40, 25, 100, 165, 240],
};

function gemOf(style: RingStyle): Gem | null {
  if (style === "gold" || style === "ruby" || style === "diamond" || style === "platinum") {
    return style;
  }
  return null;
}

/**
 * Avatar ring whose look changes sharply per streak tier:
 * accent segmented → solid → comet → blaze, then a gem ladder
 * gold → ruby → diamond → platinum (each a single clean line, escalating
 * glint / glow / sparkle count). Sparkles echo the tier's colour.
 */
export function StreakRing({
  tierIndex,
  progressPct,
  dim,
  children,
  className,
}: {
  tierIndex: number;
  progressPct: number;
  /** outer diameter in px */
  dim: number;
  children: ReactNode;
  className?: string;
}) {
  const fx = tierFx(tierIndex);
  const style: RingStyle = tierIndex < 0 ? "track" : fx.ring;

  const gem = gemOf(style);
  const baseStroke = dim < 44 ? 2.5 : 3.5;
  const stroke = gem
    ? baseStroke * (gem === "platinum" ? 1.35 : gem === "diamond" ? 1.25 : 1.15)
    : baseStroke;
  const r = (dim - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mid = dim / 2;
  const inset = Math.round(stroke + 2);
  const small = dim < 44;

  const glint = style === "comet" || style === "blaze" || gem !== null;
  const glow =
    style === "blaze" || gem === "diamond" || gem === "platinum" || gem === "ruby";
  // Unique per instance: a shared id breaks when the first SVG holding the
  // gradient sits in a display:none subtree (e.g. the md:hidden mobile bar),
  // leaving the desktop ring with no stroke colour.
  const gradId = `sr${useId().replace(/[:]/g, "")}`;
  const spark = SPARK[fx.spark];

  const years =
    fx.badge === "year" && tierIndex >= 0
      ? String(Math.round(STREAK_TIERS[tierIndex]!.days / 365))
      : null;

  const stops = gem
    ? GEM[gem]
    : (["var(--ring)", "var(--primary)", "var(--primary)"] as const);

  const glowClass = !glow
    ? undefined
    : gem === "diamond"
      ? "drop-shadow-[0_0_8px_rgb(34_211_238/0.95)]"
      : gem === "platinum"
        ? "drop-shadow-[0_0_6px_rgb(226_232_240/0.9)]"
        : gem === "ruby"
          ? "drop-shadow-[0_0_6px_rgb(244_63_94/0.75)]"
          : "drop-shadow-[0_0_6px_var(--ring)]";

  const glintSpeed =
    style === "blaze"
      ? "2.6s"
      : style === "comet"
        ? "4.5s"
        : gem === "diamond"
          ? "3.4s"
          : gem === "platinum"
            ? "4s"
            : "6s";

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: dim, height: dim }}
    >
      <svg
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        aria-hidden
        className={cn(
          "absolute inset-0",
          glowClass,
          style === "blaze" &&
            "animate-[pulse_2.4s_ease-in-out_infinite] motion-reduce:animate-none",
        )}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={stops[0]} />
            <stop offset="50%" stopColor={stops[1]} />
            <stop offset="100%" stopColor={stops[2]} />
          </linearGradient>
        </defs>

        {style === "track" && (
          <>
            <circle cx={mid} cy={mid} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
            <circle
              cx={mid}
              cy={mid}
              r={r}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - Math.max(0, Math.min(1, progressPct / 100)))}
              transform={`rotate(-90 ${mid} ${mid})`}
            />
          </>
        )}

        {style === "segmented" && (
          <circle
            cx={mid}
            cy={mid}
            r={r}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${c / 14} ${c / 28}`}
          />
        )}

        {style === "solid" && (
          <circle cx={mid} cy={mid} r={r} fill="none" stroke="var(--primary)" strokeWidth={stroke} />
        )}

        {/* one clean line for comet / blaze / every gem */}
        {(style === "comet" || style === "blaze" || gem !== null) && (
          <circle cx={mid} cy={mid} r={r} fill="none" stroke={`url(#${gradId})`} strokeWidth={stroke} />
        )}

        {glint && (
          <g
            className="motion-reduce:animate-none"
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              animation: `wally-spin ${glintSpeed} linear infinite`,
            }}
          >
            <circle
              cx={mid}
              cy={mid}
              r={r}
              fill="none"
              stroke={gem ? GLINT[gem] : "var(--ring)"}
              strokeWidth={stroke + 0.5}
              strokeLinecap="round"
              strokeDasharray={`${c * (gem === "diamond" ? 0.08 : gem ? 0.1 : 0.14)} ${c}`}
            />
          </g>
        )}
      </svg>

      {/* sparkles — tinted to the tier's colour */}
      {(SPARKLE_ANGLES[fx.sparkles] ?? []).map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x = Math.round(mid + Math.cos(rad) * (r + 1));
        const y = Math.round(mid + Math.sin(rad) * (r + 1));
        const size = small ? 3 : 4;
        return (
          <span
            key={i}
            aria-hidden
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full animate-[wally-twinkle_2.6s_ease-in-out_infinite] motion-reduce:animate-none"
            style={{
              left: x,
              top: y,
              width: size,
              height: size,
              background: spark.fill,
              animationDelay: `${i * 0.5}s`,
              boxShadow: `0 0 4px ${spark.glow}`,
            }}
          />
        );
      })}

      <div className="absolute overflow-hidden rounded-full" style={{ inset }}>
        {children}
      </div>

      {(years || fx.badge === "star") && (
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full font-bold ring-2 ring-card",
            gem === "platinum"
              ? "bg-slate-200 text-slate-800"
              : gem === "diamond"
                ? "bg-cyan-300 text-cyan-950"
                : gem === "ruby"
                  ? "bg-rose-500 text-white"
                  : "bg-amber-400 text-amber-950",
          )}
          style={{
            minWidth: small ? 13 : 17,
            height: small ? 13 : 17,
            fontSize: small ? 8 : 10,
          }}
        >
          {years ?? "★"}
        </span>
      )}
    </div>
  );
}
