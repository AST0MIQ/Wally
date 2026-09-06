import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, sub, icon, tone = "neutral", quiet = false, className }: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "positive" | "negative";
  className?: string;
  quiet?: boolean;
}) {
  return (
    <div className={cn(
      quiet ? "min-w-0 border-b border-border/50 px-1 pb-4 pt-2 sm:px-3" : "group min-w-0 rounded-2xl border border-border/70 bg-card/80 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-[0_16px_30px_-24px_rgb(15_23_42_/_0.38)] sm:p-5",
      className,
    )}>
      <div className={cn("flex items-center gap-2", quiet ? "mb-3" : "mb-4")}>
        {icon && <span className={cn(
          quiet ? "flex shrink-0 items-center text-muted-foreground" : "flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground",
          !quiet && tone === "positive" && "bg-emerald-500/10 text-positive",
          !quiet && tone === "negative" && "bg-rose-500/10 text-negative",
        )}>{icon}</span>}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className={cn(
        "balance-mask text-[1.65rem] font-semibold leading-none sm:text-3xl",
        tone === "positive" && "text-positive",
        tone === "negative" && "text-negative",
      )}>{value}</div>
      {sub && <div className="mt-3 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
