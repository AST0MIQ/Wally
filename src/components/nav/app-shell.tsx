import type { ReactNode } from "react";

import type { AccountLite } from "@/server/services/account.service";
import type { CategoryNode } from "@/server/services/category.service";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileTopBar } from "@/components/nav/mobile-top-bar";
import { BottomNav } from "@/components/nav/bottom-nav";
import { QuickAddProvider } from "@/components/transactions/quick-add-provider";
import { MarketDataRefresh } from "@/components/market/market-data-refresh";

type AppShellProps = {
  children: ReactNode;
  role: "USER" | "ADMIN";
  email?: string | null;
  lastSeenVersion: string;
  accounts: AccountLite[];
  categories: CategoryNode[];
};

export function AppShell({
  children,
  role,
  email,
  lastSeenVersion,
  accounts,
  categories,
}: AppShellProps) {
  return (
    <QuickAddProvider accounts={accounts} categories={categories}>
      <MarketDataRefresh />
      <div className="md:grid md:grid-cols-[224px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar
          role={role}
          email={email}
          lastSeenVersion={lastSeenVersion}
          className="sticky top-0 hidden md:block"
        />

        <div className="flex min-h-dvh flex-col">
          <MobileTopBar role={role} email={email} lastSeenVersion={lastSeenVersion} className="md:hidden" />

          <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-10 md:pt-10">
            {children}
          </main>

          <BottomNav className="md:hidden" />
        </div>
      </div>
    </QuickAddProvider>
  );
}
