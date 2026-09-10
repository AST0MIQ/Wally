/**
 * Equipment slots. Mirrors the Prisma `EquipmentSlot` enum (kept in sync by
 * `src/lib/cosmetics/slots.test.ts`). Every declared slot has a Phase 2
 * renderer and a matching preview.
 */

export const EQUIPMENT_SLOTS = [
  "APP_BACKGROUND",
  "NAVIGATION",
  "HEADER",
  "PROFILE_FRAME",
  "PROFILE_BADGE",
  "PROFILE_AURA",
  "OVERVIEW_CARD",
  "ACCOUNT_CARD",
  "INVESTMENT_CARD",
  "TRANSACTION_CARD",
  "CHART_STYLE",
  "ICON_SET",
  "TYPOGRAPHY",
  "AMBIENT_EFFECT",
  "INTERACTION_EFFECT",
  "CELEBRATION_EFFECT",
] as const;

export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];

/** Slots with a live renderer. */
export const RENDERED_SLOTS = [
  "APP_BACKGROUND",
  "NAVIGATION",
  "HEADER",
  "PROFILE_FRAME",
  "PROFILE_BADGE",
  "PROFILE_AURA",
  "OVERVIEW_CARD",
  "ACCOUNT_CARD",
  "INVESTMENT_CARD",
  "TRANSACTION_CARD",
  "CHART_STYLE",
  "ICON_SET",
  "TYPOGRAPHY",
  "AMBIENT_EFFECT",
  "INTERACTION_EFFECT",
  "CELEBRATION_EFFECT",
] as const satisfies readonly EquipmentSlot[];

export type RenderedSlot = (typeof RENDERED_SLOTS)[number];

export function isEquipmentSlot(v: unknown): v is EquipmentSlot {
  return typeof v === "string" && (EQUIPMENT_SLOTS as readonly string[]).includes(v);
}

export function isRenderedSlot(v: unknown): v is RenderedSlot {
  return typeof v === "string" && (RENDERED_SLOTS as readonly string[]).includes(v);
}

/** Loose grouping for the admin UI + user inventory filters. */
export const SLOT_GROUPS: Record<string, readonly EquipmentSlot[]> = {
  environment: ["APP_BACKGROUND", "AMBIENT_EFFECT"],
  chrome: ["NAVIGATION", "HEADER", "ICON_SET", "TYPOGRAPHY"],
  profile: ["PROFILE_FRAME", "PROFILE_BADGE", "PROFILE_AURA"],
  cards: ["OVERVIEW_CARD", "ACCOUNT_CARD", "INVESTMENT_CARD", "TRANSACTION_CARD"],
  data: ["CHART_STYLE"],
  effects: ["INTERACTION_EFFECT", "CELEBRATION_EFFECT"],
};

/**
 * Which config fields actually have a runtime effect for each *rendered* slot.
 * The admin config form only shows these, so a published config can never
 * imply an effect that Preview and production don't both apply.
 * `motion` here is limited to what the layer's CSS supports.
 */
export type ConfigField =
  | "colors"
  | "shape"
  | "surface"
  | "borderEffect"
  | "texture"
  | "motion"
  | "intensity"
  | "mediaUrl"
  | "chartStyle"
  | "iconStyle"
  | "typography"
  | "ambientEffect"
  | "interactionEffect"
  | "celebrationEffect";

export const SLOT_CONFIG_FIELDS: Record<RenderedSlot, readonly ConfigField[]> = {
  APP_BACKGROUND: ["colors", "surface", "texture", "motion", "intensity", "mediaUrl"],
  NAVIGATION: ["colors", "shape", "surface", "borderEffect", "texture", "intensity"],
  HEADER: ["colors", "surface", "borderEffect", "texture", "intensity"],
  OVERVIEW_CARD: ["colors", "shape", "surface", "borderEffect", "texture", "motion", "intensity", "mediaUrl"],
  ACCOUNT_CARD: ["colors", "shape", "surface", "borderEffect", "texture", "motion", "intensity", "mediaUrl"],
  INVESTMENT_CARD: ["colors", "shape", "surface", "borderEffect", "texture", "motion", "intensity", "mediaUrl"],
  TRANSACTION_CARD: ["colors", "shape", "surface", "borderEffect", "texture", "motion", "intensity", "mediaUrl"],
  PROFILE_FRAME: ["colors", "borderEffect", "motion", "intensity", "mediaUrl"],
  PROFILE_AURA: ["colors", "motion", "intensity"],
  PROFILE_BADGE: ["colors", "shape", "mediaUrl"],
  CHART_STYLE: ["colors", "chartStyle", "intensity"],
  ICON_SET: ["colors", "iconStyle"],
  // Retained for stored v2 assets, but the renderer deliberately applies no
  // alternate font so LINE Seed Sans remains consistent across Wally.
  TYPOGRAPHY: ["typography"],
  AMBIENT_EFFECT: ["colors", "ambientEffect", "intensity", "mediaUrl"],
  INTERACTION_EFFECT: ["colors", "interactionEffect", "intensity"],
  CELEBRATION_EFFECT: ["colors", "celebrationEffect", "intensity"],
};

/** Motion presets a given rendered slot's CSS can actually animate. */
export const SLOT_MOTION: Record<RenderedSlot, readonly string[]> = {
  APP_BACKGROUND: ["NONE", "FLOATING_PARTICLES"],
  NAVIGATION: ["NONE"],
  HEADER: ["NONE"],
  OVERVIEW_CARD: ["NONE", "SHIMMER", "PULSE", "FLOATING_PARTICLES"],
  ACCOUNT_CARD: ["NONE", "SHIMMER", "PULSE"],
  INVESTMENT_CARD: ["NONE", "SHIMMER", "PULSE", "FLOATING_PARTICLES"],
  TRANSACTION_CARD: ["NONE", "SHIMMER", "PULSE"],
  PROFILE_FRAME: ["NONE", "PULSE"],
  PROFILE_AURA: ["NONE", "PULSE"],
  PROFILE_BADGE: ["NONE"],
  CHART_STYLE: ["NONE"],
  ICON_SET: ["NONE"],
  TYPOGRAPHY: ["NONE"],
  AMBIENT_EFFECT: ["NONE"],
  INTERACTION_EFFECT: ["NONE"],
  CELEBRATION_EFFECT: ["NONE"],
};

export function slotConfigFields(slot: string): readonly ConfigField[] {
  return (SLOT_CONFIG_FIELDS as Record<string, readonly ConfigField[]>)[slot] ?? [];
}

/** Colour controls that have a visible effect for each slot. */
export const SLOT_COLOR_TOKENS: Record<RenderedSlot, readonly string[]> = {
  APP_BACKGROUND: ["background", "primary", "glow"],
  NAVIGATION: ["surface", "primary", "text", "muted", "border", "glow"],
  HEADER: ["surface", "primary", "text", "muted", "border", "glow"],
  PROFILE_FRAME: ["primary", "border", "glow"],
  PROFILE_BADGE: ["primary", "text", "border"],
  PROFILE_AURA: ["primary", "glow"],
  OVERVIEW_CARD: ["surface", "primary", "text", "muted", "border", "glow", "cash", "investment"],
  ACCOUNT_CARD: ["surface", "primary", "text", "muted", "border", "glow"],
  INVESTMENT_CARD: ["surface", "primary", "text", "muted", "border", "glow"],
  TRANSACTION_CARD: ["surface", "primary", "text", "muted", "border", "glow"],
  CHART_STYLE: ["primary", "muted", "glow"],
  ICON_SET: ["primary"],
  TYPOGRAPHY: [],
  AMBIENT_EFFECT: ["background", "primary", "glow"],
  INTERACTION_EFFECT: ["primary", "glow"],
  CELEBRATION_EFFECT: ["primary", "glow"],
};
