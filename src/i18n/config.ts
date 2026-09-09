export const locales = ["th", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "th";

export const LOCALE_COOKIE = "NEXT_LOCALE";
export const THEME_COOKIE = "wally-theme";
export const ACCENT_COOKIE = "wally-accent";
export const BALANCES_COOKIE = "wally-balances";
export type ThemeChoice = "light" | "dark" | "system";

/** Whether monetary amounts are shown or masked across the app. */
export type BalancesChoice = "shown" | "hidden";
export function isBalancesChoice(
  v: string | undefined | null,
): v is BalancesChoice {
  return v === "shown" || v === "hidden";
}
export const accentChoices = [
  "red",
  "orange",
  "amber",
  "lime",
  "emerald",
  "teal",
  "blue",
  "violet",
  "rose",
] as const;
export type AccentChoice = (typeof accentChoices)[number];
export function isAccentChoice(v: string | undefined | null): v is AccentChoice {
  return accentChoices.includes(v as AccentChoice);
}
export function isThemeChoice(v: string | undefined | null): v is ThemeChoice {
  return v === "light" || v === "dark" || v === "system";
}

/** Map an app locale to a BCP-47 tag for Intl.* formatting. */
export const intlLocaleTag: Record<Locale, string> = {
  // force Gregorian calendar for Thai (business decision: ค.ศ. everywhere)
  th: "th-TH-u-ca-gregory",
  en: "en-US",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "th" || value === "en";
}
