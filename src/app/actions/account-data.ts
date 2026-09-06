"use server";

import { z } from "zod";

import { auth, signOut } from "@/server/auth";
import { writeAudit } from "@/server/lib/audit";
import { deleteUserAccount } from "@/server/services/export.service";
import { fail, ok, type ActionResult } from "@/server/lib/action";

const schema = z.object({ confirm: z.string() });

/**
 * Permanently delete the signed-in user's own account. Requires typing the
 * exact confirmation phrase "DELETE"; cascades all owned data; signs out.
 */
export async function deleteMyAccountAction(
  raw: z.input<typeof schema>,
): Promise<ActionResult<never>> {
  const session = await auth();
  if (!session?.user?.id) return fail("unauthorized");

  const parsed = schema.safeParse(raw);
  if (!parsed.success || parsed.data.confirm.trim() !== "DELETE") {
    return fail("confirm_mismatch");
  }

  await writeAudit({
    userId: session.user.id,
    action: "account.delete_self",
    entity: "User",
    entityId: session.user.id,
  });
  await deleteUserAccount(session.user.id);
  await signOut({ redirectTo: "/" });
  return ok(undefined as never);
}
