import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { requireAdmin } from "@/server/lib/guards";
import { listUsersForAdmin } from "@/server/services/cosmetics/admin-cosmetics.service";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "User Directory" };

export default async function UserDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cursor?: string }>;
}) {
  await requireAdmin();
  const t = await getTranslations("admin.users");
  const locale = (await getLocale()) as Locale;
  const { q, cursor } = await searchParams;
  const { rows, nextCursor } = await listUsersForAdmin({ q, cursor });

  const nextHref = nextCursor
    ? `/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), cursor: nextCursor })}`
    : null;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={t("search")}
          className="h-10 flex-1 rounded-md border border-input bg-card px-3 text-sm"
        />
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((u) => (
            <Link key={u.id} href={`/admin/users/${u.id}`}>
              <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-muted">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{u.name || u.email}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.email} · {t("joined")} {formatDate(u.createdAt, locale)}
                  </p>
                </div>
                {u.role === "ADMIN" && <Badge variant="accent">ADMIN</Badge>}
                <span className="text-xs text-muted-foreground">
                  {u.entitlements} {t("entitlements").toLowerCase()} · {u.equipped}{" "}
                  {t("equipped").toLowerCase()}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {nextHref && (
        <Link href={nextHref} className="text-sm text-primary hover:underline">
          {t("loadMore")}
        </Link>
      )}
    </div>
  );
}
