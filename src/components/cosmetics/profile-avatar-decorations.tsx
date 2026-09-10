"use client";

import { cn } from "@/lib/utils";
import { cosmeticClasses, cosmeticMediaUrl, cosmeticVars } from "@/lib/cosmetics/render";
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
 *
 * A frame or badge may carry its own artwork in `config.mediaUrl`. The image
 * then *replaces* the CSS-drawn ring or dot rather than sitting on top of it —
 * `ck-has-media` strips the drawn shape — because the art already is the whole
 * decoration. It must be a transparent PNG: the frame's centre has to stay
 * hollow or it would cover the avatar.
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
  const media = cosmeticMediaUrl(asset.config);
  return (
    <span
      aria-hidden
      className={cn(baseClass, media && "ck-has-media", cosmeticClasses(asset.config, { slot }))}
      style={cosmeticVars(asset.config) as React.CSSProperties}
    >
      {media && (
        // Decorative user-authored artwork; same-origin / Blob validated.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media} alt="" aria-hidden className="ck-layer-media" />
      )}
    </span>
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
