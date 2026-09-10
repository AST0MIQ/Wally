"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";

import { uploadMediaAction } from "@/app/actions/admin/media";
import { useAction } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/label";
import {
  MEDIA_USAGES,
  MEDIA_USAGE_SPECS,
  aspectRatioLabel,
  mediaSizeWarnings,
  type MediaUsage,
} from "@/lib/cosmetics/media-usage";
import { cn } from "@/lib/utils";

/** Measured in the browser so the admin sees the mismatch before uploading. */
function measure(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(objectUrl);
    };
    image.src = objectUrl;
  });
}

export function MediaUploadForm({ defaultUsage = "APP_BACKGROUND" }: { defaultUsage?: MediaUsage }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [usage, setUsage] = useState<MediaUsage>(defaultUsage);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const spec = MEDIA_USAGE_SPECS[usage];
  const warnings = size ? mediaSizeWarnings(usage, size.width, size.height) : [];
  const upload = useAction(uploadMediaAction);

  useEffect(() => setUsage(defaultUsage), [defaultUsage]);

  const acceptFile = async (picked?: File) => {
    if (!picked) return;
    setFile(picked);
    setSize(await measure(picked));
  };

  const submit = async () => {
    if (!file) return;
    const res = await upload.run(
      { file, name: name || undefined, usage },
      { successMessage: "อัปโหลดเข้าคลังแล้ว" },
    );
    if (res.ok) {
      setFile(null);
      setSize(null);
      setName("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    }
  };

  return <div className="grid gap-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="ชื่อรูป">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="เช่น พื้นหลังซากุระ" />
      </Field>
      <Field label="ใช้กับส่วนไหน" hint={spec.where}>
        <Select value={usage} onChange={(event) => setUsage(event.target.value as MediaUsage)}>
          {MEDIA_USAGES.map((value) => (
            <option key={value} value={value}>{MEDIA_USAGE_SPECS[value].label}</option>
          ))}
        </Select>
      </Field>
    </div>

    <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs">
      <p className="font-semibold text-foreground">อัตราส่วนที่แนะนำ {spec.ratioLabel} · {spec.recommendedSize}</p>
      <p className="mt-1 text-muted-foreground">{spec.note}</p>
    </div>

    <label
      className={cn("flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-5 text-center transition-colors", dragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted")}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); void acceptFile(event.dataTransfer.files[0]); }}
    >
      <ImagePlus className="size-6 text-primary" />
      <span className="text-sm font-medium">ลากรูปมาวาง หรือแตะเพื่อเลือก</span>
      <span className="text-xs text-muted-foreground">{file?.name || "PNG, JPG, WebP หรือ GIF ไม่เกิน 8 MB"}</span>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(event) => void acceptFile(event.target.files?.[0])} />
    </label>

    {size && (
      warnings.length > 0 ? (
        <div className="flex gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">{size.width} × {size.height} px · {aspectRatioLabel(size.width, size.height)}</p>
            <ul className="mt-1 list-disc space-y-0.5 ps-4">
              {warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
            <p className="mt-1">อัปโหลดต่อได้ตามปกติ ถ้ารับได้กับการครอบตัดนี้</p>
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-positive">
          <CheckCircle2 className="size-4" />
          {size.width} × {size.height} px · {aspectRatioLabel(size.width, size.height)} — ตรงตามที่แนะนำ
        </p>
      )
    )}

    <Button type="button" onClick={submit} disabled={!file || upload.pending}>
      {upload.pending ? "กำลังอัปโหลด…" : "อัปโหลดเข้าคลัง"}
    </Button>
  </div>;
}
