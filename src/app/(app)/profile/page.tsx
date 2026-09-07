import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";

import { requireUser } from "@/server/lib/guards";
import { prisma } from "@/server/db";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";

import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("profile");
  const nav = await getTranslations("nav");

  const record = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { createdAt: true, lastLoginAt: true },
  });

  const name = user.name?.trim() || user.email?.split("@")[0] || "—";
  const initial = (user.name?.trim() || user.email || "?").charAt(0).toUpperCase();

  const rows: { label: string; value: string }[] = [
    {
      label: t("role"),
      value: user.role === "ADMIN" ? t("roleAdmin") : t("roleUser"),
    },
    { label: t("baseCurrency"), value: user.baseCurrency },
    { label: t("timezone"), value: user.timezone },
    {
      label: t("language"),
      value: locale === "th" ? t("languageThai") : t("languageEnglish"),
    },
    { label: t("joined"), value: formatDate(record.createdAt, locale) },
    ...(record.lastLoginAt
      ? [{ label: t("lastLogin"), value: formatDate(record.lastLoginAt, locale) }]
      : []),
  ];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={nav("profile")} description={t("subtitle")} />

      <Card className="flex items-center gap-4 p-5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{name}</p>
          {user.email && (
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          )}
        </div>
      </Card>

      <Card className="divide-y divide-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="text-right font-medium tabular-nums">{row.value}</span>
          </div>
        ))}
      </Card>

      <Link href="/settings" className="block">
        <Card className="flex items-center justify-between p-5 transition-colors hover:bg-muted">
          <div>
            <p className="font-medium">{nav("settings")}</p>
            <p className="text-sm text-muted-foreground">{t("settingsHint")}</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Card>
      </Link>

      <div>
        <SignOutButton />
      </div>
    </section>
  );
}
