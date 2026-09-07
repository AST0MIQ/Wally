import type { Metadata } from "next";

import { requireUser } from "@/server/lib/guards";
import { listPortfolios } from "@/server/services/portfolio.service";
import { listAccountsMinimal } from "@/server/services/account.service";
import { getStreak } from "@/server/services/streak.service";
import { PortfolioList } from "@/components/portfolio/portfolio-list";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  const user = await requireUser();
  const [portfolios, accounts, streak] = await Promise.all([
    listPortfolios(user.id),
    listAccountsMinimal(user.id),
    getStreak(user.id),
  ]);

  return (
    <PortfolioList
      portfolios={portfolios}
      accounts={accounts}
      streakTier={streak.tierIndex}
    />
  );
}
