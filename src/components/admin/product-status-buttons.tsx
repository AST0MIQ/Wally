"use client";
import { useAction } from "@/hooks/use-action";
import { setProductStatusAction } from "@/app/actions/admin/commerce";
import { Button } from "@/components/ui/button";
export function ProductStatusButtons({ id, status }: { id: string; status: "DRAFT" | "ACTIVE" | "ARCHIVED" }) {
  const action = useAction(setProductStatusAction);
  const next = status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
  return <Button size="sm" variant={next === "ACTIVE" ? "primary" : "ghost"} disabled={action.pending} onClick={() => action.run({ id, status: next }, { successMessage: next === "ACTIVE" ? "เปิดขายแล้ว" : "หยุดขายแล้ว" })}>{next === "ACTIVE" ? "เปิดขาย" : "หยุดขาย"}</Button>;
}
