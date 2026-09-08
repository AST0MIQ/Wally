import { describe, expect, it } from "vitest";
import { checkoutSchema, productSchema } from "@/lib/validation/commerce";

const cuid = "cm12345678901234567890123";

describe("commerce validation", () => {
  it("requires exactly one cosmetic target", () => {
    const base = { slug: "sakura-pack", name: "Sakura", price: 99, currency: "thb" };
    expect(productSchema.safeParse(base).success).toBe(false);
    expect(productSchema.safeParse({ ...base, grantsAssetId: cuid, grantsCollectionId: cuid }).success).toBe(false);
    const parsed = productSchema.parse({ ...base, grantsAssetId: cuid });
    expect(parsed.currency).toBe("THB");
  });

  it("rejects invalid prices and checkout ids", () => {
    expect(productSchema.safeParse({ slug: "x-pack", name: "Pack", price: 0, currency: "THB", grantsAssetId: cuid }).success).toBe(false);
    expect(checkoutSchema.safeParse({ productId: "" }).success).toBe(false);
  });
});
