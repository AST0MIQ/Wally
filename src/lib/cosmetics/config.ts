/**
 * Typed, versioned, SAFE cosmetic asset configuration.
 *
 * A config is a small bag of validated tokens and named presets — never a raw
 * CSS string, never JavaScript, never an arbitrary URL. `.strict()` rejects any
 * unknown key, so a `css` / `style` / `script` / `html` field cannot sneak in.
 * The server calls `parseAssetConfig()` on every asset create/update.
 */
import { z } from "zod";

import { zHexColor } from "@/lib/validation/common";
import {
  BORDER_EFFECTS,
  COLOR_TOKENS,
  INTENSITY_LEVELS,
  MOTION_PRESETS,
  SHAPE_PRESETS,
  SURFACE_PRESETS,
  TEXTURE_PRESETS,
  CHART_PRESETS,
  ICON_PRESETS,
  TYPOGRAPHY_PRESETS,
  AMBIENT_PRESETS,
  INTERACTION_PRESETS,
  CELEBRATION_PRESETS,
} from "@/lib/cosmetics/presets";

const colorsSchema = z
  .object(
    Object.fromEntries(COLOR_TOKENS.map((t) => [t, zHexColor.optional()])),
  )
  .strict();

/**
 * Same-origin path only. Must start with a single `/` (not `//`, which is a
 * protocol-relative URL), no `data:` / `blob:` / `javascript:`, no `..`.
 */
const mediaUrlSchema = z
  .string()
  .trim()
  .refine(
    (v) => /^\/(?!\/)[A-Za-z0-9\-._~/]*$/.test(v) || /^https:\/\/[A-Za-z0-9.-]+\.public\.blob\.vercel-storage\.com\/[A-Za-z0-9%\-._~/]+$/.test(v),
    "media URL must be a same-origin path or Wally's Vercel Blob URL",
  )
  .refine((v) => !v.includes(".."), "media URL must not contain '..'");

const semverish = z
  .string()
  .trim()
  .regex(/^\d+\.\d+(\.\d+)?$/, "invalid version");

export const assetConfigV1Schema = z
  .object({
    colors: colorsSchema.optional(),
    shape: z.enum(SHAPE_PRESETS).optional(),
    surface: z.enum(SURFACE_PRESETS).optional(),
    borderEffect: z.enum(BORDER_EFFECTS).optional(),
    texture: z.enum(TEXTURE_PRESETS).optional(),
    motion: z.enum(MOTION_PRESETS).optional(),
    intensity: z.enum(INTENSITY_LEVELS).optional(),
    /** decorative Wally media (same-origin or public Vercel Blob) */
    mediaUrl: mediaUrlSchema.optional(),
    /** default true — the renderer drops the layer only on an explicit `false` */
    lightCompatible: z.boolean().optional(),
    darkCompatible: z.boolean().optional(),
    /** renderer drops the layer when APP_VERSION < this (semver-ish) */
    minComponentVersion: semverish.optional(),
  })
  .strict();

export type AssetConfigV1 = z.infer<typeof assetConfigV1Schema>;
export type AssetConfigV1Input = z.input<typeof assetConfigV1Schema>;

export const assetConfigV2Schema = assetConfigV1Schema.extend({
  chartStyle: z.enum(CHART_PRESETS).optional(),
  iconStyle: z.enum(ICON_PRESETS).optional(),
  typography: z.enum(TYPOGRAPHY_PRESETS).optional(),
  ambientEffect: z.enum(AMBIENT_PRESETS).optional(),
  interactionEffect: z.enum(INTERACTION_PRESETS).optional(),
  celebrationEffect: z.enum(CELEBRATION_PRESETS).optional(),
}).strict();

export type AssetConfigV2 = z.infer<typeof assetConfigV2Schema>;
/** Normalized shape consumed by renderers; v1 is a structural subset. */
export type AssetConfig = AssetConfigV2;

export const LATEST_CONFIG_VERSION = 2 as const;

/**
 * Validate a stored/inbound config against the schema for `version`. Throws a
 * `ZodError` on any violation. Add a v2 branch here without touching v1 rows.
 */
export function parseAssetConfig(version: number, raw: unknown): AssetConfig {
  switch (version) {
    case 1:
      return assetConfigV1Schema.parse(raw);
    case 2:
      return assetConfigV2Schema.parse(raw);
    default:
      throw new Error(`unsupported cosmetic config version: ${version}`);
  }
}

/** Non-throwing variant for callers that want a result object. */
export function safeParseAssetConfig(version: number, raw: unknown) {
  if (version !== 1 && version !== 2) {
    return {
      success: false as const,
      error: `unsupported cosmetic config version: ${version}`,
    };
  }
  const res = (version === 1 ? assetConfigV1Schema : assetConfigV2Schema).safeParse(raw);
  return res.success
    ? { success: true as const, data: res.data }
    : { success: false as const, error: res.error.flatten() };
}

/** A no-op config — the neutral default (renders as today's Wally look). */
export const NEUTRAL_CONFIG: AssetConfig = {};

/** `false` only when the asset explicitly opted out of that scheme. */
export function isSchemeCompatible(
  config: AssetConfig,
  scheme: "light" | "dark",
): boolean {
  return scheme === "light"
    ? config.lightCompatible !== false
    : config.darkCompatible !== false;
}

function parseVersion(v: string): [number, number, number] {
  const [a = 0, b = 0, c = 0] = v.split(".").map((n) => Number(n) || 0);
  return [a, b, c];
}

/** True when `appVersion` satisfies `config.minComponentVersion` (or none set). */
export function meetsMinVersion(
  config: AssetConfig,
  appVersion: string,
): boolean {
  if (!config.minComponentVersion) return true;
  const [a1, a2, a3] = parseVersion(appVersion);
  const [b1, b2, b3] = parseVersion(config.minComponentVersion);
  if (a1 !== b1) return a1 > b1;
  if (a2 !== b2) return a2 > b2;
  return a3 >= b3;
}

/**
 * Whether this asset's layer should render at all, given the viewer's scheme
 * and the running app version. Used identically by the renderer and Preview so
 * Admin can never publish a config that behaves differently in production.
 */
export function shouldRenderLayer(
  config: AssetConfig,
  ctx: { scheme: "light" | "dark"; appVersion: string },
): boolean {
  return (
    isSchemeCompatible(config, ctx.scheme) &&
    meetsMinVersion(config, ctx.appVersion)
  );
}
