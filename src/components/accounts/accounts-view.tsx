"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, ArchiveRestore, ArrowLeftRight, GripVertical, LayoutGrid, Check } from "lucide-react";

import type { Locale } from "@/i18n/config";
import { formatMoney, formatMoneyCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AccountWithBalance } from "@/server/services/account.service";
import {
  reorderAccountsAction,
  unarchiveAccountAction,
} from "@/app/actions/accounts";
import { useAction } from "@/hooks/use-action";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountForm } from "@/components/accounts/account-form";
import { useQuickAdd } from "@/components/transactions/quick-add-provider";

export function AccountsView({
  accounts,
  baseCurrency,
  convertedBalances,
}: {
  accounts: AccountWithBalance[];
  baseCurrency: string;
  convertedBalances: Record<string, string>;
}) {
  const ui = useTranslations("ui");
  const locale = useLocale() as Locale;
  const t = useTranslations("accounts");
  const tc = useTranslations("common");
  const router = useRouter();
  const { open: openQuickAdd } = useQuickAdd();
  const [showArchived, setShowArchived] = useState(false);
  const [arranging, setArranging] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  // account ids currently showing their balance converted to the base currency
  const [convertedIds, setConvertedIds] = useState<Set<string>>(new Set());
  const toggleConverted = (id: string) =>
    setConvertedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const [accountOrder, setAccountOrder] = useState(() => accounts.map((account) => account.id));
  const dragRef = useRef<string | null>(null);
  const suppressClickRef = useRef(false);
  // live-drag: the card element being dragged + where the pointer went down
  const dragElRef = useRef<HTMLElement | null>(null);
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);
  const dropTargetRef = useRef<string | null>(null);
  // On touch the drag arms only after a long press, so the list can scroll
  // normally; mouse arms immediately.
  const longPressRef = useRef<number | null>(null);
  const armedRef = useRef(false);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  // while a touch press is pending/armed, swallow the native text selection so
  // iOS doesn't pop the "Copy / Look Up / Translate" callout mid-drag
  const blockSelectRef = useRef(false);
  // once a touch has been held still briefly we "claim" the gesture: a
  // non-passive touchmove preventDefault stops Safari from scrolling the page
  // out from under a diagonal drag (touch-action:none set mid-gesture is
  // ignored on iOS). A fast early swipe still scrolls — see onPointerMove.
  const scrollLockRef = useRef(false);
  const lockTimerRef = useRef<number | null>(null);
  // auto-scroll the page while a drag hovers near the top/bottom edge, so a
  // far-away account can still be reached (the touch itself can't scroll —
  // it's held by the drag)
  const scrollStartRef = useRef(0);
  const maxScrollRef = useRef(0);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const autoScrollRef = useRef<number | null>(null);
  // account slots captured once per drag so the per-frame hit test doesn't
  // re-run querySelectorAll
  const cardsRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const stopSelect = (event: Event) => {
      if (blockSelectRef.current) event.preventDefault();
    };
    const stopScroll = (event: TouchEvent) => {
      if (scrollLockRef.current || armedRef.current) event.preventDefault();
    };
    document.addEventListener("selectstart", stopSelect);
    document.addEventListener("contextmenu", stopSelect);
    document.addEventListener("touchmove", stopScroll, { passive: false });
    return () => {
      document.removeEventListener("selectstart", stopSelect);
      document.removeEventListener("contextmenu", stopSelect);
      document.removeEventListener("touchmove", stopScroll);
      if (longPressRef.current != null) window.clearTimeout(longPressRef.current);
      if (lockTimerRef.current != null) window.clearTimeout(lockTimerRef.current);
      if (autoScrollRef.current != null)
        cancelAnimationFrame(autoScrollRef.current);
    };
  }, []);

  // which account slot the pointer is over — a rect scan instead of
  // elementFromPoint, so the dragged card never needs pointer-events:none
  // (which let iOS reach through to the text on the cards underneath)
  function accountCardAt(x: number, y: number): HTMLElement | null {
    const cards = cardsRef.current.length
      ? cardsRef.current
      : Array.from(
          document.querySelectorAll<HTMLElement>("[data-account-id]"),
        );
    for (const card of cards) {
      const r = card.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return card;
    }
    return null;
  }

  // tear down a pending press that never became a drag (tap or scroll)
  function endPress(el?: HTMLElement | null) {
    if (longPressRef.current != null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    if (lockTimerRef.current != null) {
      window.clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
    scrollLockRef.current = false;
    blockSelectRef.current = false;
    cardsRef.current = [];
    stopAutoScroll();
    if (el && !armedRef.current) {
      el.style.transition = "transform 140ms ease";
      el.style.transform = "";
    }
  }

  function stopAutoScroll() {
    if (autoScrollRef.current != null) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }

  // place the dragged card under the last known pointer, compensating for any
  // page scroll since the grab, and refresh the hovered drop target
  function renderDrag() {
    const p = lastPointRef.current;
    const origin = dragOriginRef.current;
    if (!p || !origin || !dragRef.current) return;
    const dx = p.x - origin.x;
    const dy = p.y - origin.y + (window.scrollY - scrollStartRef.current);
    moveDragEl(dx, dy);
    const overId = accountCardAt(p.x, p.y)?.dataset.accountId;
    const next =
      overId && overId !== dragRef.current && !arranging ? overId : null;
    if (next !== dropTargetRef.current) {
      dropTargetRef.current = next ?? null;
      setDropTargetId(next ?? null);
    }
  }

  // generous trigger zones — roughly the top quarter / bottom third of the
  // viewport — so you don't have to drag right to the bezel
  function edgeBands() {
    const vh = window.innerHeight;
    return { vh, top: Math.max(130, vh * 0.32), bottom: Math.max(190, vh * 0.4) };
  }

  function autoScrollTick() {
    autoScrollRef.current = null;
    const p = lastPointRef.current;
    if (!armedRef.current || !p) return;
    const { vh, top, bottom } = edgeBands();
    const MIN = 13; // px/frame the moment you enter the zone
    const MAX = 51; // px/frame at the very edge
    let dv = 0;
    if (p.y < top) {
      const t = (top - p.y) / top; // 0 at zone edge → 1 at screen edge
      dv = -(MIN + (MAX - MIN) * t);
    } else if (p.y > vh - bottom) {
      const t = (p.y - (vh - bottom)) / bottom;
      dv = MIN + (MAX - MIN) * t;
    }
    if (dv === 0) return;
    const y = window.scrollY;
    if ((dv < 0 && y <= 0) || (dv > 0 && y >= maxScrollRef.current)) return;
    // "instant" bypasses the page's `scroll-behavior: smooth`, which would
    // otherwise start a fresh eased animation every frame and stutter
    window.scrollTo({ top: y + dv, behavior: "instant" });
    renderDrag();
    autoScrollRef.current = requestAnimationFrame(autoScrollTick);
  }

  function maybeAutoScroll() {
    if (autoScrollRef.current != null) return; // already looping
    const p = lastPointRef.current;
    if (!p) return;
    const { vh, top, bottom } = edgeBands();
    if (p.y < top || p.y > vh - bottom) {
      autoScrollRef.current = requestAnimationFrame(autoScrollTick);
    }
  }

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  function moveDragEl(dx: number, dy: number, opts: { snap?: boolean } = {}) {
    const el = dragElRef.current;
    if (!el) return;
    // no transition while the finger drives it (instant follow); ease on snap
    el.style.transition = opts.snap
      ? "transform 180ms cubic-bezier(0.2,0.8,0.3,1)"
      : "none";
    el.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${opts.snap ? 0.9 : 0.88})`;
  }

  function resetDragEl(withTransition: boolean) {
    const el = dragElRef.current;
    if (el) {
      el.style.transition = withTransition
        ? "transform 200ms cubic-bezier(0.2,0.8,0.3,1)"
        : "";
      el.style.transform = "";
      el.style.zIndex = "";
      el.style.pointerEvents = "";
      el.style.touchAction = "";
      const clear = () => {
        el.style.transition = "";
        el.removeEventListener("transitionend", clear);
      };
      if (withTransition) el.addEventListener("transitionend", clear);
    }
    dragElRef.current = null;
    dragOriginRef.current = null;
    dropTargetRef.current = null;
    setDropTargetId(null);
  }

  const unarchive = useAction(unarchiveAccountAction);
  const reorder = useAction(reorderAccountsAction);

  useEffect(() => {
    setAccountOrder(accounts.map((account) => account.id));
  }, [accounts]);

  const { active, archived } = useMemo(
    () => ({
      active: accounts
        .filter((a) => a.status === "ACTIVE")
        .sort((a, b) => accountOrder.indexOf(a.id) - accountOrder.indexOf(b.id)),
      archived: accounts.filter((a) => a.status === "ARCHIVED"),
    }),
    [accounts, accountOrder],
  );

  const typeLabel = (a: AccountWithBalance) =>
    a.type === "OTHER" && a.customTypeLabel
      ? a.customTypeLabel
      : t(`types.${a.type}`);

  const baseValueOf = (a: AccountWithBalance) =>
    Number(convertedBalances[a.id] ?? a.balance);
  const totalBase = active.reduce((sum, a) => sum + baseValueOf(a), 0);
  const shareOf = (a: AccountWithBalance) =>
    totalBase > 0
      ? Math.max(0, Math.min(100, Math.round((baseValueOf(a) / totalBase) * 100)))
      : 0;

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={ui("accounts")} action={
        <div className="flex gap-2">
          {active.length > 1 && (
            <Button
              variant={arranging ? "primary" : "secondary"}
              size="sm"
              onClick={() => setArranging((value) => !value)}
            >
              {arranging ? <Check /> : <LayoutGrid />}
              {arranging ? t("doneArranging") : t("arrange")}
            </Button>
          )}
          <AccountForm
            trigger={
              <Button size="sm">
                <Plus className="size-4" />
                {t("add")}
              </Button>
            }
          />
        </div>
      } />

      {active.length === 0 && archived.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyHint")}
          action={
            <AccountForm
              trigger={
                <Button size="sm">
                  <Plus className="size-4" />
                  {t("add")}
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="select-none rounded-[2rem] bg-[radial-gradient(circle_at_15%_20%,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_34%),radial-gradient(circle_at_85%_55%,color-mix(in_srgb,var(--accent)_75%,transparent),transparent_38%)] p-3 [-webkit-touch-callout:none] sm:p-5">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {active.map((a) => (
            <li key={a.id} data-account-id={a.id}>
              <Card
                onClick={(event) => {
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
                  if (arranging) return;
                  if ((event.target as HTMLElement).closest("a,button")) return;
                  router.push(`/accounts/${a.id}`);
                }}
                onPointerDown={(event) => {
                  if ((event.target as HTMLElement).closest("a,button")) return;
                  const el = event.currentTarget as HTMLElement;
                  const pointerId = event.pointerId;
                  const startX = event.clientX;
                  const startY = event.clientY;
                  pressStartRef.current = { x: startX, y: startY };
                  armedRef.current = false;
                  scrollLockRef.current = false; // safety: never start pre-locked

                  const beginDrag = () => {
                    longPressRef.current = null;
                    armedRef.current = true;
                    try {
                      el.setPointerCapture(pointerId);
                    } catch {
                      /* pointer already released */
                    }
                    // drop any selection iOS may have started during the hold
                    try {
                      window.getSelection?.()?.removeAllRanges();
                    } catch {
                      /* selection API unavailable */
                    }
                    // a short buzz confirms the grab (Android; iOS Safari ignores it)
                    try {
                      navigator.vibrate?.(15);
                    } catch {
                      /* vibration unsupported */
                    }
                    // gesture is ours now — stop the page scrolling under it
                    scrollLockRef.current = true;
                    if (lockTimerRef.current != null) {
                      window.clearTimeout(lockTimerRef.current);
                      lockTimerRef.current = null;
                    }
                    dragRef.current = a.id;
                    setDraggingId(a.id);
                    if (!prefersReducedMotion) {
                      dragElRef.current = el;
                      dragOriginRef.current = { x: startX, y: startY };
                      lastPointRef.current = { x: startX, y: startY };
                      scrollStartRef.current = window.scrollY;
                      maxScrollRef.current =
                        document.documentElement.scrollHeight -
                        window.innerHeight;
                      cardsRef.current = Array.from(
                        document.querySelectorAll<HTMLElement>(
                          "[data-account-id]",
                        ),
                      );
                      el.style.zIndex = "50";
                      el.style.touchAction = "none";
                      // pop from the pressed-in hint to the lifted state
                      el.style.transition =
                        "transform 160ms cubic-bezier(0.2,0.8,0.3,1)";
                      el.style.transform = "scale(0.88)";
                    }
                  };

                  if (event.pointerType === "mouse") {
                    beginDrag();
                  } else {
                    // hold to grab — a quick swipe scrolls the list instead.
                    // block native selection for the whole hold + drag window.
                    blockSelectRef.current = true;
                    if (!prefersReducedMotion) {
                      // immediate "pressed-in" feedback so the hold feels registered
                      el.style.transition = "transform 140ms ease";
                      el.style.transform = "scale(0.97)";
                    }
                    // after a brief still hold, claim the gesture (lock scroll)
                    lockTimerRef.current = window.setTimeout(() => {
                      scrollLockRef.current = true;
                    }, 120);
                    longPressRef.current = window.setTimeout(beginDrag, 500);
                  }
                }}
                onPointerMove={(event) => {
                  if (!armedRef.current) {
                    // before the gesture is claimed, a real move = scroll intent,
                    // so drop the pending grab and let the page scroll. Once
                    // scrollLockRef is set the hold sticks through finger drift.
                    if (
                      longPressRef.current != null &&
                      pressStartRef.current &&
                      !scrollLockRef.current
                    ) {
                      const mx = Math.abs(event.clientX - pressStartRef.current.x);
                      const my = Math.abs(event.clientY - pressStartRef.current.y);
                      if (mx > 16 || my > 16) {
                        endPress(event.currentTarget as HTMLElement);
                      }
                    }
                    return;
                  }
                  if (!dragRef.current || !dragOriginRef.current) return;
                  lastPointRef.current = { x: event.clientX, y: event.clientY };
                  renderDrag();
                  maybeAutoScroll();
                }}
                onPointerUp={(event) => {
                  if (!armedRef.current) {
                    endPress(event.currentTarget as HTMLElement);
                    return; // was a tap / scroll, not a drag
                  }
                  armedRef.current = false;
                  endPress();

                  const sourceId = dragRef.current;
                  const targetEl = accountCardAt(event.clientX, event.clientY);
                  const target = targetEl?.dataset.accountId;
                  dragRef.current = null;
                  setDraggingId(null);
                  suppressClickRef.current = true; // a grab happened — don't also navigate

                  const valid = !!sourceId && !!target && sourceId !== target;
                  if (!valid) {
                    resetDragEl(true); // float back to place
                    return;
                  }

                  const commit = () => {
                    if (arranging) {
                      const nextOrder = active.map((account) => account.id);
                      const sourceIndex = nextOrder.indexOf(sourceId!);
                      const targetIndex = nextOrder.indexOf(target!);
                      nextOrder.splice(sourceIndex, 1);
                      nextOrder.splice(targetIndex, 0, sourceId!);
                      setAccountOrder(nextOrder);
                      void reorder.run(
                        { ids: nextOrder },
                        { successMessage: t("reorderedToast"), refresh: false },
                      );
                    } else {
                      openQuickAdd({
                        mode: "TRANSFER",
                        fromAccountId: sourceId!,
                        toAccountId: target!,
                      });
                    }
                    resetDragEl(false);
                  };

                  // snap the card toward the destination, then open the sheet
                  if (dragElRef.current && targetEl && !prefersReducedMotion) {
                    const from = dragElRef.current.getBoundingClientRect();
                    const to = targetEl.getBoundingClientRect();
                    moveDragEl(
                      to.left + to.width / 2 - (from.left + from.width / 2),
                      to.top + to.height / 2 - (from.top + from.height / 2),
                      { snap: true },
                    );
                    window.setTimeout(commit, 170);
                  } else {
                    commit();
                  }
                }}
                onPointerCancel={() => {
                  armedRef.current = false;
                  endPress();
                  dragRef.current = null;
                  setDraggingId(null);
                  resetDragEl(true);
                }}
                style={{
                  backgroundColor: a.color
                    ? `color-mix(in srgb, ${a.color} 8%, var(--card))`
                    : undefined,
                  borderColor: a.color
                    ? `color-mix(in srgb, ${a.color} 30%, var(--border))`
                    : undefined,
                }}
                className={cn(
                  "interactive-lift relative flex h-full select-none flex-col overflow-hidden p-4 will-change-transform [-webkit-touch-callout:none]",
                  draggingId === a.id && "z-10 opacity-95 ring-2 ring-primary shadow-2xl",
                  draggingId === a.id && prefersReducedMotion && "scale-[0.88] opacity-80",
                  dropTargetId === a.id && "scale-[1.05] ring-4 ring-primary/70 shadow-lg transition-transform",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: (a.color ?? "#2563EB") + "26" }}
                  >
                    {a.icon || "🏦"}
                  </span>
                  <GripVertical className="size-5 text-muted-foreground/55" aria-label={arranging ? t("dragToReorder") : t("dragToTransfer")} />
                </div>

                <div className="mt-3 min-w-0">
                  <p className="line-clamp-2 font-medium leading-snug text-foreground">{a.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{typeLabel(a)} · {a.currency}</p>
                </div>

                {(() => {
                  const showBase =
                    a.currency !== baseCurrency && convertedIds.has(a.id);
                  const cur = showBase ? baseCurrency : a.currency;
                  const amt = showBase ? baseValueOf(a) : a.balance;
                  return (
                    <div className="mt-3 flex items-center gap-1.5">
                      <span
                        title={formatMoney(amt, cur, locale)}
                        className="balance-mask min-w-0 flex-1 truncate text-lg font-semibold text-foreground sm:text-xl"
                      >
                        {formatMoneyCompact(amt, cur, locale)}
                      </span>
                      {a.currency !== baseCurrency && (
                        <button
                          type="button"
                          aria-label={t("convertToBase", { currency: baseCurrency })}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleConverted(a.id);
                          }}
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                            showBase && "bg-primary/15 text-primary",
                          )}
                        >
                          <ArrowLeftRight className="size-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })()}

                <div className="mt-auto border-t border-border/60 pt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${shareOf(a)}%`,
                        backgroundColor: a.color ?? "var(--primary)",
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {t("shareOfTotal", { pct: shareOf(a) })}
                  </p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-end justify-between gap-4 px-1">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{t("totalBalance")}</p>
            <p
              title={formatMoney(totalBase, baseCurrency, locale)}
              className="balance-mask truncate text-2xl font-semibold sm:text-3xl"
            >
              {formatMoneyCompact(totalBase, baseCurrency, locale)}
            </p>
          </div>
          <p className="max-w-36 shrink-0 text-right text-xs text-muted-foreground">{arranging ? t("dragToReorder") : t("dragToTransfer")}</p>
        </div>
        </div>
      )}

      {archived.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-expanded={showArchived}
            onClick={() => setShowArchived((v) => !v)}
            className="self-start text-sm text-muted-foreground hover:text-foreground"
          >
            {t("showArchived")} ({archived.length})
          </button>
          {showArchived && (
            <ul className="flex flex-col gap-2">
              {archived.map((a) => (
                <li key={a.id}>
                  <Card className="flex flex-wrap items-center gap-3 p-4 opacity-70">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                      {a.icon || "🏦"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("archived")} · {a.currency}
                      </p>
                    </div>
                    <span className="shrink-0 text-right font-semibold tabular-nums">
                      {formatMoney(a.balance, a.currency, locale)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={tc("unarchive")}
                      disabled={unarchive.pending}
                      onClick={() =>
                        unarchive.run(
                          { id: a.id },
                          { successMessage: t("unarchivedToast") },
                        )
                      }
                    >
                      <ArchiveRestore className="size-4" />
                    </Button>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
