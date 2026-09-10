/**
 * Seeds the "สงกรานต์" (Songkran) cosmetic collection: 18 library images, 15
 * assets — one per rendered slot — and the collection that bundles them.
 *
 * The artwork already lives in Wally's public Blob store, so this script only
 * writes rows and is safe to run against any environment:
 *
 *   npx tsx --tsconfig tsconfig.json scripts/seed-songkran-theme.ts
 *   DATABASE_URL=... DIRECT_URL=... npx tsx --tsconfig tsconfig.json scripts/seed-songkran-theme.ts
 *
 * Idempotent: media is keyed by URL and assets by slug, so re-running updates
 * in place rather than duplicating. It leaves the collection and its assets in
 * DRAFT — publishing is a deliberate admin action, and an asset's config
 * freezes the first time it is published.
 */
process.loadEnvFile(".env");
try {
  process.loadEnvFile(".env.local");
} catch {
  /* optional */
}

import { PrismaClient, type EquipmentSlot, type MediaUsage } from "@prisma/client";
import { parseAssetConfig } from "../src/lib/cosmetics/config";
import type { AssetConfigV2 } from "../src/lib/cosmetics/config";

const prisma = new PrismaClient();

const BLOB = "https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/songkran";
const PORTRAIT = { width: 752, height: 1344 };
const LANDSCAPE = { width: 1344, height: 752 };

/** Shared palette. Every asset draws its colours from these nine tokens. */
const C = {
  background: "#F2FAFD",
  surface: "#FFFFFF",
  primary: "#1CA5C9",
  text: "#10323D",
  muted: "#55707A",
  border: "#CDE7F0",
  glow: "#F2B23E",
  cash: "#2E9BD6",
  investment: "#8A6BE8",
} as const;

type MediaSeed = {
  file: string;
  name: string;
  usage: MediaUsage;
  width: number;
  height: number;
};

const MEDIA: MediaSeed[] = [
  { file: "01-background.png", name: "สงกรานต์ — พื้นหลังแอป", usage: "APP_BACKGROUND", ...PORTRAIT },
  { file: "02-ambient.png", name: "สงกรานต์ — ละอองน้ำ", usage: "AMBIENT_EFFECT", ...PORTRAIT },
  { file: "03-cover.png", name: "สงกรานต์ — ปกชุดธีม", usage: "COLLECTION_COVER", ...LANDSCAPE },
  { file: "04-app-background.png", name: "สงกรานต์ — ตัวอย่างพื้นหลังแอป", usage: "ASSET_PREVIEW", ...LANDSCAPE },
  { file: "05-ambient-effect.png", name: "สงกรานต์ — ตัวอย่างเอฟเฟกต์พื้นหลัง", usage: "ASSET_PREVIEW", ...LANDSCAPE },
  { file: "06-navigation.png", name: "สงกรานต์ — ตัวอย่างแถบเมนู", usage: "ASSET_PREVIEW", ...LANDSCAPE },
  { file: "07-header.png", name: "สงกรานต์ — ตัวอย่างแถบด้านบน", usage: "ASSET_PREVIEW", ...LANDSCAPE },
  { file: "08-overview-card.png", name: "สงกรานต์ — ตัวอย่างการ์ดภาพรวม", usage: "ASSET_PREVIEW", ...LANDSCAPE },
  { file: "09-account-card.png", name: "สงกรานต์ — ตัวอย่างการ์ดบัญชี", usage: "ASSET_PREVIEW", ...LANDSCAPE },
  { file: "10-investment-card.png", name: "สงกรานต์ — ตัวอย่างการ์ดการลงทุน", usage: "ASSET_PREVIEW", ...LANDSCAPE },
  { file: "11-transaction-card.png", name: "สงกรานต์ — ตัวอย่างรายการรับจ่าย", usage: "ASSET_PREVIEW", ...LANDSCAPE },
  { file: "12-profile-frame.png", name: "สงกรานต์ — ตัวอย่างกรอบโปรไฟล์", usage: "ASSET_PREVIEW", ...LANDSCAPE },
  { file: "13-profile-badge.png", name: "สงกรานต์ — ตัวอย่างป้ายโปรไฟล์", usage: "ASSET_PREVIEW", ...LANDSCAPE },
  { file: "14-profile-aura.png", name: "สงกรานต์ — ตัวอย่างแสงรอบโปรไฟล์", usage: "ASSET_PREVIEW", ...LANDSCAPE },
  { file: "15-chart-style.png", name: "สงกรานต์ — ตัวอย่างรูปแบบกราฟ", usage: "ASSET_PREVIEW", ...LANDSCAPE },
  { file: "16-icon-set.png", name: "สงกรานต์ — ตัวอย่างชุดไอคอน", usage: "ASSET_PREVIEW", ...LANDSCAPE },
  { file: "17-interaction-effect.png", name: "สงกรานต์ — ตัวอย่างเอฟเฟกต์ตอนกด", usage: "ASSET_PREVIEW", ...LANDSCAPE },
  { file: "18-celebration-effect.png", name: "สงกรานต์ — ตัวอย่างเอฟเฟกต์ฉลอง", usage: "ASSET_PREVIEW", ...LANDSCAPE },
];

type AssetSeed = {
  slug: string;
  name: string;
  description: string;
  slot: EquipmentSlot;
  preview: string;
  config: AssetConfigV2;
};

const pick = (...tokens: (keyof typeof C)[]) =>
  Object.fromEntries(tokens.map((t) => [t, C[t]]));

const ASSETS: AssetSeed[] = [
  {
    slug: "songkran-app-background",
    name: "สงกรานต์ — พื้นหลังสายน้ำ",
    description: "ท้องฟ้าเมษายนสีฟ้าจาง กลีบมะลิลอยที่ขอบบนและขอบล่าง",
    slot: "APP_BACKGROUND",
    preview: `${BLOB}/04-app-background.png`,
    config: { colors: pick("background", "primary", "glow"), surface: "GRADIENT", texture: "NONE", motion: "NONE", intensity: "LOW", mediaUrl: `${BLOB}/01-background.png` },
  },
  {
    slug: "songkran-ambient-effect",
    name: "สงกรานต์ — ละอองน้ำ",
    description: "ละอองน้ำและกลีบมะลิลอยบาง ๆ ทับพื้นหลัง",
    slot: "AMBIENT_EFFECT",
    preview: `${BLOB}/05-ambient-effect.png`,
    config: { colors: pick("background", "primary", "glow"), ambientEffect: "SOFT_GRAIN", intensity: "LOW", mediaUrl: `${BLOB}/02-ambient.png` },
  },
  {
    slug: "songkran-navigation",
    name: "สงกรานต์ — แถบเมนูน้ำใส",
    description: "แถบเมนูทรงแคปซูลกระจกฝ้า ขอบเรืองสีเทอร์คอยซ์",
    slot: "NAVIGATION",
    preview: `${BLOB}/06-navigation.png`,
    config: { colors: pick("surface", "primary", "text", "muted", "border", "glow"), shape: "PILL", surface: "GLASS", borderEffect: "NONE", intensity: "LOW" },
  },
  {
    slug: "songkran-header",
    name: "สงกรานต์ — แถบด้านบนใส",
    description: "แถบด้านบนโปร่งแสง มีเส้นน้ำบาง ๆ ใต้ขอบ",
    slot: "HEADER",
    preview: `${BLOB}/07-header.png`,
    config: { colors: pick("surface", "primary", "text", "muted", "border", "glow"), surface: "GLASS", borderEffect: "NONE", intensity: "LOW" },
  },
  {
    slug: "songkran-overview-card",
    name: "สงกรานต์ — การ์ดภาพรวมแสงแดด",
    description: "การ์ดใบเด่น ขอบไล่เฉดฟ้า-ทอง มีประกายน้ำวิ่งผ่าน",
    slot: "OVERVIEW_CARD",
    preview: `${BLOB}/08-overview-card.png`,
    config: { colors: pick("surface", "primary", "text", "muted", "border", "glow", "cash", "investment"), shape: "SOFT", surface: "ELEVATED", borderEffect: "GRADIENT_BORDER", motion: "SHIMMER", intensity: "LOW" },
  },
  {
    slug: "songkran-account-card",
    name: "สงกรานต์ — การ์ดบัญชีมะลิ",
    description: "การ์ดบัญชีขาวสะอาด ขอบฟ้าอ่อน",
    slot: "ACCOUNT_CARD",
    preview: `${BLOB}/09-account-card.png`,
    config: { colors: pick("surface", "primary", "text", "muted", "border", "glow"), shape: "SOFT", surface: "FLAT", borderEffect: "NONE", motion: "NONE", intensity: "LOW" },
  },
  {
    slug: "songkran-investment-card",
    name: "สงกรานต์ — การ์ดลงทุนสายน้ำ",
    description: "การ์ดพอร์ตลงทุน พื้นไล่เฉดน้ำใส",
    slot: "INVESTMENT_CARD",
    preview: `${BLOB}/10-investment-card.png`,
    config: { colors: pick("surface", "primary", "text", "muted", "border", "glow"), shape: "SOFT", surface: "GRADIENT", borderEffect: "NONE", motion: "NONE", intensity: "LOW" },
  },
  {
    slug: "songkran-transaction-card",
    name: "สงกรานต์ — รายการรับจ่ายใส",
    description: "แถวรายการเรียบ อ่านง่ายบนพื้นสว่าง",
    slot: "TRANSACTION_CARD",
    preview: `${BLOB}/11-transaction-card.png`,
    config: { colors: pick("surface", "primary", "text", "muted", "border", "glow"), shape: "ROUNDED", surface: "FLAT", borderEffect: "NONE", motion: "NONE", intensity: "LOW" },
  },
  {
    slug: "songkran-profile-frame",
    name: "สงกรานต์ — กรอบโปรไฟล์หยดน้ำ",
    description: "กรอบวงกลมไล่เฉดฟ้า-ทอง ประดับหยดน้ำ",
    slot: "PROFILE_FRAME",
    preview: `${BLOB}/12-profile-frame.png`,
    config: { colors: pick("primary", "border", "glow"), borderEffect: "SHINE", motion: "NONE", intensity: "MEDIUM" },
  },
  {
    slug: "songkran-profile-badge",
    name: "สงกรานต์ — ป้ายโปรไฟล์ทอง",
    description: "ป้ายทรงแคปซูลสีทองแดดเมษา",
    slot: "PROFILE_BADGE",
    preview: `${BLOB}/13-profile-badge.png`,
    config: { colors: pick("primary", "text", "border"), shape: "PILL" },
  },
  {
    slug: "songkran-profile-aura",
    name: "สงกรานต์ — แสงรอบโปรไฟล์แดดอ่อน",
    description: "ออร่าฟ้า-ทองฟุ้งรอบรูปโปรไฟล์",
    slot: "PROFILE_AURA",
    preview: `${BLOB}/14-profile-aura.png`,
    config: { colors: pick("primary", "glow"), motion: "PULSE", intensity: "LOW" },
  },
  {
    slug: "songkran-chart-style",
    name: "สงกรานต์ — กราฟสายน้ำ",
    description: "เส้นกราฟโค้งนุ่มเหมือนสายน้ำ",
    slot: "CHART_STYLE",
    preview: `${BLOB}/15-chart-style.png`,
    config: { colors: pick("primary", "muted", "glow"), chartStyle: "SMOOTH", intensity: "MEDIUM" },
  },
  {
    slug: "songkran-icon-set",
    name: "สงกรานต์ — ชุดไอคอนมนน้ำ",
    description: "ไอคอนเส้นมนโทนฟ้าเทอร์คอยซ์",
    slot: "ICON_SET",
    preview: `${BLOB}/16-icon-set.png`,
    config: { colors: pick("primary"), iconStyle: "ROUNDED" },
  },
  {
    slug: "songkran-interaction-effect",
    name: "สงกรานต์ — ระลอกน้ำตอนกด",
    description: "กดแล้วมีระลอกน้ำแผ่ออกจากจุดที่แตะ",
    slot: "INTERACTION_EFFECT",
    preview: `${BLOB}/17-interaction-effect.png`,
    config: { colors: pick("primary", "glow"), interactionEffect: "RIPPLE", intensity: "MEDIUM" },
  },
  {
    slug: "songkran-celebration-effect",
    name: "สงกรานต์ — ฉลองสาดน้ำ",
    description: "หยดน้ำและกลีบมะลิพุ่งกระจายตอนฉลอง",
    slot: "CELEBRATION_EFFECT",
    preview: `${BLOB}/18-celebration-effect.png`,
    config: { colors: pick("primary", "glow"), celebrationEffect: "CONFETTI", intensity: "MEDIUM" },
  },
];

async function main() {
  // Fail loudly before writing anything if a config would not survive the
  // validator the admin form and the renderer both run.
  for (const a of ASSETS) parseAssetConfig(2, a.config);

  for (const m of MEDIA) {
    const url = `${BLOB}/${m.file}`;
    const data = {
      name: m.name,
      url,
      pathname: `cosmetics/songkran/${m.file}`,
      mimeType: "image/png",
      sizeBytes: 0,
      width: m.width,
      height: m.height,
      usage: m.usage,
      status: "ACTIVE" as const,
    };
    await prisma.cosmeticMedia.upsert({ where: { url }, update: data, create: data });
  }
  console.log(`media: ${MEDIA.length} rows`);

  const collection = await prisma.cosmeticCollection.upsert({
    where: { slug: "songkran" },
    update: {},
    create: {
      slug: "songkran",
      name: "สงกรานต์",
      description: "ธีมสว่างรับเทศกาลสงกรานต์ — น้ำใส แดดเมษา และดอกมะลิ",
      coverUrl: `${BLOB}/03-cover.png`,
      rarity: "SPECIAL",
      status: "DRAFT",
      isApplicableAsSet: true,
    },
  });
  console.log(`collection: ${collection.slug} (${collection.status})`);

  for (const [i, a] of ASSETS.entries()) {
    const existing = await prisma.cosmeticAsset.findUnique({ where: { slug: a.slug } });
    if (existing?.publishedAt) {
      console.log(`  skip ${a.slug} — published, config is frozen`);
      continue;
    }
    const asset = await prisma.cosmeticAsset.upsert({
      where: { slug: a.slug },
      update: {
        name: a.name,
        description: a.description,
        previewUrl: a.preview,
        configVersion: 2,
        config: a.config,
      },
      create: {
        slug: a.slug,
        name: a.name,
        description: a.description,
        slot: a.slot,
        rarity: "SPECIAL",
        status: "DRAFT",
        acquisitionType: "LIMITED_EVENT",
        previewUrl: a.preview,
        configVersion: 2,
        config: a.config,
      },
    });
    await prisma.collectionAsset.upsert({
      where: { collectionId_assetId: { collectionId: collection.id, assetId: asset.id } },
      update: { sortOrder: i },
      create: { collectionId: collection.id, assetId: asset.id, slot: a.slot, sortOrder: i },
    });
  }
  console.log(`assets: ${ASSETS.length} linked to ${collection.slug}`);
}

void main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
