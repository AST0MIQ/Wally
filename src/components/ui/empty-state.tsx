import type { ReactNode } from "react";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-accent text-primary"><Wallet className="size-6" aria-hidden="true" /></span>
      <p className="text-lg font-semibold">{title}</p>
      {description && (
        <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
