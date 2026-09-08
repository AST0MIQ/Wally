"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/lib/guards";
import { archiveMedia, uploadMedia } from "@/server/services/cosmetics/media.service";

export async function uploadMediaAction(formData: FormData) {
  const admin = await requirePermission("assets.write");
  const file = formData.get("file");
  const name = String(formData.get("name") ?? "");
  if (!(file instanceof File)) throw new Error("กรุณาเลือกไฟล์รูป");
  await uploadMedia(admin.id, file, name);
  revalidatePath("/admin/appearance/media");
}

export async function archiveMediaAction(formData: FormData) {
  const admin = await requirePermission("assets.write");
  await archiveMedia(admin.id, String(formData.get("id") ?? ""));
  revalidatePath("/admin/appearance/media");
}
