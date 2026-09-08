import { getTranslations } from "next-intl/server";

import { requireCapability } from "@/server/lib/guards";
import { PlaceholderPage } from "@/components/admin/placeholder-page";

export default async function ProductsPage() {
  await requireCapability("admin:read");
  const t = await getTranslations("admin.nav");
  return <PlaceholderPage title={t("products")} bodyKey="products" />;
}
