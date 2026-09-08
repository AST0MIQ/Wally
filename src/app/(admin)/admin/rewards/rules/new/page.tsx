import { getTranslations } from "next-intl/server";

import { requireCapability } from "@/server/lib/guards";
import { listCollections } from "@/server/services/cosmetics/collection.service";
import { listAssets } from "@/server/services/cosmetics/asset.service";
import { RewardRuleForm } from "@/components/admin/reward-rule-form";

export const metadata = { title: "New reward rule" };

export default async function NewRewardRulePage() {
  await requireCapability("rewardRule:write");
  const t = await getTranslations("admin.rewardRules");
  const [collections, assets] = await Promise.all([
    listCollections(),
    listAssets({}),
  ]);
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-tight">{t("newTitle")}</h1>
      <RewardRuleForm
        collections={collections.map((c) => ({ id: c.id, label: c.name }))}
        assets={assets.map((a) => ({ id: a.id, label: `${a.slot} · ${a.name}` }))}
      />
    </div>
  );
}
