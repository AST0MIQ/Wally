import type { Metadata } from "next";

import { requireUser } from "@/server/lib/guards";
import { getAnalytics, type Period } from "@/server/services/analytics.service";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export const metadata: Metadata = { title: "Analytics" };

const PERIODS: Period[] = ["week", "month", "year"];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const user = await requireUser();
  const raw = (await searchParams).period;
  const period = PERIODS.includes(raw as Period) ? (raw as Period) : "month";
  const data = await getAnalytics(user.id, period);

  return <AnalyticsView data={data} />;
}
