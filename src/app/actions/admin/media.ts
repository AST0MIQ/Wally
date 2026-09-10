"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/lib/guards";
import { archiveMedia, setMediaUsage, uploadMedia } from "@/server/services/cosmetics/media.service";
import { isMediaUsage, type MediaUsage } from "@/lib/cosmetics/media-usage";

function readUsage(formData: FormData): MediaUsage {
  const raw = String(formData.get("usage") ?? "");
  if (!isMediaUsage(raw)) throw new Error("กรุณาเลือกส่วนที่จะนำรูปไปใช้");
  return raw;
}

export async function uploadMediaAction(formData: FormData) {
  const admin = await requirePermission("assets.write");
  const file = formData.get("file");
  const name = String(formData.get("name") ?? "");
  if (!(file instanceof File)) throw new Error("กรุณาเลือกไฟล์รูป");
  await uploadMedia(admin.id, file, name, readUsage(formData));
  revalidatePath("/admin/appearance/media");
}

export async function setMediaUsageAction(formData: FormData) {
  const admin = await requirePermission("assets.write");
  await setMediaUsage(admin.id, String(formData.get("id") ?? ""), readUsage(formData));
  revalidatePath("/admin/appearance/media");
}

export async function archiveMediaAction(formData: FormData) {
  const admin = await requirePermission("assets.write");
  await archiveMedia(admin.id, String(formData.get("id") ?? ""));
  revalidatePath("/admin/appearance/media");
}
