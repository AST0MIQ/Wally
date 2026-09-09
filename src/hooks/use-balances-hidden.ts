"use client";

import { useEffect, useState } from "react";

/**
 * Reactive read of the app-wide "hide amounts" switch. The toggle in the top
 * bar flips `data-balances="hidden"` on <html>; this subscribes to that so
 * client charts can drop amounts from tooltips and `title`/`aria-label`
 * attributes (which CSS `.balance-mask` can't reach).
 */
export function useBalancesHidden(): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = document.documentElement;
    const read = () => setHidden(el.getAttribute("data-balances") === "hidden");
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["data-balances"] });
    return () => mo.disconnect();
  }, []);

  return hidden;
}
