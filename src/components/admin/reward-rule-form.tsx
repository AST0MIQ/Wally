"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAction } from "@/hooks/use-action";
import {
  createRewardRuleAction,
  updateRewardRuleAction,
} from "@/app/actions/admin/reward-rules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/label";

const TRIGGERS = [
  "STREAK_MILESTONE",
  "RANK_MILESTONE",
  "ACHIEVEMENT",
  "MANUAL",
] as const;

type Option = { id: string; label: string };
type Existing = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  trigger: string;
  threshold: number | null;
  grantsCollectionId: string | null;
  grantsAssetId: string | null;
  isActive: boolean;
};

export function RewardRuleForm({
  rule,
  collections,
  assets,
}: {
  rule?: Existing;
  collections: Option[];
  assets: Option[];
}) {
  const t = useTranslations("admin.rewardRules");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const editing = Boolean(rule);

  const [key, setKey] = useState(rule?.key ?? "");
  const [name, setName] = useState(rule?.name ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  const [trigger, setTrigger] = useState(rule?.trigger ?? "STREAK_MILESTONE");
  const [threshold, setThreshold] = useState(
    rule?.threshold != null ? String(rule.threshold) : "",
  );
  const [targetKind, setTargetKind] = useState<"collection" | "asset">(
    rule?.grantsAssetId ? "asset" : "collection",
  );
  const [collectionId, setCollectionId] = useState(rule?.grantsCollectionId ?? "");
  const [assetId, setAssetId] = useState(rule?.grantsAssetId ?? "");
  const [isActive, setIsActive] = useState(rule?.isActive ?? false);

  const create = useAction(createRewardRuleAction);
  const update = useAction(updateRewardRuleAction);
  const pending = create.pending || update.pending;

  const submit = async () => {
    const grantsCollectionId = targetKind === "collection" ? collectionId || undefined : undefined;
    const grantsAssetId = targetKind === "asset" ? assetId || undefined : undefined;
    const common = {
      name,
      description: description || undefined,
      trigger: trigger as never,
      threshold: threshold ? Number(threshold) : undefined,
      isActive,
    };
    if (editing) {
      const res = await update.run(
        {
          id: rule!.id,
          ...common,
          grantsCollectionId: grantsCollectionId ?? null,
          grantsAssetId: grantsAssetId ?? null,
        },
        { successMessage: tc("savedToast") },
      );
      if (res.ok) router.refresh();
    } else {
      const res = await create.run(
        { key, ...common, grantsCollectionId, grantsAssetId },
        { successMessage: tc("createdToast") },
      );
      if (res.ok && res.data)
        router.push(`/admin/rewards/rules/${res.data.id}`);
    }
  };

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("key")}>
          <Input value={key} disabled={editing} onChange={(e) => setKey(e.target.value)} />
        </Field>
        <Field label={tc("name")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t("trigger")}>
          <Select value={trigger} onChange={(e) => setTrigger(e.target.value)}>
            {TRIGGERS.map((tr) => <option key={tr}>{tr}</option>)}
          </Select>
        </Field>
        <Field label={t("threshold")}>
          <Input
            inputMode="numeric"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value.replace(/\D/g, ""))}
          />
        </Field>
      </div>

      <Field label={tc("description")}>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </Field>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{t("grants")}</p>
        <p className="text-xs text-muted-foreground">{t("oneTarget")}</p>
        <div className="flex gap-2">
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              checked={targetKind === "collection"}
              onChange={() => setTargetKind("collection")}
            />
            {t("grantCollection")}
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="radio"
              checked={targetKind === "asset"}
              onChange={() => setTargetKind("asset")}
            />
            {t("grantAsset")}
          </label>
        </div>
        {targetKind === "collection" ? (
          <Select value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
            <option value="">—</option>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Select>
        ) : (
          <Select value={assetId} onChange={(e) => setAssetId(e.target.value)}>
            <option value="">—</option>
            {assets.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </Select>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4" />
        {t("active")}
      </label>

      <div className="flex gap-2">
        <Button onClick={submit} disabled={pending}>
          {editing ? tc("save") : tc("create")}
        </Button>
        <Button variant="ghost" onClick={() => router.back()} disabled={pending}>
          {tc("cancel")}
        </Button>
      </div>
    </div>
  );
}
