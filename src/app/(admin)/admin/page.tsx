import type { Metadata } from "next";

import { requireCapability } from "@/server/lib/guards";
import { AdminOverview } from "@/components/admin/admin-overview";
import { CosmeticsOverviewBlock } from "@/components/admin/cosmetics-overview-block";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireCapability("admin:read");
  return (
    <div className="flex flex-col gap-10">
      <AdminOverview />
      <CosmeticsOverviewBlock />
    </div>
  );
}
