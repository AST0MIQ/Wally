/**
 * Canonical default cosmetics — seeded in EVERY environment (incl. production).
 *
 * "Wally Classic" is a published Collection holding one canonical-default Asset
 * per rendered slot. Its config is neutral, so equipping it renders exactly
 * today's Wally look. `acquisitionType: DEFAULT` means every user implicitly
 * owns these — no entitlement rows, no backfill.
 *
 * Idempotent: upsert by slug.
 */
import type { PrismaClient, EquipmentSlot } from "@prisma/client";

import { RENDERED_SLOTS } from "@/lib/cosmetics/slots";
import { NEUTRAL_CONFIG } from "@/lib/cosmetics/config";

const CLASSIC_SLUG = "wally-classic";

const SLOT_NAME: Record<string, string> = {
  APP_BACKGROUND: "Classic Background",
  PROFILE_FRAME: "Classic Frame",
  PROFILE_BADGE: "Classic Badge",
  PROFILE_AURA: "Classic Aura",
  OVERVIEW_CARD: "Classic Overview Card",
  INVESTMENT_CARD: "Classic Investment Card",
};

export async function seedCosmeticDefaults(prisma: PrismaClient): Promise<void> {
  const now = new Date();

  const collection = await prisma.cosmeticCollection.upsert({
    where: { slug: CLASSIC_SLUG },
    create: {
      slug: CLASSIC_SLUG,
      name: "Wally Classic",
      description: "The original Wally look. Everyone owns this.",
      rarity: "COMMON",
      status: "PUBLISHED",
      isApplicableAsSet: true,
      sortOrder: 0,
    },
    update: { status: "PUBLISHED", name: "Wally Classic" },
  });

  for (const [index, slot] of RENDERED_SLOTS.entries()) {
    const slug = `classic-${slot.toLowerCase().replace(/_/g, "-")}`;
    const asset = await prisma.cosmeticAsset.upsert({
      where: { slug },
      create: {
        slug,
        name: SLOT_NAME[slot] ?? `Classic ${slot}`,
        description: "Canonical default — renders the standard Wally styling.",
        slot: slot as EquipmentSlot,
        rarity: "COMMON",
        status: "PUBLISHED",
        acquisitionType: "DEFAULT",
        isCanonicalDefault: true,
        configVersion: 1,
        config: NEUTRAL_CONFIG,
        publishedAt: now,
      },
      // re-seed: only re-assert the canonical-default flags, never rewrite
      // config or publishedAt (published config is immutable)
      update: {
        acquisitionType: "DEFAULT",
        isCanonicalDefault: true,
      },
    });

    await prisma.collectionAsset.upsert({
      where: {
        collectionId_assetId: { collectionId: collection.id, assetId: asset.id },
      },
      create: {
        collectionId: collection.id,
        assetId: asset.id,
        slot: slot as EquipmentSlot,
        sortOrder: index,
      },
      update: { sortOrder: index },
    });
  }

  console.log(`[seed] cosmetics: "Wally Classic" + ${RENDERED_SLOTS.length} canonical defaults`);
}
