export const locales = ["th", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "th";

export const LOCALE_COOKIE = "NEXT_LOCALE";
export const THEME_COOKIE = "wally-theme";
export type ThemeChoice = "light" | "dark" | "system";
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
