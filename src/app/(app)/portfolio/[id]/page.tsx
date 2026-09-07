import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/server/lib/guards";
import { AppError } from "@/server/lib/errors";
import { prisma } from "@/server/db";
import { convert } from "@/server/lib/fx";
import {
  getPortfolio,
  listInvestmentTransactions,
} from "@/server/services/portfolio.service";
import { listAccountsMinimal } from "@/server/services/account.service";
import { finnhubEnabled } from "@/server/lib/finnhub";
import { PortfolioDetailView } from "@/components/portfolio/portfolio-detail-view";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  try {
    const [detail, history, accounts, me] = await Promise.all([
      getPortfolio(user.id, id),
      listInvestmentTransactions(user.id, id, { limit: 50 }),
      listAccountsMinimal(user.id),
      prisma.user.findUnique({ where: { id: user.id }, select: { baseCurrency: true } }),
    ]);

    const userBase = me?.baseCurrency ?? detail.baseCurrency;
    let secondary: {
      currency: string;
      marketValue: string;
      cost: string;
      unrealizedPnL: string;
      approx: boolean;
    } | null = null;
    if (userBase !== detail.baseCurrency) {
      const [mv, cost, pnl] = await Promise.all([
        convert(detail.totalMarketValue, detail.baseCurrency, userBase),
        convert(detail.totalCost, detail.baseCurrency, userBase),
        convert(detail.totalUnrealizedPnL, detail.baseCurrency, userBase),
      ]);
      secondary = {
        currency: userBase,
        marketValue: mv.amount,
        cost: cost.amount,
        unrealizedPnL: pnl.amount,
        approx: mv.approx || cost.approx || pnl.approx,
      };
    }

    return (
      <PortfolioDetailView
        detail={detail}
        secondary={secondary}
        history={history.items}
        accounts={accounts}
        finnhubEnabled={finnhubEnabled()}
      />
    );
  } catch (err) {
    if (err instanceof AppError && err.code === "NOT_FOUND") notFound();
    throw err;
  }
}
