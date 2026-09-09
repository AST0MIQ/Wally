/**
 * Demo cosmetics — seeded ONLY in development or when COSMETICS_SEED_DEMO=true.
 * Production Neon `main` never gets these. Idempotent: upsert by slug.
 */
import type { PrismaClient, EquipmentSlot, Prisma } from "@prisma/client";

import { parseAssetConfig } from "@/lib/cosmetics/config";

type DemoAsset = {
  slug: string;
  name: string;
  slot: EquipmentSlot;
  rarity: Prisma.CosmeticAssetCreateInput["rarity"];
  config: Prisma.InputJsonValue;
  /** defaults to 1; set 2 for configs that use the Phase 2 effect fields */
  configVersion?: number;
};

type DemoCollection = {
  slug: string;
  name: string;
  description: string;
  rarity: Prisma.CosmeticCollectionCreateInput["rarity"];
  assets: DemoAsset[];
};

/** Phase 2 effect fields — presence bumps a config to version 2. */
const V2_KEYS = [
  "chartStyle",
  "iconStyle",
  "typography",
  "ambientEffect",
  "interactionEffect",
  "celebrationEffect",
] as const;

function configVersionFor(asset: DemoAsset): number {
  if (asset.configVersion) return asset.configVersion;
  const keys = Object.keys(asset.config as Record<string, unknown>);
  return keys.some((k) => (V2_KEYS as readonly string[]).includes(k)) ? 2 : 1;
}

export const COLLECTIONS: DemoCollection[] = [
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
          borderEffect: "GRADIENT_BORDER",
          motion: "PULSE",
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
  {
    // Full-coverage cyberpunk set: one asset for every equipment slot.
    slug: "neon-nexus",
    name: "Neon Nexus",
    description:
      "Full cyberpunk override — every slot filled. Cyan / magenta / violet neon on black chrome, sharp edges, scanline grain.",
    rarity: "LIMITED",
    assets: [
      {
        slug: "neon-nexus-background",
        name: "Nexus Grid",
        slot: "APP_BACKGROUND",
        rarity: "LIMITED",
        config: {
          colors: { background: "#05060f", surface: "#0a0f1f", glow: "#22d3ee" },
          surface: "GRADIENT",
          texture: "FINE_NOISE",
          motion: "FLOATING_PARTICLES",
          intensity: "MEDIUM",
          darkCompatible: true,
          lightCompatible: false,
        },
      },
      {
        slug: "neon-nexus-navigation",
        name: "Chrome Deck",
        slot: "NAVIGATION",
        rarity: "LIMITED",
        config: {
          colors: { surface: "#0b0f1e", border: "#22d3ee", glow: "#22d3ee" },
          shape: "SHARP",
          surface: "GLASS",
          borderEffect: "GLOW",
          texture: "FINE_NOISE",
          intensity: "MEDIUM",
        },
      },
      {
        slug: "neon-nexus-header",
        name: "Datastream Bar",
        slot: "HEADER",
        rarity: "LIMITED",
        config: {
          colors: { surface: "#0b0f1e", border: "#ff2fb0", glow: "#ff2fb0" },
          surface: "GLASS",
          borderEffect: "GRADIENT_BORDER",
          texture: "FINE_NOISE",
          intensity: "LOW",
        },
      },
      {
        slug: "neon-nexus-profile-frame",
        name: "Circuit Frame",
        slot: "PROFILE_FRAME",
        rarity: "LIMITED",
        config: {
          colors: { border: "#22d3ee", glow: "#a855f7" },
          borderEffect: "GRADIENT_BORDER",
          motion: "PULSE",
          intensity: "MEDIUM",
        },
      },
      {
        slug: "neon-nexus-profile-badge",
        name: "Runner Badge",
        slot: "PROFILE_BADGE",
        rarity: "LIMITED",
        config: {
          colors: { primary: "#22d3ee" },
          shape: "SHARP",
        },
      },
      {
        slug: "neon-nexus-profile-aura",
        name: "Overclock Aura",
        slot: "PROFILE_AURA",
        rarity: "LIMITED",
        config: {
          colors: { glow: "#ff2fb0" },
          motion: "PULSE",
          intensity: "HIGH",
        },
      },
      {
        slug: "neon-nexus-overview-card",
        name: "HUD Overview",
        slot: "OVERVIEW_CARD",
        rarity: "LIMITED",
        config: {
          colors: {
            surface: "#0a0f1f",
            border: "#22d3ee",
            glow: "#22d3ee",
            text: "#e2e8f0",
          },
          shape: "SHARP",
          surface: "ELEVATED",
          borderEffect: "GLOW",
          texture: "FINE_NOISE",
          motion: "SHIMMER",
          intensity: "MEDIUM",
        },
      },
      {
        slug: "neon-nexus-account-card",
        name: "Credchip Card",
        slot: "ACCOUNT_CARD",
        rarity: "LIMITED",
        config: {
          colors: {
            surface: "#0b1020",
            border: "#a855f7",
            glow: "#a855f7",
            text: "#ede9fe",
          },
          shape: "SHARP",
          surface: "ELEVATED",
          borderEffect: "GRADIENT_BORDER",
          motion: "SHIMMER",
          intensity: "LOW",
        },
      },
      {
        slug: "neon-nexus-investment-card",
        name: "Market Uplink",
        slot: "INVESTMENT_CARD",
        rarity: "LIMITED",
        config: {
          colors: {
            surface: "#0a0f1f",
            border: "#ff2fb0",
            glow: "#ff2fb0",
            text: "#ffe4f3",
          },
          shape: "SHARP",
          surface: "ELEVATED",
          borderEffect: "GLOW",
          motion: "PULSE",
          intensity: "MEDIUM",
        },
      },
      {
        slug: "neon-nexus-transaction-card",
        name: "Ledger Terminal",
        slot: "TRANSACTION_CARD",
        rarity: "LIMITED",
        config: {
          colors: {
            surface: "#0b0f1e",
            border: "#22d3ee",
            glow: "#22d3ee",
            text: "#e0f2fe",
          },
          shape: "SHARP",
          surface: "GLASS",
          borderEffect: "SHINE",
          intensity: "LOW",
        },
      },
      {
        slug: "neon-nexus-chart-style",
        name: "Neon Trace",
        slot: "CHART_STYLE",
        rarity: "LIMITED",
        config: {
          colors: { primary: "#22d3ee", glow: "#ff2fb0" },
          chartStyle: "NEON",
          intensity: "MEDIUM",
        },
      },
      {
        slug: "neon-nexus-icon-set",
        name: "Hexdroid Icons",
        slot: "ICON_SET",
        rarity: "LIMITED",
        config: {
          colors: { primary: "#22d3ee" },
          iconStyle: "DUOTONE",
        },
      },
      {
        slug: "neon-nexus-typography",
        name: "Terminal Type",
        slot: "TYPOGRAPHY",
        rarity: "LIMITED",
        config: {
          colors: { text: "#e2e8f0" },
          typography: "COMPACT",
        },
      },
      {
        slug: "neon-nexus-ambient-effect",
        name: "Holo Orbs",
        slot: "AMBIENT_EFFECT",
        rarity: "LIMITED",
        config: {
          colors: { glow: "#ff2fb0" },
          ambientEffect: "GLOW_ORBS",
          intensity: "MEDIUM",
        },
      },
      {
        slug: "neon-nexus-interaction-effect",
        name: "Pulse Tap",
        slot: "INTERACTION_EFFECT",
        rarity: "LIMITED",
        config: {
          colors: { glow: "#22d3ee" },
          interactionEffect: "GLOW_TAP",
          intensity: "MEDIUM",
        },
      },
      {
        slug: "neon-nexus-celebration-effect",
        name: "Data Burst",
        slot: "CELEBRATION_EFFECT",
        rarity: "LIMITED",
        config: {
          colors: { glow: "#a855f7" },
          celebrationEffect: "SPARKLE",
          intensity: "HIGH",
        },
      },
    ],
  },
  {
    // Full-coverage minimal / retro set: one asset for every equipment slot.
    slug: "analog-paper",
    name: "Analog Paper",
    description:
      "Minimal retro — warm paper, muted ink, soft grain. No glow, no motion; rounded corners and a printed feel throughout.",
    rarity: "RARE",
    assets: [
      {
        slug: "analog-paper-background",
        name: "Paper Stock",
        slot: "APP_BACKGROUND",
        rarity: "RARE",
        config: {
          colors: { background: "#f3ede0", surface: "#efe7d6", glow: "#d9a441" },
          surface: "GRADIENT",
          texture: "FINE_NOISE",
          intensity: "LOW",
          lightCompatible: true,
          darkCompatible: false,
        },
      },
      {
        slug: "analog-paper-navigation",
        name: "Ruled Nav",
        slot: "NAVIGATION",
        rarity: "RARE",
        config: {
          colors: { surface: "#efe7d6", border: "#d8cfbc" },
          shape: "ROUNDED",
          surface: "FLAT",
          texture: "FINE_NOISE",
          intensity: "LOW",
        },
      },
      {
        slug: "analog-paper-header",
        name: "Masthead",
        slot: "HEADER",
        rarity: "RARE",
        config: {
          colors: { surface: "#efe7d6", border: "#d8cfbc" },
          surface: "FLAT",
          texture: "FINE_NOISE",
          intensity: "LOW",
        },
      },
      {
        slug: "analog-paper-profile-frame",
        name: "Stamp Frame",
        slot: "PROFILE_FRAME",
        rarity: "RARE",
        config: {
          colors: { border: "#b5533a", glow: "#d9a441" },
          borderEffect: "GRADIENT_BORDER",
          intensity: "LOW",
        },
      },
      {
        slug: "analog-paper-profile-badge",
        name: "Ink Badge",
        slot: "PROFILE_BADGE",
        rarity: "RARE",
        config: {
          colors: { primary: "#3f7d76" },
          shape: "ROUNDED",
        },
      },
      {
        slug: "analog-paper-profile-aura",
        name: "Warm Halo",
        slot: "PROFILE_AURA",
        rarity: "RARE",
        config: {
          colors: { glow: "#d9a441" },
          intensity: "LOW",
        },
      },
      {
        slug: "analog-paper-overview-card",
        name: "Cover Sheet",
        slot: "OVERVIEW_CARD",
        rarity: "RARE",
        config: {
          colors: { surface: "#faf5e9", border: "#d8cfbc", text: "#2b2b28" },
          shape: "ROUNDED",
          surface: "FLAT",
          texture: "FINE_NOISE",
          intensity: "LOW",
        },
      },
      {
        slug: "analog-paper-account-card",
        name: "Index Card",
        slot: "ACCOUNT_CARD",
        rarity: "RARE",
        config: {
          colors: { surface: "#f6efdf", border: "#d8cfbc", text: "#2b2b28" },
          shape: "ROUNDED",
          surface: "FLAT",
          texture: "FINE_NOISE",
          intensity: "LOW",
        },
      },
      {
        slug: "analog-paper-investment-card",
        name: "Ledger Sheet",
        slot: "INVESTMENT_CARD",
        rarity: "RARE",
        config: {
          colors: { surface: "#f6efdf", border: "#3f7d76", text: "#22302e" },
          shape: "ROUNDED",
          surface: "FLAT",
          texture: "FINE_NOISE",
          intensity: "LOW",
        },
      },
      {
        slug: "analog-paper-transaction-card",
        name: "Receipt Slip",
        slot: "TRANSACTION_CARD",
        rarity: "RARE",
        config: {
          colors: { surface: "#faf5e9", border: "#d8cfbc", text: "#2b2b28" },
          shape: "ROUNDED",
          surface: "FLAT",
          intensity: "LOW",
        },
      },
      {
        slug: "analog-paper-chart-style",
        name: "Dashed Plot",
        slot: "CHART_STYLE",
        rarity: "RARE",
        config: {
          colors: { primary: "#b5533a", glow: "#d9a441" },
          chartStyle: "DOTTED",
          intensity: "LOW",
        },
      },
      {
        slug: "analog-paper-icon-set",
        name: "Soft Icons",
        slot: "ICON_SET",
        rarity: "RARE",
        config: {
          colors: { primary: "#3f7d76" },
          iconStyle: "ROUNDED",
        },
      },
      {
        slug: "analog-paper-typography",
        name: "Newsprint Type",
        slot: "TYPOGRAPHY",
        rarity: "RARE",
        config: {
          colors: { text: "#2b2b28" },
          typography: "EDITORIAL",
        },
      },
      {
        slug: "analog-paper-ambient-effect",
        name: "Paper Grain",
        slot: "AMBIENT_EFFECT",
        rarity: "RARE",
        config: {
          colors: { muted: "#8a8578" },
          ambientEffect: "SOFT_GRAIN",
          intensity: "LOW",
        },
      },
      {
        slug: "analog-paper-interaction-effect",
        name: "Gentle Lift",
        slot: "INTERACTION_EFFECT",
        rarity: "RARE",
        config: {
          colors: { glow: "#d9a441" },
          interactionEffect: "SOFT_LIFT",
          intensity: "LOW",
        },
      },
      {
        slug: "analog-paper-celebration-effect",
        name: "Quiet Rings",
        slot: "CELEBRATION_EFFECT",
        rarity: "RARE",
        config: {
          colors: { glow: "#b5533a" },
          celebrationEffect: "RINGS",
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
      const version = configVersionFor(a);
      // fail loudly if a demo config is invalid for its version
      parseAssetConfig(version, a.config);

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
              configVersion: version,
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
