import { requireAdmin } from "@/server/lib/guards";
import { AppShell } from "@/components/nav/app-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  // Admins have no financial data surface — Quick Add is intentionally empty.
  return (
    <AppShell role={user.role} email={user.email} accounts={[]} categories={[]}>
      {children}
    </AppShell>
  );
}
