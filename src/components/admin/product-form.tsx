"use client";
import { useState } from "react";
import { useAction } from "@/hooks/use-action";
import { createProductAction } from "@/app/actions/admin/commerce";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function ProductForm({ assets, collections }: { assets: { id: string; name: string }[]; collections: { id: string; name: string }[] }) {
  const action = useAction(createProductAction);
  const [kind, setKind] = useState<"collection" | "asset">("collection");
  const [target, setTarget] = useState("");
  return <div className="grid gap-3 md:grid-cols-2">
    <Input id="product-slug" placeholder="รหัส เช่น sakura-pack" />
    <Input id="product-name" placeholder="ชื่อสินค้าที่ผู้ใช้เห็น" />
    <Input id="product-price" type="number" min="1" step="0.01" placeholder="ราคา" />
    <Input id="product-currency" defaultValue="THB" maxLength={3} placeholder="สกุลเงิน" />
    <Select value={kind} onChange={(e) => { setKind(e.target.value as typeof kind); setTarget(""); }}><option value="collection">ขายทั้งคอลเลกชัน</option><option value="asset">ขายไอเทมเดียว</option></Select>
    <Select value={target} onChange={(e) => setTarget(e.target.value)}><option value="">เลือกสิ่งที่จะได้รับ</option>{(kind === "collection" ? collections : assets).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>
    <Input id="product-description" className="md:col-span-2" placeholder="คำอธิบายสั้น ๆ" />
    <Button className="md:col-span-2" disabled={action.pending || !target} onClick={() => action.run({ slug: (document.getElementById("product-slug") as HTMLInputElement).value, name: (document.getElementById("product-name") as HTMLInputElement).value, description: (document.getElementById("product-description") as HTMLInputElement).value || undefined, price: Number((document.getElementById("product-price") as HTMLInputElement).value), currency: (document.getElementById("product-currency") as HTMLInputElement).value, ...(kind === "collection" ? { grantsCollectionId: target } : { grantsAssetId: target }) }, { successMessage: "สร้างสินค้าแล้ว" })}>สร้างสินค้า</Button>
  </div>;
}
