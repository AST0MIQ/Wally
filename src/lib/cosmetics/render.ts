/**
 * Turn a validated asset config into inline CSS custom properties + a set of
 * static preset class names. Pure — no React, no DOM. The class names all live
 * in `src/styles/cosmetics.css`; the custom properties are applied via an
 * inline `style` attribute (allowed by the app CSP's `style-src 'unsafe-inline'`).
 *
 * There is never a raw CSS string here — only `#rrggbb` values, a fixed
 * vocabulary of class names, and a same-origin `/…` media path.
 *
 * `slot` gates which config fields have an effect, so the renderer and the
 * admin/user Preview interpret a config identically (no "publishes different
 * from production").
 */
import type { AssetConfigV1 } from "@/lib/cosmetics/config";
import type { EquipmentSlot } from "@/lib/cosmetics/slots";
import { SLOT_MOTION, slotConfigFields } from "@/lib/cosmetics/slots";

const COLOR_VAR: Record<string, string> = {
  background: "--ck-bg",
  surface: "--ck-surface",
  primary: "--ck-primary",
  text: "--ck-text",
  muted: "--ck-muted",
  border: "--ck-border",
  glow: "--ck-glow",
};

export function cosmeticVars(config: AssetConfigV1): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [token, value] of Object.entries(config.colors ?? {})) {
    const name = COLOR_VAR[token];
    if (name && value) vars[name] = value;
  }
  return vars;
}

/**
 * Inline properties for a card host while a card cosmetic is equipped.
 *
 * Card cosmetics are replacements, not translucent decorations over Wally's
 * accent/streak background.  Giving the host its own opaque base prevents the
 * previous `brand-gradient` from bleeding through GLASS and other surfaces.
 * `surface` is the card-specific colour; `background` and `primary` are useful
 * fallbacks for older authored assets.
 */
export function cosmeticCardHostStyle(
  config: AssetConfigV1,
): Record<string, string> {
  const colors = config.colors ?? {};
  const fill = colors.surface ?? colors.background ?? colors.primary;
  const autoText = readableTextColor(fill);
  return {
    ...cosmeticVars(config),
    ...(colors.primary ? { "--primary": colors.primary } : {}),
    ...(colors.text ? { "--foreground": colors.text } : {}),
    ...(colors.muted ? { "--muted-foreground": colors.muted } : {}),
    ...(colors.border ? { "--border": colors.border } : {}),
    "--ck-card-text": colors.text ?? autoText,
    backgroundColor: fill ?? "var(--card)",
    backgroundImage: "none",
    borderColor: colors.border ?? "transparent",
    color: colors.text ?? autoText,
  };
}

/** Deterministic black/white fallback for readable text on an asset fill. */
function readableTextColor(hex?: string): string {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return "var(--foreground)";
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const linear = (v: number) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  return luminance > 0.42 ? "#111827" : "#ffffff";
}

/** Shape belongs to the replacement card itself, not only its FX overlay. */
export function cosmeticCardHostClass(config: AssetConfigV1): string {
  switch (config.shape) {
    case "SOFT": return "ck-card-replaced ck-shape-soft";
    case "ROUNDED": return "ck-card-replaced ck-shape-rounded";
    case "SHARP": return "ck-card-replaced ck-shape-sharp";
    case "PILL": return "ck-card-replaced ck-shape-pill";
    default: return "ck-card-replaced";
  }
}

/** Same-origin decorative image path, or null. Re-checked defensively. */
export function cosmeticMediaUrl(config: AssetConfigV1): string | null {
  const url = config.mediaUrl;
  if (!url) return null;
  return /^\/(?!\/)[A-Za-z0-9\-._~/]*$/.test(url) && !url.includes("..")
    ? url
    : null;
}

/**
 * `prefers-reduced-motion` is handled entirely by the `@media` gate in
 * cosmetics.css — no JS branch here, so the renderer and Preview always agree.
 */
export function cosmeticClasses(
  config: AssetConfigV1,
  opts: { slot?: EquipmentSlot } = {},
): string {
  const allowed = opts.slot ? slotConfigFields(opts.slot) : null;
  const can = (f: string) => !allowed || (allowed as readonly string[]).includes(f);
  const c: string[] = [];

  if (can("shape")) {
    switch (config.shape) {
      case "SOFT": c.push("ck-shape-soft"); break;
      case "ROUNDED": c.push("ck-shape-rounded"); break;
      case "SHARP": c.push("ck-shape-sharp"); break;
      case "PILL": c.push("ck-shape-pill"); break;
    }
  }
  if (can("surface")) {
    switch (config.surface) {
      case "GLASS": c.push("ck-surface-glass"); break;
      case "GRADIENT": c.push("ck-surface-gradient"); break;
      case "ELEVATED": c.push("ck-surface-elevated"); break;
      case "FLAT": c.push("ck-surface-flat"); break;
    }
  }
  if (can("borderEffect")) {
    switch (config.borderEffect) {
      case "GRADIENT_BORDER": c.push("ck-border-gradient"); break;
      case "GLOW": c.push("ck-border-glow"); break;
      case "SHINE": c.push("ck-border-shine"); break;
    }
  }
  if (can("texture") && config.texture === "FINE_NOISE") c.push("ck-texture-noise");

  if (can("motion")) {
    const supported = opts.slot ? SLOT_MOTION[opts.slot as keyof typeof SLOT_MOTION] : null;
    const raw = config.motion;
    const motion =
      supported && raw && !(supported as readonly string[]).includes(raw)
        ? "NONE"
        : raw;
    switch (motion) {
      case "SHIMMER": c.push("ck-motion-shimmer"); break;
      case "PULSE": c.push("ck-motion-pulse"); break;
      case "FLOATING_PARTICLES": c.push("ck-motion-particles"); break;
    }
  }

  if (can("intensity") && config.intensity) {
    c.push(`ck-intensity-${config.intensity.toLowerCase()}`);
  }

  return c.join(" ");
}

/** True when this asset config draws anything at all for `slot`. */
export function configIsDecorative(
  config: AssetConfigV1,
  slot?: EquipmentSlot,
): boolean {
  return Boolean(
    cosmeticClasses(config, { slot }) ||
      (config.colors && Object.keys(config.colors).length) ||
      cosmeticMediaUrl(config),
  );
}

/** Slots whose renderer paints a full-bleed layer rather than decorating a card. */
export const BACKGROUND_SLOTS: readonly EquipmentSlot[] = ["APP_BACKGROUND"];
