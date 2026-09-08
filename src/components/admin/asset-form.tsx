"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAction } from "@/hooks/use-action";
import {
  createAssetAction,
  updateAssetAction,
} from "@/app/actions/admin/cosmetics";
import type { AssetConfigV1 } from "@/lib/cosmetics/config";
import { EQUIPMENT_SLOTS, type EquipmentSlot } from "@/lib/cosmetics/slots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AssetConfigFields } from "@/components/admin/asset-config-fields";
import { CosmeticPreview } from "@/components/cosmetics/cosmetic-preview";

const RARITIES = ["COMMON", "RARE", "EPIC", "SPECIAL", "LIMITED"] as const;
const ACQUISITIONS = [
  "ADMIN_GRANT",
  "DEFAULT",
  "STREAK_REWARD",
  "RANK_REWARD",
  "ACHIEVEMENT",
  "PURCHASE",
  "LIMITED_EVENT",
] as const;

type ExistingAsset = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  slot: string;
  rarity: string;
  acquisitionType: string;
  previewUrl: string | null;
  config: AssetConfigV1;
};

export function AssetForm({
  asset,
  configLocked = false,
}: {
  asset?: ExistingAsset;
  configLocked?: boolean;
}) {
  const t = useTranslations("admin.assets");
  const tc = useTranslations("admin.common");
  const ts = useTranslations("admin.studio");
  const router = useRouter();
  const editing = Boolean(asset);

  const [slug, setSlug] = useState(asset?.slug ?? "");
  const [name, setName] = useState(asset?.name ?? "");
  const [description, setDescription] = useState(asset?.description ?? "");
  const [slot, setSlot] = useState<EquipmentSlot>(
    (asset?.slot as EquipmentSlot) ?? "APP_BACKGROUND",
  );
  const [rarity, setRarity] = useState(asset?.rarity ?? "COMMON");
  const [acquisitionType, setAcquisitionType] = useState(
    asset?.acquisitionType ?? "ADMIN_GRANT",
  );
  const [previewUrl, setPreviewUrl] = useState(asset?.previewUrl ?? "");
  const [config, setConfig] = useState<AssetConfigV1>(asset?.config ?? {});

  const create = useAction(createAssetAction);
  const update = useAction(updateAssetAction);
  const pending = create.pending || update.pending;

  const submit = async () => {
    if (editing) {
      const res = await update.run(
        {
          id: asset!.id,
          name,
          description: description || undefined,
          rarity: rarity as never,
          acquisitionType: acquisitionType as never,
          previewUrl: previewUrl || undefined,
          ...(configLocked ? {} : { config }),
        },
        { successMessage: tc("savedToast") },
      );
      if (res.ok) router.refresh();
    } else {
      const res = await create.run(
        {
          slug,
          name,
          description: description || undefined,
          slot,
          rarity: rarity as never,
          acquisitionType: acquisitionType as never,
          previewUrl: previewUrl || undefined,
          config,
        },
        { successMessage: tc("createdToast") },
      );
      if (res.ok && res.data) router.push(`/admin/appearance/assets/${res.data.id}`);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={tc("slug")}>
            <Input
              value={slug}
              disabled={editing}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="sakura-frame"
            />
          </Field>
          <Field label={tc("name")}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={tc("slot")} hint={editing ? t("slotLocked") : undefined}>
            <Select
              value={slot}
              disabled={editing}
              onChange={(e) => setSlot(e.target.value as EquipmentSlot)}
            >
              {EQUIPMENT_SLOTS.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label={tc("rarity")}>
            <Select value={rarity} onChange={(e) => setRarity(e.target.value)}>
              {RARITIES.map((r) => <option key={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label={t("acquisition")}>
            <Select
              value={acquisitionType}
              onChange={(e) => setAcquisitionType(e.target.value)}
            >
              {ACQUISITIONS.map((a) => <option key={a}>{a}</option>)}
            </Select>
          </Field>
          <Field label={t("preview")}>
            <Input
              value={previewUrl}
              onChange={(e) => setPreviewUrl(e.target.value)}
              placeholder="/cosmetics/…"
            />
          </Field>
        </div>
        <Field label={tc("description")}>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </Field>

        <Card className="flex flex-col gap-3 p-4">
          <p className="text-sm font-semibold">{t("config")}</p>
          {configLocked && (
            <p className="text-xs text-warning">{t("configLocked")}</p>
          )}
          <AssetConfigFields
            slot={slot}
            value={config}
            onChange={setConfig}
            disabled={configLocked}
          />
        </Card>

        <div className="flex gap-2">
          <Button onClick={submit} disabled={pending}>
            {editing ? tc("save") : tc("create")}
          </Button>
          <Button variant="ghost" onClick={() => router.back()} disabled={pending}>
            {tc("cancel")}
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {ts("livePreview")}
        </p>
        <CosmeticPreview slot={slot} config={config} />
      </div>
    </div>
  );
}
