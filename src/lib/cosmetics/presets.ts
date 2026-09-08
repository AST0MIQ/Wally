/**
 * Cosmetic config preset whitelists — the ONLY visual knobs an asset config
 * may set. Shared by the Zod validator (src/lib/cosmetics/config.ts) and the
 * renderer (src/components/cosmetics/render/*). Never raw CSS, never JS.
 *
 * Each enum holds values of a single kind — see docs/COSMETICS.md. The brief's
 * flat "effect presets" list maps across these axes:
 *   GLASS            -> surface
 *   GRADIENT_BORDER  -> borderEffect
 *   GLOW / SHINE     -> borderEffect
 *   FINE_NOISE       -> texture
 *   FLOATING_PARTICLES -> motion
 *   NONE             -> any axis
 */

export const SHAPE_PRESETS = ["SOFT", "ROUNDED", "SHARP", "PILL"] as const;
export type ShapePreset = (typeof SHAPE_PRESETS)[number];

export const SURFACE_PRESETS = ["FLAT", "GLASS", "GRADIENT", "ELEVATED"] as const;
export type SurfacePreset = (typeof SURFACE_PRESETS)[number];

export const BORDER_EFFECTS = ["NONE", "GRADIENT_BORDER", "GLOW", "SHINE"] as const;
export type BorderEffect = (typeof BORDER_EFFECTS)[number];

export const TEXTURE_PRESETS = ["NONE", "FINE_NOISE"] as const;
export type TexturePreset = (typeof TEXTURE_PRESETS)[number];

/** Actual motion values only — nothing that belongs on another axis. */
export const MOTION_PRESETS = ["NONE", "SHIMMER", "PULSE", "FLOATING_PARTICLES"] as const;
export type MotionPreset = (typeof MOTION_PRESETS)[number];

export const INTENSITY_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export type IntensityLevel = (typeof INTENSITY_LEVELS)[number];

/** Colour token slots an asset may override (each a #rrggbb hex). */
export const COLOR_TOKENS = [
  "background",
  "surface",
  "primary",
  "text",
  "muted",
  "border",
  "glow",
] as const;
export type ColorToken = (typeof COLOR_TOKENS)[number];
