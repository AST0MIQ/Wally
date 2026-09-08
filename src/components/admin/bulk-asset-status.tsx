"use client";

import { useState } from "react";
import Link from "next/link";
import { useAction } from "@/hooks/use-action";
import { bulkSetAssetStatusAction } from "@/app/actions/admin/cosmetics";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/status-badge";

type Row = { id: string; name: string; slug: string; slot: string; rarity: string; status: string; collectionCount: number; ownerCount: number };

export function BulkAssetStatus({ rows }: { rows: Row[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const action = useAction(bulkSetAssetStatusAction);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  const run = async (status: "PUBLISHED" | "HIDDEN" | "ARCHIVED") => {
    const result = await action.run({ ids: selected, status }, { successMessage: `อัปเดต ${selected.length} ไอเทมแล้ว` });
    if (result.ok) setSelected([]);
  };

  return <div className="space-y-3">
    {selected.length > 0 && <Card className="sticky top-3 z-10 flex flex-wrap items-center gap-2 p-3 shadow-lg"><strong className="mr-auto text-sm">เลือกแล้ว {selected.length} รายการ</strong><Button size="sm" onClick={() => run("PUBLISHED")} disabled={action.pending}>เผยแพร่</Button><Button size="sm" variant="secondary" onClick={() => run("HIDDEN")} disabled={action.pending}>ซ่อน</Button><Button size="sm" variant="ghost" onClick={() => setSelected([])}>ยกเลิก</Button></Card>}
    <div className="flex flex-col gap-2">{rows.map((row) => <Card key={row.id} className="flex items-center gap-3 p-4 transition-colors hover:bg-muted">
      <input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggle(row.id)} aria-label={`เลือก ${row.name}`} className="size-5 accent-[var(--primary)]" />
      <Link href={`/admin/appearance/assets/${row.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="hidden w-40 shrink-0 text-xs text-muted-foreground sm:block">{row.slot}</span>
        <div className="min-w-0 flex-1"><p className="truncate font-medium">{row.name}</p><p className="truncate text-xs text-muted-foreground">{row.slug} · {row.rarity} · {row.collectionCount} ชุด · ผู้ใช้ {row.ownerCount} คน</p></div>
        <StatusBadge status={row.status} />
      </Link>
    </Card>)}</div>
  </div>;
}
