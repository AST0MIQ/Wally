/**
 * ADMIN_EMAILS bootstrap / emergency access.
 *
 * This is the ONLY place an email address is used for authorization, and it
 * is deliberately isolated in its own file so it can be deleted wholesale
 * once every environment has a database-backed SUPER_ADMIN assignment.
 *
 *  - `ADMIN_EMAILS` is environment-only. It is never written to the database
 *    and is never surfaced as an editable setting in the Admin Console.
 *  - A bootstrap admin is treated as a SUPER_ADMIN by `getPrincipal()` even
 *    with zero UserRole rows, so they can initialise and recover DB-backed
 *    access (assign the SUPER_ADMIN role to real accounts).
 *  - Bootstrap admins are NOT counted as database-backed SUPER_ADMINs by the
 *    "final active SUPER_ADMIN" safety invariant (see user-role.service.ts).
 *
 * To remove bootstrap entirely: delete this file, drop `isBootstrap` handling
 * from `rbac.ts`, and remove `applyAdminBootstrap` from `onboarding.ts`.
 */

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").normalize("NFKC").trim().toLowerCase();
}

/** Parsed, normalized, de-duplicated ADMIN_EMAILS entries. */
export function bootstrapEmails(): string[] {
  return [
    ...new Set(
      (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((s) => normalizeEmail(s))
        .filter(Boolean),
    ),
  ];
}

export function isBootstrapEmail(email: string | null | undefined): boolean {
  const e = normalizeEmail(email);
  return e.length > 0 && bootstrapEmails().includes(e);
}

/** How many distinct bootstrap admins are configured (for a read-only notice). */
export function bootstrapAdminCount(): number {
  return bootstrapEmails().length;
}
