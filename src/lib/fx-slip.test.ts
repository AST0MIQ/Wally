import { describe, expect, it } from "vitest";
import { parseFxSlip } from "@/lib/fx-slip";

describe("parseFxSlip", () => {
  it("reads a USD -> THB Dime exchange slip", () => {
    const parsed = parseFxSlip([
      "สถานะ (ณ 5 ก.ย. 69 - 19:31 น.)",
      "สำเร็จ",
      "คุณได้รับเงินที่คุณแลกเปลี่ยนแล้ว",
      "แลกเปลี่ยน",
      "30.45 USD",
      "บัญชีชำระเงิน : Dime! FCD - USD",
      "เป็น",
      "999.67 THB",
      "บัญชีรับเงิน : Dime! Save",
      "อัตราแลกเปลี่ยน 1 USD = 32.83 THB",
      "อัตราแลกเปลี่ยน ณ ปัจจุบัน",
      "วันที่ส่งคำสั่ง 5 ก.ย. 69 - 19:31 น.",
      "วันที่ได้รับเงิน 5 ก.ย. 69 - 19:31 น.",
      "เลขที่คำสั่ง FX20260905123121000avgz",
    ].join("\n"));

    expect(parsed).toEqual({
      fromAmount: "30.45",
      fromCurrency: "USD",
      toAmount: "999.67",
      toCurrency: "THB",
      rate: "32.83",
      date: "2026-09-05",
      orderNo: "FX20260905123121000avgz",
    });
  });

  it("reads a THB -> USD slip and normalises the rate to from -> to", () => {
    const parsed = parseFxSlip([
      "สถานะ (ณ 4 ก.ค. 69 - 23:32 น.)",
      "สำเร็จ",
      "แลกเปลี่ยน",
      "44,560.17 THB",
      "บัญชีชำระเงิน : Dime! Save",
      "เป็น",
      "1,339.35 USD",
      "บัญชีรับเงิน : Dime! FCD - USD",
      "อัตราแลกเปลี่ยน 1 USD = 33.27 THB",
      "วันที่ได้รับเงิน 4 ก.ค. 69 - 23:32 น.",
      "เลขที่คำสั่ง FX20260704163247000wkro",
    ].join("\n"));

    expect(parsed).toMatchObject({
      fromAmount: "44560.17",
      fromCurrency: "THB",
      toAmount: "1339.35",
      toCurrency: "USD",
      rate: "0.030057",
      date: "2026-07-04",
      orderNo: "FX20260704163247000wkro",
    });
  });

  it("infers the debited amount when OCR only caught the credited side and the rate", () => {
    const parsed = parseFxSlip([
      "เป็น 999.67 THB",
      "อัตราแลกเปลี่ยน 1 USD = 32.83 THB",
    ].join("\n"));

    expect(parsed.fromCurrency).toBe("USD");
    expect(parsed.toAmount).toBe("999.67");
    expect(parsed.fromAmount).toBe("30.45");
  });

  it("returns nothing usable for unrelated text", () => {
    expect(parseFxSlip("just a normal receipt for coffee")).toEqual({
      fromAmount: undefined,
      fromCurrency: undefined,
      toAmount: undefined,
      toCurrency: undefined,
      rate: undefined,
      date: undefined,
      orderNo: undefined,
    });
  });
});
