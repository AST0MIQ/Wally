import { getTranslations } from "next-intl/server";

import { requireCapability } from "@/server/lib/guards";
import { listPermissionCatalogue } from "@/server/services/rbac/permission.service";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Permissions" };

export default async function PermissionsPage() {
  await requireCapability("roles:read");
  const t = await getTranslations("admin.access.permissions");
  const groups = await listPermissionCatalogue();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-4">
        {groups.map((g) => (
          <Card key={g.resource} className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {g.resource}
            </p>
            <ul className="flex flex-col divide-y divide-border">
              {g.permissions.map((p) => (
                <li
                  key={p.key}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 text-sm"
                >
                  <code className="font-medium">{p.key}</code>
                  <span className="text-muted-foreground">{p.description}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {t("usedBy", { count: p.roleCount })}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
