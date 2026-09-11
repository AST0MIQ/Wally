"use client";

import { useEffect } from "react";

/**
 * Publishes the on-screen keyboard's height as `--keyboard-inset` on the root
 * element. It is `0px` whenever the keyboard is closed, and on any browser
 * without the Visual Viewport API — so `var(--keyboard-inset, 0px)` is always
 * safe to use in a calc().
 *
 * Why this is needed: iOS never resizes the *layout* viewport when the keyboard
 * opens. It shrinks only the visual viewport and scrolls the page under it, so
 * `dvh`, `position: fixed` and `env(safe-area-inset-bottom)` all still measure
 * the full screen and nothing in CSS can tell the keyboard is there.
 */

// Several sheets can be open at once (a dialog over a drawer). One shared
// listener with a subscriber count keeps the value correct until the last one
// unmounts, instead of the first unmount clearing it for everyone.
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
      // What the layout viewport has that the visual one does not, less the
      // part already scrolled above it — i.e. the keyboard, and nothing else.
      const inset = window.innerHeight - viewport.height - viewport.offsetTop;
      root.style.setProperty(
        "--keyboard-inset",
        `${Math.max(0, Math.round(inset))}px`,
      );
    });
  };

  sync();
  viewport.addEventListener("resize", sync);
  viewport.addEventListener("scroll", sync);

  detach = () => {
    cancelAnimationFrame(frame);
    viewport.removeEventListener("resize", sync);
    viewport.removeEventListener("scroll", sync);
    root.style.removeProperty("--keyboard-inset");
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
