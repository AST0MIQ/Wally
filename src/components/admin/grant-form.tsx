"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAction } from "@/hooks/use-action";
import {
  grantAssetAction,
  grantCollectionAction,
  bulkGrantAssetsAction,
} from "@/app/actions/admin/entitlements";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";

type Option = { id: string; label: string };

export function GrantForm({
  userId,
  assets,
  collections,
}: {
  userId: string;
  assets: Option[];
  collections: Option[];
}) {
  const t = useTranslations("admin.users");
  const router = useRouter();
  const [assetId, setAssetId] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [assetIds, setAssetIds] = useState<string[]>([]);
  const [ref, setRef] = useState("");

  const grantA = useAction(grantAssetAction);
  const grantC = useAction(grantCollectionAction);
  const grantMany = useAction(bulkGrantAssetsAction);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <p className="text-sm font-medium">{t("grantAsset")}</p>
        <Select value={assetId} onChange={(e) => setAssetId(e.target.value)}>
          <option value="">—</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </Select>
        <Field label={t("sourceRef")}>
          <Input value={ref} onChange={(e) => setRef(e.target.value)} />
        </Field>
        <Button
          size="sm"
          disabled={!assetId || grantA.pending}
          onClick={async () => {
            const res = await grantA.run(
              { userId, assetId, sourceRef: ref || undefined, acquisitionType: "ADMIN_GRANT" },
              { successMessage: t("grantedToast") },
            );
            if (res.ok) {
              setAssetId("");
              router.refresh();
            }
          }}
        >
          {t("grant")}
        </Button>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
        <p className="text-sm font-medium">{t("grantCollection")}</p>
        <Select value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
          <option value="">—</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </Select>
        <Button
          size="sm"
          disabled={!collectionId || grantC.pending}
          onClick={async () => {
            const res = await grantC.run(
              { userId, collectionId, sourceRef: ref || undefined, acquisitionType: "ADMIN_GRANT" },
              { successMessage: t("grantedToast") },
            );
            if (res.ok) {
              setCollectionId("");
              router.refresh();
            }
          }}
        >
          {t("grant")}
        </Button>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:col-span-2">
        <p className="text-sm font-medium">ให้หลายไอเทมพร้อมกัน</p>
        <div className="grid max-h-52 gap-2 overflow-auto rounded-md bg-muted/40 p-2 sm:grid-cols-2">
          {assets.map((asset) => <label key={asset.id} className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm hover:bg-muted"><input type="checkbox" checked={assetIds.includes(asset.id)} onChange={() => setAssetIds((current) => current.includes(asset.id) ? current.filter((id) => id !== asset.id) : [...current, asset.id])} className="size-4 accent-[var(--primary)]" />{asset.label}</label>)}
        </div>
        <Button size="sm" disabled={assetIds.length === 0 || grantMany.pending} onClick={async () => {
          const result = await grantMany.run({ userId, assetIds, sourceRef: ref || undefined, acquisitionType: "ADMIN_GRANT" }, { successMessage: `ให้ ${assetIds.length} ไอเทมแล้ว` });
          if (result.ok) { setAssetIds([]); router.refresh(); }
        }}>ให้ {assetIds.length || "หลาย"} ไอเทม</Button>
      </div>
    </div>
  );
}
