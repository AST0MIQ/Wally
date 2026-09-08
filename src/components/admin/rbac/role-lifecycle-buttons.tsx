"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAction } from "@/hooks/use-action";
import { confirm } from "@/components/ui/confirm";
import {
  archiveRoleAction,
  deleteRoleAction,
  unarchiveRoleAction,
} from "@/app/actions/admin/roles";
import { Button } from "@/components/ui/button";

export function RoleLifecycleButtons({
  roleId,
  roleName,
  archived,
  deletable,
}: {
  roleId: string;
  roleName: string;
  archived: boolean;
  deletable: boolean;
}) {
  const t = useTranslations("admin.access.roles");
  const router = useRouter();
  const archive = useAction(archiveRoleAction);
  const unarchive = useAction(unarchiveRoleAction);
  const del = useAction(deleteRoleAction);

  return (
    <div className="flex flex-wrap gap-2">
      {archived ? (
        <Button
          variant="secondary"
          disabled={unarchive.pending}
          onClick={async () => {
            const res = await unarchive.run(
              { id: roleId },
              { successMessage: t("unarchivedToast") },
            );
            if (res.ok) router.refresh();
          }}
        >
          {t("unarchive")}
        </Button>
      ) : (
        <Button
          variant="secondary"
          disabled={archive.pending}
          onClick={async () => {
            const ok = await confirm({
              title: t("archive"),
              description: t("archiveConfirm", { role: roleName }),
              tone: "danger",
            });
            if (!ok) return;
            const res = await archive.run(
              { id: roleId },
              { successMessage: t("archivedToast") },
            );
            if (res.ok) router.refresh();
          }}
        >
          {t("archive")}
        </Button>
      )}

      {deletable && (
        <Button
          variant="destructive"
          disabled={del.pending}
          onClick={async () => {
            const ok = await confirm({
              title: t("delete"),
              description: t("deleteConfirm", { role: roleName }),
              tone: "danger",
            });
            if (!ok) return;
            const res = await del.run(
              { id: roleId },
              { successMessage: t("deletedToast"), refresh: false },
            );
            if (res.ok) router.push("/admin/access/roles");
          }}
        >
          {t("delete")}
        </Button>
      )}
    </div>
  );
}
