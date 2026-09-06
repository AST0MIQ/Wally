import { NextResponse } from "next/server";
import { snapshotAllUsers } from "@/server/lib/networth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** Daily net-worth snapshot for every user. Scheduled via vercel.json. */
export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await snapshotAllUsers();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/networth]", err);
    return NextResponse.json(
      { ok: false, error: "snapshot_failed" },
      { status: 500 },
    );
  }
}
