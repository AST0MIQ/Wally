"use client";

import { cn } from "@/lib/utils";
import { SidebarNav } from "@/components/nav/sidebar-nav";

type SidebarProps = {
  role: "USER" | "ADMIN";
  email?: string | null;
  lastSeenVersion: string;
  className?: string;
};

/** Desktop fixed sidebar (md and up). */
export function Sidebar({ role, email, lastSeenVersion, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "h-dvh border-r border-border/70 bg-card/65 backdrop-blur-xl",
        className,
      )}
    >
      <SidebarNav role={role} email={email} lastSeenVersion={lastSeenVersion} />
    </aside>
  );
}
