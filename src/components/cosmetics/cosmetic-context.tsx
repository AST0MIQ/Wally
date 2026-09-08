"use client";

import { createContext, useContext } from "react";

import type { ResolvedLoadout, ResolvedSlotAsset } from "@/server/services/cosmetics/loadout.service";
import type { EquipmentSlot } from "@/lib/cosmetics/slots";

const CosmeticContext = createContext<ResolvedLoadout | null>(null);

export function CosmeticProvider({
  loadout,
  children,
}: {
  loadout: ResolvedLoadout;
  children: React.ReactNode;
}) {
  return (
    <CosmeticContext.Provider value={loadout}>
      {children}
    </CosmeticContext.Provider>
  );
}

/** The asset equipped in `slot`, or null. Safe to call outside a provider. */
export function useCosmetic(slot: EquipmentSlot): ResolvedSlotAsset | null {
  const loadout = useContext(CosmeticContext);
  return loadout?.[slot] ?? null;
}
