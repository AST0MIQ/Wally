import { describe, expect, it } from "vitest";
import { parseHoldingSlip } from "@/lib/holding-slip";

describe("parseHoldingSlip", () => {
  it("reads a Dime holding detail screenshot", () => {
    expect(parseHoldingSlip([
      "NVDA",
      "จำนวนหุ้นคงเหลือ 7.5317373",
      "ราคา (USD) และ % เปลี่ยน 1 วัน 230.36",
      "ต้นทุนต่อหุ้น (USD) 169.5505",
      "ต้นทุนรวม (USD) 1,277.01",
    ].join("\n"))).toMatchObject({
      symbol: "NVDA",
      currency: "USD",
      quantity: "7.5317373",
      costPerShare: "169.5505",
    });
  });
});
