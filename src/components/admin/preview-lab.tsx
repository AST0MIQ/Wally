"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { AssetConfigV1 } from "@/lib/cosmetics/config";
import { RENDERED_SLOTS, type RenderedSlot } from "@/lib/cosmetics/slots";
import { cosmeticVars } from "@/lib/cosmetics/render";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { CosmeticPreview } from "@/components/cosmetics/cosmetic-preview";

export type PreviewAsset = {
  id: string;
  name: string;
  slot: string;
  config: AssetConfigV1;
};

export function PreviewLab({ assets }: { assets: PreviewAsset[] }) {
  const t = useTranslations("admin.previewLab");
  const [picks, setPicks] = useState<Partial<Record<RenderedSlot, string>>>({});

  const bySlot = (slot: string) => assets.filter((a) => a.slot === slot);
  const chosen = (slot: RenderedSlot) => assets.find((a) => a.id === picks[slot]);

  const bg = chosen("APP_BACKGROUND");
  // merge colour vars from every active pick so profile FX read their tokens too
  const mergedVars = RENDERED_SLOTS.reduce<Record<string, string>>((acc, slot) => {
    const a = chosen(slot);
    return a ? { ...acc, ...cosmeticVars(a.config) } : acc;
  }, {});

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-3">
        {RENDERED_SLOTS.map((slot) => (
          <label key={slot} className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-muted-foreground">{slot}</span>
            <Select
              value={picks[slot] ?? ""}
              onChange={(e) =>
                setPicks((p) => ({ ...p, [slot]: e.target.value || undefined }))
              }
            >
              <option value="">{t("pick")}</option>
              {bySlot(slot).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </label>
        ))}
      </div>

      <div
        style={{
          ...(mergedVars as React.CSSProperties),
          backgroundColor: bg ? "var(--ck-bg, transparent)" : undefined,
        }}
        className="relative min-h-[420px] overflow-hidden rounded-2xl border border-border p-6"
      >
        {bg && bg.config.surface === "GRADIENT" && (
          <div
            aria-hidden
            className="ck-fx ck-surface-gradient"
            style={{ position: "absolute", inset: 0, zIndex: 0 }}
          />
        )}
        <div className="relative z-[1] grid gap-4 sm:grid-cols-2">
          {chosen("OVERVIEW_CARD") && (
            <CosmeticPreview slot="OVERVIEW_CARD" config={chosen("OVERVIEW_CARD")!.config} />
          )}
          {chosen("INVESTMENT_CARD") && (
            <CosmeticPreview slot="INVESTMENT_CARD" config={chosen("INVESTMENT_CARD")!.config} />
          )}
          <Card className="relative flex h-40 items-center justify-center">
            <div className="relative size-16">
              <span className="flex size-full items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary">
                A
              </span>
              {chosen("PROFILE_FRAME") && <span aria-hidden className="ck-profile-frame" />}
              {chosen("PROFILE_AURA") && <span aria-hidden className="ck-profile-aura" />}
              {chosen("PROFILE_BADGE") && <span aria-hidden className="ck-profile-badge" />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
