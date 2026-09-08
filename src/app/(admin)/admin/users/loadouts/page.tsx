import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { requireCapability } from "@/server/lib/guards";
import { listUsersWithLoadout } from "@/server/services/cosmetics/admin-cosmetics.service";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Loadouts" };

export default async function LoadoutsPage() {
  await requireCapability("user:read");
  const t = await getTranslations("admin.loadouts");
  const tu = await getTranslations("admin.users");
  const rows = await listUsersWithLoadout(120);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((u) => (
            <Link key={u.id} href={`/admin/users/${u.id}`}>
              <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-muted">
                <span className="min-w-0 flex-1 truncate font-medium">
                  {u.name || u.email}
                </span>
                <span className="text-xs text-muted-foreground">
                  {u._count.equippedCosmetics} {tu("equipped").toLowerCase()} ·{" "}
                  {u._count.cosmeticEntitlements} {tu("entitlements").toLowerCase()}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
