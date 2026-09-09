import { Badge } from "@/components/ui/badge";

const MAP: Record<string, { variant: "neutral" | "positive" | "negative" | "accent" }> = {
  DRAFT: { variant: "neutral" },
  PUBLISHED: { variant: "positive" },
  HIDDEN: { variant: "accent" },
  ARCHIVED: { variant: "negative" },
};

const LABELS: Record<string, string> = {
  DRAFT: "ฉบับร่าง", PUBLISHED: "เผยแพร่แล้ว", HIDDEN: "ซ่อนอยู่",
  ARCHIVED: "เก็บถาวร", ACTIVE: "เปิดใช้งาน", PENDING: "รอดำเนินการ",
  PAID: "ชำระแล้ว", FULFILLED: "มอบไอเทมแล้ว", CANCELLED: "ยกเลิกแล้ว",
  REFUNDED: "คืนเงินแล้ว",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={MAP[status]?.variant ?? "neutral"}>{LABELS[status] ?? status}</Badge>;
}
