"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAction } from "@/hooks/use-action";
import {
  createCollectionAction,
  updateCollectionAction,
} from "@/app/actions/admin/cosmetics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/label";
import { MediaPicker, type PickableMedia } from "@/components/admin/media-picker";

const RARITIES = ["COMMON", "RARE", "EPIC", "SPECIAL", "LIMITED"] as const;
const RARITY_LABELS: Record<string, string> = { COMMON: "ทั่วไป", RARE: "หายาก", EPIC: "พิเศษ", SPECIAL: "รุ่นพิเศษ", LIMITED: "จำนวนจำกัด" };

type ExistingCollection = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  rarity: string;
  isApplicableAsSet: boolean;
  coverUrl: string | null;
  availableFrom?: Date | string | null;
  availableTo?: Date | string | null;
};

export function CollectionForm({
  collection,
  media = [],
}: {
  collection?: ExistingCollection;
  media?: PickableMedia[];
}) {
  const t = useTranslations("admin.collections");
  const tc = useTranslations("admin.common");
  const router = useRouter();
  const editing = Boolean(collection);

  const [slug, setSlug] = useState(collection?.slug ?? "");
  const [name, setName] = useState(collection?.name ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [rarity, setRarity] = useState(collection?.rarity ?? "COMMON");
  const [asSet, setAsSet] = useState(collection?.isApplicableAsSet ?? true);
  const [coverUrl, setCoverUrl] = useState(collection?.coverUrl ?? "");
  const dateValue = (v?: Date | string | null) => {
    if (!v) return "";
    const date = new Date(v);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  };
  const [availableFrom, setAvailableFrom] = useState(dateValue(collection?.availableFrom));
  const [availableTo, setAvailableTo] = useState(dateValue(collection?.availableTo));

  const create = useAction(createCollectionAction);
  const update = useAction(updateCollectionAction);
  const pending = create.pending || update.pending;

  const submit = async () => {
    const common = {
      name,
      description: description || undefined,
      rarity: rarity as never,
      isApplicableAsSet: asSet,
      coverUrl: coverUrl || undefined,
    };
    if (editing) {
      const res = await update.run(
        {
          id: collection!.id,
          ...common,
          availableFrom: availableFrom ? new Date(availableFrom) : null,
          availableTo: availableTo ? new Date(availableTo) : null,
        },
        { successMessage: tc("savedToast") },
      );
      if (res.ok) router.refresh();
    } else {
      const res = await create.run(
        {
          slug,
          ...common,
          availableFrom: availableFrom ? new Date(availableFrom) : undefined,
          availableTo: availableTo ? new Date(availableTo) : undefined,
        },
        { successMessage: tc("createdToast") },
      );
      if (res.ok && res.data)
        router.push(`/admin/appearance/collections/${res.data.id}`);
    }
  };

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={tc("slug")}>
          <Input
            value={slug}
            disabled={editing}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="sakura"
          />
        </Field>
        <Field label={tc("name")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={tc("rarity")}>
          <Select value={rarity} onChange={(e) => setRarity(e.target.value)}>
            {RARITIES.map((r) => <option key={r} value={r}>{RARITY_LABELS[r]}</option>)}
          </Select>
        </Field>
        <Field label="เริ่มให้รับได้"><Input type="datetime-local" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} /></Field>
        <Field label="หยุดให้รับ"><Input type="datetime-local" value={availableTo} onChange={(e) => setAvailableTo(e.target.value)} /></Field>
      </div>
      <Field label={t("coverUrl")} hint="ภาพปกของชุดธีม เลือกจากคลังรูปหมวด “ปกชุดธีม”">
        <div className="flex flex-col gap-2">
          <MediaPicker
            media={media}
            usage="COLLECTION_COVER"
            value={coverUrl}
            onSelect={setCoverUrl}
            onClear={() => setCoverUrl("")}
          />
          <Input
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="หรือใส่ลิงก์เอง เช่น /cosmetics/…"
          />
        </div>
      </Field>
      <Field label={tc("description")}>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={asSet}
          onChange={(e) => setAsSet(e.target.checked)}
          className="size-4"
        />
        {t("applicableAsSet")}
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
