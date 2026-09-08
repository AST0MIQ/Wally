import { requireUser } from "@/server/lib/guards";
import { getQuickAddData } from "@/server/services/quick-add";
import { getStreak } from "@/server/services/streak.service";
import { getResolvedLoadout } from "@/server/services/cosmetics/loadout.service";
import { AppShell } from "@/components/nav/app-shell";
import { CosmeticRoot } from "@/components/cosmetics/cosmetic-root";
import { CosmeticProvider } from "@/components/cosmetics/cosmetic-context";

// Authenticated pages always depend on the current session and live database data.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const [{ accounts, categories }, streak, loadout] = await Promise.all([
    getQuickAddData(user.id),
    getStreak(user.id),
    getResolvedLoadout(user.id),
  ]);

  return (
    <CosmeticProvider loadout={loadout}>
      <CosmeticRoot loadout={loadout}>
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
      </CosmeticRoot>
    </CosmeticProvider>
  );
}
