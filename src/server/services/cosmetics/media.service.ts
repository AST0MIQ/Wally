import { del, put } from "@vercel/blob";
import { prisma } from "@/server/db";
import { auditInTx } from "@/server/lib/audit";
import { conflict, notFound } from "@/server/lib/errors";
import { imageSize } from "@/server/lib/image-size";
import { serializableTx } from "@/server/lib/tx";
import { isMediaUsage, type MediaUsage } from "@/lib/cosmetics/media-usage";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_BYTES = 8 * 1024 * 1024;

export function listMedia(opts: { activeOnly?: boolean; usage?: MediaUsage } = {}) {
  return prisma.cosmeticMedia.findMany({
    where: {
      ...(opts.activeOnly ? { status: "ACTIVE" as const } : {}),
      ...(opts.usage ? { usage: opts.usage } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

/** The exact fields the admin media pickers need, active images only. */
export function listPickableMedia() {
  return prisma.cosmeticMedia.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, url: true, usage: true, width: true, height: true },
  });
}

export async function uploadMedia(
  adminId: string,
  file: File,
  name?: string,
  usage: MediaUsage = "APP_BACKGROUND",
) {
  if (!ALLOWED.has(file.type)) conflict("media_type_not_allowed");
  if (file.size <= 0 || file.size > MAX_BYTES) conflict("media_too_large");
  if (!isMediaUsage(usage)) conflict("media_usage_invalid");
  if (!process.env.BLOB_READ_WRITE_TOKEN) conflict("media_storage_not_configured");

  // Read once: the same bytes are measured and uploaded, so the stored
  // dimensions always describe the blob that actually went out.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const size = imageSize(bytes);

  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "-").slice(-120);
  const pathname = `cosmetics/${crypto.randomUUID()}-${safeName}`;
  const blob = await put(pathname, file, { access: "public", addRandomSuffix: false });
  try {
    return await serializableTx(async (tx) => {
      const media = await tx.cosmeticMedia.create({
        data: {
          name: name?.trim() || file.name,
          url: blob.url,
          pathname: blob.pathname,
          mimeType: file.type,
          sizeBytes: file.size,
          width: size?.width ?? null,
          height: size?.height ?? null,
          usage,
          uploadedById: adminId,
        },
      });
      await auditInTx(tx, { userId: adminId, action: "cosmeticMedia.upload", entity: "CosmeticMedia", entityId: media.id, metadata: { pathname: media.pathname, sizeBytes: media.sizeBytes, usage, width: media.width, height: media.height } });
      return media;
    });
  } catch (error) {
    await del(blob.url).catch(() => undefined);
    throw error;
  }
}

/** Re-file an image under a different surface without re-uploading it. */
export async function setMediaUsage(adminId: string, id: string, usage: MediaUsage) {
  if (!isMediaUsage(usage)) conflict("media_usage_invalid");
  return serializableTx(async (tx) => {
    const current = await tx.cosmeticMedia.findUnique({ where: { id } });
    if (!current) notFound("media_not_found");
    const media = await tx.cosmeticMedia.update({ where: { id }, data: { usage } });
    await auditInTx(tx, { userId: adminId, action: "cosmeticMedia.setUsage", entity: "CosmeticMedia", entityId: id, metadata: { from: current.usage, to: usage } });
    return media;
  });
}

export async function archiveMedia(adminId: string, id: string) {
  return serializableTx(async (tx) => {
    const current = await tx.cosmeticMedia.findUnique({ where: { id } });
    if (!current) notFound("media_not_found");
    const media = await tx.cosmeticMedia.update({ where: { id }, data: { status: "ARCHIVED" } });
    await auditInTx(tx, { userId: adminId, action: "cosmeticMedia.archive", entity: "CosmeticMedia", entityId: id });
    return media;
  });
}
