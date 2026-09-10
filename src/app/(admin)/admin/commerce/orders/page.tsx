import { requirePermission } from "@/server/lib/guards";
import { listOrders } from "@/server/services/cosmetics/commerce.service";
import { Card } from "@/components/ui/card";

export default async function OrdersPage() {
  await requirePermission("commerce.read");
  const orders = await listOrders();
  const labels: Record<string, string> = { PENDING: "รอชำระเงิน", PAID: "ชำระแล้ว", FULFILLED: "มอบไอเทมแล้ว", CANCELLED: "ยกเลิกแล้ว", REFUNDED: "คืนเงินแล้ว" };
  return <div className="space-y-5"><div><h1 className="text-2xl font-bold">คำสั่งซื้อ</h1><p className="text-sm text-muted-foreground">ตรวจสอบการชำระเงินและการมอบไอเทมให้ผู้ซื้อ</p></div><Card className="divide-y divide-border">{orders.map((o) => <div key={o.id} className="flex flex-wrap justify-between gap-3 p-4"><div><strong>{o.product.name}</strong><p className="text-sm text-muted-foreground">{o.user.name || o.user.email} · {Number(o.amount).toLocaleString()} {o.currency}</p></div><span className="text-sm">{labels[o.status] ?? o.status}</span></div>)}{orders.length === 0 && <p className="p-8 text-center text-muted-foreground">ยังไม่มีคำสั่งซื้อ</p>}</Card></div>;
}
