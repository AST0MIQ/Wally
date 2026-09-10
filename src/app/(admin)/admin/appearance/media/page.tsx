import { requirePermission } from "@/server/lib/guards";
import { listMedia } from "@/server/services/cosmetics/media.service";
import { archiveMediaAction } from "@/app/actions/admin/media";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { MediaUrlField } from "@/components/admin/media-url-field";

export default async function MediaPage() {
  await requirePermission("assets.write");
  const items = await listMedia();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">คลังรูป</h1>
        <p className="text-sm text-muted-foreground">อัปโหลดครั้งเดียว แล้วเลือกใช้กับไอเทมได้ทันที</p>
      </div>
      <Card className="p-4">
        <MediaUploadForm />
        <p className="mt-2 text-xs text-muted-foreground">รองรับ PNG, JPG, WebP และ GIF ขนาดไม่เกิน 8 MB</p>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.name} className="aspect-video w-full object-cover" />
            <div className="space-y-2 p-3">
              <div className="flex justify-between gap-2">
                <strong className="truncate">{item.name}</strong>
                <span className="text-xs text-muted-foreground">{item.status === "ACTIVE" ? "พร้อมใช้งาน" : "เก็บแล้ว"}</span>
              </div>
              <MediaUrlField name={item.name} url={item.url} />
              {item.status === "ACTIVE" && (
                <form action={archiveMediaAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <Button type="submit" variant="ghost" size="sm">เก็บเข้าคลัง</Button>
                </form>
              )}
            </div>
          </Card>
        ))}
      </div>
      {items.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">ยังไม่มีรูป อัปโหลดรูปแรกด้านบนได้เลย</p>}
    </div>
  );
}
