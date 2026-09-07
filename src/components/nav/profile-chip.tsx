import Link from "next/link";

import { cn } from "@/lib/utils";

/** Header identity chip → navigates to the full profile page. */
export function ProfileChip({
  name,
  email,
  compact = false,
  className,
}: {
  name?: string | null;
  email?: string | null;
  /** avatar only (mobile top bar) */
  compact?: boolean;
  className?: string;
}) {
  const label = name?.trim() || email?.split("@")[0] || "—";
  const initial = (name?.trim() || email || "?").charAt(0).toUpperCase();

  return (
    <Link
      href="/profile"
      aria-label={label}
      className={cn(
        "flex shrink-0 items-center rounded-full border border-border/70 transition-colors hover:bg-muted",
        compact ? "size-9 justify-center" : "gap-2 py-1 pl-1 pr-3",
        className,
      )}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
        {initial}
      </span>
      {!compact && <span className="max-w-[10rem] truncate text-sm font-medium">{label}</span>}
    </Link>
  );
}
