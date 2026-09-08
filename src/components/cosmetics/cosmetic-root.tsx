import { cookies } from "next/headers";

import { cn } from "@/lib/utils";
import { APP_VERSION } from "@/lib/version";
import { THEME_COOKIE } from "@/i18n/config";
import { cosmeticClasses, cosmeticMediaUrl, cosmeticSemanticClasses, cosmeticVars } from "@/lib/cosmetics/render";
import { shouldRenderLayer } from "@/lib/cosmetics/config";
import type { ResolvedLoadout } from "@/server/services/cosmetics/loadout.service";

/**
 * Server component. Wraps the app in a `[data-cosmetics]` stacking context that
 * carries the merged `--ck-*` custom properties (inline style — CSP-safe) and
 * paints the APP_BACKGROUND layer: a fixed, `pointer-events: none`, z-index:0
 * layer that sits ABOVE the page's opaque background but below content
 * (`.ck-content`, z-index:1). With an empty loadout it renders just `{children}`
 * — zero visual change, identical stacking to today.
 *
 * `shouldRenderLayer` (scheme + min-version) gates each layer identically to
 * Preview, so Admin can't publish a config that behaves differently here.
 */
export async function CosmeticRoot({
  loadout,
  children,
}: {
  loadout: ResolvedLoadout;
  children: React.ReactNode;
}) {
  const themeCookie = (await cookies()).get(THEME_COOKIE)?.value;
  // "system" and anything unknown -> assume both schemes acceptable (dark check
  // uses "dark" only when the user explicitly picked it)
  const scheme: "light" | "dark" = themeCookie === "dark" ? "dark" : "light";
  const ctx = { scheme, appVersion: APP_VERSION };

  const rendered = Object.fromEntries(
    Object.entries(loadout).map(([slot, asset]) => [
      slot,
      asset && shouldRenderLayer(asset.config, ctx) ? asset : null,
    ]),
  ) as ResolvedLoadout;

  const active = Object.values(rendered).some((v) => v !== null);
  if (!active) return <>{children}</>;

  const vars: Record<string, string> = {};
  for (const asset of Object.values(rendered)) {
    if (asset) Object.assign(vars, cosmeticVars(asset.config));
  }
  const chart = rendered.CHART_STYLE;
  if (chart?.config.colors?.primary) vars["--color-primary"] = chart.config.colors.primary;
  if (chart?.config.colors?.glow) vars["--ck-glow"] = chart.config.colors.glow;

  const bg = rendered.APP_BACKGROUND;
  const media = bg ? cosmeticMediaUrl(bg.config) : null;
  const semantic = ["CHART_STYLE", "ICON_SET", "TYPOGRAPHY", "AMBIENT_EFFECT", "INTERACTION_EFFECT", "CELEBRATION_EFFECT"]
    .map((slot) => {
      const asset = rendered[slot as keyof ResolvedLoadout];
      return asset ? cosmeticSemanticClasses(asset.slot, asset.config) : "";
    })
    .filter(Boolean);
  const ambient = rendered.AMBIENT_EFFECT;
  const ambientMedia = ambient ? cosmeticMediaUrl(ambient.config) : null;

  return (
    <div data-cosmetics className={cn(semantic)} style={vars as React.CSSProperties}>
      {bg && (
        <div
          aria-hidden
          className={cn("ck-bg-layer", cosmeticClasses(bg.config, { slot: "APP_BACKGROUND" }))}
        >
          {media && (
            // decorative, same-origin only, cannot intercept interaction
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media} alt="" aria-hidden className="ck-bg-media" />
          )}
        </div>
      )}
      {ambient && (
        <div aria-hidden className="ck-ambient-layer">
          {ambientMedia && (
            // Decorative user-authored Blob media; preserving the original
            // asset is preferable to Next/Image transformation here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ambientMedia} alt="" className="ck-bg-media" />
          )}
        </div>
      )}
      <div className="ck-content">{children}</div>
    </div>
  );
}
