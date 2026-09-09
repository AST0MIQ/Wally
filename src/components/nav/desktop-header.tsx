"use client";

import { ProfileChip, type ProfileChipStreak } from "@/components/nav/profile-chip";
import { BalanceVisibilityToggle } from "@/components/nav/balance-visibility-toggle";
import { cn } from "@/lib/utils";
import { useCosmeticCardTheme } from "@/components/cosmetics/use-cosmetic-card-theme";
import { CosmeticCardFx } from "@/components/cosmetics/cosmetic-card-fx";

/** Desktop-only top bar (md+) holding the profile chip on the right. */
export function DesktopHeader({
  name,
  email,
  streak,
}: {
  name?: string | null;
  email?: string | null;
  streak?: ProfileChipStreak;
}) {
  const theme = useCosmeticCardTheme("HEADER");
  return (
    <header
      className={cn(
        "sticky top-0 z-30 hidden h-14 items-center justify-end overflow-hidden border-b px-8 md:flex",
        theme.active ? theme.className : "glass border-glass",
      )}
      style={theme.style}
    >
      <CosmeticCardFx slot="HEADER" />
      <div className="relative z-[1] flex items-center gap-1">
        <BalanceVisibilityToggle />
        <ProfileChip name={name} email={email} streak={streak} />
      </div>
    </header>
  );
}
