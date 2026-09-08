import { getTranslations } from "next-intl/server";

import { requireAdmin } from "@/server/lib/guards";
import { listAssets } from "@/server/services/cosmetics/asset.service";
import { parseAssetConfig } from "@/lib/cosmetics/config";
import { RENDERED_SLOTS } from "@/lib/cosmetics/slots";
import { PreviewLab, type PreviewAsset } from "@/components/admin/preview-lab";

export const metadata = { title: "Preview Lab" };

export default async function PreviewLabPage() {
  await requireAdmin();
  const t = await getTranslations("admin.previewLab");
  const rows = await listAssets({ status: "PUBLISHED" });

  const assets: PreviewAsset[] = rows
    .filter((a) => (RENDERED_SLOTS as readonly string[]).includes(a.slot))
    .map((a) => {
      let config = {};
      try {
        config = parseAssetConfig(a.configVersion, a.config);
      } catch {
        /* skip bad config */
      }
      return { id: a.id, name: a.name, slot: a.slot, config };
    });

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mb-4 text-sm text-muted-foreground">{t("subtitle")}</p>
      <PreviewLab assets={assets} />
    </div>
  );
}
