"use client";

import { useEffect, useState } from "react";

import { APP_VERSION } from "@/lib/version";

export type RenderCtx = {
  scheme: "light" | "dark";
  appVersion: string;
};

/**
 * Client-side render context for cosmetic layers, resolved after mount to
 * avoid a hydration mismatch. Mirrors what `CosmeticRoot` computes on the
 * server (theme cookie -> scheme) so Preview and production agree.
 */
export function useRenderCtx(): RenderCtx {
  const [scheme, setScheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const attr = root.getAttribute("data-theme");
    if (attr === "dark") return setScheme("dark");
    if (attr === "light") return setScheme("light");
    // "system" — follow the OS
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setScheme(mql.matches ? "dark" : "light");
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  return { scheme, appVersion: APP_VERSION };
}
