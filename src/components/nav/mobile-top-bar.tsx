"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Drawer, SideDrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { SidebarNav } from "@/components/nav/sidebar-nav";

/** Mobile-only top bar with a hamburger that opens the sidebar as a left drawer. */
export function MobileTopBar({
  role,
  email,
  className,
}: {
  role: "USER" | "ADMIN";
  email?: string | null;
  className?: string;
}) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <header
      className={cn(
        "mobile-safe-header sticky top-0 z-30 flex items-center gap-2 border-b border-border/70 bg-card/80 px-3 backdrop-blur-xl",
        className,
      )}
    >
      <Drawer direction="left" open={open} onOpenChange={setOpen}>
        <button
          type="button"
          aria-label={t("menu")}
          onClick={() => setOpen(true)}
          className="flex size-11 items-center justify-center rounded-md text-foreground hover:bg-muted"
        >
          <Menu className="size-5" />
        </button>
        <SideDrawerContent className="mobile-safe-drawer">
          <DrawerTitle className="sr-only">{t("menu")}</DrawerTitle>
          <SidebarNav
            role={role}
            email={email}
            onNavigate={() => setOpen(false)}
          />
        </SideDrawerContent>
      </Drawer>

      <span className="text-base font-bold tracking-tight">Wally</span>
    </header>
  );
}
