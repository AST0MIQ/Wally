import { describe, expect, it } from "vitest";

import {
  assetCreateSchema,
  rewardRuleCreateSchema,
  zSlug,
} from "@/lib/validation/cosmetics";

describe("cosmetics validation", () => {
  it("slug is lowercase-kebab", () => {
    expect(zSlug.safeParse("sakura-frame").success).toBe(true);
    expect(zSlug.safeParse("Sakura_Frame").success).toBe(false);
    expect(zSlug.safeParse("a").success).toBe(false);
  });

  it("asset create requires a slot and a valid config", () => {
    const base = { slug: "x-y", name: "XY", config: {} };
    expect(assetCreateSchema.safeParse(base).success).toBe(false); // no slot
    expect(
      assetCreateSchema.safeParse({ ...base, slot: "APP_BACKGROUND" }).success,
    ).toBe(true);
    expect(
      assetCreateSchema.safeParse({
        ...base,
        slot: "APP_BACKGROUND",
        config: { css: "x" },
      }).success,
    ).toBe(false); // config rejects unknown keys
  });

  it("[S9] reward rule grants exactly one target", () => {
    const base = { key: "r-1", name: "R1", trigger: "MANUAL" as const };
    expect(rewardRuleCreateSchema.safeParse(base).success).toBe(false); // neither
    expect(
      rewardRuleCreateSchema.safeParse({ ...base, grantsAssetId: "a", grantsCollectionId: "c" })
        .success,
    ).toBe(false); // both
    expect(
      rewardRuleCreateSchema.safeParse({ ...base, grantsAssetId: "a" }).success,
    ).toBe(true);
    expect(
      rewardRuleCreateSchema.safeParse({ ...base, grantsCollectionId: "c" }).success,
    ).toBe(true);
  });
});
