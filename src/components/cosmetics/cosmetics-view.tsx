"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Lock, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAction } from "@/hooks/use-action";
import { confirm } from "@/components/ui/confirm";
import {
  equipAssetAction,
  unequipSlotAction,
  applyCollectionAction,
  resetCosmeticsAction,
} from "@/app/actions/cosmetics";
import type { InventoryAsset } from "@/server/services/cosmetics/entitlement.service";
import type { ApplicableCollection } from "@/server/services/cosmetics/entitlement.service";
import type { EquipmentSlot } from "@/lib/cosmetics/slots";
import { EQUIPMENT_SLOTS } from "@/lib/cosmetics/slots";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Tab = "owned" | "locked" | "all";

export function CosmeticsView({
  items,
  equippedBySlot,
  collections,
}: {
  items: InventoryAsset[];
  equippedBySlot: Partial<Record<EquipmentSlot, string>>;
  collections: ApplicableCollection[];
}) {
  const t = useTranslations("cosmetics");
  const tc = useTranslations("common");
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("owned");
  const [slot, setSlot] = useState<string>("");
  const [collectionFilter, setCollectionFilter] = useState<string>("");

  const equip = useAction(equipAssetAction);
  const unequip = useAction(unequipSlotAction);
  const apply = useAction(applyCollectionAction);
  const reset = useAction(resetCosmeticsAction);
  const busy = equip.pending || unequip.pending || apply.pending || reset.pending;

  const nameById = useMemo(
    () => new Map(items.map((i) => [i.assetId, i.name])),
    [items],
  );

  const visible = items.filter((i) => {
    if (tab === "owned" && !i.owned) return false;
    if (tab === "locked" && i.owned) return false;
    if (slot && i.slot !== slot) return false;
    if (collectionFilter && i.sourceCollectionId !== collectionFilter) return false;
    return true;
  });

  const usedSlots = [...new Set(items.map((i) => i.slot))];

  const doEquip = async (i: InventoryAsset) => {
    const res = i.equipped
      ? await unequip.run({ slot: i.slot }, { successMessage: t("unequippedToast") })
      : await equip.run(
          { slot: i.slot, assetId: i.assetId },
          { successMessage: t("equippedToast") },
        );
    if (res.ok) router.refresh();
  };

  const doApply = async (c: ApplicableCollection) => {
    const replaced = c.slots.filter(
      (s) => equippedBySlot[s.slot] && equippedBySlot[s.slot] !== s.assetId,
    );
    const body =
      replaced.length === 0
        ? t("applyConfirmNoChange")
        : `${t("applyConfirmBody")}\n` +
          replaced
            .map(
              (s) =>
                `• ${s.slot}: ${s.assetName} ${t("replaces", {
                  name: nameById.get(equippedBySlot[s.slot]!) ?? "?",
                })}`,
            )
            .join("\n");
    const okToApply = await confirm({
      title: t("applyConfirmTitle", { name: c.name }),
      description: body,
    });
    if (!okToApply) return;
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
                disabled={!c.fullyOwned || busy}
                onClick={() => doApply(c)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  c.fullyOwned
                    ? "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
                    : "border-border text-muted-foreground",
                )}
              >
                {!c.fullyOwned && <Lock className="size-3.5" />}
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
            <option key={s}>{s}</option>
          ))}
        </Select>
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
                    <p className="text-xs text-muted-foreground">{t("slotLabel", { slot: i.slot })}</p>
                  </div>
                  <Badge variant={i.rarity === "COMMON" ? "neutral" : "accent"}>
                    {i.rarity}
                  </Badge>
                </div>
                <div className="mt-auto flex items-center gap-2">
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
                  {i.equipped && (
                    <span className="text-xs font-medium text-primary">{t("equipped")}</span>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
