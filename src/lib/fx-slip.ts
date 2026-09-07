export type ParsedFxSlip = {
  fromAmount?: string;
  fromCurrency?: string;
  toAmount?: string;
  toCurrency?: string;
  /** Normalised so that: 1 fromCurrency = <rate> toCurrency */
  rate?: string;
  /** ISO yyyy-mm-dd, taken from the "received" date when available */
  date?: string;
  orderNo?: string;
};

const THAI_MONTHS: Record<string, number> = {
  "ม.ค": 0, "ก.พ": 1, "มี.ค": 2, "เม.ย": 3, "พ.ค": 4, "มิ.ย": 5,
  "ก.ค": 6, "ส.ค": 7, "ก.ย": 8, "ต.ค": 9, "พ.ย": 10, "ธ.ค": 11,
};

const MONTH_ALT = "ม\\.ค|ก\\.พ|มี\\.ค|เม\\.ย|พ\\.ค|มิ\\.ย|ก\\.ค|ส\\.ค|ก\\.ย|ต\\.ค|พ\\.ย|ธ\\.ค";
const AMOUNT = "([\\d,]+(?:\\.\\d+)?)";
const CCY = "([A-Z]{3})";

function parseThaiDate(day?: string, monthRaw?: string, yearRaw?: string): string | undefined {
  if (!day || !monthRaw || !yearRaw) return undefined;
  const month = THAI_MONTHS[monthRaw.replace(/\.$/, "")];
  if (month === undefined) return undefined;
  let year = Number(yearRaw);
  if (!Number.isFinite(year)) return undefined;
  if (year < 100) year += 2500; // "69" -> 2569 (Buddhist)
  if (year > 2400) year -= 543; // -> Gregorian
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(Number(day)).padStart(2, "0")}`;
}

function trimNumber(value: number, digits: number): string {
  return String(Number(value.toFixed(digits)));
}

/**
 * Parse the OCR text of a KKP Dime foreign-exchange slip. The slip states an
 * amount debited ("แลกเปลี่ยน …") and an amount credited ("เป็น …"), plus a
 * quoted rate ("อัตราแลกเปลี่ยน 1 USD = 32.83 THB"). Everything is best-effort;
 * missing fields are simply left undefined for the user to fill in.
 */
export function parseFxSlip(text: string): ParsedFxSlip {
  const normalized = text
    .replace(/ /g, " ")
    .replace(/[：]/g, ":")
    .replace(/ํา/g, "ำ")
    .replace(/[|]/g, " ");

  const clean = (value?: string) => value?.replaceAll(",", "");

  // Credited side — "เป็น\n999.67 THB"
  const toMatch = normalized.match(new RegExp(`เป็น[\\s\\S]{0,30}?${AMOUNT}\\s*${CCY}`));
  // Debited side — "แลกเปลี่ยน\n30.45 USD", but never "อัตราแลกเปลี่ยน"
  const fromMatch = normalized.match(new RegExp(`(?<!อัตรา)แลกเปลี่ยน[\\s\\S]{0,30}?${AMOUNT}\\s*${CCY}`));
  // Quoted rate — "1 USD = 32.83 THB"
  const rateMatch = normalized.match(new RegExp(`1\\s*${CCY}\\s*=\\s*${AMOUNT}\\s*${CCY}`));

  const dateMatch =
    normalized.match(new RegExp(`วันที่ได้รับเงิน[\\s\\S]{0,40}?(\\d{1,2})\\s*(${MONTH_ALT})\\.?\\s*(\\d{2,4})`)) ??
    normalized.match(new RegExp(`วันที่(?:ทำรายการ|ส่งคำสั่ง|ชำระเงิน)[\\s\\S]{0,40}?(\\d{1,2})\\s*(${MONTH_ALT})\\.?\\s*(\\d{2,4})`));

  const orderMatch = normalized.match(/เลขที่คำสั่ง\s*:?\s*([A-Z]{2}[A-Za-z0-9]{6,})/);

  let fromAmount = clean(fromMatch?.[1]);
  let fromCurrency = fromMatch?.[2];
  const toAmount = clean(toMatch?.[1]);
  const toCurrency = toMatch?.[2];

  // If OCR dropped the debited amount, we can still name its currency via the rate line.
  if (!fromCurrency && rateMatch && toCurrency) {
    const rateBase = rateMatch[1];
    const rateQuote = rateMatch[3];
    fromCurrency = rateBase === toCurrency ? rateQuote : rateBase;
  }

  let rate: string | undefined;
  if (rateMatch && fromCurrency && toCurrency) {
    const rateBase = rateMatch[1];
    const rateValue = Number(clean(rateMatch[2]));
    const rateQuote = rateMatch[3];
    if (Number.isFinite(rateValue) && rateValue > 0) {
      if (rateBase === fromCurrency && rateQuote === toCurrency) rate = trimNumber(rateValue, 6);
      else if (rateBase === toCurrency && rateQuote === fromCurrency) rate = trimNumber(1 / rateValue, 6);
    }
  }

  // Fill a missing debited amount from the credited amount and the rate.
  if (!fromAmount && toAmount && rate && Number(rate) > 0) {
    fromAmount = trimNumber(Number(toAmount) / Number(rate), 2);
  }

  return {
    fromAmount,
    fromCurrency,
    toAmount,
    toCurrency,
    rate,
    date: parseThaiDate(dateMatch?.[1], dateMatch?.[2], dateMatch?.[3]),
    orderNo: orderMatch?.[1],
  };
}
