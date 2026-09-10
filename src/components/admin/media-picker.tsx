"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MEDIA_USAGE_SPECS,
  aspectRatioLabel,
  mediaSizeWarnings,
  type MediaUsage,
} from "@/lib/cosmetics/media-usage";

export type PickableMedia = {
  id: string;
  name: string;
  url: string;
  usage: string;
  width?: number | null;
  height?: number | null;
};

/**
 * Picks one image out of the library, showing only the images filed under
 * `usage` — an image filed elsewhere would either not render at all or render
 * at the wrong aspect ratio on this surface.
 */
export function MediaPicker({
  media,
  usage,
  value,
  onSelect,
  onClear,
}: {
  media: readonly PickableMedia[];
  usage: MediaUsage;
  value?: string | null;
  onSelect: (url: string) => void;
  onClear?: () => void;
}) {
  const spec = MEDIA_USAGE_SPECS[usage];
  const items = media.filter((item) => item.usage === usage);
  const libraryHref = `/admin/appearance/media?usage=${usage}`;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        แสดงเฉพาะรูปหมวด “{spec.label}” · แนะนำ {spec.ratioLabel} ({spec.recommendedSize})
      </p>
      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => {
            const selected = value === item.url;
            const warned = mediaSizeWarnings(item.usage, item.width, item.height).length > 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.url)}
                className={`overflow-hidden rounded-xl border text-left transition ${selected ? "border-primary ring-2 ring-primary/25" : "border-border hover:border-primary/50"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt="" className="aspect-video w-full bg-muted object-contain" />
                <span className="block truncate px-2 pt-1.5 text-xs">{item.name}</span>
                <span className={`block truncate px-2 pb-1.5 text-[11px] ${warned ? "text-warning" : "text-muted-foreground"}`}>
                  {item.width && item.height
                    ? `${item.width}×${item.height} · ${aspectRatioLabel(item.width, item.height)}${warned ? " ⚠" : ""}`
                    : "ไม่ทราบขนาด"}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          ยังไม่มีรูปในหมวด “{spec.label}”{" "}
          <Link href={libraryHref} className="text-primary hover:underline">อัปโหลดที่เมนูคลังรูป</Link>
        </p>
      )}
      <div className="flex items-center gap-2">
        <Link href={libraryHref} className="text-xs text-primary hover:underline">จัดการคลังรูปหมวดนี้</Link>
        {value && onClear && (
          <Button type="button" size="sm" variant="ghost" onClick={onClear}>ไม่ใช้รูป</Button>
        )}
      </div>
    </div>
  );
}
