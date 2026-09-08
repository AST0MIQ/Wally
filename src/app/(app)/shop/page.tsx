import { requireUser } from "@/server/lib/guards";
import { listProducts } from "@/server/services/cosmetics/commerce.service";
import { checkoutAction } from "@/app/actions/checkout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ShopPage() {
  await requireUser();
  const products = await listProducts();
  return <div className="page-container space-y-5 glint-enter"><div><h1 className="text-3xl font-bold">ร้านธีม</h1><p className="text-muted-foreground">เลือกซื้อไอเทมตกแต่ง แล้วรับเข้าคลังทันทีหลังชำระเงิน</p></div><div className="grid gap-4 sm:grid-cols-2">{products.map((p) => <Card key={p.id} className="p-5"><h2 className="text-lg font-semibold">{p.name}</h2><p className="mt-1 text-sm text-muted-foreground">{p.description}</p><p className="my-4 text-2xl font-bold">{Number(p.price).toLocaleString()} {p.currency}</p><form action={checkoutAction}><input type="hidden" name="productId" value={p.id}/><Button type="submit" className="w-full">ซื้อไอเทมนี้</Button></form></Card>)}</div>{products.length === 0 && <Card className="p-8 text-center text-muted-foreground">ยังไม่มีสินค้าเปิดขาย</Card>}</div>;
}
