import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import {
  CAPABILITY_PERMISSIONS,
  type Capability,
} from "@/server/lib/authz";
import { forbidden } from "@/server/lib/errors";
import {
  getPrincipal,
  principalHas,
  principalHasAny,
  type Principal,
} from "@/server/lib/rbac";
import type { PermissionKey } from "@/lib/rbac/catalogue";

export type SessionUser = Session["user"];

/**
 * Require an authenticated user in a Server Component / Server Action / Route
 * Handler. Redirects to the landing page when there is no valid session.
 *
 * All server-side data access MUST derive `userId` from the object returned
 * here — never from client-supplied input.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }
  return session.user;
}

/**
 * Resolve the caller's database-backed RBAC principal (roles + effective
 * permissions + bootstrap/super-admin status). Redirects unauthenticated
 * callers. Memoized per-request in `rbac.ts`.
 */
export async function getRequestPrincipal(): Promise<Principal> {
  const user = await requireUser();
  return getPrincipal(user.id, user.email ?? "");
}

/**
 * Require a caller who may enter the Admin Console at all (any DB permission,
 * a SUPER_ADMIN role, or ADMIN_EMAILS bootstrap). A signed-in user without
 * any admin access is bounced to their dashboard — same UX as Phase 1, now
 * driven by DB roles instead of the boolean `User.role`.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  const principal = await getPrincipal(user.id, user.email ?? "");
  if (!principal.canAccessAdmin) {
    redirect("/dashboard");
  }
  return user;
}

/**
 * Require an admin who also satisfies `capability` (mapped to one or more
 * `resource.action` permission keys — ANY match passes; SUPER_ADMIN /
 * bootstrap bypass). Non-admins are redirected; an admin missing the
 * capability gets a `FORBIDDEN` `AppError`. Used by every `/admin/*` page and
 * by `adminAction({ capability })`.
 */
export async function requireCapability(
  capability: Capability,
): Promise<SessionUser> {
  const user = await requireUser();
  const principal = await getPrincipal(user.id, user.email ?? "");
  if (!principal.canAccessAdmin) {
    redirect("/dashboard");
  }
  if (!principalHasAny(principal, CAPABILITY_PERMISSIONS[capability])) {
    forbidden(`missing capability: ${capability}`);
  }
  return user;
}

/** Require a single explicit permission key. */
export async function requirePermission(
  key: PermissionKey,
): Promise<SessionUser> {
  const user = await requireUser();
  const principal = await getPrincipal(user.id, user.email ?? "");
  if (!principal.canAccessAdmin) {
    redirect("/dashboard");
  }
  if (!principalHas(principal, key)) {
    forbidden(`missing permission: ${key}`);
  }
  return user;
}

/** Require ANY one of several permission keys. */
export async function requireAnyPermission(
  keys: readonly PermissionKey[],
): Promise<SessionUser> {
  const user = await requireUser();
  const principal = await getPrincipal(user.id, user.email ?? "");
  if (!principal.canAccessAdmin) {
    redirect("/dashboard");
  }
  if (!principalHasAny(principal, keys)) {
    forbidden(`missing permission: ${keys.join(" | ")}`);
  }
  return user;
}

/**
 * Require the narrowly-defined SUPER_ADMIN privilege (the non-archived
 * SUPER_ADMIN role or ADMIN_EMAILS bootstrap). Used for role assignment /
 * revocation and other access-control mutations.
 */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  const principal = await getPrincipal(user.id, user.email ?? "");
  if (!principal.canAccessAdmin) {
    redirect("/dashboard");
  }
  if (!principal.isSuperAdmin) {
    forbidden("requires SUPER_ADMIN");
  }
  return user;
}
