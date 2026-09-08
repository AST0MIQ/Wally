import { requirePermission } from "@/server/lib/guards";
import { listFeatureFlags } from "@/server/services/operations.service";
import { Card } from "@/components/ui/card";
import { FlagToggle, NewFlagForm } from "@/components/admin/operations-forms";

export default async function FlagsPage() {
  await requirePermission("settings.read");
  const flags = await listFeatureFlags();
  return <div className="space-y-5"><div><h1 className="text-2xl font-bold">เปิด–ปิดฟีเจอร์</h1><p className="text-sm text-muted-foreground">ควบคุมการปล่อยฟีเจอร์โดยไม่ต้องแก้โค้ด</p></div><Card className="p-4"><h2 className="mb-3 font-semibold">เพิ่มตัวควบคุม</h2><NewFlagForm /></Card><div className="space-y-2">{flags.length === 0 ? <Card className="p-4 text-sm text-muted-foreground">ยังไม่มีตัวควบคุม</Card> : flags.map((flag) => <Card key={flag.key} className="flex items-center justify-between gap-3 p-4"><div><strong>{flag.name}</strong><p className="text-sm text-muted-foreground">{flag.key}{flag.description ? ` · ${flag.description}` : ""}</p></div><FlagToggle flagKey={flag.key} enabled={flag.enabled} /></Card>)}</div></div>;
}
