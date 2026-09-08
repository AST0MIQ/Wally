import type { Metadata } from "next";

import { requireUser } from "@/server/lib/guards";
import {
  listUserInventory,
  listApplicableCollections,
} from "@/server/services/cosmetics/entitlement.service";
import { listCollections } from "@/server/services/cosmetics/collection.service";
import { CosmeticsView } from "@/components/cosmetics/cosmetics-view";

export const metadata: Metadata = { title: "Cosmetics" };

export default async function CosmeticsPage() {
  const user = await requireUser();
  const [{ items, equippedBySlot }, collections, published] = await Promise.all([
    listUserInventory(user.id),
    listApplicableCollections(user.id),
    listCollections({ status: "PUBLISHED" }),
  ]);

  return (
    <CosmeticsView
      items={items}
      equippedBySlot={equippedBySlot}
      collections={collections}
      collectionNames={published.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
