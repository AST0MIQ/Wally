/**
 * Where an uploaded image is actually painted.
 *
 * Only four places in Wally ever show an admin-uploaded image, so the library
 * is tagged with exactly those four — one usage per image. Every other
 * equipment slot is drawn from CSS tokens alone (see `SLOT_CONFIG_FIELDS`),
 * so offering them here would let an admin file an image that never renders.
 *
 * Each usage carries the aspect ratio the surface actually needs. The ratio is
 * advisory: an off-ratio image still uploads, it just gets a warning, because
 * every surface here crops with `object-fit: cover` rather than failing.
 */

/**
 * Upload ceiling, shared by the client pre-check and the server guard. It is
 * pinned to `serverActions.bodySizeLimit` in next.config.ts, which is itself
 * bounded by Vercel's 4.5 MB serverless request body: a larger file is
 * rejected by the platform before any of our code runs.
 */
export const MEDIA_MAX_BYTES = 4 * 1024 * 1024;
export const MEDIA_MAX_MB = MEDIA_MAX_BYTES / 1024 / 1024;

export const MEDIA_ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export const MEDIA_USAGES = [
  "APP_BACKGROUND",
  "AMBIENT_EFFECT",
  "PROFILE_FRAME",
  "PROFILE_BADGE",
  "ASSET_PREVIEW",
  "COLLECTION_COVER",
] as const;

export type MediaUsage = (typeof MEDIA_USAGES)[number];

export type MediaUsageSpec = {
  /** Thai label shown in admin. */
  label: string;
  /** Where this image ends up, in the admin's words. */
  where: string;
  /** Human ratio, e.g. "9:19.5". */
  ratioLabel: string;
  /** Concrete pixel size to aim for. */
  recommendedSize: string;
  /** width / height of `recommendedSize`. */
  idealRatio: number;
  /** Accepted band around the ideal — outside this we warn. */
  minRatio: number;
  maxRatio: number;
  /** Below this the image looks soft on a 3x screen. */
  minWidth: number;
  /** Extra authoring note (transparency, safe area…). */
  note: string;
};

const PORTRAIT = {
  ratioLabel: "9:19.5 (แนวตั้ง)",
  recommendedSize: "1170 × 2532 px",
  idealRatio: 9 / 19.5,
  minRatio: 0.4,
  maxRatio: 0.58,
  minWidth: 720,
} as const;

/** Square, transparent, drawn over a round avatar. */
const AVATAR = {
  ratioLabel: "1:1 (จัตุรัส)",
  recommendedSize: "512 × 512 px",
  idealRatio: 1,
  minRatio: 0.95,
  maxRatio: 1.05,
  minWidth: 256,
} as const;

const LANDSCAPE = {
  ratioLabel: "16:9 (แนวนอน)",
  recommendedSize: "1280 × 720 px",
  idealRatio: 16 / 9,
  minRatio: 1.5,
  maxRatio: 2,
  minWidth: 640,
} as const;

export const MEDIA_USAGE_SPECS: Record<MediaUsage, MediaUsageSpec> = {
  APP_BACKGROUND: {
    ...PORTRAIT,
    label: "พื้นหลังแอป",
    where: "ภาพเต็มจอด้านหลังทุกหน้าของแอป",
    note: "ภาพถูกครอบให้เต็มจอ จุดเด่นควรอยู่กลางภาพ",
  },
  AMBIENT_EFFECT: {
    ...PORTRAIT,
    label: "เอฟเฟกต์พื้นหลัง",
    where: "เลเยอร์เอฟเฟกต์ที่ซ้อนทับพื้นหลังอีกชั้น",
    note: "ควรเป็น PNG หรือ WebP พื้นหลังโปร่งใส ไม่อย่างนั้นจะบังพื้นหลังจนมิด",
  },
  PROFILE_FRAME: {
    ...AVATAR,
    label: "กรอบโปรไฟล์",
    where: "วงกรอบที่วาดล้อมรูปโปรไฟล์จริง",
    note: "ต้องเป็น PNG พื้นหลังโปร่งใส และตรงกลางต้องกลวง ไม่งั้นจะบังรูปโปรไฟล์",
  },
  PROFILE_BADGE: {
    ...AVATAR,
    label: "ป้ายโปรไฟล์",
    where: "ป้ายเล็กมุมขวาล่างของรูปโปรไฟล์",
    note: "PNG พื้นหลังโปร่งใส ตัวป้ายควรเต็มเฟรมเพราะถูกย่อเหลือ 44% ของรูปโปรไฟล์",
  },
  ASSET_PREVIEW: {
    ...LANDSCAPE,
    label: "รูปตัวอย่างไอเทม",
    where: "แถบรูปบนการ์ดไอเทมในร้านค้าและกระเป๋าของผู้ใช้",
    note: "เป็นรูปโฆษณาไอเทม ไม่ได้ถูกนำไปแสดงเป็นธีมจริง",
  },
  COLLECTION_COVER: {
    ...LANDSCAPE,
    label: "ปกชุดธีม",
    where: "ภาพปกของชุดธีมในหน้าแอดมิน",
    note: "ใช้เป็นภาพจำของชุดธีม ควรเห็นบรรยากาศรวมของทั้งชุด",
  },
};

export function isMediaUsage(v: unknown): v is MediaUsage {
  return typeof v === "string" && (MEDIA_USAGES as readonly string[]).includes(v);
}

export function mediaUsageSpec(usage: string): MediaUsageSpec {
  return MEDIA_USAGE_SPECS[usage as MediaUsage] ?? MEDIA_USAGE_SPECS.APP_BACKGROUND;
}

/**
 * The usage an equipment slot draws its `config.mediaUrl` from, or null for the
 * slots the renderer paints without any image.
 */
export function usageForSlot(slot: string): MediaUsage | null {
  switch (slot) {
    case "APP_BACKGROUND": return "APP_BACKGROUND";
    case "AMBIENT_EFFECT": return "AMBIENT_EFFECT";
    case "PROFILE_FRAME": return "PROFILE_FRAME";
    case "PROFILE_BADGE": return "PROFILE_BADGE";
    default: return null;
  }
}

const COMMON_RATIOS: readonly (readonly [string, number])[] = [
  ["21:9", 21 / 9],
  ["2:1", 2],
  ["16:9", 16 / 9],
  ["16:10", 1.6],
  ["3:2", 1.5],
  ["4:3", 4 / 3],
  ["5:4", 1.25],
  ["1:1", 1],
  ["4:5", 0.8],
  ["3:4", 0.75],
  ["2:3", 2 / 3],
  ["9:16", 0.5625],
  ["9:19.5", 9 / 19.5],
  ["9:20", 0.45],
];

/** "1280×720" → "16:9". Falls back to a decimal ratio for odd sizes. */
export function aspectRatioLabel(width: number, height: number): string {
  if (!(width > 0) || !(height > 0)) return "—";
  const ratio = width / height;
  let best = "";
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const [label, value] of COMMON_RATIOS) {
    const diff = Math.abs(value - ratio) / ratio;
    if (diff < bestDiff) {
      best = label;
      bestDiff = diff;
    }
  }
  if (bestDiff <= 0.02) return best;
  return ratio >= 1 ? `${ratio.toFixed(2)}:1` : `1:${(1 / ratio).toFixed(2)}`;
}

export function ratioFits(usage: string, width: number, height: number): boolean {
  const spec = mediaUsageSpec(usage);
  if (!(width > 0) || !(height > 0)) return true;
  const ratio = width / height;
  return ratio >= spec.minRatio && ratio <= spec.maxRatio;
}

/**
 * Advisory problems with an image for the usage it is filed under. Empty array
 * means "as recommended". Never blocks an upload — the surfaces all crop.
 */
export function mediaSizeWarnings(
  usage: string,
  width?: number | null,
  height?: number | null,
): string[] {
  if (!width || !height) return [];
  const spec = mediaUsageSpec(usage);
  const warnings: string[] = [];
  if (!ratioFits(usage, width, height)) {
    warnings.push(
      `อัตราส่วน ${aspectRatioLabel(width, height)} ต่างจาก ${spec.ratioLabel} ที่แนะนำ ภาพจะถูกครอบตัดบางส่วน`,
    );
  }
  if (width < spec.minWidth) {
    warnings.push(
      `กว้าง ${width}px น้อยกว่า ${spec.minWidth}px ที่แนะนำ ภาพอาจดูไม่คม`,
    );
  }
  return warnings;
}
