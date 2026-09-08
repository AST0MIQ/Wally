import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { requireAdmin } from "@/server/lib/guards";
import { getAdminUserDetail } from "@/server/services/cosmetics/admin-cosmetics.service";
import { listAssets } from "@/server/services/cosmetics/asset.service";
import { listCollections } from "@/server/services/cosmetics/collection.service";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/status-badge";
import { GrantForm } from "@/components/admin/grant-form";
import { RevokeButton } from "@/components/admin/revoke-button";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const t = await getTranslations("admin.users");
  const locale = (await getLocale()) as Locale;

  const detail = await getAdminUserDetail(id);
  if (!detail) notFound();
  const { user, entitlements, equipped } = detail;

  const [assets, collections] = await Promise.all([
    listAssets({ status: "PUBLISHED" }),
    listCollections({ status: "PUBLISHED" }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {user.name || user.email}
        </h1>
        <p className="text-xs text-muted-foreground">
          {user.email} · {t("joined")} {formatDate(user.createdAt, locale)}
          {user.lastLoginAt
            ? ` · ${t("lastLogin")} ${formatDate(user.lastLoginAt, locale)}`
            : ""}
        </p>
      </div>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-semibold">{t("loadout")}</h2>
        {equipped.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noLoadout")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border text-sm">
            {equipped.map((e) => (
              <li key={e.id} className="flex items-center gap-2 py-2">
                <span className="w-40 shrink-0 text-xs text-muted-foreground">
                  {e.slot}
                </span>
                <span className="flex-1 truncate">{e.asset.name}</span>
                <StatusBadge status={e.asset.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-semibold">{t("inventory")}</h2>
        {entitlements.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noInventory")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border text-sm">
            {entitlements.map((ent) => (
              <li key={ent.id} className="flex items-center gap-2 py-2">
                <span className="w-32 shrink-0 text-xs text-muted-foreground">
                  {ent.asset.slot}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {ent.asset.name}
                  {ent.sourceCollection && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({ent.sourceCollection.name})
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {ent.status} · {ent.acquisitionType}
                </span>
                {ent.status === "ACTIVE" && (
                  <RevokeButton userId={user.id} assetId={ent.assetId} />
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-semibold">{t("grantAsset")} / {t("grantCollection")}</h2>
        <GrantForm
          userId={user.id}
          assets={assets.map((a) => ({ id: a.id, label: `${a.slot} · ${a.name}` }))}
          collections={collections.map((c) => ({ id: c.id, label: c.name }))}
        />
      </Card>
    </div>
  );
}
