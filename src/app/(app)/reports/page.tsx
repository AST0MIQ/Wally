import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const t = await getTranslations("reports");
  return <PagePlaceholder title={t("title")} description={t("comingSoon")} />;
}
