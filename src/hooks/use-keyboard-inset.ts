"use client";

import { useEffect } from "react";

/**
 * Publishes two numbers about the on-screen keyboard on the root element.
 * Both are `0px` when no keyboard is showing and on any browser without the
 * Visual Viewport API, so `var(--x, 0px)` is always safe in a calc().
 *
 *   --keyboard-inset   how much height the keyboard takes away
 *   --viewport-shift   how far the visual viewport has scrolled down inside
 *                      the layout viewport
 *
 * Why both: iOS never resizes the *layout* viewport for the keyboard. It
 * shrinks the visual viewport (that's the inset) and then scrolls it down to
 * reveal the focused field (that's the shift). A `position: fixed` sheet is
 * laid out against the layout viewport, so the shift moves it up and off the
 * screen even though nothing about the sheet changed.
 *
 * vaul reads the first number and not the second — it never looks at
 * `visualViewport.offsetTop` — which is why a sheet it has "lifted above the
 * keyboard" still ends up too high, with a gap underneath it.
 */

// Several sheets can be open at once (a dialog over a drawer). One shared
// listener with a subscriber count keeps the values correct until the last one
// unmounts, instead of the first unmount clearing them for everyone.
let subscribers = 0;
let detach: (() => void) | null = null;

function attach() {
  const viewport = window.visualViewport;
  if (!viewport) return;

  const root = document.documentElement;
  let frame = 0;

  const sync = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const inset = Math.max(0, window.innerHeight - viewport.height);
      const shift = Math.max(0, viewport.offsetTop);
      root.style.setProperty("--keyboard-inset", `${Math.round(inset)}px`);
      root.style.setProperty("--viewport-shift", `${Math.round(shift)}px`);
    });
  };

  sync();
  // `scroll` is the one that fires for the shift; `resize` for the inset.
  viewport.addEventListener("resize", sync);
  viewport.addEventListener("scroll", sync);

  detach = () => {
    cancelAnimationFrame(frame);
    viewport.removeEventListener("resize", sync);
    viewport.removeEventListener("scroll", sync);
    root.style.removeProperty("--keyboard-inset");
    root.style.removeProperty("--viewport-shift");
    detach = null;
  };
}

export function useKeyboardInset() {
  useEffect(() => {
    if (subscribers === 0) attach();
    subscribers += 1;
    return () => {
      subscribers -= 1;
      if (subscribers === 0) detach?.();
    };
  }, []);
}
