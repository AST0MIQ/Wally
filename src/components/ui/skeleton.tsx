import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/** Generic page loading state: a title bar + a few blocks. */
export function PageSkeleton({ blocks = 4 }: { blocks?: number }) {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-8 w-40" />
      {Array.from({ length: blocks }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  );
}
