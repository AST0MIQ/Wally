"use client";

import { useRouter } from "next/navigation";

import { archiveMediaAction, setMediaUsageAction } from "@/app/actions/admin/media";
import { useAction } from "@/hooks/use-action";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { MEDIA_USAGES, MEDIA_USAGE_SPECS, type MediaUsage } from "@/lib/cosmetics/media-usage";

/** Re-file or archive one library image, reporting the real failure reason. */
export function MediaCardActions({
  id,
  name,
  usage,
  archivable,
}: {
  id: string;
  name: string;
  usage: string;
  archivable: boolean;
}) {
  const router = useRouter();
  const move = useAction(setMediaUsageAction);
  const archive = useAction(archiveMediaAction);
  const pending = move.pending || archive.pending;

  return (
    <div className="flex items-center gap-2">
      <Select
        value={usage}
        disabled={pending}
        aria-label={`ย้ายหมวดของ ${name}`}
        className="h-9 text-xs"
        onChange={async (event) => {
          const res = await move.run(
            { id, usage: event.target.value as MediaUsage },
            { successMessage: "ย้ายหมวดแล้ว" },
          );
          if (res.ok) router.refresh();
        }}
      >
        {MEDIA_USAGES.map((value) => (
          <option key={value} value={value}>{MEDIA_USAGE_SPECS[value].label}</option>
        ))}
      </Select>
      {archivable && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={async () => {
            const res = await archive.run({ id }, { successMessage: "เก็บเข้าคลังแล้ว" });
            if (res.ok) router.refresh();
          }}
        >
          เก็บเข้าคลัง
        </Button>
      )}
    </div>
  );
}
