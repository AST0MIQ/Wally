import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { requireCapability } from "@/server/lib/guards";
import { listRecentEntitlements } from "@/server/services/cosmetics/admin-cosmetics.service";
import { formatDateTime } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Entitlements" };

export default async function EntitlementsFeedPage() {
  await requireCapability("user:read");
  const t = await getTranslations("admin.entitlements");
  const locale = (await getLocale()) as Locale;
  const rows = await listRecentEntitlements(80);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <Card className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="w-32 shrink-0 text-xs text-muted-foreground">
                {formatDateTime(r.updatedAt, locale)}
              </span>
              <Link
                href={`/admin/users/${r.user.id}`}
                className="w-48 shrink-0 truncate text-primary hover:underline"
              >
                {r.user.name || r.user.email}
              </Link>
              <span className="min-w-0 flex-1 truncate">
                {r.asset.slot} · {r.asset.name}
                {r.sourceCollection && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({r.sourceCollection.name})
                  </span>
                )}
              </span>
              <span
                className={
                  r.status === "ACTIVE"
                    ? "text-xs font-medium text-positive"
                    : "text-xs font-medium text-negative"
                }
              >
                {r.status}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
