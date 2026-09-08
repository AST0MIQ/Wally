"use server";

import { revalidatePath } from "next/cache";

import { action } from "@/server/lib/action";
import {
  equipSchema,
  unequipSchema,
  applyCollectionSchema,
} from "@/lib/validation/cosmetics";
import { z } from "zod";
import {
  equip,
  unequip,
  applyCollection,
  resetToDefaults,
} from "@/server/services/cosmetics/loadout.service";

function revalidateCosmetics() {
  revalidatePath("/cosmetics");
  revalidatePath("/", "layout");
}

export const equipAssetAction = action(
  equipSchema,
  async ({ input, user }) => {
    await equip(user.id, input.slot, input.assetId);
    revalidateCosmetics();
  },
  { name: "cosmetics.equip" },
);

export const unequipSlotAction = action(
  unequipSchema,
  async ({ input, user }) => {
    await unequip(user.id, input.slot);
    revalidateCosmetics();
  },
  { name: "cosmetics.unequip" },
);

export const applyCollectionAction = action(
  applyCollectionSchema,
  async ({ input, user }) => {
    const res = await applyCollection(user.id, input.collectionId);
    revalidateCosmetics();
    return res;
  },
  { name: "cosmetics.applyCollection" },
);

export const resetCosmeticsAction = action(
  z.object({}),
  async ({ user }) => {
    await resetToDefaults(user.id);
    revalidateCosmetics();
  },
  { name: "cosmetics.reset" },
);
