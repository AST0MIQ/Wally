/**
 * Demo cosmetics — seeded ONLY in development or when COSMETICS_SEED_DEMO=true.
 * Production Neon `main` never gets these. Idempotent: upsert by slug.
 */
import type { PrismaClient, EquipmentSlot, Prisma } from "@prisma/client";

import { assetConfigV1Schema } from "@/lib/cosmetics/config";

type DemoAsset = {
  slug: string;
  name: string;
  slot: EquipmentSlot;
  rarity: Prisma.CosmeticAssetCreateInput["rarity"];
  config: Prisma.InputJsonValue;
};

type DemoCollection = {
  slug: string;
  name: string;
  description: string;
  rarity: Prisma.CosmeticCollectionCreateInput["rarity"];
  assets: DemoAsset[];
};

const COLLECTIONS: DemoCollection[] = [
  {
    slug: "sakura",
    name: "Sakura",
    description: "Soft pinks, petals, a gentle shimmer.",
    rarity: "RARE",
    assets: [
      {
        slug: "sakura-background",
        name: "Sakura Sky",
        slot: "APP_BACKGROUND",
        rarity: "RARE",
        config: {
          colors: { background: "#fdf2f8", glow: "#f9a8d4" },
          surface: "GRADIENT",
          texture: "FINE_NOISE",
          motion: "FLOATING_PARTICLES",
          reducedMotionMotion: "NONE",
          intensity: "LOW",
        },
      },
      {
        slug: "sakura-frame",
        name: "Sakura Frame",
        slot: "PROFILE_FRAME",
        rarity: "RARE",
        config: {
          colors: { border: "#f472b6", glow: "#f9a8d4" },
          shape: "SOFT",
          borderEffect: "GRADIENT_BORDER",
          motion: "SHIMMER",
          reducedMotionMotion: "NONE",
        },
      },
      {
        slug: "sakura-overview-card",
        name: "Sakura Card",
        slot: "OVERVIEW_CARD",
        rarity: "RARE",
        config: {
          colors: { surface: "#fff1f2", border: "#fbcfe8" },
          surface: "GLASS",
          borderEffect: "SHINE",
        },
      },
    ],
  },
  {
    slug: "midnight-galaxy",
    name: "Midnight Galaxy",
    description: "Deep space, quiet stars.",
    rarity: "EPIC",
    assets: [
      {
        slug: "galaxy-background",
        name: "Midnight Galaxy",
        slot: "APP_BACKGROUND",
        rarity: "EPIC",
        config: {
          colors: { background: "#0b1026", glow: "#6366f1" },
          surface: "GRADIENT",
          motion: "FLOATING_PARTICLES",
          reducedMotionMotion: "NONE",
          intensity: "MEDIUM",
          darkCompatible: true,
          lightCompatible: false,
        },
      },
      {
        slug: "galaxy-aura",
        name: "Nebula Aura",
        slot: "PROFILE_AURA",
        rarity: "EPIC",
        config: {
          colors: { glow: "#818cf8" },
          motion: "PULSE",
          reducedMotionMotion: "NONE",
          intensity: "MEDIUM",
        },
      },
      {
        slug: "galaxy-badge",
        name: "Stargazer Badge",
        slot: "PROFILE_BADGE",
        rarity: "SPECIAL",
        config: { colors: { primary: "#a5b4fc" }, shape: "PILL" },
      },
    ],
  },
  {
    slug: "cyber-finance",
    name: "Cyber Finance",
    description: "Neon grid, sharp edges.",
    rarity: "EPIC",
    assets: [
      {
        slug: "cyber-investment-card",
        name: "Cyber Ledger",
        slot: "INVESTMENT_CARD",
        rarity: "EPIC",
        config: {
          colors: { surface: "#0f172a", border: "#22d3ee", glow: "#22d3ee" },
          surface: "ELEVATED",
          borderEffect: "GLOW",
          shape: "SHARP",
        },
      },
      {
        slug: "cyber-overview-card",
        name: "Cyber Overview",
        slot: "OVERVIEW_CARD",
        rarity: "EPIC",
        config: {
          colors: { border: "#22d3ee", glow: "#06b6d4" },
          borderEffect: "GRADIENT_BORDER",
          shape: "SHARP",
        },
      },
      {
        slug: "cyber-background",
        name: "Neon Grid",
        slot: "APP_BACKGROUND",
        rarity: "EPIC",
        config: {
          colors: { background: "#05070f", glow: "#22d3ee" },
          texture: "FINE_NOISE",
          surface: "FLAT",
          intensity: "LOW",
        },
      },
    ],
  },
];

export async function seedCosmeticDemo(prisma: PrismaClient): Promise<void> {
  const now = new Date();
  let assetCount = 0;

  for (const [ci, col] of COLLECTIONS.entries()) {
    const collection = await prisma.cosmeticCollection.upsert({
      where: { slug: col.slug },
      create: {
        slug: col.slug,
        name: col.name,
        description: col.description,
        rarity: col.rarity,
        status: "PUBLISHED",
        isApplicableAsSet: true,
        sortOrder: ci + 1,
      },
      update: { status: "PUBLISHED", name: col.name, description: col.description },
    });

    for (const [ai, a] of col.assets.entries()) {
      // fail loudly if a demo config is invalid
      assetConfigV1Schema.parse(a.config);

      // Published config is IMMUTABLE. Re-seeding only creates missing rows and
      // touches safe metadata — it never rewrites `config`, `status`,
      // `publishedAt` or `slot` on an existing asset. To change a published
      // demo asset, bump its slug (a new row) instead.
      const existing = await prisma.cosmeticAsset.findUnique({
        where: { slug: a.slug },
        select: { id: true },
      });
      const asset = existing
        ? await prisma.cosmeticAsset.update({
            where: { slug: a.slug },
            data: { name: a.name, rarity: a.rarity },
          })
        : await prisma.cosmeticAsset.create({
            data: {
              slug: a.slug,
              name: a.name,
              slot: a.slot,
              rarity: a.rarity,
              status: "PUBLISHED",
              acquisitionType: "ADMIN_GRANT",
              configVersion: 1,
              config: a.config,
              publishedAt: now,
            },
          });
      assetCount += 1;

      await prisma.collectionAsset.upsert({
        where: {
          collectionId_assetId: {
            collectionId: collection.id,
            assetId: asset.id,
          },
        },
        create: {
          collectionId: collection.id,
          assetId: asset.id,
          slot: a.slot,
          sortOrder: ai,
        },
        update: { sortOrder: ai },
      });
    }
  }

  console.log(
    `[seed] cosmetics demo: ${COLLECTIONS.length} collections, ${assetCount} assets`,
  );
}
