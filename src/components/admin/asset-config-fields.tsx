"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/label";
import type { AssetConfigV1 } from "@/lib/cosmetics/config";
import {
  BORDER_EFFECTS,
  COLOR_TOKENS,
  INTENSITY_LEVELS,
  SHAPE_PRESETS,
  SURFACE_PRESETS,
  TEXTURE_PRESETS,
} from "@/lib/cosmetics/presets";
import {
  SLOT_MOTION,
  slotConfigFields,
  isRenderedSlot,
} from "@/lib/cosmetics/slots";

type Props = {
  slot: string;
  value: AssetConfigV1;
  onChange: (next: AssetConfigV1) => void;
  disabled?: boolean;
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export function AssetConfigFields({ slot, value, onChange, disabled }: Props) {
  const t = useTranslations("admin.assets");
  const set = (patch: Partial<AssetConfigV1>) => onChange({ ...value, ...patch });
  const setColor = (token: string, hex: string) => {
    const colors = { ...(value.colors ?? {}) };
    if (hex) colors[token as keyof typeof colors] = hex;
    else delete colors[token as keyof typeof colors];
    set({ colors: Object.keys(colors).length ? colors : undefined });
  };

  const sel =
    (key: keyof AssetConfigV1) =>
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      set({ [key]: (e.target.value || undefined) as never } as Partial<AssetConfigV1>);

  // Only fields with a real runtime effect for THIS slot are shown, so a
  // published config can never imply an effect Preview/production don't apply.
  const fields = slotConfigFields(slot);
  const show = (f: string) => fields.includes(f as never);
  const motionOptions = isRenderedSlot(slot)
    ? (SLOT_MOTION[slot as keyof typeof SLOT_MOTION] ?? ["NONE"])
    : ["NONE"];

  if (!isRenderedSlot(slot)) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        {t("noRendererYet")}
      </p>
    );
  }

  return (
    <fieldset disabled={disabled} className="flex flex-col gap-4 disabled:opacity-60">
      {show("colors") && (
        <div>
          <p className="mb-2 text-sm font-medium">{t("colors")}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COLOR_TOKENS.map((token) => {
              const v = value.colors?.[token] ?? "";
              const bad = v !== "" && !HEX.test(v);
              return (
                <label key={token} className="flex flex-col gap-1 text-xs">
                  <span className="text-muted-foreground">{token}</span>
                  <span className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={HEX.test(v) ? v : "#000000"}
                      onChange={(e) => setColor(token, e.target.value)}
                      className="size-8 shrink-0 rounded border border-border bg-transparent"
                    />
                    <Input
                      value={v}
                      placeholder="#rrggbb"
                      onChange={(e) => setColor(token, e.target.value.trim())}
                      className={cn("h-8 px-2 text-xs", bad && "border-negative")}
                    />
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {show("shape") && (
          <Field label={t("shape")}>
            <Select value={value.shape ?? ""} onChange={sel("shape")}>
              <option value="">—</option>
              {SHAPE_PRESETS.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
        )}
        {show("surface") && (
          <Field label={t("surface")}>
            <Select value={value.surface ?? ""} onChange={sel("surface")}>
              <option value="">—</option>
              {SURFACE_PRESETS.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
        )}
        {show("borderEffect") && (
          <Field label={t("borderEffect")}>
            <Select value={value.borderEffect ?? ""} onChange={sel("borderEffect")}>
              <option value="">—</option>
              {BORDER_EFFECTS.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
        )}
        {show("texture") && (
          <Field label={t("texture")}>
            <Select value={value.texture ?? ""} onChange={sel("texture")}>
              <option value="">—</option>
              {TEXTURE_PRESETS.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
        )}
        {show("motion") && (
          <Field label={t("motion")}>
            <Select value={value.motion ?? ""} onChange={sel("motion")}>
              <option value="">—</option>
              {motionOptions
                .filter((m) => m !== "NONE")
                .map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
        )}
        {show("intensity") && (
          <Field label={t("intensity")}>
            <Select value={value.intensity ?? ""} onChange={sel("intensity")}>
              <option value="">—</option>
              {INTENSITY_LEVELS.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
        )}
      </div>

      {show("mediaUrl") && (
        <Field label={t("mediaUrl")} hint="/cosmetics/…">
          <Input
            value={value.mediaUrl ?? ""}
            placeholder="/cosmetics/bg/example.webp"
            onChange={(e) => set({ mediaUrl: e.target.value.trim() || undefined })}
          />
        </Field>
      )}
    </fieldset>
  );
}
