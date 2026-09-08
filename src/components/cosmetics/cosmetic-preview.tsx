"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { AssetConfigV1 } from "@/lib/cosmetics/config";
import { isRenderedSlot, type EquipmentSlot } from "@/lib/cosmetics/slots";
import { cosmeticClasses, cosmeticMediaUrl, cosmeticVars } from "@/lib/cosmetics/render";

/**
 * A safe, self-contained visual preview of ONE asset config, shaped like the
 * surface the slot decorates. Uses the exact same `cosmeticClasses(config,
 * {slot})` + `cosmeticVars` + `cosmeticMediaUrl` as production, so what Admin
 * (or a user before Equip) sees is what renders. For a slot with no Phase-1
 * renderer it says so instead of showing a misleading generic card.
 * All FX layers are `pointer-events: none` + `aria-hidden`.
 */
export function CosmeticPreview({
  slot,
  config,
  previewUrl,
  className,
}: {
  slot: EquipmentSlot;
  config: AssetConfigV1;
  previewUrl?: string | null;
  className?: string;
}) {
  const t = useTranslations("cosmetics");
  const vars = cosmeticVars(config) as React.CSSProperties;
  const fx = cosmeticClasses(config, { slot });
  const media = cosmeticMediaUrl(config) ?? (previewUrl && cosmeticMediaUrl({ mediaUrl: previewUrl }));

  if (!isRenderedSlot(slot)) {
    return (
      <div
        className={cn(
          "flex h-40 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center",
          className,
        )}
      >
        <p className="text-xs font-medium text-muted-foreground">{slot}</p>
        <p className="text-xs text-muted-foreground">{t("rendererComingPhase2")}</p>
      </div>
    );
  }

  if (slot === "APP_BACKGROUND") {
    return (
      <div
        style={vars}
        className={cn(
          "relative h-40 w-full overflow-hidden rounded-xl border border-border",
          className,
        )}
      >
        <div
          aria-hidden
          className={cn("absolute inset-0", fx)}
          style={{ backgroundColor: "var(--ck-bg, transparent)" }}
        >
          {media && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media} alt="" aria-hidden className="ck-bg-media" />
          )}
        </div>
        <div className="relative z-[1] p-4 text-xs text-muted-foreground">
          {t("previewBackground")}
        </div>
      </div>
    );
  }

  if (slot === "PROFILE_FRAME" || slot === "PROFILE_BADGE" || slot === "PROFILE_AURA") {
    return (
      <div
        style={vars}
        className={cn(
          "flex h-40 items-center justify-center rounded-xl border border-border",
          className,
        )}
      >
        <div className="relative size-16">
          <span className="flex size-full items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary">
            A
          </span>
          {slot === "PROFILE_FRAME" && <span aria-hidden className={cn("ck-profile-frame", fx)} />}
          {slot === "PROFILE_AURA" && <span aria-hidden className={cn("ck-profile-aura", fx)} />}
          {slot === "PROFILE_BADGE" && <span aria-hidden className={cn("ck-profile-badge", fx)} />}
        </div>
      </div>
    );
  }

  // OVERVIEW_CARD / INVESTMENT_CARD
  return (
    <div
      style={vars}
      className={cn(
        "relative h-40 w-full overflow-hidden rounded-2xl border border-border bg-card p-4",
        className,
      )}
    >
      <span aria-hidden className={cn("ck-fx", fx)} />
      <div className="relative z-[1]">
        <p className="text-xs text-muted-foreground">{t("previewCard")}</p>
        <p className="mt-2 text-2xl font-semibold">฿12,345</p>
      </div>
    </div>
  );
}
