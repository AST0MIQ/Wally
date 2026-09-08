"use client";

import { cn } from "@/lib/utils";
import { cosmeticClasses, cosmeticVars } from "@/lib/cosmetics/render";
import type { EquipmentSlot } from "@/lib/cosmetics/slots";
import { useCosmetic } from "@/components/cosmetics/cosmetic-context";

/**
 * A decorative overlay for a card slot (OVERVIEW_CARD / INVESTMENT_CARD).
 * Renders nothing when the slot is empty. Always `pointer-events: none` +
 * `aria-hidden` — it can never intercept a tap, drag or scroll. Place inside
 * a `position: relative` host that clips (`overflow-hidden`).
 */
export function CosmeticCardFx({ slot }: { slot: EquipmentSlot }) {
  const asset = useCosmetic(slot);
  if (!asset) return null;

  return (
    <span
      aria-hidden
      style={cosmeticVars(asset.config) as React.CSSProperties}
      className={cn("ck-fx z-0", cosmeticClasses(asset.config))}
    />
  );
}
