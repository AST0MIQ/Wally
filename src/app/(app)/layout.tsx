import { requireUser } from "@/server/lib/guards";
import { getQuickAddData } from "@/server/services/quick-add";
import { AppShell } from "@/components/nav/app-shell";

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
      accounts={accounts}
      categories={categories}
    >
      {children}
    </AppShell>
  );
}
