import type { Metadata } from "next";

import { requireUser } from "@/server/lib/guards";
import {
  listUserInventory,
  listApplicableCollections,
} from "@/server/services/cosmetics/entitlement.service";
import { CosmeticsView } from "@/components/cosmetics/cosmetics-view";

export const metadata: Metadata = { title: "Cosmetics" };

export default async function CosmeticsPage() {
  const user = await requireUser();
  const [{ items, equippedBySlot }, collections] = await Promise.all([
    listUserInventory(user.id),
    listApplicableCollections(user.id),
  ]);

  return (
    <CosmeticsView
      items={items}
      equippedBySlot={equippedBySlot}
      collections={collections}
    />
  );
}
