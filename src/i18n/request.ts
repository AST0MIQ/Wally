import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "./config";

/**
 * next-intl "without i18n routing" setup: the active locale is read from a
 * cookie (no `/th` or `/en` URL prefix — closer to a native app feel).
 * When a user is signed in, the language switcher also persists the choice
 * to `User.locale`.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieValue) ? cookieValue : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    now: new Date(),
    timeZone: "Asia/Bangkok",
  };
});
