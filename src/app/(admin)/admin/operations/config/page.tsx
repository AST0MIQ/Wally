import { getTranslations } from "next-intl/server";

import { requireAdmin } from "@/server/lib/guards";
import { PlaceholderPage } from "@/components/admin/placeholder-page";

export default async function ConfigPage() {
  await requireAdmin();
  const t = await getTranslations("admin.nav");
  return <PlaceholderPage title={t("appConfig")} bodyKey="appConfig" />;
}
