"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { AssetConfig } from "@/lib/cosmetics/config";
import { RENDERED_SLOTS, type RenderedSlot } from "@/lib/cosmetics/slots";
import { cosmeticVars } from "@/lib/cosmetics/render";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CosmeticPreview } from "@/components/cosmetics/cosmetic-preview";

export type PreviewAsset = {
  id: string;
  name: string;
  slot: string;
  config: AssetConfig;
};

export function PreviewLab({ assets }: { assets: PreviewAsset[] }) {
  const t = useTranslations("admin.previewLab");
  const tSlots = useTranslations("cosmetics.slots");
  const [picks, setPicks] = useState<Partial<Record<RenderedSlot, string>>>({});
  const [scheme, setScheme] = useState<"light" | "dark">("light");

  const bySlot = (slot: string) => assets.filter((a) => a.slot === slot);
  const chosen = (slot: RenderedSlot) => assets.find((a) => a.id === picks[slot]);

  const bg = chosen("APP_BACKGROUND");
  // merge colour vars from every active pick so profile FX read their tokens too
  const mergedVars = RENDERED_SLOTS.reduce<Record<string, string>>((acc, slot) => {
    const a = chosen(slot);
    return a ? { ...acc, ...cosmeticVars(a.config) } : acc;
  }, {});

  return (
    <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" className={scheme === "light" ? "border-foreground bg-foreground text-background hover:bg-foreground/90" : ""} onClick={() => setScheme("light")}>สว่าง</Button>
          <Button type="button" size="sm" variant="secondary" className={scheme === "dark" ? "border-foreground bg-foreground text-background hover:bg-foreground/90" : ""} onClick={() => setScheme("dark")}>มืด</Button>
          <Button type="button" size="sm" variant="ghost" className="ml-auto" onClick={() => setPicks({})}>ล้างทั้งหมด</Button>
        </div>
        {RENDERED_SLOTS.map((slot) => (
          <label key={slot} className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-muted-foreground">{tSlots(slot)}</span>
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
        data-theme={scheme}
        style={{
          ...(mergedVars as React.CSSProperties),
          backgroundColor: bg ? "var(--ck-bg, transparent)" : undefined,
        }}
        className="relative min-h-[680px] overflow-hidden rounded-3xl border border-border bg-background text-foreground shadow-xl"
      >
        {bg && bg.config.surface === "GRADIENT" && (
          <div
            aria-hidden
            className="ck-fx ck-surface-gradient"
            style={{ position: "absolute", inset: 0, zIndex: 0 }}
          />
        )}
        <div className="relative z-[1] flex min-h-[680px] flex-col">
          <div className="flex h-14 items-center justify-between border-b border-border bg-card/80 px-5">
            <strong>Wally<span className="text-primary">.</span></strong>
            <div className="relative size-9"><span className="flex size-full items-center justify-center rounded-full bg-primary/15 font-bold text-primary">A</span>{chosen("PROFILE_FRAME") && <span aria-hidden className="ck-profile-frame" />}{chosen("PROFILE_AURA") && <span aria-hidden className="ck-profile-aura" />}{chosen("PROFILE_BADGE") && <span aria-hidden className="ck-profile-badge" />}</div>
          </div>
          <div className="flex-1 space-y-5 p-4 sm:p-6">
            <div><p className="text-xs text-muted-foreground">ภาพรวม</p><h2 className="text-2xl font-bold">สวัสดี, A</h2></div>
          {chosen("OVERVIEW_CARD") && (
            <CosmeticPreview slot="OVERVIEW_CARD" config={chosen("OVERVIEW_CARD")!.config} />
          )}
          {!chosen("OVERVIEW_CARD") && <Card className="brand-gradient p-5 text-white"><p className="text-xs text-white/70">ทรัพย์สินสุทธิ</p><strong className="text-3xl">฿245,800</strong><div className="mt-5 flex h-2 overflow-hidden rounded-full bg-white/20"><span className="w-3/5 bg-white"/><span className="ml-0.5 w-2/5 bg-white/50"/></div></Card>}
          <div className="grid gap-4 sm:grid-cols-2">
            {chosen("ACCOUNT_CARD") ? <CosmeticPreview slot="ACCOUNT_CARD" config={chosen("ACCOUNT_CARD")!.config} /> : <Card className="p-4"><p className="text-sm text-muted-foreground">บัญชีหลัก</p><strong className="mt-3 block text-xl">฿145,800</strong></Card>}
            {chosen("INVESTMENT_CARD") ? <CosmeticPreview slot="INVESTMENT_CARD" config={chosen("INVESTMENT_CARD")!.config} /> : <Card className="p-4"><p className="text-sm text-muted-foreground">การลงทุน</p><strong className="mt-3 block text-xl">฿100,000</strong></Card>}
          </div>
          {chosen("TRANSACTION_CARD") ? <CosmeticPreview slot="TRANSACTION_CARD" config={chosen("TRANSACTION_CARD")!.config} /> : <Card className="p-4"><p className="text-sm font-medium">รายการล่าสุด</p><p className="mt-3 text-sm text-muted-foreground">อาหารกลางวัน <span className="float-right text-negative">−฿120</span></p></Card>}
          </div>
          <div className="grid h-16 grid-cols-4 items-center border-t border-border bg-card/90 text-center text-xs text-muted-foreground"><span>ภาพรวม</span><span>รายการ</span><span className="text-2xl text-primary">＋</span><span>พอร์ต</span></div>
        </div>
      </div>
    </div>
  );
}
