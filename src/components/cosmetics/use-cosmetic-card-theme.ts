"use client";

import { shouldRenderLayer } from "@/lib/cosmetics/config";
import {
  cosmeticCardHostClass,
  cosmeticCardHostStyle,
} from "@/lib/cosmetics/render";
import type { EquipmentSlot } from "@/lib/cosmetics/slots";
import { useCosmetic } from "@/components/cosmetics/cosmetic-context";
import { useRenderCtx } from "@/components/cosmetics/use-render-ctx";

/**
 * Resolves replacement styles for a card slot. Incompatible assets behave as
 * unequipped so the normal Wally/streak presentation remains intact.
 */
export function useCosmeticCardTheme(slot: EquipmentSlot) {
  const asset = useCosmetic(slot);
  const ctx = useRenderCtx();
  const active = Boolean(asset && shouldRenderLayer(asset.config, ctx));

  return {
    active,
    className: active && asset ? cosmeticCardHostClass(asset.config) : "",
    style: active && asset ? cosmeticCardHostStyle(asset.config) : undefined,
  };
}
