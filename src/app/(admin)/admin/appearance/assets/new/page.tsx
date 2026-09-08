import { getTranslations } from "next-intl/server";

import { requireAdmin } from "@/server/lib/guards";
import { AssetForm } from "@/components/admin/asset-form";

export const metadata = { title: "New asset" };

export default async function NewAssetPage() {
  await requireAdmin();
  const t = await getTranslations("admin.assets");
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-tight">{t("newTitle")}</h1>
      <AssetForm />
    </div>
  );
}
