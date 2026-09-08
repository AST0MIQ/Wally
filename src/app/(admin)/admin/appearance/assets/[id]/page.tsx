import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { requirePermission } from "@/server/lib/guards";
import { getAsset } from "@/server/services/cosmetics/asset.service";
import { parseAssetConfig } from "@/lib/cosmetics/config";
import { wasEverPublished } from "@/lib/cosmetics/lifecycle";
import {
  setAssetStatusAction,
  deleteAssetAction,
} from "@/app/actions/admin/cosmetics";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatusActions } from "@/components/admin/status-actions";
import { AssetForm } from "@/components/admin/asset-form";
import { DuplicateAssetButton } from "@/components/admin/duplicate-asset-button";
import { listMedia } from "@/server/services/cosmetics/media.service";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("assets.write");
  const { id } = await params;
  const t = await getTranslations("admin.assets");

  const [asset, media] = await Promise.all([
    getAsset(id).catch(() => null),
    listMedia(true),
  ]);
  if (!asset) notFound();

  const configLocked = asset.status !== "DRAFT" || wasEverPublished(asset);
  let config;
  try {
    config = parseAssetConfig(asset.configVersion, asset.config);
  } catch {
    config = {};
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{asset.name}</h1>
          <p className="text-xs text-muted-foreground">
            {asset.slug} · {asset.slot}
          </p>
        </div>
        <StatusBadge status={asset.status} />
      </div>

      <StatusActions
        id={asset.id}
        status={asset.status}
        setStatus={setAssetStatusAction}
        remove={deleteAssetAction}
        extra={<DuplicateAssetButton id={asset.id} baseSlug={asset.slug} />}
      />

      {asset.collections.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("inCollections")}:{" "}
          {asset.collections.map((c, i) => (
            <span key={c.collection.id}>
              {i > 0 && ", "}
              <Link
                href={`/admin/appearance/collections/${c.collection.id}`}
                className="text-primary hover:underline"
              >
                {c.collection.name}
              </Link>
            </span>
          ))}
        </p>
      )}

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold">{t("editTitle")}</h2>
        <AssetForm
          configLocked={configLocked}
          media={media.map(({ id: mediaId, name, url }) => ({ id: mediaId, name, url }))}
          asset={{
            id: asset.id,
            slug: asset.slug,
            name: asset.name,
            description: asset.description,
            slot: asset.slot,
            rarity: asset.rarity,
            acquisitionType: asset.acquisitionType,
            previewUrl: asset.previewUrl,
            config,
          }}
        />
      </Card>
    </div>
  );
}
