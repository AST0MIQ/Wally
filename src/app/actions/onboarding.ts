"use server";

import { cookies } from "next/headers";

import { ONBOARDED_COOKIE } from "@/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Mark the first-run onboarding screen as done (or skipped). Cookie-only —
 * per browser, no database column. The `(app)` layout reads this to decide
 * whether to send a fresh account to `/onboarding`.
 */
export async function completeOnboarding(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ONBOARDED_COOKIE, "1", {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });
}
