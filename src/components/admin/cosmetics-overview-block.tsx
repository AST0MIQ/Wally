import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Box, Layers } from "lucide-react";

import { getCosmeticsAdminStats } from "@/server/services/cosmetics/admin-cosmetics.service";
import { Card } from "@/components/ui/card";

export async function CosmeticsOverviewBlock() {
  const t = await getTranslations("admin.cos");
  const stats = await getCosmeticsAdminStats();

  const tiles = [
    {
      label: t("collections"),
      value: stats.collections.total,
      sub: `${stats.collections.published} ${t("published")} · ${stats.collections.draft} ${t("draft")}`,
      href: "/admin/appearance/collections",
      icon: Layers,
    },
    {
      label: t("assets"),
      value: stats.assets.total,
      sub: `${stats.assets.published} ${t("published")} · ${stats.assets.draft} ${t("draft")}`,
      href: "/admin/appearance/assets",
      icon: Box,
    },
    {
      label: t("entitlements"),
      value: stats.entitlements.total,
      sub: `${stats.entitlements.active} ${t("active")}`,
      href: "/admin/users/entitlements",
    },
    {
      label: t("usersWithLoadout"),
      value: stats.usersWithLoadout,
      href: "/admin/users/loadouts",
    },
    {
      label: t("rewardRules"),
      value: stats.rewardRules.total,
      sub: `${stats.rewardRules.active} ${t("active")}`,
      href: "/admin/rewards/rules",
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("overviewTitle")}</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href}>
            <Card className="flex h-full flex-col gap-1 p-4 transition-colors hover:bg-muted">
              <span className="text-xs text-muted-foreground">{tile.label}</span>
              <span className="text-2xl font-bold tabular-nums">{tile.value}</span>
              {tile.sub && (
                <span className="text-[11px] text-muted-foreground">{tile.sub}</span>
              )}
            </Card>
          </Link>
        ))}
      </div>
      {stats.assets.bySlot.length > 0 && (
        <Card className="flex flex-col gap-2 p-4">
          <span className="text-xs font-medium text-muted-foreground">{t("bySlot")}</span>
          <div className="flex flex-wrap gap-1.5">
            {stats.assets.bySlot.map((s) => (
              <span
                key={s.slot}
                className="rounded-full border border-border px-2 py-0.5 text-[11px]"
              >
                {s.slot} · {s.count}
              </span>
            ))}
          </div>
        </Card>
      )}
    </section>
  );
}
