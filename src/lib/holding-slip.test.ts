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

  it.each([
    ["CRWD", "8.0960004", "108.52", "878.58", "NVDA"],
    ["AAPL", "4.7133200", "250.8550", "1182.36", "NVDA CRWD"],
    ["MSFT", "2.4186539", "459.5573", "1,111.51", "AAPL ASML"],
    ["AMZN", "4.0714543", "215.1664", "876.04", "ASML MSFT"],
    ["GOOGL", "2.8318730", "318.9409", "903.20", "ASML MSFT AMZN"],
    ["SPCX", "1.0000000", "168.00", "168.00", "ASML MSFT AMZN GOOGL"],
  ])("selects %s immediately above its expanded details", (symbol, quantity, cost, total, earlierSymbols) => {
    expect(parseHoldingSlip([
      earlierSymbols,
      `${symbol} 1,725.26`,
      `จำนวนหุ้นคงเหลือ ราคา (USD) และ % เปลี่ยน 1 วัน`,
      quantity,
      `ต้นทุนต่อหุ้น (USD) ต้นทุนรวม (USD)`,
      `${cost} ${total}`,
    ].join("\n"))).toMatchObject({ symbol, currency: "USD", quantity, costPerShare: cost });
  });

  it("restores a leading price group dropped by OCR using the total cost", () => {
    expect(parseHoldingSlip([
      "NVDA CRWD AAPL ASML 1,494.98",
      "จำนวนหุ้นคงเหลือ ราคา (USD)",
      "0.8717705 1,714.88",
      "ต้นทุนต่อหุ้น (USD) ต้นทุนรวม (USD)",
      "ไไ42.9613 996.40",
    ].join("\n"))).toMatchObject({
      symbol: "ASML",
      quantity: "0.8717705",
      costPerShare: "1142.9613",
    });
  });
});
