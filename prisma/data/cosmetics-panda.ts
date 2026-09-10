/**
 * "แพนด้า" (Panda) collection data — a light theme of rice-paper cream,
 * charcoal and muted bamboo sage.
 *
 * Unlike the earlier collections, three of its slots carry real artwork the
 * renderer paints directly rather than a shop picture: the app background, and
 * — new in this theme — the avatar frame and badge, which are transparent PNGs
 * drawn in place of the CSS ring and dot.
 *
 * Single source of truth for the seed script and the generated data migration.
 */
import type { EquipmentSlot, MediaUsage } from "@prisma/client";
import type { AssetConfigV2 } from "../../src/lib/cosmetics/config";

export const BLOB = "https://pvffworkoolfc7yl.public.blob.vercel-storage.com/cosmetics/panda";

/**
 * Sage carries the theme rather than a green primary: strong green and red are
 * reserved for income and expense, and must not read as a theme colour.
 */
export const C = {
  background: "#F6F2E9",
  surface: "#FFFFFF",
  primary: "#3A4149",
  text: "#1E2328",
  muted: "#6B7280",
  border: "#E2DCCF",
  glow: "#8FAF9B",
  cash: "#5B8DBE",
  investment: "#A98BC9",
} as const;

export type MediaSeed = {
  file: string;
  name: string;
  usage: MediaUsage;
  width: number;
  height: number;
};

const PREVIEW = { usage: "ASSET_PREVIEW" as MediaUsage, width: 1280, height: 720 };

export const MEDIA: MediaSeed[] = [
  { file: "01-background.png", name: "แพนด้า — พื้นหลังแอป", usage: "APP_BACKGROUND", width: 752, height: 1344 },
  { file: "02-profile-frame.png", name: "แพนด้า — กรอบไผ่ (ภาพใช้จริง)", usage: "PROFILE_FRAME", width: 1024, height: 1024 },
  { file: "03-cover.png", name: "แพนด้า — ปกชุดธีม", usage: "COLLECTION_COVER", width: 1344, height: 752 },
  { file: "04-profile-badge.png", name: "แพนด้า — ป้ายหน้าแพนด้า (ภาพใช้จริง)", usage: "PROFILE_BADGE", width: 1024, height: 1024 },
  { file: "p-app-background.png", name: "แพนด้า — ตัวอย่างพื้นหลังแอป", ...PREVIEW },
  { file: "p-ambient-effect.png", name: "แพนด้า — ตัวอย่างเอฟเฟกต์พื้นหลัง", ...PREVIEW },
  { file: "p-navigation.png", name: "แพนด้า — ตัวอย่างแถบเมนู", ...PREVIEW },
  { file: "p-header.png", name: "แพนด้า — ตัวอย่างแถบด้านบน", ...PREVIEW },
  { file: "p-overview-card.png", name: "แพนด้า — ตัวอย่างการ์ดภาพรวม", ...PREVIEW },
  { file: "p-account-card.png", name: "แพนด้า — ตัวอย่างการ์ดบัญชี", ...PREVIEW },
  { file: "p-investment-card.png", name: "แพนด้า — ตัวอย่างการ์ดการลงทุน", ...PREVIEW },
  { file: "p-transaction-card.png", name: "แพนด้า — ตัวอย่างรายการรับจ่าย", ...PREVIEW },
  { file: "p-profile-frame.png", name: "แพนด้า — ตัวอย่างกรอบโปรไฟล์", ...PREVIEW },
  { file: "p-profile-badge.png", name: "แพนด้า — ตัวอย่างป้ายโปรไฟล์", ...PREVIEW },
  { file: "p-profile-aura.png", name: "แพนด้า — ตัวอย่างแสงรอบโปรไฟล์", ...PREVIEW },
  { file: "p-chart-style.png", name: "แพนด้า — ตัวอย่างรูปแบบกราฟ", ...PREVIEW },
  { file: "p-icon-set.png", name: "แพนด้า — ตัวอย่างชุดไอคอน", ...PREVIEW },
  { file: "p-interaction-effect.png", name: "แพนด้า — ตัวอย่างเอฟเฟกต์ตอนกด", ...PREVIEW },
  { file: "p-celebration-effect.png", name: "แพนด้า — ตัวอย่างเอฟเฟกต์ฉลอง", ...PREVIEW },
];

export type AssetSeed = {
  slug: string;
  name: string;
  description: string;
  slot: EquipmentSlot;
  preview: string;
  config: AssetConfigV2;
};

const pick = (...tokens: (keyof typeof C)[]) =>
  Object.fromEntries(tokens.map((t) => [t, C[t]]));

export const ASSETS: AssetSeed[] = [
  {
    slug: "panda-app-background",
    name: "แพนด้า — พื้นหลังป่าไผ่",
    description: "กระดาษสาสีครีม มีเงาลำไผ่ที่ขอบบนและขอบล่าง",
    slot: "APP_BACKGROUND",
    preview: `${BLOB}/p-app-background.png`,
    config: { colors: pick("background", "primary", "glow"), surface: "FLAT", texture: "FINE_NOISE", motion: "NONE", intensity: "LOW", mediaUrl: `${BLOB}/01-background.png` },
  },
  {
    slug: "panda-profile-frame",
    name: "แพนด้า — กรอบไผ่",
    description: "กรอบไผ่พร้อมหูแพนด้า เป็นภาพจริงที่วาดล้อมรูปโปรไฟล์",
    slot: "PROFILE_FRAME",
    preview: `${BLOB}/p-profile-frame.png`,
    config: { colors: pick("primary", "border", "glow"), motion: "NONE", intensity: "LOW", mediaUrl: `${BLOB}/02-profile-frame.png` },
  },
  {
    slug: "panda-profile-badge",
    name: "แพนด้า — ป้ายหน้าแพนด้า",
    description: "ป้ายรูปหน้าแพนด้า เป็นภาพจริงที่ติดมุมรูปโปรไฟล์",
    slot: "PROFILE_BADGE",
    preview: `${BLOB}/p-profile-badge.png`,
    config: { colors: pick("primary", "text", "border"), mediaUrl: `${BLOB}/04-profile-badge.png` },
  },
  {
    slug: "panda-ambient-effect",
    name: "แพนด้า — ใบไผ่ปลิว",
    description: "ผงกระดาษสาบาง ๆ ลอยทับพื้นหลัง",
    slot: "AMBIENT_EFFECT",
    preview: `${BLOB}/p-ambient-effect.png`,
    config: { colors: pick("background", "primary", "glow"), ambientEffect: "SOFT_GRAIN", intensity: "LOW" },
  },
  {
    slug: "panda-navigation",
    name: "แพนด้า — แถบเมนูกระดาษสา",
    description: "แถบเมนูทรงแคปซูลพื้นขาวนวล",
    slot: "NAVIGATION",
    preview: `${BLOB}/p-navigation.png`,
    config: { colors: pick("surface", "primary", "text", "muted", "border", "glow"), shape: "PILL", surface: "FLAT", borderEffect: "NONE", intensity: "LOW" },
  },
  {
    slug: "panda-header",
    name: "แพนด้า — แถบด้านบนไผ่",
    description: "แถบด้านบนเรียบ มีเส้นไผ่บาง ๆ ใต้ขอบ",
    slot: "HEADER",
    preview: `${BLOB}/p-header.png`,
    config: { colors: pick("surface", "primary", "text", "muted", "border", "glow"), surface: "FLAT", borderEffect: "NONE", intensity: "LOW" },
  },
  {
    slug: "panda-overview-card",
    name: "แพนด้า — การ์ดภาพรวมกระดาษสา",
    description: "การ์ดใบเด่น ขอบนุ่ม ยกตัวเล็กน้อย",
    slot: "OVERVIEW_CARD",
    preview: `${BLOB}/p-overview-card.png`,
    config: { colors: pick("surface", "primary", "text", "muted", "border", "glow", "cash", "investment"), shape: "SOFT", surface: "ELEVATED", borderEffect: "NONE", texture: "FINE_NOISE", motion: "NONE", intensity: "LOW" },
  },
  {
    slug: "panda-account-card",
    name: "แพนด้า — การ์ดบัญชีกระดาษ",
    description: "การ์ดบัญชีเรียบ อ่านง่าย",
    slot: "ACCOUNT_CARD",
    preview: `${BLOB}/p-account-card.png`,
    config: { colors: pick("surface", "primary", "text", "muted", "border", "glow"), shape: "SOFT", surface: "FLAT", borderEffect: "NONE", motion: "NONE", intensity: "LOW" },
  },
  {
    slug: "panda-investment-card",
    name: "แพนด้า — การ์ดลงทุนหน่อไผ่",
    description: "การ์ดพอร์ตลงทุนโทนครีม",
    slot: "INVESTMENT_CARD",
    preview: `${BLOB}/p-investment-card.png`,
    config: { colors: pick("surface", "primary", "text", "muted", "border", "glow"), shape: "SOFT", surface: "FLAT", borderEffect: "NONE", motion: "NONE", intensity: "LOW" },
  },
  {
    slug: "panda-transaction-card",
    name: "แพนด้า — รายการรับจ่ายเรียบ",
    description: "แถวรายการเรียงเป็นระเบียบบนพื้นครีม",
    slot: "TRANSACTION_CARD",
    preview: `${BLOB}/p-transaction-card.png`,
    config: { colors: pick("surface", "primary", "text", "muted", "border", "glow"), shape: "ROUNDED", surface: "FLAT", borderEffect: "NONE", motion: "NONE", intensity: "LOW" },
  },
  {
    slug: "panda-profile-aura",
    name: "แพนด้า — แสงรอบโปรไฟล์ไผ่",
    description: "ออร่าสีไผ่นวล ๆ รอบรูปโปรไฟล์",
    slot: "PROFILE_AURA",
    preview: `${BLOB}/p-profile-aura.png`,
    config: { colors: pick("primary", "glow"), motion: "NONE", intensity: "LOW" },
  },
  {
    slug: "panda-chart-style",
    name: "แพนด้า — กราฟหน่อไผ่",
    description: "เส้นกราฟโค้งนุ่มโทนไผ่",
    slot: "CHART_STYLE",
    preview: `${BLOB}/p-chart-style.png`,
    config: { colors: pick("primary", "muted", "glow"), chartStyle: "SMOOTH", intensity: "MEDIUM" },
  },
  {
    slug: "panda-icon-set",
    name: "แพนด้า — ชุดไอคอนมน",
    description: "ไอคอนเส้นมนโทนถ่านกับไผ่",
    slot: "ICON_SET",
    preview: `${BLOB}/p-icon-set.png`,
    config: { colors: pick("primary"), iconStyle: "ROUNDED" },
  },
  {
    slug: "panda-interaction-effect",
    name: "แพนด้า — สัมผัสนุ่ม",
    description: "กดแล้วปุ่มยกตัวขึ้นเบา ๆ",
    slot: "INTERACTION_EFFECT",
    preview: `${BLOB}/p-interaction-effect.png`,
    config: { colors: pick("primary", "glow"), interactionEffect: "SOFT_LIFT", intensity: "LOW" },
  },
  {
    slug: "panda-celebration-effect",
    name: "แพนด้า — ฉลองใบไผ่",
    description: "ใบไผ่ปลิวกระจายตอนฉลอง",
    slot: "CELEBRATION_EFFECT",
    preview: `${BLOB}/p-celebration-effect.png`,
    config: { colors: pick("primary", "glow"), celebrationEffect: "SPARKLE", intensity: "MEDIUM" },
  },
];

export const COLLECTION = {
  slug: "panda",
  name: "แพนด้า",
  description: "ธีมสว่างโทนกระดาษสา ถ่าน และไผ่ — กรอบและป้ายโปรไฟล์เป็นภาพจริง",
  coverUrl: `${BLOB}/03-cover.png`,
  rarity: "SPECIAL",
} as const;
