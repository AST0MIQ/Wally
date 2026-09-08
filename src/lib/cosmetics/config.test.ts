import { describe, expect, it } from "vitest";

import {
  assetConfigV1Schema,
  parseAssetConfig,
  safeParseAssetConfig,
} from "@/lib/cosmetics/config";

describe("cosmetic asset config v1", () => {
  it("accepts a valid config", () => {
    const cfg = {
      colors: { background: "#0b1026", glow: "#6366f1" },
      surface: "GRADIENT",
      borderEffect: "GLOW",
      texture: "FINE_NOISE",
      motion: "FLOATING_PARTICLES",
      reducedMotionMotion: "NONE",
      intensity: "MEDIUM",
      mediaUrl: "/cosmetics/bg/galaxy.webp",
      minComponentVersion: "1.4",
    };
    const parsed = parseAssetConfig(1, cfg);
    expect(parsed.surface).toBe("GRADIENT");
    expect(parsed.motion).toBe("FLOATING_PARTICLES");
  });

  it("rejects unknown keys (no css / style / script smuggling)", () => {
    for (const key of ["css", "style", "script", "html", "onClick"]) {
      expect(assetConfigV1Schema.safeParse({ [key]: "x" }).success).toBe(false);
    }
  });

  it("rejects non-hex colours", () => {
    expect(
      assetConfigV1Schema.safeParse({ colors: { background: "red" } }).success,
    ).toBe(false);
    expect(
      assetConfigV1Schema.safeParse({
        colors: { background: "#fff" },
      }).success,
    ).toBe(false);
  });

  it("rejects presets outside the whitelist", () => {
    expect(assetConfigV1Schema.safeParse({ surface: "HOLOGRAM" }).success).toBe(false);
    expect(assetConfigV1Schema.safeParse({ motion: "GLASS" }).success).toBe(false); // GLASS is a surface, not a motion
  });

  it("rejects external / data / non-path media URLs", () => {
    for (const url of [
      "https://evil.example/x.png",
      "data:image/png;base64,AAAA",
      "//cdn.example/x.png",
      "javascript:alert(1)",
      "cosmetics/x.png",
    ]) {
      expect(assetConfigV1Schema.safeParse({ mediaUrl: url }).success).toBe(false);
    }
    expect(
      assetConfigV1Schema.safeParse({ mediaUrl: "/cosmetics/x.png" }).success,
    ).toBe(true);
  });

  it("dispatches on version and rejects unknown versions", () => {
    expect(() => parseAssetConfig(2, {})).toThrow();
    expect(safeParseAssetConfig(99, {}).success).toBe(false);
    expect(safeParseAssetConfig(1, { surface: "FLAT" }).success).toBe(true);
  });
});
