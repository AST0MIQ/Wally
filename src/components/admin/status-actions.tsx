"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAction } from "@/hooks/use-action";
import { confirm } from "@/components/ui/confirm";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/server/lib/action";

type Status = "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED";

/**
 * Publish / hide / archive / restore controls + a guarded hard-delete.
 * `setStatus` and `remove` are bound server actions.
 */
export function StatusActions({
  id,
  status,
  setStatus,
  remove,
  extra,
}: {
  id: string;
  status: Status;
  setStatus: (input: { id: string; status: Status }) => Promise<ActionResult<unknown>>;
  remove?: (input: { id: string }) => Promise<ActionResult<unknown>>;
  extra?: React.ReactNode;
}) {
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const st = useAction(setStatus);
  const del = useAction(remove ?? (async () => ({ ok: true, data: null }) as const));

  const go = (next: Status) =>
    st.run({ id, status: next }, { successMessage: tc("statusToast") });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "DRAFT" && (
        <Button size="sm" onClick={() => go("PUBLISHED")} disabled={st.pending}>
          {tc("publish")}
        </Button>
      )}
      {status === "PUBLISHED" && (
        <Button size="sm" variant="secondary" onClick={() => go("HIDDEN")} disabled={st.pending}>
          {tc("hide")}
        </Button>
      )}
      {status === "HIDDEN" && (
        <Button size="sm" onClick={() => go("PUBLISHED")} disabled={st.pending}>
          {tc("publish")}
        </Button>
      )}
      {(status === "PUBLISHED" || status === "HIDDEN") && (
        <Button size="sm" variant="ghost" onClick={() => go("ARCHIVED")} disabled={st.pending}>
          {tc("archive")}
        </Button>
      )}
      {status === "ARCHIVED" && (
        <Button size="sm" variant="secondary" onClick={() => go("DRAFT")} disabled={st.pending}>
          {tc("restore")}
        </Button>
      )}
      {extra}
      {remove && status === "DRAFT" && (
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
            if (res.ok) router.back();
          }}
        >
          {tc("delete")}
        </Button>
      )}
    </div>
  );
}
