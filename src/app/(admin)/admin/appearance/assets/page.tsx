import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

import { requirePermission } from "@/server/lib/guards";
import { listAssets } from "@/server/services/cosmetics/asset.service";
import { LinkButton } from "@/components/admin/link-button";
import { BulkAssetStatus } from "@/components/admin/bulk-asset-status";

export const metadata = { title: "Assets" };

export default async function AssetsPage() {
  await requirePermission("assets.read");
  const t = await getTranslations("admin.assets");
  const tc = await getTranslations("admin.common");
  const rows = await listAssets({});

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <LinkButton href="/admin/appearance/assets/new">
          <Plus className="size-4" />
          {tc("create")}
        </LinkButton>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <BulkAssetStatus rows={rows.map((a) => ({ id: a.id, name: a.name, slug: a.slug, slot: a.slot, rarity: a.rarity, status: a.status, collectionCount: a._count.collections, ownerCount: a._count.entitlements }))} />
      )}
    </div>
  );
}
