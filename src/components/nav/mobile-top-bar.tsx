"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Drawer, SideDrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { SidebarNav } from "@/components/nav/sidebar-nav";
import { APP_VERSION } from "@/lib/version";

/** Mobile-only top bar with a hamburger that opens the sidebar as a left drawer. */
export function MobileTopBar({
  role,
  email,
  lastSeenVersion,
  className,
}: {
  role: "USER" | "ADMIN";
  email?: string | null;
  lastSeenVersion: string;
  className?: string;
}) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const [hasUnreadPatchNotes, setHasUnreadPatchNotes] = useState(lastSeenVersion !== APP_VERSION);

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
          className="relative flex size-11 items-center justify-center rounded-md text-foreground hover:bg-muted"
        >
          <Menu className="size-5" />
          {hasUnreadPatchNotes && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-card" />}
        </button>
        <SideDrawerContent className="mobile-safe-drawer">
          <DrawerTitle className="sr-only">{t("menu")}</DrawerTitle>
          <SidebarNav
            role={role}
            email={email}
            lastSeenVersion={lastSeenVersion}
            onNavigate={() => setOpen(false)}
            onPatchNotesSeen={() => setHasUnreadPatchNotes(false)}
          />
        </SideDrawerContent>
      </Drawer>

      <span className="text-base font-bold tracking-tight">Wally</span>
    </header>
  );
}
