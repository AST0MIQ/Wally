import { z } from "zod";

import { ok, fail, type ActionResult } from "@/server/lib/action";
import { AppError } from "@/server/lib/errors";
import {
  requireAdmin,
  requireAnyPermission,
  requireCapability,
  requirePermission,
  requireSuperAdmin,
  type SessionUser,
} from "@/server/lib/guards";
import { type Capability } from "@/server/lib/authz";
import type { PermissionKey } from "@/lib/rbac/catalogue";
import { rateLimit, RATE_LIMITS } from "@/server/lib/rate-limit";

type AdminActionOpts = {
  name?: string;
  /** Legacy capability (mapped to permission keys in authz.ts). */
  capability?: Capability;
  /** One explicit permission key. */
  permission?: PermissionKey;
  /** ANY one of these permission keys. */
  anyPermission?: readonly PermissionKey[];
  /** Require the narrow SUPER_ADMIN privilege. */
  superAdmin?: boolean;
};

async function authorize(opts: AdminActionOpts): Promise<SessionUser> {
  if (opts.superAdmin) return requireSuperAdmin();
  if (opts.permission) return requirePermission(opts.permission);
  if (opts.anyPermission) return requireAnyPermission(opts.anyPermission);
  if (opts.capability) return requireCapability(opts.capability);
  return requireAdmin();
}

/**
 * Server Action wrapper for Admin Console operations. Mirrors `action()` but:
 *  - authenticates and enforces DB-backed RBAC (`superAdmin` > `permission` >
 *    `anyPermission` > `capability` > any-admin, first match wins);
 *  - rate-limits per admin;
 *  - normalises thrown `AppError`s into an `ActionResult`.
 *
 * It does **not** write audit records — that is the domain service's job,
 * inside the same `$transaction` as the mutation (see `auditInTx`). Keeping a
 * single audit path avoids duplicate / orphaned audit rows.
 */
export function adminAction<TSchema extends z.ZodTypeAny, TOut>(
  schema: TSchema,
  handler: (args: {
    input: z.infer<TSchema>;
    admin: SessionUser;
  }) => Promise<TOut>,
  opts: AdminActionOpts = {},
) {
  return async (rawInput: z.input<TSchema>): Promise<ActionResult<TOut>> => {
    let admin: SessionUser;
    try {
      admin = await authorize(opts);
    } catch (err) {
      if (err instanceof AppError) return fail(err.message);
      throw err; // e.g. redirect() for unauthenticated / non-admin
    }

    const rl = rateLimit(
      `admin:${opts.name ?? "*"}:${admin.id}`,
      RATE_LIMITS.mutation,
    );
    if (!rl.ok) return fail("rate_limited");

    const parsed = schema.safeParse(rawInput);
    if (!parsed.success) {
      return fail("validation_error", parsed.error.flatten().fieldErrors);
    }

    try {
      return ok(await handler({ input: parsed.data, admin }));
    } catch (err) {
      if (err instanceof AppError) return fail(err.message);
      console.error("[adminAction] unexpected error", err);
      return fail("unexpected_error");
    }
  };
}
