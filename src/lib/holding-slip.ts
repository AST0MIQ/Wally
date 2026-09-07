export type ParsedHoldingSlip = {
  symbol?: string;
  currency?: string;
  quantity?: string;
  costPerShare?: string;
};

const cleanNumber = (value?: string) => value?.replaceAll(",", "");

export function parseHoldingSlip(text: string): ParsedHoldingSlip {
  const normalized = text.replace(/\u00a0/g, " ").replace(/ํา/g, "ำ");
  const excluded = new Set(["USD", "THB", "P&L", "AVG", "TOTAL"]);
  const symbols = [...normalized.matchAll(/(?:^|\n|\s)([A-Z][A-Z0-9.]{1,9})(?=\s|\n|$)/g)]
    .map((match) => match[1]!)
    .filter((value) => !excluded.has(value));
  const quantity = normalized.match(/จำนวนหุ้นคงเหลือ[\s\S]{0,50}?([\d,.]+)/i)?.[1]
    ?? normalized.match(/(?:หุ้นที่ถือ|จำนวนหุ้น)[\s\S]{0,50}?([\d,.]+)/i)?.[1];
  const cost = normalized.match(/ต้นทุนต่อหุ้น(?:\s*\(([A-Z]{3})\))?[\s\S]{0,50}?([\d,.]+)/i);
  return {
    symbol: symbols[0]?.toUpperCase(),
    currency: cost?.[1]?.toUpperCase() ?? (normalized.includes("USD") ? "USD" : undefined),
    quantity: cleanNumber(quantity),
    costPerShare: cleanNumber(cost?.[2]),
  };
}
