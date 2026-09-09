import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ONBOARDED_COOKIE } from "@/i18n/config";
import { requireUser } from "@/server/lib/guards";
import { getQuickAddData } from "@/server/services/quick-add";
import { getStreak } from "@/server/services/streak.service";
import { AppShell } from "@/components/nav/app-shell";

// Authenticated pages always depend on the current session and live database data.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const [{ accounts, categories }, streak] = await Promise.all([
    getQuickAddData(user.id),
    getStreak(user.id),
  ]);

  // First run on this browser, and nothing set up yet → send them through the
  // one-screen onboarding. Cookie-only (no DB column), so an existing account
  // with data is never bounced.
  const onboarded = (await cookies()).get(ONBOARDED_COOKIE)?.value === "1";
  if (!onboarded && accounts.length === 0) {
    redirect("/onboarding");
  }

  return (
    <AppShell
      role={user.role}
      name={user.name}
      email={user.email}
      lastSeenVersion={user.lastSeenVersion}
      accounts={accounts}
      categories={categories}
      streak={streak}
    >
      {children}
    </AppShell>
  );
}
