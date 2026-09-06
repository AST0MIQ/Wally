import { PageHeader } from "@/components/ui/page-header";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";

import { requireUser } from "@/server/lib/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/nav/language-switcher";
import { ThemeToggle } from "@/components/settings/theme-toggle";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const ui = await getTranslations("ui");
  const t = await getTranslations("settings");

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={ui("settings")} />

      <div className="flex flex-col gap-2">
        <Link href="/settings/categories" className="block">
          <Card className="flex items-center justify-between p-5 transition-colors hover:bg-muted">
            <div>
              <p className="font-medium">{t("categories")}</p>
              <p className="text-sm text-muted-foreground">
                {t("manageCategories")}
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Card>
        </Link>
        <Link href="/settings/data" className="block">
          <Card className="flex items-center justify-between p-5 transition-colors hover:bg-muted">
            <div>
              <p className="font-medium">{t("dataPrivacy")}</p>
              <p className="text-sm text-muted-foreground">
                {t("dataPrivacyHint")}
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("appearance")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("baseCurrency")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {user.baseCurrency}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("timezone")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {user.timezone}
        </CardContent>
      </Card>
    </section>
  );
}
