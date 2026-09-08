"use client";

import { cn } from "@/lib/utils";
import { SidebarNav } from "@/components/nav/sidebar-nav";
import { useCosmeticCardTheme } from "@/components/cosmetics/use-cosmetic-card-theme";
import { CosmeticCardFx } from "@/components/cosmetics/cosmetic-card-fx";

type SidebarProps = {
  role: "USER" | "ADMIN";
  email?: string | null;
  lastSeenVersion: string;
  className?: string;
};

/** Desktop fixed sidebar (md and up). */
export function Sidebar({ role, email, lastSeenVersion, className }: SidebarProps) {
  const theme = useCosmeticCardTheme("NAVIGATION");
  return (
    <aside
      className={cn(
        "relative h-dvh overflow-hidden border-r",
        theme.active ? theme.className : "glass border-glass",
        className,
      )}
      style={theme.style}
    >
      <CosmeticCardFx slot="NAVIGATION" />
      <div className="relative z-[1] h-full">
        <SidebarNav role={role} email={email} lastSeenVersion={lastSeenVersion} />
      </div>
    </aside>
  );
}
