"use client";

import { cn } from "@/lib/utils";
import { cosmeticClasses, cosmeticVars } from "@/lib/cosmetics/render";
import { shouldRenderLayer } from "@/lib/cosmetics/config";
import type { EquipmentSlot } from "@/lib/cosmetics/slots";
import { useCosmetic } from "@/components/cosmetics/cosmetic-context";
import { useRenderCtx, type RenderCtx } from "@/components/cosmetics/use-render-ctx";

/**
 * PROFILE_FRAME / PROFILE_AURA / PROFILE_BADGE — three independent slots so a
 * frame from one collection mixes with a badge/aura from another. Each layer is
 * `pointer-events: none`. Preset interpretation (`cosmeticClasses(config, {slot})`)
 * is identical to CosmeticPreview and to the card renderer. Place inside a
 * `position: relative`, round avatar host.
 */
function Layer({
  slot,
  baseClass,
  ctx,
}: {
  slot: EquipmentSlot;
  baseClass: string;
  ctx: RenderCtx;
}) {
  const asset = useCosmetic(slot);
  if (!asset || !shouldRenderLayer(asset.config, ctx)) return null;
  return (
    <span
      aria-hidden
      className={cn(baseClass, cosmeticClasses(asset.config, { slot }))}
      style={cosmeticVars(asset.config) as React.CSSProperties}
    />
  );
}

export function ProfileAvatarDecorations() {
  const ctx = useRenderCtx();
  return (
    <>
      <Layer slot="PROFILE_AURA" baseClass="ck-profile-aura" ctx={ctx} />
      <Layer slot="PROFILE_FRAME" baseClass="ck-profile-frame" ctx={ctx} />
      <Layer slot="PROFILE_BADGE" baseClass="ck-profile-badge" ctx={ctx} />
    </>
  );
}
