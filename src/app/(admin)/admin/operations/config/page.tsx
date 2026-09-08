import { requirePermission } from "@/server/lib/guards";
import { listAppSettings } from "@/server/services/operations.service";
import { Card } from "@/components/ui/card";
import { SettingForm } from "@/components/admin/operations-forms";

export default async function ConfigPage() {
  await requirePermission("settings.read");
  const settings = await listAppSettings();
  return <div className="space-y-5"><div><h1 className="text-2xl font-bold">ตั้งค่าระบบ</h1><p className="text-sm text-muted-foreground">ค่าที่ไม่เป็นความลับและปรับได้ขณะระบบทำงาน</p></div><Card className="p-4"><h2 className="mb-3 font-semibold">เพิ่มหรืออัปเดตค่า</h2><SettingForm /></Card><div className="space-y-2">{settings.length === 0 ? <Card className="p-4 text-sm text-muted-foreground">ยังไม่มีค่าระบบ</Card> : settings.map((setting) => <Card key={setting.key} className="p-4"><strong>{setting.name}</strong><p className="text-sm text-muted-foreground">{setting.key}</p><pre className="mt-2 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(setting.value, null, 2)}</pre></Card>)}</div></div>;
}
