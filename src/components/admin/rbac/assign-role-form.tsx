"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAction } from "@/hooks/use-action";
import { confirm } from "@/components/ui/confirm";
import { assignRoleAction } from "@/app/actions/admin/user-roles";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export function AssignRoleForm({
  userId,
  email,
  roles,
}: {
  userId: string;
  email: string;
  roles: { id: string; key: string; name: string }[];
}) {
  const t = useTranslations("admin.access.users");
  const router = useRouter();
  const assign = useAction(assignRoleAction);
  const [roleId, setRoleId] = useState("");

  if (roles.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noAssignable")}</p>;
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Select
        value={roleId}
        onChange={(e) => setRoleId(e.target.value)}
        className="min-w-56"
      >
        <option value="">—</option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} ({r.key})
          </option>
        ))}
      </Select>
      <Button
        disabled={!roleId || assign.pending}
        onClick={async () => {
          const role = roles.find((r) => r.id === roleId);
          if (!role) return;
          const ok = await confirm({
            title: t("assignRole"),
            description: t("assignConfirm", { role: role.key, email }),
          });
          if (!ok) return;
          const res = await assign.run(
            { userId, roleId },
            { successMessage: t("assignedToast") },
          );
          if (res.ok) {
            setRoleId("");
            router.refresh();
          }
        }}
      >
        {t("assign")}
      </Button>
    </div>
  );
}
