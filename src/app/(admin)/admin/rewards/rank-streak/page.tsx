import { getTranslations } from "next-intl/server";

import { requireAdmin } from "@/server/lib/guards";
import { STREAK_TIERS } from "@/server/lib/streak";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Rank & Streak" };

export default async function RankStreakPage() {
  await requireAdmin();
  const t = await getTranslations("admin.rankStreak");
  const s = await getTranslations("streak");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <Card className="divide-y divide-border">
        {STREAK_TIERS.map((tier, i) => (
          <div key={tier.key} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span className="w-8 text-xs text-muted-foreground">#{i}</span>
            <span className="flex-1 font-medium">{s(`tier_${tier.key}`)}</span>
            <span className="tabular-nums text-muted-foreground">
              {tier.days} {tier.days === 1 ? t("day") : t("days")}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
