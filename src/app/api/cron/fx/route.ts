import { NextResponse } from "next/server";
import { refreshLatestRates } from "@/server/lib/fx";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Daily FX refresh. Schedule via Vercel Cron (vercel.json) which sends
 * `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshLatestRates();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/fx]", err);
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 502 });
  }
}
