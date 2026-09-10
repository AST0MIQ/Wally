import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { requirePermission } from "@/server/lib/guards";
import { listMedia } from "@/server/services/cosmetics/media.service";
import { archiveMediaAction } from "@/app/actions/admin/media";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { MediaUrlField } from "@/components/admin/media-url-field";
import { MediaUsageSelect } from "@/components/admin/media-usage-select";
import {
  MEDIA_USAGES,
  MEDIA_USAGE_SPECS,
  aspectRatioLabel,
  isMediaUsage,
  mediaSizeWarnings,
} from "@/lib/cosmetics/media-usage";
import { cn } from "@/lib/utils";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ usage?: string }>;
}) {
  await requirePermission("assets.write");
  const { usage } = await searchParams;
  const filter = isMediaUsage(usage) ? usage : null;

  // One query, filtered in memory: the library is small and the chips need
  // the per-usage counts anyway.
  const all = await listMedia();
  const items = filter ? all.filter((item) => item.usage === filter) : all;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">คลังรูป</h1>
        <p className="text-sm text-muted-foreground">
          อัปโหลดครั้งเดียว แล้วเลือกใช้กับไอเทมได้ทันที แต่ละรูปเลือกได้ 1 ส่วน เวลาไปเลือกใช้จะเห็นเฉพาะรูปของส่วนนั้น
        </p>
      </div>

      <Card className="p-4">
        <MediaUploadForm defaultUsage={filter ?? "APP_BACKGROUND"} />
        <p className="mt-2 text-xs text-muted-foreground">รองรับ PNG, JPG, WebP และ GIF ขนาดไม่เกิน 8 MB</p>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/appearance/media"
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            filter ? "border-border text-muted-foreground hover:bg-muted" : "border-primary bg-primary/10 text-primary",
          )}
        >
          ทั้งหมด ({all.length})
        </Link>
        {MEDIA_USAGES.map((value) => (
          <Link
            key={value}
            href={`/admin/appearance/media?usage=${value}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {MEDIA_USAGE_SPECS[value].label} ({all.filter((item) => item.usage === value).length})
          </Link>
        ))}
      </div>

      {filter && (
        <p className="text-xs text-muted-foreground">
          {MEDIA_USAGE_SPECS[filter].where} · แนะนำ {MEDIA_USAGE_SPECS[filter].ratioLabel} ({MEDIA_USAGE_SPECS[filter].recommendedSize})
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const warnings = mediaSizeWarnings(item.usage, item.width, item.height);
          return (
            <Card key={item.id} className="overflow-hidden">
              {/* object-contain: the card shows the whole file, not the crop a
                  particular surface would make of it. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.name} className="aspect-video w-full bg-muted object-contain" />
              <div className="space-y-2 p-3">
                <div className="flex justify-between gap-2">
                  <strong className="truncate">{item.name}</strong>
                  <span className="shrink-0 text-xs text-muted-foreground">{item.status === "ACTIVE" ? "พร้อมใช้งาน" : "เก็บแล้ว"}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="accent">{MEDIA_USAGE_SPECS[item.usage].label}</Badge>
                  {item.width && item.height ? (
                    <Badge variant={warnings.length > 0 ? "negative" : "positive"}>
                      {item.width} × {item.height} · {aspectRatioLabel(item.width, item.height)}
                    </Badge>
                  ) : (
                    <Badge>ไม่ทราบขนาด</Badge>
                  )}
                </div>
                {warnings.length > 0 && (
                  <p className="flex gap-1.5 text-xs text-warning">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span>{warnings.join(" · ")}</span>
                  </p>
                )}
                <MediaUrlField name={item.name} url={item.url} />
                <div className="flex items-center gap-2">
                  <MediaUsageSelect id={item.id} usage={item.usage} name={item.name} />
                  {item.status === "ACTIVE" && (
                    <form action={archiveMediaAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button type="submit" variant="ghost" size="sm">เก็บเข้าคลัง</Button>
                    </form>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {items.length === 0 && (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          {filter ? `ยังไม่มีรูปในหมวด "${MEDIA_USAGE_SPECS[filter].label}" อัปโหลดรูปแรกด้านบนได้เลย` : "ยังไม่มีรูป อัปโหลดรูปแรกด้านบนได้เลย"}
        </p>
      )}
    </div>
  );
}
