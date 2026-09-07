"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { StreakRing } from "@/components/streak/streak-ring";
import { HeroCardFx, heroCardClasses } from "@/components/streak/hero-card-fx";

type Entry = { key: string; days: number; earned: boolean };

export function StreakLadder({
  ladder,
  currentTierIndex,
  initial,
}: {
  ladder: Entry[];
  currentTierIndex: number;
  initial: string;
}) {
  const s = useTranslations("streak");
  const [selected, setSelected] = useState<number | null>(null);
  const entry = selected == null ? null : ladder[selected];

  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold text-muted-foreground">
        {s("ladder")}
      </p>
      <ul className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-8">
        {ladder.map((tier, i) => {
          const isCurrent = i === currentTierIndex;
          return (
            <li key={tier.key}>
              <button
                type="button"
                onClick={() => setSelected(i)}
                className={cn(
                  "flex w-full flex-col items-center gap-1.5 rounded-xl p-1 text-center transition-colors hover:bg-muted",
                  isCurrent && "bg-muted",
                )}
              >
                <span className={cn("block", !tier.earned && "opacity-40 grayscale")}>
                  <StreakRing tierIndex={i} progressPct={100} dim={40}>
                    <span className="flex size-full items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold tabular-nums text-primary">
                      {tier.earned ? tier.days : <Lock className="size-3" />}
                    </span>
                  </StreakRing>
                </span>
                <span
                  className={cn(
                    "text-[11px] leading-tight",
                    tier.earned ? "text-foreground" : "text-muted-foreground/60",
                  )}
                >
                  {s(`tier_${tier.key}`)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Drawer open={selected != null} onOpenChange={(o) => !o && setSelected(null)}>
        <DrawerContent className="mx-auto max-w-md">
          {entry && (
            <div className="flex flex-col items-center gap-4 text-center">
              <DrawerTitle className="sr-only">
                {s(`tier_${entry.key}`)}
              </DrawerTitle>

              <StreakRing
                tierIndex={selected!}
                progressPct={100}
                dim={76}
              >
                <span className="flex size-full items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary">
                  {initial}
                </span>
              </StreakRing>

              <div>
                <p className="text-lg font-semibold">{s(`tier_${entry.key}`)}</p>
                <p className="text-sm text-muted-foreground">
                  {s("daysGoal", { n: entry.days })}
                </p>
              </div>

              <div className="w-full rounded-xl bg-muted/60 p-4 text-left">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">
                  {s("rewardTitle")}
                </p>
                <p className="text-sm">{s(`reward_${entry.key}`)}</p>
              </div>

              {/* live preview of how the overview card changes */}
              <div className="w-full text-left">
                <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                  {s("cardPreview")}
                </p>
                <div
                  className={cn(
                    "brand-gradient relative overflow-hidden rounded-2xl px-4 py-3 text-white shadow-[0_16px_36px_-30px_rgb(0_0_0_/_0.55)]",
                    heroCardClasses(selected!),
                  )}
                >
                  <HeroCardFx tierIndex={selected!} />
                  <div className="relative z-[1]">
                    <p className="text-[10px] text-white/70">{s("netWorthMock")}</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums">
                      ฿123,456
                    </p>
                    <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-white/20">
                      <span className="bg-white/85" style={{ width: "62%" }} />
                      <span className="bg-white/45" style={{ width: "38%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {selected === currentTierIndex ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                  <Check className="size-3.5" />
                  {s("current")}
                </span>
              ) : entry.earned ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-positive/15 px-3 py-1 text-xs font-medium text-positive">
                  <Check className="size-3.5" />
                  {s("earnedOn")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Lock className="size-3.5" />
                  {s("daysGoal", { n: entry.days })}
                </span>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
