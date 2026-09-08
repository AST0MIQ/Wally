"use client";

import { cosmeticVars } from "@/lib/cosmetics/render";
import { useCosmetic } from "@/components/cosmetics/cosmetic-context";

/**
 * PROFILE_FRAME / PROFILE_AURA / PROFILE_BADGE decorations. Three independent
 * slots so a frame from one collection can mix with a badge/aura from another.
 * Each layer is `pointer-events: none`. Place inside a `position: relative`,
 * round avatar host.
 */
export function ProfileAvatarDecorations() {
  const frame = useCosmetic("PROFILE_FRAME");
  const aura = useCosmetic("PROFILE_AURA");
  const badge = useCosmetic("PROFILE_BADGE");
  if (!frame && !aura && !badge) return null;

  return (
    <>
      {aura && (
        <span
          aria-hidden
          className="ck-profile-aura"
          style={cosmeticVars(aura.config) as React.CSSProperties}
        />
      )}
      {frame && (
        <span
          aria-hidden
          className="ck-profile-frame"
          style={cosmeticVars(frame.config) as React.CSSProperties}
        />
      )}
      {badge && (
        <span
          aria-hidden
          className="ck-profile-badge"
          style={cosmeticVars(badge.config) as React.CSSProperties}
        />
      )}
    </>
  );
}
