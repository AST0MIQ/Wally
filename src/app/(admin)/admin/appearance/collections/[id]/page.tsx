import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { requirePermission } from "@/server/lib/guards";
import { getCollection } from "@/server/services/cosmetics/collection.service";
import { listAssets } from "@/server/services/cosmetics/asset.service";
import {
  setCollectionStatusAction,
  deleteCollectionAction,
} from "@/app/actions/admin/cosmetics";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatusActions } from "@/components/admin/status-actions";
import { CollectionForm } from "@/components/admin/collection-form";
import { CollectionAssetsPanel } from "@/components/admin/collection-assets-panel";
import { DuplicateCollectionButton } from "@/components/admin/duplicate-collection-button";
import { wasEverPublished } from "@/lib/cosmetics/lifecycle";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("collections.write");
  const { id } = await params;
  const t = await getTranslations("admin.collections");

  const collection = await getCollection(id).catch(() => null);
  if (!collection) notFound();

  const frozen = wasEverPublished(collection);
  const candidates = await listAssets({});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{collection.name}</h1>
          <p className="text-xs text-muted-foreground">{collection.slug}</p>
        </div>
        <StatusBadge status={collection.status} />
      </div>

      <StatusActions
        id={collection.id}
        status={collection.status}
        setStatus={setCollectionStatusAction}
        remove={frozen ? undefined : deleteCollectionAction}
        extra={
          frozen ? (
            <DuplicateCollectionButton id={collection.id} baseSlug={collection.slug} />
          ) : undefined
        }
      />
      {frozen && (
        <p className="text-xs text-muted-foreground">{t("frozenHint")}</p>
      )}
      {collection.assets.length === 0 && !frozen && (
        <p className="text-xs text-warning">{t("publishBlocked")}</p>
      )}

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold">{t("editTitle")}</h2>
        <CollectionForm
          collection={{
            id: collection.id,
            slug: collection.slug,
            name: collection.name,
            description: collection.description,
            rarity: collection.rarity,
            isApplicableAsSet: collection.isApplicableAsSet,
            coverUrl: collection.coverUrl,
            availableFrom: collection.availableFrom,
            availableTo: collection.availableTo,
          }}
        />
      </Card>

      <Card className="p-5">
        <CollectionAssetsPanel
          collectionId={collection.id}
          frozen={frozen}
          attached={collection.assets.map((a) => ({
            assetId: a.assetId,
            slot: a.slot,
            asset: a.asset,
          }))}
          candidates={candidates.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            slot: c.slot,
            status: c.status,
          }))}
        />
      </Card>
    </div>
  );
}
