"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { createHoldingImportAction } from "@/app/actions/portfolios";
import { parseHoldingSlip } from "@/lib/holding-slip";
import { useAction } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { HoldingSlipGuide } from "@/components/portfolio/holding-slip-guide";

type Row = { id: string; symbol: string; currency: string; quantity: string; costPerShare: string };
const blank = (): Row => ({ id: crypto.randomUUID(), symbol: "", currency: "USD", quantity: "", costPerShare: "" });

export function ImportHoldingsSheet({ portfolioId, open, onOpenChange }: {
  portfolioId: string; open: boolean; onOpenChange: (value: boolean) => void;
}) {
  const t = useTranslations("portfolio");
  const tc = useTranslations("common");
  const [rows, setRows] = useState<Row[]>([]);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [ocrPercent, setOcrPercent] = useState(0);
  const [failedFiles, setFailedFiles] = useState(0);
  const keys = useRef(new Map<string, string>());
  const action = useAction(createHoldingImportAction);

  useEffect(() => { if (!open) { setRows([]); setProgress(0); setTotalFiles(0); setOcrPercent(0); setFailedFiles(0); keys.current.clear(); } }, [open]);
  const update = (id: string, patch: Partial<Row>) => setRows((old) => old.map((row) => row.id === id ? { ...row, ...patch } : row));

  async function read(files: File[]) {
    setReading(true); setProgress(0); setTotalFiles(files.length); setOcrPercent(0); setFailedFiles(0);
    let worker: Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>> | undefined;
    try {
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker(["tha", "eng"], undefined, {
        logger: (message) => {
          if (message.status === "recognizing text") setOcrPercent(Math.round(message.progress * 100));
        },
      });
      for (let i = 0; i < files.length; i += 1) {
        setOcrPercent(0);
        try {
          const result = await worker.recognize(files[i]!);
          const parsed = parseHoldingSlip(result.data.text);
          setRows((old) => [...old, { id: crypto.randomUUID(), symbol: parsed.symbol ?? "", currency: parsed.currency ?? "USD", quantity: parsed.quantity ?? "", costPerShare: parsed.costPerShare ?? "" }]);
        } catch {
          setFailedFiles((count) => count + 1);
        } finally {
          setProgress(i + 1);
        }
      }
    } finally { await worker?.terminate(); setReading(false); }
  }

  const valid = rows.filter((row) => row.symbol && Number(row.quantity) > 0 && Number(row.costPerShare) > 0);
  async function save() {
    const result = await action.run({
      portfolioId,
      items: valid.map((row) => ({
        symbol: row.symbol.toUpperCase(), securityCurrency: row.currency.toUpperCase(), quantity: row.quantity,
        price: row.costPerShare, idempotencyKey: keys.current.get(row.id) ?? (() => { const key = crypto.randomUUID(); keys.current.set(row.id, key); return key; })(),
      })),
    });
    if (result.ok && result.data.failed === 0) onOpenChange(false);
  }

  return <Drawer open={open} onOpenChange={onOpenChange}>
    <DrawerContent className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between"><DrawerTitle>{t("importTitle")}</DrawerTitle><DrawerClose asChild><Button variant="ghost" size="icon"><X /></Button></DrawerClose></div>
      {rows.length === 0 && !reading && <HoldingSlipGuide />}
      <label className="mb-4 flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
        {reading ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
        <span className="flex-1">{reading ? t("importReading", { done: progress, total: totalFiles, percent: ocrPercent }) : t("importUpload")}</span><ImageIcon className="size-5" />
        <input className="sr-only" type="file" accept="image/*" multiple disabled={reading} onChange={(e) => { const files = [...(e.target.files ?? [])]; e.target.value = ""; if (files.length) void read(files); }} />
      </label>
      {failedFiles > 0 && <p className="mb-3 text-sm text-negative">{t("importReadFailed", { count: failedFiles })}</p>}
      <div className="flex flex-col gap-2">
        {rows.map((row) => <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-xl border p-3">
          <Input value={row.symbol} placeholder="NVDA" onChange={(e) => update(row.id, { symbol: e.target.value.toUpperCase() })} />
          <Input value={row.currency} placeholder="USD" onChange={(e) => update(row.id, { currency: e.target.value.toUpperCase() })} />
          <Button variant="ghost" size="icon" onClick={() => setRows((old) => old.filter((item) => item.id !== row.id))}><Trash2 className="size-4" /></Button>
          <Input inputMode="decimal" value={row.quantity} placeholder={t("remainingShares")} onChange={(e) => update(row.id, { quantity: e.target.value })} />
          <Input inputMode="decimal" value={row.costPerShare} placeholder={t("costPerShare")} onChange={(e) => update(row.id, { costPerShare: e.target.value })} />
        </div>)}
        <Button variant="secondary" onClick={() => setRows((old) => [...old, blank()])}><Plus className="size-4" />{t("importAddRow")}</Button>
        <Button disabled={!valid.length || reading || action.pending} onClick={save}>{action.pending ? tc("saving") : t("importCta", { count: valid.length })}</Button>
      </div>
    </DrawerContent>
  </Drawer>;
}
