/**
 * Turn a validated asset config into inline CSS custom properties + a set of
 * static preset class names. Pure — no React, no DOM. The class names all live
 * in `src/styles/cosmetics.css`; the custom properties are applied via an
 * inline `style` attribute (allowed by the app CSP's `style-src 'unsafe-inline'`).
 *
 * There is never a raw CSS string here — only `#rrggbb` values and a fixed
 * vocabulary of class names.
 */
import type { AssetConfigV1 } from "@/lib/cosmetics/config";
import type { EquipmentSlot } from "@/lib/cosmetics/slots";

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
 * @param reducedMotion  the viewer prefers reduced motion — swap in the
 *                       reduced-motion fallback (default: no motion)
 */
export function cosmeticClasses(
  config: AssetConfigV1,
  opts: { reducedMotion?: boolean } = {},
): string {
  const c: string[] = [];

  switch (config.shape) {
    case "SOFT": c.push("ck-shape-soft"); break;
    case "ROUNDED": c.push("ck-shape-rounded"); break;
    case "SHARP": c.push("ck-shape-sharp"); break;
    case "PILL": c.push("ck-shape-pill"); break;
  }
  switch (config.surface) {
    case "GLASS": c.push("ck-surface-glass"); break;
    case "GRADIENT": c.push("ck-surface-gradient"); break;
    case "ELEVATED": c.push("ck-surface-elevated"); break;
    case "FLAT": c.push("ck-surface-flat"); break;
  }
  switch (config.borderEffect) {
    case "GRADIENT_BORDER": c.push("ck-border-gradient"); break;
    case "GLOW": c.push("ck-border-glow"); break;
    case "SHINE": c.push("ck-border-shine"); break;
  }
  if (config.texture === "FINE_NOISE") c.push("ck-texture-noise");

  const motion = opts.reducedMotion
    ? (config.reducedMotionMotion ?? "NONE")
    : config.motion;
  switch (motion) {
    case "SHIMMER": c.push("ck-motion-shimmer"); break;
    case "PULSE": c.push("ck-motion-pulse"); break;
    case "FLOATING_PARTICLES": c.push("ck-motion-particles"); break;
  }

  if (config.intensity) c.push(`ck-intensity-${config.intensity.toLowerCase()}`);

  return c.join(" ");
}

/** True when this asset config draws anything at all. */
export function configIsDecorative(config: AssetConfigV1): boolean {
  return Boolean(
    (config.colors && Object.keys(config.colors).length) ||
      config.surface ||
      config.borderEffect ||
      config.texture ||
      (config.motion && config.motion !== "NONE") ||
      config.shape ||
      config.mediaUrl,
  );
}

/** Slots whose renderer paints a full-bleed layer rather than decorating a card. */
export const BACKGROUND_SLOTS: readonly EquipmentSlot[] = ["APP_BACKGROUND"];
