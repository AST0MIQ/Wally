import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

import { CosmeticRoot } from "@/components/cosmetics/cosmetic-root";
import { EQUIPMENT_SLOTS, type EquipmentSlot } from "@/lib/cosmetics/slots";
import type { ResolvedLoadout } from "@/server/services/cosmetics/loadout.service";

function loadout(overrides: Partial<ResolvedLoadout> = {}): ResolvedLoadout {
  return {
    ...(Object.fromEntries(EQUIPMENT_SLOTS.map((s) => [s, null])) as ResolvedLoadout),
    ...overrides,
  };
}

async function markup(el: Promise<React.ReactElement>) {
  return renderToStaticMarkup(await el);
}

describe("[10] CosmeticRoot stacking", () => {
  it("empty loadout renders children only (no wrapper)", async () => {
    const html = await markup(
      CosmeticRoot({ loadout: loadout(), children: "APP" as never }),
    );
    expect(html).toBe("APP");
    expect(html).not.toContain("data-cosmetics");
  });

  it("with a background: layer at z-index:0 above content in .ck-content, never behind body", async () => {
    const bg = {
      assetId: "a1",
      slug: "bg",
      slot: "APP_BACKGROUND" as EquipmentSlot,
      configVersion: 1,
      config: { colors: { background: "#0b1026" }, surface: "GRADIENT" as const },
    };
    const html = await markup(
      CosmeticRoot({
        loadout: loadout({ APP_BACKGROUND: bg }),
        children: "APP" as never,
      }),
    );
    expect(html).toContain("data-cosmetics");
    expect(html).toContain("ck-bg-layer");
    expect(html).toContain('class="ck-content"');
    expect(html).not.toMatch(/-10/); // the old z-index:-10 bug
  });

  it("drops a layer whose config opts out of the current scheme", async () => {
    const bg = {
      assetId: "a2",
      slug: "bg2",
      slot: "APP_BACKGROUND" as EquipmentSlot,
      configVersion: 1,
      config: { lightCompatible: false as const },
    };
    // mocked cookie -> scheme "light" -> lightCompatible:false drops it
    const html = await markup(
      CosmeticRoot({
        loadout: loadout({ APP_BACKGROUND: bg }),
        children: "APP" as never,
      }),
    );
    expect(html).toBe("APP");
  });
});
