import { getTranslations } from "next-intl/server";

import { requirePermission } from "@/server/lib/guards";
import { STREAK_TIERS } from "@/server/lib/streak";
import { Card } from "@/components/ui/card";
import { prisma } from "@/server/db";
import { RankPointsForm } from "@/components/admin/rank-points-form";

export const metadata = { title: "Rank & Streak" };

export default async function RankStreakPage() {
  await requirePermission("users.read");
  const t = await getTranslations("admin.rankStreak");
  const s = await getTranslations("streak");

  const users = await prisma.user.findMany({ orderBy: { email: "asc" }, take: 100, select: { id: true, email: true, name: true, rank: true } });
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
      <Card className="p-4"><h2 className="font-semibold">แต้มและระดับของผู้ใช้</h2><p className="mb-3 text-sm text-muted-foreground">ทุก 100 แต้มจะเพิ่ม 1 ระดับ และระบบจะตรวจรางวัลให้อัตโนมัติ</p><div className="divide-y divide-border">{users.map((user) => <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">{user.name || user.email}</p><p className="text-xs text-muted-foreground">ระดับ {user.rank?.level ?? 1} · {user.email}</p></div><RankPointsForm userId={user.id} initial={user.rank?.points ?? 0} /></div>)}</div></Card>
    </div>
  );
}
