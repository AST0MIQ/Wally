"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { uploadMediaAction } from "@/app/actions/admin/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function MediaUploadForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  const acceptFile = (file?: File) => {
    if (!file || !fileRef.current) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileRef.current.files = transfer.files;
    setFileName(file.name);
  };

  return <form action={uploadMediaAction} className="grid gap-3">
    <Input name="name" placeholder="ชื่อรูป เช่น พื้นหลังซากุระ" />
    <label
      className={cn("flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-5 text-center transition-colors", dragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted")}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); acceptFile(event.dataTransfer.files[0]); }}
    >
      <ImagePlus className="size-6 text-primary" />
      <span className="text-sm font-medium">ลากรูปมาวาง หรือแตะเพื่อเลือก</span>
      <span className="text-xs text-muted-foreground">{fileName || "PNG, JPG, WebP หรือ GIF ไม่เกิน 8 MB"}</span>
      <input ref={fileRef} name="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required className="sr-only" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} />
    </label>
    <Button type="submit" disabled={!fileName}>อัปโหลดเข้าคลัง</Button>
  </form>;
}
