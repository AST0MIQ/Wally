import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { requireCapability } from "@/server/lib/guards";
import { searchAdminUsers } from "@/server/services/rbac/user-role.service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Admin Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cursor?: string }>;
}) {
  await requireCapability("roles:read");
  const t = await getTranslations("admin.access.users");
  const { q, cursor } = await searchParams;
  const query = (q ?? "").trim();
  const { rows, nextCursor } = query
    ? await searchAdminUsers({ q: query, cursor })
    : { rows: [], nextCursor: null };

  const nextHref = nextCursor
    ? `/admin/access/users?${new URLSearchParams({ q: query, cursor: nextCursor })}`
    : null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("searchHint")}</p>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          className="h-10 flex-1 rounded-md border border-input bg-card px-3 text-sm"
        />
        <button
          type="submit"
          className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          {t("search")}
        </button>
      </form>

      {!query ? (
        <p className="text-sm text-muted-foreground">{t("noQuery")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((u) => (
            <Link key={u.id} href={`/admin/access/users/${u.id}`}>
              <Card className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-muted">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{u.name || u.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {u.roleKeys.length === 0 ? (
                    <span className="text-xs text-muted-foreground">{t("noRoles")}</span>
                  ) : (
                    u.roleKeys.map((k) => <Badge key={k}>{k}</Badge>)
                  )}
                </div>
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
