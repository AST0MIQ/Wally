"use client";

import { useAction } from "@/hooks/use-action";
import { toggleFeatureFlagAction, upsertAppSettingAction, upsertFeatureFlagAction } from "@/app/actions/admin/operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewFlagForm() {
  const action = useAction(upsertFeatureFlagAction);
  return <form className="grid gap-3 md:grid-cols-2" action={async (data) => { await action.run({ key: String(data.get("key") ?? ""), name: String(data.get("name") ?? ""), description: String(data.get("description") ?? "") || undefined, enabled: false }, { successMessage: "สร้างตัวควบคุมแล้ว" }); }}>
    <Input name="key" required placeholder="รหัส เช่น cosmetics.shop" />
    <Input name="name" required placeholder="ชื่อที่อ่านเข้าใจง่าย" />
    <Input name="description" className="md:col-span-2" placeholder="คำอธิบาย (ไม่บังคับ)" />
    <Button type="submit" disabled={action.pending}>เพิ่มตัวควบคุม</Button>
  </form>;
}

export function FlagToggle({ flagKey, enabled }: { flagKey: string; enabled: boolean }) {
  const action = useAction(toggleFeatureFlagAction);
  return <Button variant={enabled ? "secondary" : "primary"} size="sm" disabled={action.pending} onClick={() => action.run({ key: flagKey, enabled: !enabled }, { successMessage: enabled ? "ปิดแล้ว" : "เปิดแล้ว" })}>{enabled ? "ปิด" : "เปิด"}</Button>;
}

export function SettingForm() {
  const action = useAction(upsertAppSettingAction);
  return <form className="grid gap-3" action={async (data) => { await action.run({ key: String(data.get("key") ?? ""), name: String(data.get("name") ?? ""), description: String(data.get("description") ?? "") || undefined, value: String(data.get("value") ?? "") }, { successMessage: "บันทึกค่าแล้ว" }); }}>
    <div className="grid gap-3 md:grid-cols-2"><Input name="key" required placeholder="รหัส เช่น cosmetics.maxUploadMb" /><Input name="name" required placeholder="ชื่อที่อ่านเข้าใจง่าย" /></div>
    <Input name="description" placeholder="คำอธิบาย (ไม่บังคับ)" />
    <Input name="value" required defaultValue="true" placeholder={'ค่าแบบ JSON เช่น true, 8 หรือ "ข้อความ"'} />
    <p className="text-xs text-muted-foreground">รับค่าแบบ JSON เท่านั้น และห้ามใส่รหัสผ่านหรือ API key ในหน้านี้</p>
    <Button type="submit" disabled={action.pending}>เพิ่มหรืออัปเดต</Button>
  </form>;
}
