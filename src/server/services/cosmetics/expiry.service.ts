import { serializableTx } from "@/server/lib/tx";

/** Expire due ownership rows and remove only the matching equipped asset. */
export function expireDueEntitlements(now = new Date()) {
  return serializableTx(async (tx) => {
    const due = await tx.userEntitlement.findMany({
      where: { status: "ACTIVE", expiresAt: { lte: now } },
      include: { asset: { select: { slot: true } } },
    });
    for (const ent of due) {
      await tx.userEntitlement.update({ where: { id: ent.id }, data: { status: "EXPIRED" } });
      await tx.userEquippedAsset.deleteMany({ where: { userId: ent.userId, slot: ent.asset.slot, assetId: ent.assetId } });
    }
    return { expired: due.length };
  });
}
