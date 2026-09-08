import { requirePermission } from "@/server/lib/guards";
import { listMedia } from "@/server/services/cosmetics/media.service";
import { archiveMediaAction } from "@/app/actions/admin/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MediaUploadForm } from "@/components/admin/media-upload-form";

export default async function MediaPage() {
  await requirePermission("assets.write");
  const items = await listMedia();
  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold">คลังรูป</h1><p className="text-sm text-muted-foreground">อัปโหลดครั้งเดียว แล้วคัดลอกลิงก์ไปใช้กับไอเทมได้เลย</p></div>
    <Card className="p-4"><MediaUploadForm /><p className="mt-2 text-xs text-muted-foreground">ต้องตั้งค่า BLOB_READ_WRITE_TOKEN ก่อนใช้งานจริง</p></Card>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <Card key={item.id} className="overflow-hidden">
      <img src={item.url} alt={item.name} className="aspect-video w-full object-cover" />
      <div className="space-y-2 p-3"><div className="flex justify-between gap-2"><strong className="truncate">{item.name}</strong><span className="text-xs text-muted-foreground">{item.status === "ACTIVE" ? "ใช้งานได้" : "เก็บแล้ว"}</span></div>
      <Input readOnly value={item.url} onFocus={(e) => e.currentTarget.select()} aria-label={`ลิงก์ของ ${item.name}`} />
      {item.status === "ACTIVE" && <form action={archiveMediaAction}><input type="hidden" name="id" value={item.id} /><Button type="submit" variant="ghost" size="sm">เก็บเข้าคลัง</Button></form>}</div>
    </Card>)}</div>
    {items.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">ยังไม่มีรูป อัปโหลดรูปแรกด้านบนได้เลย</p>}
  </div>;
}
