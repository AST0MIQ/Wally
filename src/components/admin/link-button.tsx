import Link from "next/link";
import { cn } from "@/lib/utils";

/** A `<Link>` styled like the primary/secondary Button (which has no asChild). */
export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors [&_svg]:size-4",
        variant === "primary" && "bg-primary text-primary-foreground hover:opacity-90",
        variant === "secondary" && "border border-border bg-card hover:bg-muted",
        variant === "ghost" && "hover:bg-muted",
        className,
      )}
    >
      {children}
    </Link>
  );
}
