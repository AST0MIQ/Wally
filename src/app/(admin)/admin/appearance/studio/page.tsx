import { getTranslations } from "next-intl/server";

import { requirePermission } from "@/server/lib/guards";
import { AssetForm } from "@/components/admin/asset-form";
import { listMedia } from "@/server/services/cosmetics/media.service";

export const metadata = { title: "Asset Studio" };

export default async function StudioPage() {
  await requirePermission("assets.write");
  const t = await getTranslations("admin.studio");
  const media = await listMedia(true);
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mb-4 text-sm text-muted-foreground">{t("subtitle")}</p>
      <AssetForm media={media.map(({ id, name, url }) => ({ id, name, url }))} />
    </div>
  );
}
