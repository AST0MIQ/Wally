"use client";

import { cn } from "@/lib/utils";
import type { AssetConfigV1 } from "@/lib/cosmetics/config";
import type { EquipmentSlot } from "@/lib/cosmetics/slots";
import { cosmeticClasses, cosmeticVars } from "@/lib/cosmetics/render";

/**
 * A self-contained visual preview of one asset config, shaped roughly like the
 * surface the slot decorates. Used by Asset Studio and Preview Lab. All FX
 * layers are pointer-events:none.
 */
export function CosmeticPreview({
  slot,
  config,
  className,
}: {
  slot: EquipmentSlot;
  config: AssetConfigV1;
  className?: string;
}) {
  const vars = cosmeticVars(config) as React.CSSProperties;
  const fx = cosmeticClasses(config);

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
        />
        <div className="relative z-[1] p-4 text-xs text-muted-foreground">
          App background
        </div>
      </div>
    );
  }

  if (slot === "PROFILE_FRAME" || slot === "PROFILE_BADGE" || slot === "PROFILE_AURA") {
    return (
      <div
        style={vars}
        className={cn("flex h-40 items-center justify-center rounded-xl border border-border", className)}
      >
        <div className="relative size-16">
          <span className="flex size-full items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary">
            A
          </span>
          {slot === "PROFILE_FRAME" && <span aria-hidden className="ck-profile-frame" />}
          {slot === "PROFILE_AURA" && <span aria-hidden className="ck-profile-aura" />}
          {slot === "PROFILE_BADGE" && <span aria-hidden className="ck-profile-badge" />}
        </div>
      </div>
    );
  }

  // card-like slots
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
        <p className="text-xs text-muted-foreground">Card preview</p>
        <p className="mt-2 text-2xl font-semibold">฿12,345</p>
      </div>
    </div>
  );
}
