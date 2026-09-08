import { describe, expect, it } from "vitest";
import { appSettingUpsertSchema, featureFlagUpsertSchema } from "@/lib/validation/operations";

describe("runtime operations validation", () => {
  it("accepts stable dotted keys and rejects secret-like formatting", () => {
    expect(featureFlagUpsertSchema.safeParse({ key: "cosmetics.shop", name: "Theme shop", enabled: true }).success).toBe(true);
    expect(featureFlagUpsertSchema.safeParse({ key: "API KEY", name: "Bad" }).success).toBe(false);
  });

  it("caps runtime setting payloads", () => {
    expect(appSettingUpsertSchema.safeParse({ key: "cosmetics.limit", name: "Limit", value: "8" }).success).toBe(true);
    expect(appSettingUpsertSchema.safeParse({ key: "cosmetics.limit", name: "Limit", value: "x".repeat(10_001) }).success).toBe(false);
  });
});
