"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

/**
 * Manual "refresh market prices" trigger. Hits the same endpoint the background
 * poller uses, then refreshes the route so recomputed values show immediately.
 */
export function MarketRefreshButton({ className }: { className?: string }) {
  const router = useRouter();
  const t = useTranslations("portfolio");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/market/refresh", { method: "POST" });
      if (!res.ok) throw new Error("refresh_failed");
      const data = (await res.json()) as { changed?: boolean; prices?: { updated?: number } };
      const updated = data.prices?.updated ?? 0;
      toast.success(updated > 0 ? t("pricesUpdated", { count: updated }) : t("pricesUpToDate"));
      if (data.changed) router.refresh();
    } catch {
      toast.error(t("priceRefreshFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={refresh}
      disabled={busy}
      aria-label={t("refreshPrices")}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60",
        className,
      )}
    >
      <RefreshCw className={cn("size-3.5", busy && "animate-spin")} />
      {t("refreshPrices")}
    </button>
  );
}
