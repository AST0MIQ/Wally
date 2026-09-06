import type { Metadata } from "next";

import { requireUser } from "@/server/lib/guards";
import { getAnalytics } from "@/server/services/analytics.service";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const user = await requireUser();
  const data = await getAnalytics(user.id);

  return <AnalyticsView data={data} />;
}
