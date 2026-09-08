"use client";

import { useState } from "react";
import { useAction } from "@/hooks/use-action";
import { setUserRankAction } from "@/app/actions/admin/reward-rules";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RankPointsForm({ userId, initial }: { userId: string; initial: number }) {
  const [points, setPoints] = useState(String(initial));
  const action = useAction(setUserRankAction);
  return <div className="flex items-center gap-2"><Input className="w-28" type="number" min={0} value={points} onChange={(e) => setPoints(e.target.value)} /><Button size="sm" disabled={action.pending} onClick={() => action.run({ userId, points: Number(points) }, { successMessage: "บันทึกแต้มและตรวจรางวัลแล้ว" })}>บันทึก</Button></div>;
}
