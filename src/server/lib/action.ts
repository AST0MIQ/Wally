import { z } from "zod";
import { AppError } from "@/server/lib/errors";
import { requireUser, type SessionUser } from "@/server/lib/guards";
import { rateLimit, RATE_LIMITS } from "@/server/lib/rate-limit";

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(
  error: string,
  fieldErrors?: FieldErrors,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/**
 * Wrap a Server Action body: authenticates, validates input with `schema`,
 * and normalizes thrown errors into an `ActionResult`. The handler always
 * receives a session-derived `user` — never trust a client-supplied userId.
 */
export function action<TSchema extends z.ZodTypeAny, TOut>(
  schema: TSchema,
  handler: (args: {
    input: z.infer<TSchema>;
    user: SessionUser;
  }) => Promise<TOut>,
  opts: { name?: string; rateLimit?: { limit: number; windowMs: number } } = {},
) {
  return async (rawInput: z.input<TSchema>): Promise<ActionResult<TOut>> => {
    const user = await requireUser();

    const limit = opts.rateLimit ?? RATE_LIMITS.mutation;
    const rl = rateLimit(`action:${opts.name ?? "*"}:${user.id}`, limit);
    if (!rl.ok) return fail("rate_limited");

    const parsed = schema.safeParse(rawInput);
    if (!parsed.success) {
      return fail("validation_error", parsed.error.flatten().fieldErrors);
    }

    try {
      const data = await handler({ input: parsed.data, user });
      return ok(data);
    } catch (err) {
      if (err instanceof AppError) return fail(err.message);
      console.error("[action] unexpected error", err);
      return fail("unexpected_error");
    }
  };
}
