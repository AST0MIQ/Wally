import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/server/lib/guards";
import { AppError } from "@/server/lib/errors";
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
    const [detail, history, accounts] = await Promise.all([
      getPortfolio(user.id, id),
      listInvestmentTransactions(user.id, id, { limit: 50 }),
      listAccountsMinimal(user.id),
    ]);

    return (
      <PortfolioDetailView
        detail={detail}
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
