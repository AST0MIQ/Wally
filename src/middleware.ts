import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight, edge-safe route protection: redirect unauthenticated requests
 * for protected paths to the landing page. This is an *optimistic* check on
 * the session cookie only — the authoritative check happens server-side in
 * `requireUser()` / `requireAdmin()` (which validate the session against the DB).
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/transactions",
  "/accounts",
  "/portfolio",
  "/analytics",
  "/reports",
  "/settings",
  "/admin",
];

// Auth.js v5 database-session cookie names (dev vs. secure).
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!needsAuth) return NextResponse.next();

  const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match everything except Next internals and static asset folders.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|fonts|splash|sw.js).*)",
  ],
};
