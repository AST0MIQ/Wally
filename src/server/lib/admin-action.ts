import { z } from "zod";

import { ok, fail, type ActionResult } from "@/server/lib/action";
import { AppError } from "@/server/lib/errors";
import {
  requireAdmin,
  requireCapability,
  type SessionUser,
} from "@/server/lib/guards";
import { type Capability } from "@/server/lib/authz";
import { rateLimit, RATE_LIMITS } from "@/server/lib/rate-limit";

/**
 * Server Action wrapper for Admin Console operations. Mirrors `action()` but:
 *  - authenticates as an admin and enforces an optional `capability`;
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
  opts: { name?: string; capability?: Capability } = {},
) {
  return async (rawInput: z.input<TSchema>): Promise<ActionResult<TOut>> => {
    let admin: SessionUser;
    try {
      admin = opts.capability
        ? await requireCapability(opts.capability)
        : await requireAdmin();
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
