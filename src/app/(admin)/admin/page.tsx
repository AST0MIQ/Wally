import type { Metadata } from "next";

import { requireAdmin } from "@/server/lib/guards";
import { AdminOverview } from "@/components/admin/admin-overview";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();
  return <AdminOverview />;
}
