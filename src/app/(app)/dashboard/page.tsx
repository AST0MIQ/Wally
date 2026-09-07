import type { Metadata } from "next";

import { requireUser } from "@/server/lib/guards";
import { getDashboard } from "@/server/services/dashboard.service";
import { getStreak } from "@/server/services/streak.service";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [data, streak] = await Promise.all([
    getDashboard(user.id),
    getStreak(user.id),
  ]);
  const firstName = user.name?.split(" ")[0];

  return <DashboardView data={data} firstName={firstName} streak={streak} />;
}
