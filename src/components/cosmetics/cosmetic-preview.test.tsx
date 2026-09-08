import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// keep it a pure node render: translate to the key, no provider needed
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { CosmeticPreview } from "@/components/cosmetics/cosmetic-preview";
import type { RenderCtx } from "@/components/cosmetics/use-render-ctx";

const render = (props: Parameters<typeof CosmeticPreview>[0]) =>
  renderToStaticMarkup(<CosmeticPreview {...props} />);

const light: RenderCtx = { scheme: "light", appVersion: "1.4.6" };
const dark: RenderCtx = { scheme: "dark", appVersion: "1.4.6" };

describe("[2] CosmeticPreview parity with production gate", () => {
  it("light-incompatible asset: hidden in light preview, shown in dark", () => {
    const cfg = { lightCompatible: false as const, surface: "GLASS" as const };
    const inLight = render({ slot: "OVERVIEW_CARD", config: cfg, ctx: light });
    expect(inLight).toContain("incompatibleScheme");
    expect(inLight).not.toContain("ck-surface-glass");

    const inDark = render({ slot: "OVERVIEW_CARD", config: cfg, ctx: dark });
    expect(inDark).toContain("ck-surface-glass");
    expect(inDark).not.toContain("incompatibleScheme");
  });

  it("dark-incompatible asset: hidden in dark preview, shown in light", () => {
    const cfg = { darkCompatible: false as const, surface: "GRADIENT" as const };
    expect(render({ slot: "INVESTMENT_CARD", config: cfg, ctx: dark })).toContain(
      "incompatibleScheme",
    );
    expect(render({ slot: "INVESTMENT_CARD", config: cfg, ctx: light })).toContain(
      "ck-surface-gradient",
    );
  });

  it("minComponentVersion above the running app: hidden with a version notice", () => {
    const cfg = { minComponentVersion: "9.9.9", surface: "FLAT" as const };
    const html = render({ slot: "OVERVIEW_CARD", config: cfg, ctx: light });
    expect(html).toContain("incompatibleVersion");
    expect(html).not.toContain("ck-surface-flat");
    // satisfied version renders
    expect(
      render({
        slot: "OVERVIEW_CARD",
        config: { minComponentVersion: "1.0.0", surface: "FLAT" as const },
        ctx: light,
      }),
    ).toContain("ck-surface-flat");
  });

  it("non-rendered slot shows 'coming in Phase 2', not a card", () => {
    const html = render({ slot: "NAVIGATION", config: {}, ctx: light });
    expect(html).toContain("rendererComingPhase2");
    expect(html).not.toContain("ck-fx");
  });

  it("previewUrl thumbnail renders for every slot (same-origin only)", () => {
    for (const slot of ["PROFILE_BADGE", "OVERVIEW_CARD", "NAVIGATION"] as const) {
      const ok = render({
        slot,
        config: {},
        previewUrl: "/cosmetics/thumbs/x.webp",
        ctx: light,
      });
      expect(ok).toContain("/cosmetics/thumbs/x.webp");
      const bad = render({
        slot,
        config: {},
        previewUrl: "https://evil/x.png",
        ctx: light,
      });
      expect(bad).not.toContain("evil");
    }
  });
});
