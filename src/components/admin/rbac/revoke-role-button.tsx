"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAction } from "@/hooks/use-action";
import { confirm } from "@/components/ui/confirm";
import { revokeRoleAction } from "@/app/actions/admin/user-roles";

export function RevokeRoleButton({
  userId,
  roleId,
  roleKey,
  email,
}: {
  userId: string;
  roleId: string;
  roleKey: string;
  email: string;
}) {
  const t = useTranslations("admin.access.users");
  const router = useRouter();
  const revoke = useAction(revokeRoleAction);

  return (
    <button
      type="button"
      className="text-xs font-medium text-negative hover:underline disabled:opacity-50"
      disabled={revoke.pending}
      onClick={async () => {
        const ok = await confirm({
          title: t("revoke"),
          description: t("revokeConfirm", { role: roleKey, email }),
          tone: "danger",
        });
        if (!ok) return;
        const res = await revoke.run(
          { userId, roleId },
          { successMessage: t("revokedToast") },
        );
        if (res.ok) router.refresh();
      }}
    >
      {t("revoke")}
    </button>
  );
}
