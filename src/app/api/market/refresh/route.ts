import { NextResponse } from "next/server";

import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { refreshLiveRates } from "@/server/lib/fx";
import { refreshUserSecurityPrices } from "@/server/services/security.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [user, currencies] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { baseCurrency: true } }),
    prisma.financeAccount.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      distinct: ["currency"],
      select: { currency: true },
    }),
  ]);
  const currencyList = [...new Set([user?.baseCurrency ?? "THB", ...currencies.map((row) => row.currency)])];
  const [prices, fx] = await Promise.all([
    refreshUserSecurityPrices(session.user.id),
    refreshLiveRates(currencyList),
  ]);
  return NextResponse.json({
    ok: true,
    changed: prices.updated > 0 || fx.rowsWritten > 0,
    prices,
    fx,
    refreshedAt: new Date().toISOString(),
  });
}
