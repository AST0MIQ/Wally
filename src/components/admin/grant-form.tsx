"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAction } from "@/hooks/use-action";
import {
  grantAssetAction,
  grantCollectionAction,
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
  const [ref, setRef] = useState("");

  const grantA = useAction(grantAssetAction);
  const grantC = useAction(grantCollectionAction);

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
    </div>
  );
}
