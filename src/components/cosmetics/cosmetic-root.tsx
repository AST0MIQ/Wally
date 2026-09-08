import { cn } from "@/lib/utils";
import { cosmeticClasses, cosmeticVars } from "@/lib/cosmetics/render";
import type { ResolvedLoadout } from "@/server/services/cosmetics/loadout.service";

/**
 * Server component. Wraps the app in a `[data-cosmetics]` div that carries the
 * merged `--ck-*` custom properties (inline style — CSP-safe) and paints the
 * APP_BACKGROUND layer: one fixed, `pointer-events: none`, z-index:-10 div.
 * With an empty loadout it renders just `{children}` — zero visual change.
 */
export function CosmeticRoot({
  loadout,
  children,
}: {
  loadout: ResolvedLoadout;
  children: React.ReactNode;
}) {
  const active = Object.values(loadout).some((v) => v !== null);
  if (!active) return <>{children}</>;

  // merge colour vars from every equipped asset so nested FX can read tokens
  const vars: Record<string, string> = {};
  for (const asset of Object.values(loadout)) {
    if (asset) Object.assign(vars, cosmeticVars(asset.config));
  }

  const bg = loadout.APP_BACKGROUND;

  return (
    <div data-cosmetics style={vars as React.CSSProperties}>
      {bg && (
        <div
          aria-hidden
          className={cn("ck-bg-layer", cosmeticClasses(bg.config))}
        />
      )}
      {children}
    </div>
  );
}
