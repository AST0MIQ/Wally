import { requirePermission } from "@/server/lib/guards";
import { listProducts } from "@/server/services/cosmetics/commerce.service";
import { listAssets } from "@/server/services/cosmetics/asset.service";
import { listCollections } from "@/server/services/cosmetics/collection.service";
import { ProductForm } from "@/components/admin/product-form";
import { ProductStatusButtons } from "@/components/admin/product-status-buttons";
import { Card } from "@/components/ui/card";

export default async function ProductsPage() {
  await requirePermission("commerce.read");
  const [products, assets, collections] = await Promise.all([listProducts(true), listAssets({ status: "PUBLISHED" }), listCollections({ status: "PUBLISHED" })]);
  return <div className="space-y-5"><div><h1 className="text-2xl font-bold">สินค้า</h1><p className="text-sm text-muted-foreground">กำหนดราคาและสิ่งที่ผู้ใช้จะได้รับหลังชำระเงิน</p></div><Card className="p-4"><h2 className="mb-3 font-semibold">สร้างสินค้าใหม่</h2><ProductForm assets={assets} collections={collections} /></Card><div className="space-y-2">{products.map((p) => <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><strong>{p.name}</strong><p className="text-sm text-muted-foreground">{Number(p.price).toLocaleString()} {p.currency} · ผู้ซื้อ {p._count.orders} คน · {p.grantsCollection?.name ?? p.grantsAsset?.name}</p></div><ProductStatusButtons id={p.id} status={p.status} /></Card>)}</div></div>;
}
