import { getTranslations } from "next-intl/server";

import { requireCapability } from "@/server/lib/guards";
import { AssetForm } from "@/components/admin/asset-form";

export const metadata = { title: "Asset Studio" };

export default async function StudioPage() {
  await requireCapability("cosmetics:write");
  const t = await getTranslations("admin.studio");
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mb-4 text-sm text-muted-foreground">{t("subtitle")}</p>
      <AssetForm />
    </div>
  );
}
