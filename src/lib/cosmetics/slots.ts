/**
 * Equipment slots. Mirrors the Prisma `EquipmentSlot` enum (kept in sync by
 * `src/lib/cosmetics/slots.test.ts`). `RENDERED_SLOTS` is the Phase 1 subset
 * the renderer actually draws — every other slot is data/admin only.
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

/** Slots with a live renderer in Phase 1. */
export const RENDERED_SLOTS = [
  "APP_BACKGROUND",
  "PROFILE_FRAME",
  "PROFILE_BADGE",
  "PROFILE_AURA",
  "OVERVIEW_CARD",
  "INVESTMENT_CARD",
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
