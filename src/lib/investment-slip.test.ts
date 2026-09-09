import { describe, expect, it } from "vitest";
import { parseInvestmentSlip } from "@/lib/investment-slip";

describe("parseInvestmentSlip", () => {
  it("extracts a Dime buy confirmation", () => {
    const parsed = parseInvestmentSlip([
      "ซื้อ CRWD",
      "ราคาที่ได้จริง 428.59 USD",
      "จำนวนหุ้น 0.2329477",
      "ค่าคอมมิชชั่น 0.15 USD",
      "ภาษีมูลค่าเพิ่ม 7% (VAT) 0.01 USD",
      "วันที่ส่งคำสั่ง 17 มี.ค. 69 - 01:33 น.",
    ].join("\n"));
    expect(parsed).toEqual({
      type: "BUY",
      symbol: "CRWD",
      quantity: "0.2329477",
      price: "428.59",
      fee: "0.16",
      tradeDate: "2026-03-17",
    });
  });

  it("handles the column order and Thai OCR spelling from a screenshot", () => {
    const parsed = parseInvestmentSlip([
      "คำสั่งซื้อของคุณได้รับการจับคู่ทั้งหมดแล้ว",
      "{io CRWD                                  «NASDAQ",
      "ราคาที่ได้จริง                   จํานวนหุ้น",
      "428.59 USD                 0.2329477",
      "ค่าคอมมิชชัน                                     0.15 USD",
      "ภาษีมูลค่าเพิ่ม 7% (VAT)                           0.01 USD",
      "วันที่ส่งคําสั่ง 17 มี.ค. 69 - 01:33 น.",
    ].join("\n"));
    expect(parsed).toMatchObject({
      type: "BUY",
      symbol: "CRWD",
      quantity: "0.2329477",
      price: "428.59",
      fee: "0.16",
      tradeDate: "2026-03-17",
    });
  });

  it("extracts a pending Dime market-order slip (no fill price / share count yet)", () => {
    const parsed = parseInvestmentSlip([
      "สถานะ (ณ 03 เม.ย. 2568 - 20:38 น.)",
      "รอดำเนินการ",
      "คุณส่งคำสั่งเรียบร้อยแล้ว คำสั่งของคุณจะได้รับการเสนอซื้อในช่วงเวลาทำการตลาด (regular hours)",
      "ซื้อ JEPQ                                  🇺🇸 NASDAQ",
      "29.16 USD",
      "มูลค่าหุ้นที่ซื้อ                        29.11 USD",
      "ค่าคอมมิชชัน                            0.05 USD",
      "ภาษีมูลค่าเพิ่ม 7% (VAT)                 0.0033 USD",
      "วันที่ส่งคำสั่ง            Dime! Fast",
      "03 เม.ย. 2568 - 20:38 น.",
      "ประเภทคำสั่ง             ราคาตลาด (Market)",
    ].join("\n"));
    expect(parsed).toMatchObject({
      type: "BUY",
      symbol: "JEPQ",
      amount: "29.11",
      fee: "0.0533",
      tradeDate: "2025-04-03",
    });
    expect(parsed.quantity).toBeUndefined();
    expect(parsed.price).toBeUndefined();
  });
});
