"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import {
  isLocale,
  isAccentChoice,
  ACCENT_COOKIE,
  BALANCES_COOKIE,
  isThemeChoice,
  LOCALE_COOKIE,
  THEME_COOKIE,
  type Locale,
  type ThemeChoice,
} from "@/i18n/config";
import { isCurrencyCode } from "@/lib/currency";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setAccent(next: string): Promise<void> {
  if (!isAccentChoice(next)) return;
  const cookieStore = await cookies();
  cookieStore.set(ACCENT_COOKIE, next, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
  const session = await auth();
  if (session?.user?.id) {
    await prisma.user.update({ where: { id: session.user.id }, data: { accent: next } });
  }
  revalidatePath("/", "layout");
}

export async function markPatchNotesSeen(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  const { APP_VERSION } = await import("@/lib/version");
  await prisma.user.update({ where: { id: session.user.id }, data: { lastSeenVersion: APP_VERSION } });
  revalidatePath("/", "layout");
}

/**
 * Set the active UI language. Always writes the cookie (drives next-intl);
 * also persists to `User.locale` when signed in.
 */
export async function setLocale(next: Locale): Promise<void> {
  if (!isLocale(next)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, next, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });

  const session = await auth();
  if (session?.user?.id) {
    await prisma.user
      .update({
        where: { id: session.user.id },
        data: { locale: next === "th" ? "TH" : "EN" },
      })
      .catch(() => {
        /* non-critical: cookie already applied */
      });
  }

  revalidatePath("/", "layout");
}

/** Set the color theme. Cookie drives SSR `data-theme`; persisted when signed in. */
export async function setTheme(next: ThemeChoice): Promise<void> {
  if (!isThemeChoice(next)) return;

  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE, next, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });

  const session = await auth();
  if (session?.user?.id) {
    await prisma.user
      .update({
        where: { id: session.user.id },
        data: {
          theme:
            next === "light" ? "LIGHT" : next === "dark" ? "DARK" : "SYSTEM",
        },
      })
      .catch(() => {});
  }

  revalidatePath("/", "layout");
}

/**
 * Show or hide every monetary amount across the app. Cookie-only (per browser):
 * drives the SSR `data-balances` attribute so there is no flash of visible
 * balances on reload.
 */
export async function setBalancesHidden(hidden: boolean): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(BALANCES_COOKIE, hidden ? "hidden" : "shown", {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
  // No revalidate: the client applies `data-balances` optimistically; the
  // cookie only needs to be right for the next full page load.
}

/** Change the currency used by dashboards and cross-currency summaries. */
export async function setBaseCurrency(next: string): Promise<void> {
  const currency = next.trim().toUpperCase();
  if (!isCurrencyCode(currency)) return;

  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { baseCurrency: currency },
  });

  revalidatePath("/", "layout");
}
