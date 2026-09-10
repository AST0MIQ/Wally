"use client";

import { useRef } from "react";
import { setMediaUsageAction } from "@/app/actions/admin/media";
import { Select } from "@/components/ui/select";
import { MEDIA_USAGES, MEDIA_USAGE_SPECS } from "@/lib/cosmetics/media-usage";

/** Re-files one library image under a different surface. Submits on change. */
export function MediaUsageSelect({ id, usage, name }: { id: string; usage: string; name: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={setMediaUsageAction}>
      <input type="hidden" name="id" value={id} />
      <Select
        name="usage"
        defaultValue={usage}
        aria-label={`ย้ายหมวดของ ${name}`}
        className="h-9 text-xs"
        onChange={() => formRef.current?.requestSubmit()}
      >
        {MEDIA_USAGES.map((value) => (
          <option key={value} value={value}>{MEDIA_USAGE_SPECS[value].label}</option>
        ))}
      </Select>
    </form>
  );
}
