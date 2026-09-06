import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { requireAdmin } from "@/server/lib/guards";
import { getAdminStats } from "@/server/services/admin.service";
import type { Locale } from "@/i18n/config";
import { formatDate, formatNumber } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/charts/stat-card";
import { LineChart } from "@/components/charts/line-chart";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();
  const stats = await getAdminStats();
  const t = await getTranslations("admin");
  const locale = (await getLocale()) as Locale;

  const n = (v: number) => formatNumber(v, locale);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("totalUsers")} value={n(stats.totalUsers)} />
        <StatCard label={t("newToday")} value={n(stats.newToday)} />
        <StatCard label={t("newThisMonth")} value={n(stats.newThisMonth)} />
        <StatCard label={t("activeUsers")} value={n(stats.activeUsers)} />
      </div>

      <Card className="flex flex-col gap-2 p-5">
        <h2 className="text-sm font-semibold">{t("signups30d")}</h2>
        <LineChart
          data={stats.signups.map((s) => ({
            label: formatDate(s.date, locale, {
              month: "short",
              day: "numeric",
            }),
            value: s.count,
          }))}
        />
      </Card>

      <p className="text-xs text-muted-foreground">{t("activeHint")}</p>
    </section>
  );
}
