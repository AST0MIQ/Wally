import type { Metadata } from "next";

import { requireUser } from "@/server/lib/guards";
import { listPortfolios } from "@/server/services/portfolio.service";
import { listAccountsMinimal } from "@/server/services/account.service";
import { PortfolioList } from "@/components/portfolio/portfolio-list";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  const user = await requireUser();
  const [portfolios, accounts] = await Promise.all([
    listPortfolios(user.id),
    listAccountsMinimal(user.id),
  ]);

  return <PortfolioList portfolios={portfolios} accounts={accounts} />;
}
