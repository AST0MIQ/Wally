import { describe, expect, it } from "vitest";
import { EquipmentSlot as PrismaEquipmentSlot } from "@prisma/client";

import { EQUIPMENT_SLOTS, RENDERED_SLOTS, SLOT_GROUPS } from "@/lib/cosmetics/slots";

describe("equipment slots", () => {
  it("stays in sync with the Prisma EquipmentSlot enum", () => {
    const prisma = Object.values(PrismaEquipmentSlot).sort();
    expect([...EQUIPMENT_SLOTS].sort()).toEqual(prisma);
  });

  it("every rendered slot is a real slot", () => {
    for (const s of RENDERED_SLOTS) {
      expect(EQUIPMENT_SLOTS).toContain(s);
    }
  });

  it("slot groups only reference real slots and cover every slot once", () => {
    const grouped = Object.values(SLOT_GROUPS).flat();
    expect([...grouped].sort()).toEqual([...EQUIPMENT_SLOTS].sort());
  });
});
