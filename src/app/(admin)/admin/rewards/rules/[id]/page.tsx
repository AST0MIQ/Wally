import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { requireAdmin } from "@/server/lib/guards";
import { getRewardRule } from "@/server/services/cosmetics/reward-rule.service";
import { listCollections } from "@/server/services/cosmetics/collection.service";
import { listAssets } from "@/server/services/cosmetics/asset.service";
import { Card } from "@/components/ui/card";
import { RewardRuleForm } from "@/components/admin/reward-rule-form";
import { DeleteRewardRuleButton } from "@/components/admin/delete-reward-rule-button";

export default async function RewardRuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const t = await getTranslations("admin.rewardRules");

  const rule = await getRewardRule(id).catch(() => null);
  if (!rule) notFound();

  const [collections, assets] = await Promise.all([
    listCollections(),
    listAssets({}),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{rule.name}</h1>
          <p className="text-xs text-muted-foreground">{rule.key}</p>
        </div>
        <DeleteRewardRuleButton id={rule.id} />
      </div>

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold">{t("editTitle")}</h2>
        <RewardRuleForm
          rule={{
            id: rule.id,
            key: rule.key,
            name: rule.name,
            description: rule.description,
            trigger: rule.trigger,
            threshold: rule.threshold,
            grantsCollectionId: rule.grantsCollectionId,
            grantsAssetId: rule.grantsAssetId,
            isActive: rule.isActive,
          }}
          collections={collections.map((c) => ({ id: c.id, label: c.name }))}
          assets={assets.map((a) => ({ id: a.id, label: `${a.slot} · ${a.name}` }))}
        />
      </Card>
    </div>
  );
}
