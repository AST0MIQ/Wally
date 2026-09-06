import { requireUser } from "@/server/lib/guards";
import { buildUserExport } from "@/server/services/export.service";
import { writeAudit } from "@/server/lib/audit";
import { rateLimit, RATE_LIMITS } from "@/server/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const user = await requireUser();

  const rl = rateLimit(`export:${user.id}`, RATE_LIMITS.export);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: "rate_limited" }), {
      status: 429,
      headers: { "content-type": "application/json" },
    });
  }

  const data = await buildUserExport(user.id);
  await writeAudit({
    userId: user.id,
    action: "data.export",
    entity: "User",
    entityId: user.id,
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="wally-export-${stamp}.json"`,
      "cache-control": "no-store",
    },
  });
}
