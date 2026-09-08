import { getRequestPrincipal, requireAdmin } from "@/server/lib/guards";
import { AdminShell } from "@/components/admin/admin-shell";

// The Admin Console never renders any user's financial data. It has its own
// shell (no QuickAdd / bottom nav / streak) and re-checks auth on every page.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const principal = await getRequestPrincipal();
  return <AdminShell email={user.email} permissions={[...principal.permissions]}>{children}</AdminShell>;
}
