import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronRight, Flame, Sparkles } from "lucide-react";

import { requireUser } from "@/server/lib/guards";
import { prisma } from "@/server/db";
import { getStreak } from "@/server/services/streak.service";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";

import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { StreakRing } from "@/components/streak/streak-ring";
import { StreakLadder } from "@/components/streak/streak-ladder";
import { ProfileAvatarDecorations } from "@/components/cosmetics/profile-avatar-decorations";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("profile");
  const s = await getTranslations("streak");
  const nav = await getTranslations("nav");
  const cos = await getTranslations("cosmetics");

  const [record, streak] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { createdAt: true, lastLoginAt: true },
    }),
    getStreak(user.id),
  ]);

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
        <span className="relative shrink-0">
          <StreakRing
            tierIndex={streak.tierIndex}
            progressPct={streak.progressPct}
            dim={64}
          >
            <span className="flex size-full items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary">
              {initial}
            </span>
          </StreakRing>
          <ProfileAvatarDecorations />
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{name}</p>
          {user.email && (
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          )}
        </div>
      </Card>

      {/* Logging streak */}
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flame className="size-3.5 text-primary" />
              {s("streakLabel")}
            </p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums">
              {s("unitDays", { n: streak.count })}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {s("best", { n: streak.best })}
          </p>
        </div>

        {streak.nextKey ? (
          <div className="flex flex-col gap-1.5">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${Math.max(4, streak.progressPct)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {streak.count === 0
                ? s("startHint")
                : s("toNext", {
                    n: streak.daysToNext ?? 0,
                    tier: s(`tier_${streak.nextKey}`),
                  })}
            </p>
          </div>
        ) : (
          <p className="text-xs font-medium text-primary">{s("maxed")}</p>
        )}

        <StreakLadder
          ladder={streak.ladder}
          currentTierIndex={streak.tierIndex}
          initial={initial}
        />
      </Card>

      <div className="flex flex-col gap-2">
        <Link href="/cosmetics" className="block">
          <Card className="flex items-center justify-between p-5 transition-colors hover:bg-muted">
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium">{cos("entryTitle")}</p>
                <p className="text-sm text-muted-foreground">{cos("entryHint")}</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Card>
        </Link>
        <Link href="/settings" className="block">
          <Card className="flex items-center justify-between p-5 transition-colors hover:bg-muted">
            <div>
              <p className="font-medium">{nav("settings")}</p>
              <p className="text-sm text-muted-foreground">{t("settingsHint")}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Card>
        </Link>
      </div>

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

      <div>
        <SignOutButton />
      </div>
    </section>
  );
}
