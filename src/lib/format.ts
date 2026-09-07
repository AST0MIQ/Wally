import { intlLocaleTag, type Locale } from "@/i18n/config";

const DEFAULT_TZ = "Asia/Bangkok";

/**
 * Format a monetary amount. Amounts are handled as `Decimal` in the data layer;
 * pass a `number` or numeric string here only for display.
 */
export function formatCurrency(
  amount: number | string,
  currency: string,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat(intlLocaleTag[locale], {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(Number.isFinite(value) ? value : 0);
}

/** Compact display for prominent balances while preserving calculation precision. */
export function formatMoney(
  amount: number | string,
  currency: string,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  return formatCurrency(amount, currency, locale, {
    currencyDisplay: "narrowSymbol",
    ...options,
  });
}

export function formatNumber(
  value: number | string,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat(intlLocaleTag[locale], options).format(
    Number.isFinite(n) ? n : 0,
  );
}

export function formatPercent(
  ratio: number,
  locale: Locale,
  fractionDigits = 1,
): string {
  return new Intl.NumberFormat(intlLocaleTag[locale], {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number.isFinite(ratio) ? ratio : 0);
}

/** Gregorian calendar always (business decision: ค.ศ. for both languages). */
export function formatDate(
  date: Date | string | number,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
  timeZone: string = DEFAULT_TZ,
): string {
  // `dateStyle` can't be combined with component options (month/day/…),
  // so only apply the default style when the caller gave no options.
  const opts: Intl.DateTimeFormatOptions = options
    ? { timeZone, ...options }
    : { dateStyle: "medium", timeZone };
  return new Intl.DateTimeFormat(intlLocaleTag[locale], opts).format(
    new Date(date),
  );
}

export function formatDateTime(
  date: Date | string | number,
  locale: Locale,
  timeZone: string = DEFAULT_TZ,
): string {
  return new Intl.DateTimeFormat(intlLocaleTag[locale], {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(date));
}
