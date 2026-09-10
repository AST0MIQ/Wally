"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MediaUrlField({ name, url }: { name: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex gap-2">
      <Input readOnly value={url} aria-label={`ลิงก์ของ ${name}`} onFocus={(event) => event.currentTarget.select()} />
      <Button type="button" size="icon" variant="secondary" aria-label={`คัดลอกลิงก์ของ ${name}`} onClick={copy}>
        {copied ? <Check /> : <Copy />}
      </Button>
    </div>
  );
}
