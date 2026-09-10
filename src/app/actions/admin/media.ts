"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/server/lib/admin-action";
import {
  mediaIdSchema,
  mediaUploadSchema,
  mediaUsageSchema,
} from "@/lib/validation/cosmetics";
import {
  archiveMedia,
  setMediaUsage,
  uploadMedia,
} from "@/server/services/cosmetics/media.service";

const MEDIA_PATH = "/admin/appearance/media";

export const uploadMediaAction = adminAction(
  mediaUploadSchema,
  async ({ input, admin }) => {
    const media = await uploadMedia(admin.id, input.file, input.name, input.usage);
    revalidatePath(MEDIA_PATH);
    return { id: media.id };
  },
  { name: "media.upload", permission: "assets.write" },
);

export const setMediaUsageAction = adminAction(
  mediaUsageSchema,
  async ({ input, admin }) => {
    await setMediaUsage(admin.id, input.id, input.usage);
    revalidatePath(MEDIA_PATH);
  },
  { name: "media.setUsage", permission: "assets.write" },
);

export const archiveMediaAction = adminAction(
  mediaIdSchema,
  async ({ input, admin }) => {
    await archiveMedia(admin.id, input.id);
    revalidatePath(MEDIA_PATH);
  },
  { name: "media.archive", permission: "assets.write" },
);
