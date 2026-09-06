import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

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

/** Require an ADMIN user. Non-admins are bounced to their dashboard. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}
