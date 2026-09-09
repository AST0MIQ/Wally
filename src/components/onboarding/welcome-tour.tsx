"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  LayoutDashboard,
  ListChecks,
  Menu,
  PlusCircle,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const TOUR_SEEN_KEY = "wally-tour-seen";
/** Fire `window.dispatchEvent(new Event(OPEN_TOUR_EVENT))` to replay the tour. */
export const OPEN_TOUR_EVENT = "wally:open-tour";

type Step = {
  key: string;
  icon: LucideIcon;
  /** `data-tour="…"` of the element to spotlight. Omit for a centred card. */
  anchor?: string;
  /** Preferred side to place the callout relative to the anchor. */
  side?: "top" | "bottom";
  /** Skip on ≥ md screens (e.g. the hamburger only exists on mobile). */
  mobileOnly?: boolean;
};

const STEPS: Step[] = [
  { key: "welcome", icon: Wallet },
  { key: "dashboard", icon: LayoutDashboard, anchor: "net-worth", side: "bottom" },
  { key: "log", icon: PlusCircle, anchor: "add-transaction", side: "top" },
  { key: "logHow", icon: ListChecks, anchor: "add-transaction", side: "top" },
  { key: "grow", icon: TrendingUp, anchor: "primary-nav", side: "top" },
  { key: "menu", icon: Menu, anchor: "menu-button", side: "bottom", mobileOnly: true },
  { key: "personalize", icon: Sparkles },
];

const PAD = 8; // breathing room around the spotlit element
const GAP = 12; // distance from anchor to the callout card
const CARD_W = 340;

type Box = { top: number; left: number; width: number; height: number };

/**
 * Pick the on-screen element for a `data-tour` name. There can be several
 * (e.g. the sidebar nav and the mobile bottom nav both tagged `primary-nav`,
 * plus a closed drawer that keeps its copy mounted but translated off-screen).
 * We want the one the user can actually see right now.
 */
function resolveAnchor(name: string): HTMLElement | null {
  const els = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`),
  );
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const visible = els.filter((el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0")
      return false;
    // `offsetParent` is null for position:fixed (the mobile bottom nav!), so
    // don't use it — a zero-size rect already covers an ancestor display:none.
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    // Must overlap the viewport (rejects an off-canvas closed drawer).
    return r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw;
  });
  // Prefer the element closest to the viewport centre when more than one shows.
  visible.sort((a, b) => {
    const ca = a.getBoundingClientRect();
    const cb = b.getBoundingClientRect();
    const da = Math.abs(ca.top + ca.height / 2 - vh / 2);
    const db = Math.abs(cb.top + cb.height / 2 - vh / 2);
    return da - db;
  });
  return visible[0] ?? null;
}

export function WelcomeTour() {
  const t = useTranslations("onboarding.tour");
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [isMobile, setIsMobile] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(
    null,
  );

  useEffect(() => setMounted(true), []);

  // Which media the hamburger step applies to.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const steps = useMemo(
    () => STEPS.filter((s) => !s.mobileOnly || isMobile),
    [isMobile],
  );

  // First visit on this browser → show it once.
  useEffect(() => {
    try {
      if (localStorage.getItem(TOUR_SEEN_KEY) !== "1") setOpen(true);
    } catch {
      /* storage blocked — just don't auto-open */
    }
  }, []);

  // "Show me again" from Settings — jump to the dashboard so the anchors exist.
  useEffect(() => {
    const replay = () => {
      setStep(0);
      if (pathname !== "/dashboard") router.push("/dashboard");
      setTimeout(() => setOpen(true), pathname !== "/dashboard" ? 350 : 0);
    };
    window.addEventListener(OPEN_TOUR_EVENT, replay);
    return () => window.removeEventListener(OPEN_TOUR_EVENT, replay);
  }, [pathname, router]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(TOUR_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, []);

  const safeStep = Math.min(step, steps.length - 1);
  const current = steps[safeStep] ?? steps[0]!;
  const isLast = safeStep === steps.length - 1;
  const atStart = safeStep === 0;

  const next = useCallback(
    () => setStep((s) => Math.min(s + 1, steps.length - 1)),
    [steps.length],
  );
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  // Track the anchor rect every frame while open (keeps the spotlight glued
  // through smooth-scroll, layout shifts and viewport resizes).
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const anchorName = current.anchor;

    const tick = () => {
      if (anchorName) {
        const el = resolveAnchor(anchorName);
        if (el) {
          const r = el.getBoundingClientRect();
          setBox({
            top: r.top - PAD,
            left: r.left - PAD,
            width: r.width + PAD * 2,
            height: r.height + PAD * 2,
          });
        } else {
          setBox(null);
        }
      } else {
        setBox(null);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, current.anchor, safeStep]);

  // Bring the anchor into view when the step changes.
  useEffect(() => {
    if (!open || !current.anchor) return;
    resolveAnchor(current.anchor)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [open, current.anchor, safeStep]);

  // Place the callout card next to the spotlight (or centre it when there's
  // no anchor / it doesn't fit).
  useLayoutEffect(() => {
    if (!open) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const h = cardRef.current?.offsetHeight ?? 200;
    const w = Math.min(CARD_W, vw - 24);

    if (!box) {
      setCardPos({ top: (vh - h) / 2, left: (vw - w) / 2 });
      return;
    }

    const below = box.top + box.height + GAP;
    const above = box.top - GAP - h;
    let top: number;
    if (current.side === "top" && above > 12) top = above;
    else if (below + h < vh - 12) top = below;
    else if (above > 12) top = above;
    else top = (vh - h) / 2;
    // Never let the card run off the top/bottom of the screen.
    top = Math.max(12, Math.min(top, vh - h - 12));

    let left = box.left + box.width / 2 - w / 2;
    left = Math.max(12, Math.min(left, vw - w - 12));
    setCardPos({ top, left });
  }, [open, box, step, current.side]);

  // Keyboard controls.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        if (isLast) dismiss();
        else next();
      } else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isLast, next, back, dismiss]);

  if (!mounted || !open) return null;

  const Icon = current.icon;
  const w = Math.min(CARD_W, window.innerWidth - 24);

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={t(`${current.key}.title`)}>
      {/* Dimmer. With an anchor we cut a hole with a huge spread shadow. */}
      {box ? (
        <div
          className="pointer-events-none absolute rounded-2xl ring-2 ring-primary/70 transition-all duration-300 ease-out"
          style={{
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
            boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.66)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgba(2,6,23,0.66)]" />
      )}

      {/* Click-blocker so the page underneath stays put during the tour. */}
      <button
        type="button"
        aria-label={t("skip")}
        onClick={dismiss}
        className="absolute inset-0 h-full w-full cursor-default"
        tabIndex={-1}
      />

      <div
        ref={cardRef}
        className="glass absolute flex flex-col gap-3 rounded-2xl border border-glass p-5 shadow-xl"
        style={{ width: w, top: cardPos?.top ?? 0, left: cardPos?.left ?? 0 }}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("skip")}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-md text-muted-foreground opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="size-4" />
        </button>

        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">
            {safeStep + 1} / {steps.length}
          </p>
          <h2 className="text-base font-semibold">{t(`${current.key}.title`)}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(`${current.key}.body`)}
          </p>
        </div>

        <div className="mt-1 flex items-center justify-between">
          <div className="flex gap-1.5" aria-hidden>
            {steps.map((s, i) => (
              <span
                key={s.key}
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  i === safeStep ? "bg-primary" : "bg-muted-foreground/30",
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!atStart && (
              <Button variant="ghost" size="sm" onClick={back}>
                <ArrowLeft className="size-4" />
                {t("back")}
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={dismiss}>
                {t("done")}
              </Button>
            ) : (
              <Button size="sm" onClick={next}>
                {t("next")}
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
