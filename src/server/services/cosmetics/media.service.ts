import { del, put } from "@vercel/blob";
import { prisma } from "@/server/db";
import { auditInTx } from "@/server/lib/audit";
import { conflict, notFound } from "@/server/lib/errors";
import { serializableTx } from "@/server/lib/tx";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_BYTES = 8 * 1024 * 1024;

export function listMedia(activeOnly = false) {
  return prisma.cosmeticMedia.findMany({
    where: activeOnly ? { status: "ACTIVE" } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function uploadMedia(adminId: string, file: File, name?: string) {
  if (!ALLOWED.has(file.type)) conflict("media_type_not_allowed");
  if (file.size <= 0 || file.size > MAX_BYTES) conflict("media_too_large");
  if (!process.env.BLOB_READ_WRITE_TOKEN) conflict("media_storage_not_configured");

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
          uploadedById: adminId,
        },
      });
      await auditInTx(tx, { userId: adminId, action: "cosmeticMedia.upload", entity: "CosmeticMedia", entityId: media.id, metadata: { pathname: media.pathname, sizeBytes: media.sizeBytes } });
      return media;
    });
  } catch (error) {
    await del(blob.url).catch(() => undefined);
    throw error;
  }
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
