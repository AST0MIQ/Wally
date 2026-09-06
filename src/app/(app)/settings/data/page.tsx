import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Download } from "lucide-react";

import { requireUser } from "@/server/lib/guards";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteAccountButton } from "@/components/settings/danger-zone";

export const metadata: Metadata = { title: "Data & privacy" };

export default async function DataSettingsPage() {
  await requireUser();
  const t = await getTranslations("settingsData");

  return (
    <section className="flex flex-col gap-6">
      <Link
        href="/settings"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {t("back")}
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("export")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t("exportHint")}</p>
          <a
            href="/api/export"
            className={buttonVariants({ variant: "secondary" })}
          >
            <Download className="size-4" />
            {t("exportCta")}
          </a>
        </CardContent>
      </Card>

      <Card className="border-negative/30">
        <CardHeader>
          <CardTitle className="text-negative">{t("dangerZone")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t("deleteHint")}</p>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </section>
  );
}
