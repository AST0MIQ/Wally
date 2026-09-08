import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

import { requireCapability } from "@/server/lib/guards";
import { listAssets } from "@/server/services/cosmetics/asset.service";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/status-badge";
import { LinkButton } from "@/components/admin/link-button";

export const metadata = { title: "Assets" };

export default async function AssetsPage() {
  await requireCapability("cosmetics:write");
  const t = await getTranslations("admin.assets");
  const tc = await getTranslations("admin.common");
  const rows = await listAssets({});

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <LinkButton href="/admin/appearance/assets/new">
          <Plus className="size-4" />
          {tc("create")}
        </LinkButton>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((a) => (
            <Link key={a.id} href={`/admin/appearance/assets/${a.id}`}>
              <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-muted">
                <span className="w-40 shrink-0 text-xs text-muted-foreground">
                  {a.slot}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.slug} · {a.rarity} · {a._count.collections} coll · {a._count.entitlements} owned
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
