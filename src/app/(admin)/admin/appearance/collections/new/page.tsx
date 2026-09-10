import { getTranslations } from "next-intl/server";

import { requirePermission } from "@/server/lib/guards";
import { CollectionForm } from "@/components/admin/collection-form";
import { listPickableMedia } from "@/server/services/cosmetics/media.service";

export const metadata = { title: "New collection" };

export default async function NewCollectionPage() {
  await requirePermission("collections.write");
  const t = await getTranslations("admin.collections");
  const media = await listPickableMedia();
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-tight">{t("newTitle")}</h1>
      <CollectionForm media={media} />
    </div>
  );
}
