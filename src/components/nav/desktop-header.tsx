import { ProfileChip, type ProfileChipStreak } from "@/components/nav/profile-chip";

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
  return (
    <header className="glass sticky top-0 z-30 hidden h-14 items-center justify-end border-b border-glass px-8 md:flex">
      <ProfileChip name={name} email={email} streak={streak} />
    </header>
  );
}
