import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { getRequestPrincipal, requireCapability } from "@/server/lib/guards";
import { getUserAccess } from "@/server/services/rbac/user-role.service";
import { listRoles } from "@/server/services/rbac/role.service";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssignRoleForm } from "@/components/admin/rbac/assign-role-form";
import { RevokeRoleButton } from "@/components/admin/rbac/revoke-role-button";

export default async function UserAccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCapability("roles:read");
  const principal = await getRequestPrincipal();
  const { id } = await params;
  const t = await getTranslations("admin.access.users");
  const locale = (await getLocale()) as Locale;

  const access = await getUserAccess(id);
  if (!access) notFound();

  const canManage = principal.isSuperAdmin;
  const heldRoleIds = new Set(access.roles.map((r) => r.id));
  const assignable = canManage
    ? (await listRoles())
        .filter((r) => !r.archivedAt && !heldRoleIds.has(r.id))
        .map((r) => ({ id: r.id, key: r.key, name: r.name }))
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/access/users"
          className="text-xs text-muted-foreground hover:underline"
        >
          ← {t("title")}
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {access.user.name || access.user.email}
        </h1>
        <p className="text-xs text-muted-foreground">
          {access.user.email} · {t("joined")}{" "}
          {formatDate(access.user.createdAt, locale)}
          {access.user.lastLoginAt
            ? ` · ${t("lastLogin")} ${formatDate(access.user.lastLoginAt, locale)}`
            : ""}
        </p>
        {access.isSuperAdmin && (
          <span className="mt-2 inline-block">
            <Badge variant="accent">ผู้ดูแลระบบสูงสุด</Badge>
          </span>
        )}
      </div>

      {access.isBootstrap && (
        <Card className="border-accent/40 bg-accent/5 p-4 text-sm">
          {t("bootstrapNotice")}
        </Card>
      )}

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-semibold">{t("assignedRoles")}</h2>
        {access.roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noAssignedRoles")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border text-sm">
            {access.roles.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 py-2">
                <span className="font-medium">{r.name}</span>
                <code className="text-xs text-muted-foreground">{r.key}</code>
                {r.isSystem && <Badge>{t("roles")}</Badge>}
                {r.archivedAt && (
                  <span className="text-xs text-negative">เก็บถาวรแล้ว</span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatDate(r.assignedAt, locale)}
                  {r.assignedBy
                    ? ` · ${t("assignedBy")} ${r.assignedBy.name || r.assignedBy.email}`
                    : ""}
                </span>
                {canManage && (
                  <RevokeRoleButton
                    userId={access.user.id}
                    roleId={r.id}
                    roleKey={r.key}
                    email={access.user.email}
                  />
                )}
              </li>
            ))}
          </ul>
        )}

        {canManage ? (
          <div className="mt-2 border-t border-border pt-3">
            <p className="mb-2 text-sm font-medium">{t("assignRole")}</p>
            <AssignRoleForm
              userId={access.user.id}
              email={access.user.email}
              roles={assignable}
            />
          </div>
        ) : (
          <p className="mt-2 border-t border-border pt-3 text-xs text-muted-foreground">
            {t("superAdminOnly")}
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-semibold">{t("effectivePermissions")}</h2>
        {access.effectivePermissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("noEffectivePermissions")}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {access.effectivePermissions.map((p) => (
              <code
                key={p}
                className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                {p}
              </code>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
