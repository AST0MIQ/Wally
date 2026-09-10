import { describe, expect, it } from "vitest";
import { MediaUsage as PrismaMediaUsage } from "@prisma/client";

import {
  MEDIA_USAGES,
  MEDIA_USAGE_SPECS,
  aspectRatioLabel,
  isMediaUsage,
  mediaSizeWarnings,
  ratioFits,
  usageForSlot,
} from "@/lib/cosmetics/media-usage";
import { EQUIPMENT_SLOTS, slotConfigFields } from "@/lib/cosmetics/slots";

describe("media usages", () => {
  it("stays in sync with the Prisma MediaUsage enum", () => {
    expect([...MEDIA_USAGES].sort()).toEqual(Object.values(PrismaMediaUsage).sort());
  });

  it("every usage has a spec whose ideal ratio sits inside its own band", () => {
    for (const usage of MEDIA_USAGES) {
      const spec = MEDIA_USAGE_SPECS[usage];
      expect(spec.label.length).toBeGreaterThan(0);
      expect(spec.minRatio).toBeLessThan(spec.idealRatio);
      expect(spec.maxRatio).toBeGreaterThan(spec.idealRatio);
    }
  });

  it("maps exactly the slots whose renderer paints an image", () => {
    const withMedia = EQUIPMENT_SLOTS.filter((slot) =>
      slotConfigFields(slot).includes("mediaUrl"),
    );
    const mapped = EQUIPMENT_SLOTS.filter((slot) => usageForSlot(slot) !== null);
    expect(mapped).toEqual(withMedia);
    expect(usageForSlot("PROFILE_FRAME")).toBeNull();
  });

  it("rejects unknown usage strings", () => {
    expect(isMediaUsage("APP_BACKGROUND")).toBe(true);
    expect(isMediaUsage("PROFILE_FRAME")).toBe(false);
    expect(isMediaUsage(null)).toBe(false);
  });
});

describe("aspectRatioLabel", () => {
  it("names common ratios", () => {
    expect(aspectRatioLabel(1280, 720)).toBe("16:9");
    expect(aspectRatioLabel(1080, 1920)).toBe("9:16");
    expect(aspectRatioLabel(1170, 2532)).toBe("9:19.5");
    expect(aspectRatioLabel(800, 800)).toBe("1:1");
    expect(aspectRatioLabel(1024, 768)).toBe("4:3");
  });

  it("falls back to a decimal for odd sizes", () => {
    expect(aspectRatioLabel(1000, 273)).toBe("3.66:1");
    expect(aspectRatioLabel(273, 1000)).toBe("1:3.66");
  });

  it("is defensive about missing dimensions", () => {
    expect(aspectRatioLabel(0, 100)).toBe("—");
  });
});

describe("ratio checks", () => {
  it("accepts phone-shaped images for the background", () => {
    expect(ratioFits("APP_BACKGROUND", 1170, 2532)).toBe(true);
    expect(ratioFits("APP_BACKGROUND", 1080, 1920)).toBe(true); // 9:16 phones
    expect(ratioFits("APP_BACKGROUND", 1280, 720)).toBe(false); // landscape
  });

  it("accepts wide images for previews and covers", () => {
    expect(ratioFits("ASSET_PREVIEW", 1280, 720)).toBe(true);
    expect(ratioFits("COLLECTION_COVER", 1200, 900)).toBe(false); // 4:3
  });

  it("warns about a wrong ratio and a small file, and stays quiet otherwise", () => {
    expect(mediaSizeWarnings("ASSET_PREVIEW", 1280, 720)).toEqual([]);
    const warnings = mediaSizeWarnings("ASSET_PREVIEW", 400, 400);
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toContain("1:1");
    expect(warnings[1]).toContain("640px");
  });

  it("says nothing when the dimensions are unknown", () => {
    expect(mediaSizeWarnings("APP_BACKGROUND", null, null)).toEqual([]);
  });
});
