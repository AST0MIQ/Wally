export type ParsedHoldingSlip = {
  symbol?: string;
  currency?: string;
  quantity?: string;
  costPerShare?: string;
};

const cleanNumber = (value?: string) => value?.replaceAll(",", "");

const numberValue = (value?: string) => {
  const cleaned = cleanNumber(value);
  const parsed = cleaned ? Number(cleaned) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
};

function repairTruncatedCost(costText?: string, totalText?: string, quantityText?: string) {
  const cost = numberValue(costText);
  const total = numberValue(totalText);
  const quantity = numberValue(quantityText);
  if (cost === undefined || total === undefined || quantity === undefined || quantity <= 0) return costText;

  const impliedCost = total / quantity;
  if (Math.abs(cost - impliedCost) / impliedCost <= 0.05) return costText;

  // Tesseract can drop a leading group separated by a comma (for example
  // 1,142.9613 becomes 42.9613). Preserve the visible precision and restore
  // the nearest missing hundreds using the rounded total as a cross-check.
  const candidate = Math.floor(impliedCost / 100) * 100 + cost;
  if (candidate > cost && Math.abs(candidate * quantity - total) <= 0.1) {
    const decimals = costText?.replaceAll(",", "").split(".")[1]?.length ?? 0;
    return candidate.toFixed(decimals);
  }
  return costText;
}

export function parseHoldingSlip(text: string): ParsedHoldingSlip {
  const normalized = text.replace(/\u00a0/g, " ").replace(/ํา/g, "ำ");
  const excluded = new Set(["USD", "THB", "P&L", "AVG", "TOTAL"]);
  const quantityLabelIndex = normalized.search(/จำนวนหุ้นคงเหลือ|หุ้นที่ถือ|จำนวนหุ้น/i);
  const symbolArea = quantityLabelIndex >= 0 ? normalized.slice(0, quantityLabelIndex) : normalized;
  const symbols = [...symbolArea.matchAll(/(?:^|\n|\s)([A-Z][A-Z0-9.]{1,9})(?=\s|\n|$)/g)]
    .map((match) => match[1]!)
    .filter((value) => !excluded.has(value));
  const quantity = normalized.match(/จำนวนหุ้นคงเหลือ[ \t]+([\d,.]+)/i)?.[1]
    ?? normalized.match(/จำนวนหุ้นคงเหลือ[^\n]*\n\s*([\d,.]+)/i)?.[1]
    ?? normalized.match(/จำนวนหุ้นคงเหลือ[\s\S]{0,50}?([\d,.]+)/i)?.[1]
    ?? normalized.match(/(?:หุ้นที่ถือ|จำนวนหุ้น)[\s\S]{0,50}?([\d,.]+)/i)?.[1];
  const cost = normalized.match(/ต้นทุนต่อหุ้น(?:\s*\(([A-Z]{3})\))?[\s\S]{0,50}?([\d,.]+)/i);
  const totalLabelIndex = normalized.search(/ต้นทุนรวม(?:\s*\([A-Z]{3}\))?/i);
  const totalArea = totalLabelIndex >= 0 ? normalized.slice(totalLabelIndex, totalLabelIndex + 100) : "";
  const totalNumbers = [...totalArea.matchAll(/[\d,.]+/g)].map((match) => match[0]);
  // In the two-column Dime layout OCR emits both labels, then both values.
  const total = totalNumbers.length > 1 ? totalNumbers[1] : totalNumbers[0];
  return {
    symbol: symbols.at(-1)?.toUpperCase(),
    currency: cost?.[1]?.toUpperCase() ?? (normalized.includes("USD") ? "USD" : undefined),
    quantity: cleanNumber(quantity),
    costPerShare: cleanNumber(repairTruncatedCost(cost?.[2], total, quantity)),
  };
}
