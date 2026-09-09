import { getLocale, getTranslations } from "next-intl/server";

import { getAdminStats, type MixSlice } from "@/server/services/admin.service";
import type { Locale } from "@/i18n/config";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/charts/stat-card";
import { LineChart } from "@/components/charts/line-chart";

const ACCENT_SWATCH: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  amber: "#ca8a04",
  lime: "#84cc16",
  emerald: "#10b981",
  teal: "#14b8a6",
  blue: "#3b82f6",
  violet: "#8b5cf6",
  rose: "#d946ef",
};

/** Aggregate, non-financial admin overview. Rendered by the guarded /admin page. */
export async function AdminOverview() {
  const stats = await getAdminStats();
  const t = await getTranslations("admin");
  const ts = await getTranslations("settings");
  const locale = (await getLocale()) as Locale;

  const n = (v: number) => formatNumber(v, locale);
  const pct = (part: number, whole: number) =>
    whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—";

  const momPct =
    stats.prevMonthUsers > 0
      ? Math.round(((stats.newThisMonth - stats.prevMonthUsers) / stats.prevMonthUsers) * 100)
      : null;

  const localeLabel = (key: string) =>
    key === "TH" ? ts("languageThai") : key === "EN" ? ts("languageEnglish") : key;
  const themeLabel = (key: string) =>
    key === "LIGHT" ? ts("themeLight") : key === "DARK" ? ts("themeDark") : key === "SYSTEM" ? ts("themeSystem") : key;

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("totalUsers")} value={n(stats.totalUsers)} />
        <StatCard label={t("newToday")} value={n(stats.newToday)} />
        <StatCard label={t("newThisWeek")} value={n(stats.newThisWeek)} />
        <StatCard label={t("newThisMonth")} value={n(stats.newThisMonth)} />
        <StatCard label={t("active7d")} value={n(stats.active7d)} sub={pct(stats.active7d, stats.totalUsers)} />
        <StatCard label={t("activeUsers")} value={n(stats.activeUsers)} sub={pct(stats.activeUsers, stats.totalUsers)} />
        <StatCard
          label={t("momGrowth")}
          value={momPct === null ? "—" : `${momPct >= 0 ? "+" : ""}${momPct}%`}
          tone={momPct === null ? "neutral" : momPct >= 0 ? "positive" : "negative"}
        />
        <StatCard label={t("activeToday")} value={n(stats.activeToday)} sub={pct(stats.activeToday, stats.totalUsers)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-sm font-semibold">{t("funnelTitle")}</h2>
          <FunnelBar label={t("totalUsers")} value={stats.totalUsers} total={stats.totalUsers} n={n} pct={pct} />
          <FunnelBar label={t("hasAccount")} value={stats.withAccount} total={stats.totalUsers} n={n} pct={pct} />
          <FunnelBar label={t("hasTransaction")} value={stats.withTransaction} total={stats.totalUsers} n={n} pct={pct} />
          <FunnelBar label={t("hasPortfolio")} value={stats.withPortfolio} total={stats.totalUsers} n={n} pct={pct} />
        </Card>

        <Card className="flex flex-col gap-5 p-5">
          <h2 className="text-sm font-semibold">{t("prefsTitle")}</h2>
          <MixRow title={t("prefLanguage")} slices={stats.localeMix} total={stats.totalUsers} label={localeLabel} n={n} />
          <MixRow title={t("prefTheme")} slices={stats.themeMix} total={stats.totalUsers} label={themeLabel} n={n} />
          <MixRow title={t("prefCurrency")} slices={stats.currencyMix.slice(0, 5)} total={stats.totalUsers} label={(k) => k} n={n} />
        </Card>
      </div>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-semibold">{t("accentTitle")}</h2>
        <div className="flex flex-wrap gap-2">
          {stats.accentMix.map((slice) => (
            <span
              key={slice.key}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs"
            >
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: ACCENT_SWATCH[slice.key] ?? "#94a3b8" }}
              />
              {slice.key} · {n(slice.count)}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {t("versionAdoption", { version: stats.latestVersion })}: {n(stats.onLatestVersion)} / {n(stats.totalUsers)} ({pct(stats.onLatestVersion, stats.totalUsers)})
        </p>
      </Card>

      <Card className="flex flex-col gap-2 p-5">
        <h2 className="text-sm font-semibold">{t("signups30d")}</h2>
        <LineChart
          data={stats.signups.map((s) => ({
            label: formatDate(s.date, locale, { month: "short", day: "numeric" }),
            value: s.count,
          }))}
          valueLocale={locale}
        />
      </Card>

      <p className="text-xs text-muted-foreground">{t("activeHint")}</p>
    </section>
  );
}

function FunnelBar({
  label,
  value,
  total,
  n,
  pct,
}: {
  label: string;
  value: number;
  total: number;
  n: (v: number) => string;
  pct: (p: number, w: number) => string;
}) {
  const width = total > 0 ? Math.max(2, Math.round((value / total) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {n(value)} <span className="tabular-nums">· {pct(value, total)}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function MixRow({
  title,
  slices,
  total,
  label,
  n,
}: {
  title: string;
  slices: MixSlice[];
  total: number;
  label: (key: string) => string;
  n: (v: number) => string;
}) {
  const palette = ["bg-primary", "bg-primary/70", "bg-primary/45", "bg-primary/30", "bg-primary/20"];
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
        {slices.map((slice, i) => (
          <div
            key={slice.key}
            className={cn(palette[i] ?? "bg-primary/15")}
            style={{ width: `${total > 0 ? (slice.count / total) * 100 : 0}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {slices.map((slice, i) => (
          <span key={slice.key} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", palette[i] ?? "bg-primary/15")} />
            {label(slice.key)} {n(slice.count)}
          </span>
        ))}
      </div>
    </div>
  );
}
