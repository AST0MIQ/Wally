import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getRequestPrincipal, requireCapability } from "@/server/lib/guards";
import { listRoles } from "@/server/services/rbac/role.service";
import { bootstrapAdminCount } from "@/server/lib/rbac-bootstrap";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Roles" };

export default async function RolesPage() {
  await requireCapability("roles:read");
  const principal = await getRequestPrincipal();
  const t = await getTranslations("admin.access.roles");
  const roles = await listRoles();
  const canWrite = principal.permissions.has("roles.write") || principal.isSuperAdmin;
  const bootstrapCount = bootstrapAdminCount();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("permissionsHint")}</p>
        </div>
        {canWrite && (
          <Link
            href="/admin/access/roles/new"
            className="h-10 shrink-0 rounded-md bg-primary px-4 text-sm font-medium leading-10 text-primary-foreground"
          >
            {t("newRole")}
          </Link>
        )}
      </div>

      {bootstrapCount > 0 && (
        <Card className="border-accent/40 bg-accent/5 p-3 text-xs text-muted-foreground">
          {bootstrapCount} bootstrap SUPER_ADMIN
          {bootstrapCount === 1 ? "" : "s"} configured via the{" "}
          <code>ADMIN_EMAILS</code> environment variable (read-only).
        </Card>
      )}

      {roles.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {roles.map((r) => (
            <Link key={r.id} href={`/admin/access/roles/${r.id}`}>
              <Card className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-muted">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    {r.name}
                    <code className="text-xs font-normal text-muted-foreground">
                      {r.key}
                    </code>
                  </p>
                  {r.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {r.description}
                    </p>
                  )}
                </div>
                {r.isSystem ? (
                  <Badge>{t("system")}</Badge>
                ) : (
                  <Badge variant="accent">{t("custom")}</Badge>
                )}
                {r.archivedAt && (
                  <Badge variant="negative">{t("archived")}</Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {t("permissionCount", { count: r.permissionKeys.length })} ·{" "}
                  {t("memberCount", { count: r.userCount })}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
