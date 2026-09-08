import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

import { requireAdmin } from "@/server/lib/guards";
import { listRewardRules } from "@/server/services/cosmetics/reward-rule.service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/admin/link-button";

export const metadata = { title: "Reward Rules" };

export default async function RewardRulesPage() {
  await requireAdmin();
  const t = await getTranslations("admin.rewardRules");
  const tc = await getTranslations("admin.common");
  const rows = await listRewardRules();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <LinkButton href="/admin/rewards/rules/new">
          <Plus className="size-4" />
          {tc("create")}
        </LinkButton>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <Link key={r.id} href={`/admin/rewards/rules/${r.id}`}>
              <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-muted">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.key} · {r.trigger}
                    {r.threshold != null ? ` ≥ ${r.threshold}` : ""} →{" "}
                    {r.grantsCollection?.name ?? r.grantsAsset?.name ?? "—"}
                  </p>
                </div>
                <Badge variant={r.isActive ? "positive" : "neutral"}>
                  {r.isActive ? t("active") : tc("status")}
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
