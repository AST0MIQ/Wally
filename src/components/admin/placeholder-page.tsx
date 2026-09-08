import { getTranslations } from "next-intl/server";
import { Construction } from "lucide-react";

import { Card } from "@/components/ui/card";

export async function PlaceholderPage({
  title,
  bodyKey,
}: {
  title: string;
  bodyKey: string;
}) {
  const t = await getTranslations("admin.placeholder");
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <Construction className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">{t("title")}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{t(bodyKey)}</p>
      </Card>
    </div>
  );
}
