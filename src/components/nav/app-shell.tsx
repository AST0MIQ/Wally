import type { ReactNode } from "react";

import type { AccountLite } from "@/server/services/account.service";
import type { CategoryNode } from "@/server/services/category.service";
import type { StreakData } from "@/server/services/streak.service";
import { Sidebar } from "@/components/nav/sidebar";
import { MobileTopBar } from "@/components/nav/mobile-top-bar";
import { DesktopHeader } from "@/components/nav/desktop-header";
import { BottomNav } from "@/components/nav/bottom-nav";
import { StreakCelebration } from "@/components/streak/streak-celebration";
import { WelcomeTour } from "@/components/onboarding/welcome-tour";
import { QuickAddProvider } from "@/components/transactions/quick-add-provider";
import { MarketDataRefresh } from "@/components/market/market-data-refresh";

type AppShellProps = {
  children: ReactNode;
  role: "USER" | "ADMIN";
  name?: string | null;
  email?: string | null;
  lastSeenVersion: string;
  accounts: AccountLite[];
  categories: CategoryNode[];
  streak?: StreakData;
};

const NO_STREAK: StreakData = {
  count: 0,
  best: 0,
  tierIndex: -1,
  nextKey: null,
  daysToNext: null,
  progressPct: 0,
  ladder: [],
  loggedToday: false,
  pendingCelebration: -1,
};

export function AppShell({
  children,
  role,
  name,
  email,
  lastSeenVersion,
  accounts,
  categories,
  streak = NO_STREAK,
}: AppShellProps) {
  const chipStreak = {
    tierIndex: streak.tierIndex,
    progressPct: streak.progressPct,
  };
  return (
    <QuickAddProvider accounts={accounts} categories={categories}>
      <MarketDataRefresh />
      <WelcomeTour />
      <StreakCelebration
        pending={streak.pendingCelebration}
        count={streak.count}
      />
      <div className="md:grid md:grid-cols-[224px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar
          role={role}
          email={email}
          lastSeenVersion={lastSeenVersion}
          className="sticky top-0 hidden md:block"
        />

        <div className="flex min-h-dvh flex-col">
          <MobileTopBar role={role} name={name} email={email} lastSeenVersion={lastSeenVersion} streak={chipStreak} className="md:hidden" />
          <DesktopHeader name={name} email={email} streak={chipStreak} />

          <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-10 md:pt-10">
            {children}
          </main>

          <BottomNav className="md:hidden" />
        </div>
      </div>
    </QuickAddProvider>
  );
}
