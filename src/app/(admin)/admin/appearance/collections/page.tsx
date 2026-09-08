import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

import { requireCapability } from "@/server/lib/guards";
import { listCollections } from "@/server/services/cosmetics/collection.service";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/status-badge";
import { LinkButton } from "@/components/admin/link-button";

export const metadata = { title: "Collections" };

export default async function CollectionsPage() {
  await requireCapability("cosmetics:write");
  const t = await getTranslations("admin.collections");
  const tc = await getTranslations("admin.common");
  const locale = (await getLocale()) as Locale;
  const rows = await listCollections();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <LinkButton href="/admin/appearance/collections/new">
          <Plus className="size-4" />
          {tc("create")}
        </LinkButton>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((c) => (
            <Link key={c.id} href={`/admin/appearance/collections/${c.id}`}>
              <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-muted">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.slug} · {c.rarity} · {c._count.assets} {t("assetsInSet").toLowerCase()}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(c.updatedAt, locale)}
                </span>
                <StatusBadge status={c.status} />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
