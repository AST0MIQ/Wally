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
  MOTION_PRESETS,
  SHAPE_PRESETS,
  SURFACE_PRESETS,
  TEXTURE_PRESETS,
} from "@/lib/cosmetics/presets";

type Props = {
  value: AssetConfigV1;
  onChange: (next: AssetConfigV1) => void;
  disabled?: boolean;
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export function AssetConfigFields({ value, onChange, disabled }: Props) {
  const t = useTranslations("admin.assets");
  const set = (patch: Partial<AssetConfigV1>) => onChange({ ...value, ...patch });
  const setColor = (token: string, hex: string) => {
    const colors = { ...(value.colors ?? {}) };
    if (hex) colors[token as keyof typeof colors] = hex;
    else delete colors[token as keyof typeof colors];
    set({ colors: Object.keys(colors).length ? colors : undefined });
  };

  const sel =
    (key: keyof AssetConfigV1, options: readonly string[]) =>
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      set({ [key]: (e.target.value || undefined) as never } as Partial<AssetConfigV1>);

  return (
    <fieldset disabled={disabled} className="flex flex-col gap-4 disabled:opacity-60">
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label={t("shape")}>
          <Select value={value.shape ?? ""} onChange={sel("shape", SHAPE_PRESETS)}>
            <option value="">—</option>
            {SHAPE_PRESETS.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label={t("surface")}>
          <Select value={value.surface ?? ""} onChange={sel("surface", SURFACE_PRESETS)}>
            <option value="">—</option>
            {SURFACE_PRESETS.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label={t("borderEffect")}>
          <Select value={value.borderEffect ?? ""} onChange={sel("borderEffect", BORDER_EFFECTS)}>
            <option value="">—</option>
            {BORDER_EFFECTS.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label={t("texture")}>
          <Select value={value.texture ?? ""} onChange={sel("texture", TEXTURE_PRESETS)}>
            <option value="">—</option>
            {TEXTURE_PRESETS.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label={t("motion")}>
          <Select value={value.motion ?? ""} onChange={sel("motion", MOTION_PRESETS)}>
            <option value="">—</option>
            {MOTION_PRESETS.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label={t("intensity")}>
          <Select value={value.intensity ?? ""} onChange={sel("intensity", INTENSITY_LEVELS)}>
            <option value="">—</option>
            {INTENSITY_LEVELS.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
      </div>

      <Field label={t("mediaUrl")} hint="/cosmetics/…">
        <Input
          value={value.mediaUrl ?? ""}
          placeholder="/cosmetics/bg/example.webp"
          onChange={(e) => set({ mediaUrl: e.target.value.trim() || undefined })}
        />
      </Field>
    </fieldset>
  );
}
