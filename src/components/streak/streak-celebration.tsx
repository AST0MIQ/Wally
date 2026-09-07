"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { toast } from "@/components/ui/toaster";
import { acknowledgeStreakTier } from "@/app/actions/streak";
import { STREAK_TIERS } from "@/server/lib/streak";

const CONFETTI_COLORS = [
  "var(--primary)",
  "var(--ring)",
  "#fbbf24",
  "#34d399",
  "#f472b6",
];

/**
 * Fires once when the user crosses a streak milestone: a toast plus a short
 * confetti burst. Server write (`acknowledgeStreakTier`) stops it recurring;
 * a sessionStorage guard covers the window before that write lands.
 */
export function StreakCelebration({
  pending,
  count,
}: {
  pending: number;
  count: number;
}) {
  const t = useTranslations("streak");
  const fired = useRef(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (pending < 0 || fired.current) return;
    const key = `wally-streak-celebrated-${pending}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode — fall through, server write still de-dupes */
    }
    fired.current = true;

    const tierKey = STREAK_TIERS[pending]?.key ?? "";
    toast.success(t("celebrateTitle", { days: count }), {
      description: t("celebrateBody", { tier: t(`tier_${tierKey}`) }),
      duration: 6000,
    });

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      setBurst(true);
      const id = window.setTimeout(() => setBurst(false), 2200);
      void acknowledgeStreakTier(pending);
      return () => window.clearTimeout(id);
    }
    void acknowledgeStreakTier(pending);
  }, [pending, count, t]);

  if (!burst) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden>
      {Array.from({ length: 42 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.35;
        const dur = 1.4 + Math.random() * 0.9;
        const size = 6 + Math.random() * 6;
        return (
          <span
            key={i}
            className="absolute top-[-8%] block motion-reduce:hidden"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 0.5,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              borderRadius: 1,
              animation: `wally-confetti ${dur}s ${delay}s cubic-bezier(0.4,0.1,0.5,1) forwards`,
            }}
          />
        );
      })}
    </div>
  );
}
