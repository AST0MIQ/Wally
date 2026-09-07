"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Drawer, SideDrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { SidebarNav } from "@/components/nav/sidebar-nav";
import { APP_VERSION } from "@/lib/version";

/** Mobile-only top bar with a hamburger (right side) that opens the menu as a right drawer. */
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

  // Right-edge swipe → open the menu drawer (native-app feel).
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const onSwipeStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    swipeStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };
  const onSwipeMove = (e: React.TouchEvent) => {
    if (open || !swipeStart.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - swipeStart.current.x;
    const dy = touch.clientY - swipeStart.current.y;
    if (dx < -48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      swipeStart.current = null;
      setOpen(true);
    }
  };

  return (
    <>
      <div
        aria-hidden
        className="fixed right-0 z-30 w-5 md:hidden"
        style={{ top: "calc(3.5rem + env(safe-area-inset-top, 0px))", bottom: 0, touchAction: "pan-y" }}
        onTouchStart={onSwipeStart}
        onTouchMove={onSwipeMove}
        onTouchEnd={() => {
          swipeStart.current = null;
        }}
      />
      <header
        className={cn(
          "glass mobile-safe-header sticky top-0 z-30 flex items-center gap-2 border-b border-glass px-3",
          className,
        )}
      >
        <span className="text-base font-bold tracking-tight">Wally</span>

        <Drawer direction="right" open={open} onOpenChange={setOpen}>
          <button
            type="button"
            aria-label={t("menu")}
            onClick={() => setOpen(true)}
            className="relative ml-auto flex size-11 items-center justify-center rounded-md text-foreground hover:bg-muted"
          >
            <Menu className="size-5" />
            {hasUnreadPatchNotes && <span className="absolute left-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-card" />}
          </button>
          <SideDrawerContent side="right" className="mobile-safe-drawer">
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
      </header>
    </>
  );
}
