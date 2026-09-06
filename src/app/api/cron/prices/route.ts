import { NextResponse } from "next/server";
import { refreshHeldSecurityPrices } from "@/server/services/security.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Daily security-price refresh (Finnhub). Scheduled via vercel.json;
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshHeldSecurityPrices();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/prices]", err);
    return NextResponse.json(
      { ok: false, error: "refresh_failed" },
      { status: 502 },
    );
  }
}
