"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAction } from "@/hooks/use-action";
import { confirm } from "@/components/ui/confirm";
import { revokeEntitlementAction } from "@/app/actions/admin/entitlements";

export function RevokeButton({
  userId,
  assetId,
}: {
  userId: string;
  assetId: string;
}) {
  const t = useTranslations("admin.users");
  const router = useRouter();
  const revoke = useAction(revokeEntitlementAction);

  return (
    <button
      type="button"
      className="text-xs font-medium text-negative hover:underline disabled:opacity-50"
      disabled={revoke.pending}
      onClick={async () => {
        const okToRevoke = await confirm({
          title: t("revoke"),
          description: t("revokeConfirm"),
          tone: "danger",
        });
        if (!okToRevoke) return;
        const res = await revoke.run(
          { userId, assetId },
          { successMessage: t("revokedToast") },
        );
        if (res.ok) router.refresh();
      }}
    >
      {t("revoke")}
    </button>
  );
}
