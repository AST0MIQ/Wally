import { describe, expect, it } from "vitest";

import {
  meetsMinVersion,
  shouldRenderLayer,
  isSchemeCompatible,
  type AssetConfigV1,
} from "@/lib/cosmetics/config";
import { cosmeticClasses, cosmeticMediaUrl } from "@/lib/cosmetics/render";
import {
  RENDERED_SLOTS,
  SLOT_CONFIG_FIELDS,
  SLOT_MOTION,
} from "@/lib/cosmetics/slots";

describe("render helpers", () => {
  it("[11] media URL only accepts a same-origin path", () => {
    expect(cosmeticMediaUrl({ mediaUrl: "/cosmetics/x.webp" })).toBe(
      "/cosmetics/x.webp",
    );
    expect(cosmeticMediaUrl({ mediaUrl: "//evil/x" })).toBeNull();
    expect(cosmeticMediaUrl({ mediaUrl: "https://evil/x" })).toBeNull();
    expect(cosmeticMediaUrl({ mediaUrl: "/a/../b" })).toBeNull();
    expect(cosmeticMediaUrl({})).toBeNull();
  });

  it("[11] minComponentVersion gates rendering", () => {
    expect(meetsMinVersion({ minComponentVersion: "1.4.0" }, "1.4.6")).toBe(true);
    expect(meetsMinVersion({ minComponentVersion: "1.5.0" }, "1.4.6")).toBe(false);
    expect(meetsMinVersion({ minComponentVersion: "2.0" }, "1.9.9")).toBe(false);
    expect(meetsMinVersion({}, "0.0.1")).toBe(true);
  });

  it("[11] light/dark compatibility is respected", () => {
    expect(isSchemeCompatible({ darkCompatible: false }, "dark")).toBe(false);
    expect(isSchemeCompatible({ darkCompatible: false }, "light")).toBe(true);
    expect(isSchemeCompatible({}, "dark")).toBe(true);
  });

  it("[11] shouldRenderLayer combines scheme + version", () => {
    const cfg: AssetConfigV1 = { lightCompatible: false, minComponentVersion: "1.0" };
    expect(shouldRenderLayer(cfg, { scheme: "light", appVersion: "9.9" })).toBe(false);
    expect(shouldRenderLayer(cfg, { scheme: "dark", appVersion: "9.9" })).toBe(true);
    expect(
      shouldRenderLayer({ minComponentVersion: "9.9" }, { scheme: "dark", appVersion: "1.0" }),
    ).toBe(false);
  });

  it("[12] cosmeticClasses only emits classes a slot's renderer supports", () => {
    // PROFILE_BADGE supports colours + shape only -> surface/border ignored
    const badge = cosmeticClasses(
      { surface: "GLASS", borderEffect: "GLOW", shape: "PILL", motion: "PULSE" },
      { slot: "PROFILE_BADGE" },
    );
    expect(badge).toContain("ck-shape-pill");
    expect(badge).not.toContain("ck-surface-glass");
    expect(badge).not.toContain("ck-border-glow");
    expect(badge).not.toContain("ck-motion-pulse"); // not in SLOT_MOTION.PROFILE_BADGE

    // OVERVIEW_CARD supports the lot
    const card = cosmeticClasses(
      { surface: "GLASS", motion: "SHIMMER" },
      { slot: "OVERVIEW_CARD" },
    );
    expect(card).toContain("ck-surface-glass");
    expect(card).toContain("ck-motion-shimmer");
  });

  it("[12] every rendered slot has config-field + motion metadata", () => {
    for (const s of RENDERED_SLOTS) {
      expect(SLOT_CONFIG_FIELDS[s].length).toBeGreaterThan(0);
      expect(SLOT_MOTION[s]).toContain("NONE");
      // motion allowed only when 'motion' is a config field for the slot
      if (SLOT_MOTION[s].length > 1) {
        expect(SLOT_CONFIG_FIELDS[s]).toContain("motion");
      }
    }
  });
});
