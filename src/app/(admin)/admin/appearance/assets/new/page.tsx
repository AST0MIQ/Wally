import { getTranslations } from "next-intl/server";

import { requirePermission } from "@/server/lib/guards";
import { AssetForm } from "@/components/admin/asset-form";
import { listPickableMedia } from "@/server/services/cosmetics/media.service";

export const metadata = { title: "New asset" };

export default async function NewAssetPage() {
  await requirePermission("assets.write");
  const t = await getTranslations("admin.assets");
  const media = await listPickableMedia();
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-tight">{t("newTitle")}</h1>
      <AssetForm media={media} />
    </div>
  );
}
