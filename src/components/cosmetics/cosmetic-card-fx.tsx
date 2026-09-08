"use client";

import { cn } from "@/lib/utils";
import { cosmeticClasses, cosmeticVars } from "@/lib/cosmetics/render";
import { shouldRenderLayer } from "@/lib/cosmetics/config";
import type { EquipmentSlot } from "@/lib/cosmetics/slots";
import { useCosmetic } from "@/components/cosmetics/cosmetic-context";
import { useRenderCtx } from "@/components/cosmetics/use-render-ctx";

/**
 * Decorative overlay for a card slot (OVERVIEW_CARD / INVESTMENT_CARD).
 * Renders nothing when the slot is empty or the asset's config opts out of the
 * current scheme / needs a newer app. Always `pointer-events: none` +
 * `aria-hidden` — it can never intercept a tap, drag or scroll. Place inside a
 * `position: relative`, clipping (`overflow-hidden`) host.
 */
export function CosmeticCardFx({ slot }: { slot: EquipmentSlot }) {
  const asset = useCosmetic(slot);
  const ctx = useRenderCtx();
  if (!asset || !shouldRenderLayer(asset.config, ctx)) return null;

  return (
    <span
      aria-hidden
      style={cosmeticVars(asset.config) as React.CSSProperties}
      className={cn("ck-fx z-0", cosmeticClasses(asset.config, { slot }))}
    />
  );
}
