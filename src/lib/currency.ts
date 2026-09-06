/**
 * Currency reference data. Wally is fully multi-currency: any well-formed
 * ISO 4217 alpha code is accepted (`isCurrencyCode`). This curated list only
 * drives the currency picker's suggestions and per-currency minor units.
 */
export type CurrencyInfo = {
  code: string;
  /** number of fraction digits (minor unit) */
  decimals: number;
  nameKey: string; // i18n key under `currencies.*` (added later; falls back to code)
};

export const COMMON_CURRENCIES: CurrencyInfo[] = [
  { code: "THB", decimals: 2, nameKey: "THB" },
  { code: "USD", decimals: 2, nameKey: "USD" },
  { code: "EUR", decimals: 2, nameKey: "EUR" },
  { code: "GBP", decimals: 2, nameKey: "GBP" },
  { code: "JPY", decimals: 0, nameKey: "JPY" },
  { code: "CNY", decimals: 2, nameKey: "CNY" },
  { code: "HKD", decimals: 2, nameKey: "HKD" },
  { code: "SGD", decimals: 2, nameKey: "SGD" },
  { code: "AUD", decimals: 2, nameKey: "AUD" },
  { code: "CAD", decimals: 2, nameKey: "CAD" },
  { code: "CHF", decimals: 2, nameKey: "CHF" },
  { code: "KRW", decimals: 0, nameKey: "KRW" },
  { code: "TWD", decimals: 2, nameKey: "TWD" },
  { code: "MYR", decimals: 2, nameKey: "MYR" },
  { code: "VND", decimals: 0, nameKey: "VND" },
  { code: "IDR", decimals: 2, nameKey: "IDR" },
  { code: "PHP", decimals: 2, nameKey: "PHP" },
  { code: "INR", decimals: 2, nameKey: "INR" },
  { code: "AED", decimals: 2, nameKey: "AED" },
  { code: "NZD", decimals: 2, nameKey: "NZD" },
];

const COMMON_BY_CODE = new Map(COMMON_CURRENCIES.map((c) => [c.code, c]));

const ISO_ALPHA = /^[A-Z]{3}$/;

export function isCurrencyCode(value: string): boolean {
  return ISO_ALPHA.test(value);
}

export function currencyDecimals(code: string): number {
  return COMMON_BY_CODE.get(code)?.decimals ?? 2;
}
