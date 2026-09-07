export type ParsedInvestmentSlip = {
  type?: "BUY" | "SELL";
  symbol?: string;
  quantity?: string;
  price?: string;
  fee?: string;
  tradeDate?: string;
};

const THAI_MONTHS: Record<string, number> = {
  "ม.ค": 0, "ก.พ": 1, "มี.ค": 2, "เม.ย": 3, "พ.ค": 4, "มิ.ย": 5,
  "ก.ค": 6, "ส.ค": 7, "ก.ย": 8, "ต.ค": 9, "พ.ย": 10, "ธ.ค": 11,
};

function numberAfter(text: string, label: string): string | undefined {
  const match = text.match(new RegExp(label + "[\\s\\S]{0,120}?([\\d,]+(?:\\.\\d+)?)\\s*(?:USD)?", "i"));
  return match?.[1]?.replaceAll(",", "");
}

export function parseInvestmentSlip(text: string): ParsedInvestmentSlip {
  const normalized = text
    .replace(/\u00a0/g, " ")
    .replace(/[：]/g, ":")
    .replace(/ํา/g, "ำ");
  const action = normalized.match(/(?:^|\s)(ซื้อ|ขาย)\s+([A-Z][A-Z0-9.]{0,9})\b/i);
  const marketAndQuantity = normalized.match(
    /ราคาที่ได้จริง\s+จำนวนหุ้น\s+([\d,.]+)\s*USD\s+([\d,.]+)/i,
  );
  const exchangeContext = normalized.match(/([A-Z0-9.{}«\s]{1,100})NASDAQ/i)?.[1] ?? "";
  const exchangeSymbols = [...exchangeContext.matchAll(/\b([A-Z][A-Z0-9.]{1,9})\b/g)];
  const symbolNearExchange = exchangeSymbols.at(-1)?.[1];
  const inferredType = action?.[1] === "ขาย"
    ? "SELL"
    : action || normalized.includes("คำสั่งซื้อ")
      ? "BUY"
      : normalized.includes("คำสั่งขาย")
        ? "SELL"
        : undefined;
  const commission = numberAfter(normalized, "ค่าคอมมิชชั่?[นณ]");
  const vat = normalized
    .match(/ภาษีมูลค่าเพิ่ม[\s\S]{0,100}?\(VAT\)[\s\S]{0,100}?([\d,.]+(?:\.\d+)?)/i)?.[1]
    ?.replaceAll(",", "");
  const date = normalized.match(/วันที่ส่งคำสั่ง[\s\S]{0,100}?(\d{1,2})\s*(ม\.ค|ก\.พ|มี\.ค|เม\.ย|พ\.ค|มิ\.ย|ก\.ค|ส\.ค|ก\.ย|ต\.ค|พ\.ย|ธ\.ค)\.?\s*(\d{2,4})/);
  let tradeDate: string | undefined;
  if (date) {
    const monthKey = date[2]?.replace(/\.$/, "");
    const month = monthKey ? THAI_MONTHS[monthKey] : undefined;
    let year = Number(date[3]);
    if (year < 100) year += 2500;
    if (year > 2400) year -= 543;
    if (month !== undefined) {
      tradeDate = year + "-" + String(month + 1).padStart(2, "0") + "-" + String(Number(date[1])).padStart(2, "0");
    }
  }

  const fee = Number(commission ?? 0) + Number(vat ?? 0);
  return {
    type: inferredType,
    symbol: (action?.[2] ?? symbolNearExchange)?.toUpperCase(),
    quantity: marketAndQuantity?.[2]?.replaceAll(",", "") ?? numberAfter(normalized, "จำนวนหุ้น"),
    price: marketAndQuantity?.[1]?.replaceAll(",", "") ?? numberAfter(normalized, "ราคาที่ได้จริง"),
    fee: fee > 0 ? String(fee) : undefined,
    tradeDate,
  };
}
