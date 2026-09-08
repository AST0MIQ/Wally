import { getTranslations } from "next-intl/server";

import { requireAdmin } from "@/server/lib/guards";
import { CollectionForm } from "@/components/admin/collection-form";

export const metadata = { title: "New collection" };

export default async function NewCollectionPage() {
  await requireAdmin();
  const t = await getTranslations("admin.collections");
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-tight">{t("newTitle")}</h1>
      <CollectionForm />
    </div>
  );
}
