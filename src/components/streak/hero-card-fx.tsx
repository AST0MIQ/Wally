import { cn } from "@/lib/utils";
import { tierFx, type CardStyle } from "@/server/lib/streak";

function cardStyle(tierIndex: number): CardStyle {
  return tierIndex < 0 ? "none" : tierFx(tierIndex).card;
}

/** Classes for the hero <section> itself (gem background + glow + border). */
export function heroCardClasses(tierIndex: number): string {
  const s = cardStyle(tierIndex);
  const gem =
    s === "gold" || s === "ruby" || s === "diamond" || s === "platinum";
  return cn(
    (s === "sheen-glow" || s === "border") && "hero-glow",
    (s === "gold" || s === "ruby" || s === "diamond") && "hero-glow-strong",
    s === "platinum" && "hero-glow-max",
    (s === "border" || gem) && "hero-ring",
    s === "border" && "hero-ring-accent",
    // full-card gem background from 1 year on
    s === "gold" && "hero-ring-gold hero-bg-gold",
    s === "ruby" && "hero-ring-ruby hero-bg-ruby",
    s === "diamond" && "hero-ring-diamond hero-bg-diamond",
    s === "platinum" && "hero-ring-platinum hero-bg-platinum",
  );
}

/** Overlay layers (a moving sheen sweep) rendered inside the hero card. */
export function HeroCardFx({ tierIndex }: { tierIndex: number }) {
  const s = cardStyle(tierIndex);
  const sheen =
    s === "sheen" ||
    s === "sheen-glow" ||
    s === "gold" ||
    s === "ruby" ||
    s === "diamond" ||
    s === "platinum";
  if (!sheen) return null;

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      <span className="hero-sheen" />
    </span>
  );
}
