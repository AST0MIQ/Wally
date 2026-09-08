import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getRequestPrincipal, requireCapability } from "@/server/lib/guards";
import { getRole } from "@/server/services/rbac/role.service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleEditor } from "@/components/admin/rbac/role-editor";
import { RoleLifecycleButtons } from "@/components/admin/rbac/role-lifecycle-buttons";
import { PermissionChecklist } from "@/components/admin/rbac/permission-checklist";

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCapability("roles:read");
  const principal = await getRequestPrincipal();
  const { id } = await params;
  const t = await getTranslations("admin.access.roles");

  const role = await getRole(id);
  if (!role) notFound();

  const canWrite =
    principal.isSuperAdmin || principal.permissions.has("roles.write");
  const editable = canWrite && !role.isSystem && !role.archivedAt;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/admin/access/roles"
          className="text-xs text-muted-foreground hover:underline"
        >
          ← {t("backToRoles")}
        </Link>
        <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight">
          {role.name}
          <code className="text-sm font-normal text-muted-foreground">
            {role.key}
          </code>
          {role.isSystem ? (
            <Badge>{t("system")}</Badge>
          ) : (
            <Badge variant="accent">{t("custom")}</Badge>
          )}
          {role.archivedAt && <Badge variant="negative">{t("archived")}</Badge>}
        </h1>
        {role.description && (
          <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
        )}
      </div>

      {role.isSystem && (
        <Card className="border-accent/40 bg-accent/5 p-3 text-sm text-muted-foreground">
          {t("systemLocked")}
        </Card>
      )}
      {!role.isSystem && role.archivedAt && (
        <Card className="border-accent/40 bg-accent/5 p-3 text-sm text-muted-foreground">
          {t("archivedLocked")}
        </Card>
      )}

      <Card className="p-5">
        {editable ? (
          <RoleEditor
            mode="edit"
            role={{
              id: role.id,
              key: role.key,
              name: role.name,
              description: role.description,
              permissionKeys: role.permissionKeys,
            }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold">{t("permissionsTitle")}</p>
            <PermissionChecklist value={role.permissionKeys} disabled />
          </div>
        )}
      </Card>

      {canWrite && !role.isSystem && (
        <Card className="p-5">
          <RoleLifecycleButtons
            roleId={role.id}
            roleName={role.key}
            archived={Boolean(role.archivedAt)}
            deletable={!role.archivedAt && role.userCount === 0}
          />
        </Card>
      )}
    </div>
  );
}
