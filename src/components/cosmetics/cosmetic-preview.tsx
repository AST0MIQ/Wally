"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  shouldRenderLayer,
  isSchemeCompatible,
  meetsMinVersion,
  type AssetConfigV1,
} from "@/lib/cosmetics/config";
import { isRenderedSlot, type EquipmentSlot } from "@/lib/cosmetics/slots";
import {
  cosmeticCardHostClass,
  cosmeticCardHostStyle,
  cosmeticClasses,
  cosmeticMediaUrl,
  cosmeticVars,
} from "@/lib/cosmetics/render";
import { useRenderCtx, type RenderCtx } from "@/components/cosmetics/use-render-ctx";

/**
 * A safe, self-contained visual preview of ONE asset config that renders
 * EXACTLY what production would: it runs the same `shouldRenderLayer(config,
 * ctx)` gate (scheme + min app version) and, when the gate fails, shows a
 * clear "not shown here" state instead of a misleading visual. Uses the same
 * `cosmeticClasses(config,{slot})` + `cosmeticVars` as the renderer.
 *
 * `previewUrl` is the generic artwork/thumbnail for the asset and is shown for
 * every slot (same-origin validated). `config.mediaUrl` is slot-specific
 * production decoration and is only painted where the renderer paints it
 * (APP_BACKGROUND).
 *
 * All FX layers are `pointer-events: none` + `aria-hidden`.
 */
export function CosmeticPreview({
  slot,
  config,
  previewUrl,
  ctx: ctxProp,
  className,
}: {
  slot: EquipmentSlot;
  config: AssetConfigV1;
  previewUrl?: string | null;
  /** injectable for tests / Preview Lab; defaults to the live context */
  ctx?: RenderCtx;
  className?: string;
}) {
  const t = useTranslations("cosmetics");
  const liveCtx = useRenderCtx();
  const ctx = ctxProp ?? liveCtx;

  const thumb = previewUrl ? cosmeticMediaUrl({ mediaUrl: previewUrl }) : null;
  const Thumb = thumb ? (
    <span className="block overflow-hidden rounded-md border border-border">
      {/* decorative artwork, same-origin only */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb}
        alt=""
        aria-hidden
        className="h-20 w-full object-cover"
      />
    </span>
  ) : null;

  // Non-rendered Phase-1 slot: no misleading card.
  if (!isRenderedSlot(slot)) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {Thumb}
        <div className="flex h-28 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center">
          <p className="text-xs font-medium text-muted-foreground">{slot}</p>
          <p className="text-xs text-muted-foreground">{t("rendererComingPhase2")}</p>
        </div>
      </div>
    );
  }

  // Config opts out of the current scheme / needs a newer app — say so.
  if (!shouldRenderLayer(config, ctx)) {
    const reason = !isSchemeCompatible(config, ctx.scheme)
      ? t("incompatibleScheme", { scheme: ctx.scheme })
      : !meetsMinVersion(config, ctx.appVersion)
        ? t("incompatibleVersion", { version: config.minComponentVersion ?? "?" })
        : t("incompatibleGeneric");
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {Thumb}
        <div className="flex h-28 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-warning/50 bg-warning/5 p-4 text-center">
          <AlertTriangle className="size-4 text-warning" />
          <p className="text-xs text-muted-foreground">{reason}</p>
        </div>
      </div>
    );
  }

  const vars = cosmeticVars(config) as React.CSSProperties;
  const fx = cosmeticClasses(config, { slot });

  let body: React.ReactNode;
  if (slot === "APP_BACKGROUND") {
    const media = cosmeticMediaUrl(config);
    body = (
      <div
        style={vars}
        className="relative h-32 w-full overflow-hidden rounded-xl border border-border"
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
        <div className="relative z-[1] p-3 text-xs text-muted-foreground">
          {t("previewBackground")}
        </div>
      </div>
    );
  } else if (
    slot === "PROFILE_FRAME" ||
    slot === "PROFILE_BADGE" ||
    slot === "PROFILE_AURA"
  ) {
    body = (
      <div
        style={vars}
        className="flex h-32 items-center justify-center rounded-xl border border-border"
      >
        <div className="relative size-14">
          <span className="flex size-full items-center justify-center rounded-full bg-primary/15 text-base font-bold text-primary">
            A
          </span>
          {slot === "PROFILE_FRAME" && <span aria-hidden className={cn("ck-profile-frame", fx)} />}
          {slot === "PROFILE_AURA" && <span aria-hidden className={cn("ck-profile-aura", fx)} />}
          {slot === "PROFILE_BADGE" && <span aria-hidden className={cn("ck-profile-badge", fx)} />}
        </div>
      </div>
    );
  } else if (slot === "NAVIGATION") {
    const cardStyle = cosmeticCardHostStyle(config) as React.CSSProperties;
    body = (
      <div
        style={cardStyle}
        className={cn(
          "relative flex h-24 w-full items-end overflow-hidden border p-2",
          cosmeticCardHostClass(config),
        )}
      >
        <span aria-hidden className={cn("ck-fx", fx)} />
        <div className="relative z-[1] grid w-full grid-cols-4 gap-1 text-center text-[10px]">
          {["⌂", "▣", "+", "◯"].map((icon, index) => (
            <span key={`${icon}-${index}`} className="rounded-lg px-1 py-2">{icon}</span>
          ))}
        </div>
      </div>
    );
  } else if (slot === "HEADER") {
    const cardStyle = cosmeticCardHostStyle(config) as React.CSSProperties;
    body = (
      <div
        style={cardStyle}
        className={cn(
          "relative flex h-20 w-full items-center justify-between overflow-hidden border px-4",
          cosmeticCardHostClass(config),
        )}
      >
        <span aria-hidden className={cn("ck-fx", fx)} />
        <span className="relative z-[1] font-semibold">Wally<span className="text-primary">.</span></span>
        <span className="relative z-[1] flex size-8 items-center justify-center rounded-full border">A</span>
      </div>
    );
  } else if (slot === "TRANSACTION_CARD") {
    const cardStyle = cosmeticCardHostStyle(config) as React.CSSProperties;
    body = (
      <div
        style={cardStyle}
        className={cn(
          "relative flex h-24 w-full items-center gap-3 overflow-hidden border p-3",
          cosmeticCardHostClass(config),
        )}
      >
        <span aria-hidden className={cn("ck-fx", fx)} />
        <span className="relative z-[1] flex size-10 items-center justify-center rounded-xl bg-negative/10">🛍️</span>
        <span className="relative z-[1] min-w-0 flex-1"><b className="block text-sm">Shopping</b><small className="text-muted-foreground">Today</small></span>
        <b className="relative z-[1] text-negative">−฿450</b>
      </div>
    );
  } else if (slot === "ACCOUNT_CARD") {
    const cardStyle = cosmeticCardHostStyle(config) as React.CSSProperties;
    body = (
      <div
        style={cardStyle}
        className={cn(
          "relative flex h-32 w-full flex-col overflow-hidden border p-3",
          cosmeticCardHostClass(config),
        )}
      >
        <span aria-hidden className={cn("ck-fx", fx)} />
        <span className="relative z-[1] text-lg">🏦</span>
        <b className="relative z-[1] mt-2 text-sm">Everyday account</b>
        <strong className="relative z-[1] mt-auto text-lg">฿12,345</strong>
      </div>
    );
  } else {
    const cardStyle = cosmeticCardHostStyle(config) as React.CSSProperties;
    body = (
      <div
        style={cardStyle}
        className={cn(
          "relative h-32 w-full overflow-hidden rounded-2xl border p-3",
          cosmeticCardHostClass(config),
        )}
      >
        <span aria-hidden className={cn("ck-fx", fx)} />
        <div className="relative z-[1]">
          <p className="text-xs text-muted-foreground">{t("previewCard")}</p>
          <p className="mt-1.5 text-xl font-semibold">฿12,345</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Thumb}
      {body}
    </div>
  );
}
