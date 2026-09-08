import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { requirePermission } from "@/server/lib/guards";
import { Card } from "@/components/ui/card";
import { RoleEditor } from "@/components/admin/rbac/role-editor";

export const metadata = { title: "New role" };

export default async function NewRolePage() {
  await requirePermission("roles.write");
  const t = await getTranslations("admin.access.roles");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/admin/access/roles"
          className="text-xs text-muted-foreground hover:underline"
        >
          ← {t("backToRoles")}
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{t("newTitle")}</h1>
      </div>
      <Card className="p-5">
        <RoleEditor mode="create" />
      </Card>
    </div>
  );
}
