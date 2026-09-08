"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Eye, Lock, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAction } from "@/hooks/use-action";
import { confirm } from "@/components/ui/confirm";
import {
  equipAssetAction,
  unequipSlotAction,
  applyCollectionAction,
  resetCosmeticsAction,
} from "@/app/actions/cosmetics";
import type {
  InventoryAsset,
  ApplicableCollection,
} from "@/server/services/cosmetics/entitlement.service";
import type { EquipmentSlot } from "@/lib/cosmetics/slots";
import { EQUIPMENT_SLOTS, isRenderedSlot } from "@/lib/cosmetics/slots";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { CosmeticPreview } from "@/components/cosmetics/cosmetic-preview";

type Tab = "owned" | "locked" | "all";

export function CosmeticsView({
  items,
  equippedBySlot,
  collections,
  collectionNames,
}: {
  items: InventoryAsset[];
  equippedBySlot: Partial<Record<EquipmentSlot, string>>;
  collections: ApplicableCollection[];
  collectionNames: { id: string; name: string }[];
}) {
  const t = useTranslations("cosmetics");
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("owned");
  const [slot, setSlot] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("");
  const [previewAsset, setPreviewAsset] = useState<InventoryAsset | null>(null);
  const [previewCollection, setPreviewCollection] =
    useState<ApplicableCollection | null>(null);

  const equip = useAction(equipAssetAction);
  const unequip = useAction(unequipSlotAction);
  const apply = useAction(applyCollectionAction);
  const reset = useAction(resetCosmeticsAction);
  const busy = equip.pending || unequip.pending || apply.pending || reset.pending;

  const nameById = useMemo(
    () => new Map(items.map((i) => [i.assetId, i.name])),
    [items],
  );
  const collNameById = useMemo(
    () => new Map(collectionNames.map((c) => [c.id, c.name])),
    [collectionNames],
  );

  const visible = items.filter((i) => {
    if (tab === "owned" && !i.owned) return false;
    if (tab === "locked" && i.owned) return false;
    if (slot && i.slot !== slot) return false;
    if (collectionFilter && !i.collectionIds.includes(collectionFilter)) return false;
    return true;
  });

  const usedSlots = [...new Set(items.map((i) => i.slot))];
  const usedCollections = [
    ...new Set(items.flatMap((i) => i.collectionIds)),
  ].filter((id) => collNameById.has(id));

  const doEquip = async (i: InventoryAsset) => {
    const res = i.equipped
      ? await unequip.run({ slot: i.slot }, { successMessage: t("unequippedToast") })
      : await equip.run(
          { slot: i.slot, assetId: i.assetId },
          { successMessage: t("equippedToast") },
        );
    if (res.ok) {
      setPreviewAsset(null);
      router.refresh();
    }
  };

  const applyDiff = (c: ApplicableCollection) =>
    c.slots.filter(
      (s) => equippedBySlot[s.slot] && equippedBySlot[s.slot] !== s.assetId,
    );

  const doApply = async (c: ApplicableCollection) => {
    setPreviewCollection(null);
    const res = await apply.run(
      { collectionId: c.id },
      { successMessage: t("appliedToast") },
    );
    if (res.ok) router.refresh();
  };

  const doReset = async () => {
    const okToReset = await confirm({
      title: t("resetTitle"),
      description: t("resetBody"),
    });
    if (!okToReset) return;
    const res = await reset.run({}, { successMessage: t("resetToast") });
    if (res.ok) router.refresh();
  };

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          <Button variant="ghost" size="sm" onClick={doReset} disabled={busy}>
            <RotateCcw className="size-4" />
            {t("reset")}
          </Button>
        }
      />

      {collections.length > 0 && (
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-sm font-semibold">{t("applyCollection")}</p>
          <div className="flex flex-wrap gap-2">
            {collections.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={busy}
                onClick={() => setPreviewCollection(c)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  c.applicable
                    ? "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
                    : "border-border text-muted-foreground",
                )}
              >
                {!c.applicable && <Lock className="size-3.5" />}
                {c.name}
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-muted p-1 text-sm">
          {(["owned", "locked", "all"] as Tab[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium transition-colors",
                tab === key ? "bg-card shadow-sm" : "text-muted-foreground",
              )}
            >
              {t(key === "owned" ? "tabOwned" : key === "locked" ? "tabLocked" : "tabAll")}
            </button>
          ))}
        </div>
        <Select value={slot} onChange={(e) => setSlot(e.target.value)} className="h-9 w-auto">
          <option value="">{t("allSlots")}</option>
          {EQUIPMENT_SLOTS.filter((s) => usedSlots.includes(s)).map((s) => (
            <option key={s} value={s}>{t(`slots.${s}`)}</option>
          ))}
        </Select>
        {usedCollections.length > 0 && (
          <Select
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
            className="h-9 w-auto"
          >
            <option value="">{t("allCollections")}</option>
            {usedCollections.map((id) => (
              <option key={id} value={id}>
                {collNameById.get(id)}
              </option>
            ))}
          </Select>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((i) => (
            <li key={i.assetId}>
              <Card className="flex h-full flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{i.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("slotLabel", { slot: t(`slots.${i.slot}`) })}
                      {!isRenderedSlot(i.slot) && ` · ${t("phase2Short")}`}
                    </p>
                  </div>
                  <Badge variant={i.rarity === "COMMON" ? "neutral" : "accent"}>
                    {i.rarity}
                  </Badge>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPreviewAsset(i)}
                  >
                    <Eye className="size-4" />
                    {t("preview")}
                  </Button>
                  {i.equipped ? (
                    <Button size="sm" variant="secondary" onClick={() => doEquip(i)} disabled={busy}>
                      <Check className="size-4" />
                      {t("unequip")}
                    </Button>
                  ) : i.owned ? (
                    <Button size="sm" onClick={() => doEquip(i)} disabled={busy}>
                      {t("equip")}
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="size-3.5" />
                      {t("locked")}
                    </span>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {/* Single-asset preview — never mutates the loadout */}
      <Dialog open={!!previewAsset} onOpenChange={(o) => !o && setPreviewAsset(null)}>
        <DialogContent className="max-w-md">
          {previewAsset && (
            <>
              <DialogHeader>
                <DialogTitle>{previewAsset.name}</DialogTitle>
                <DialogDescription>
                  {t("slotLabel", { slot: t(`slots.${previewAsset.slot}`) })}
                </DialogDescription>
              </DialogHeader>
              <CosmeticPreview
                slot={previewAsset.slot}
                config={previewAsset.config}
                previewUrl={previewAsset.previewUrl}
              />
              <p className="text-xs text-muted-foreground">{t("previewNoChange")}</p>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">{t("close")}</Button>
                </DialogClose>
                {previewAsset.owned && !previewAsset.equipped && (
                  <Button disabled={busy} onClick={() => doEquip(previewAsset)}>
                    {t("useThis")}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Collection composite preview — shows every asset + replace diff */}
      <Dialog
        open={!!previewCollection}
        onOpenChange={(o) => !o && setPreviewCollection(null)}
      >
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          {previewCollection && (
            <>
              <DialogHeader>
                <DialogTitle>{previewCollection.name}</DialogTitle>
                <DialogDescription>
                  {applyDiff(previewCollection).length === 0
                    ? t("applyConfirmNoChange")
                    : t("applyConfirmBody")}
                </DialogDescription>
              </DialogHeader>

              {applyDiff(previewCollection).length > 0 && (
                <ul className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  {applyDiff(previewCollection).map((s) => (
                    <li key={s.slot}>
                      {t(`slots.${s.slot}`)}: <b>{s.assetName}</b>{" "}
                      {t("replaces", {
                        name:
                          nameById.get(equippedBySlot[s.slot]!) ??
                          equippedBySlot[s.slot]!,
                      })}
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {previewCollection.slots.map((s) => (
                  <div key={s.slot} className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t(`slots.${s.slot}`)} · {s.assetName}
                      {!s.owned && ` · ${t("locked")}`}
                      {s.assetStatus !== "PUBLISHED" && ` · ${s.assetStatus}`}
                    </p>
                    <CosmeticPreview
                      slot={s.slot}
                      config={s.config}
                      previewUrl={s.previewUrl}

                    />
                  </div>
                ))}
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">{t("close")}</Button>
                </DialogClose>
                <Button
                  disabled={!previewCollection.applicable || busy}
                  onClick={() => doApply(previewCollection)}
                >
                  {t("applyCollection")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
