import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/** True only when real Google OAuth credentials are configured. */
export const googleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

/**
 * Edge-safe Auth.js config: providers + pages only, no adapter or DB access.
 * Consumed by both `src/server/auth.ts` (full server config) and, if needed,
 * by middleware. Route protection currently lives in `src/middleware.ts`
 * (cookie check) + server-side guards (`requireUser` / `requireAdmin`).
 */
export const authConfig = {
  providers: googleConfigured
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          // Do not auto-link Google identity to a pre-existing email account.
          allowDangerousEmailAccountLinking: false,
        }),
      ]
    : [],
  pages: {
    signIn: "/",
  },
  trustHost: true,
} satisfies NextAuthConfig;

export default authConfig;
