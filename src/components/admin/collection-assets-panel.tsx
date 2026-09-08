"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { useAction } from "@/hooks/use-action";
import {
  attachAssetAction,
  detachAssetAction,
} from "@/app/actions/admin/cosmetics";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/admin/status-badge";

type AssetLite = { id: string; name: string; slug: string; slot: string; status: string };

export function CollectionAssetsPanel({
  collectionId,
  attached,
  candidates,
  frozen = false,
}: {
  collectionId: string;
  attached: { assetId: string; slot: string; asset: AssetLite }[];
  candidates: AssetLite[];
  /** collection has been published — membership is immutable */
  frozen?: boolean;
}) {
  const t = useTranslations("admin.collections");
  const router = useRouter();
  const [pick, setPick] = useState("");
  const attach = useAction(attachAssetAction);
  const detach = useAction(detachAssetAction);

  const takenSlots = new Set(attached.map((a) => a.slot));
  const options = candidates.filter(
    (c) => !attached.some((a) => a.assetId === c.id) && !takenSlots.has(c.slot),
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">{t("assetsInSet")}</p>
      <p className="text-xs text-muted-foreground">
        {frozen ? t("frozenHint") : t("onePerSlot")}
      </p>

      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {attached.length === 0 && (
          <li className="px-3 py-2 text-sm text-muted-foreground">—</li>
        )}
        {attached.map((row) => (
          <li key={row.assetId} className="flex items-center gap-2 px-3 py-2 text-sm">
            <span className="w-40 shrink-0 text-xs text-muted-foreground">{row.slot}</span>
            <span className="flex-1 truncate">{row.asset.name}</span>
            <StatusBadge status={row.asset.status} />
            {!frozen && (
              <button
                type="button"
                aria-label={t("detach")}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
                disabled={detach.pending}
                onClick={async () => {
                  const res = await detach.run({ collectionId, assetId: row.assetId });
                  if (res.ok) router.refresh();
                }}
              >
                <X className="size-4" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {!frozen && (
        <div className="flex gap-2">
          <Select value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">{t("pickAsset")}</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.slot} · {o.name} ({o.status})
              </option>
            ))}
          </Select>
          <Button
            disabled={!pick || attach.pending}
            onClick={async () => {
              const res = await attach.run({ collectionId, assetId: pick, sortOrder: 0 });
              if (res.ok) {
                setPick("");
                router.refresh();
              }
            }}
          >
            {t("attach")}
          </Button>
        </div>
      )}
    </div>
  );
}
