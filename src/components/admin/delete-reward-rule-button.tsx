"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAction } from "@/hooks/use-action";
import { confirm } from "@/components/ui/confirm";
import { deleteRewardRuleAction } from "@/app/actions/admin/reward-rules";
import { Button } from "@/components/ui/button";

export function DeleteRewardRuleButton({ id }: { id: string }) {
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const del = useAction(deleteRewardRuleAction);

  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-negative"
      disabled={del.pending}
      onClick={async () => {
        const okToDelete = await confirm({
          title: tc("delete"),
          description: tc("confirmDelete"),
          tone: "danger",
        });
        if (!okToDelete) return;
        const res = await del.run({ id }, { successMessage: tc("deletedToast") });
        if (res.ok) router.push("/admin/rewards/rules");
      }}
    >
      {tc("delete")}
    </Button>
  );
}
