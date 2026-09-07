import { requireUser } from "@/server/lib/guards";
import { getQuickAddData } from "@/server/services/quick-add";
import { AppShell } from "@/components/nav/app-shell";

// Authenticated pages always depend on the current session and live database data.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const { accounts, categories } = await getQuickAddData(user.id);

  return (
    <AppShell
      role={user.role}
      email={user.email}
      lastSeenVersion={user.lastSeenVersion}
      accounts={accounts}
      categories={categories}
    >
      {children}
    </AppShell>
  );
}
