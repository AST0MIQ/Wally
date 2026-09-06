"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/toaster";

/**
 * Registers /sw.js and surfaces a "new version available" toast that lets the
 * user apply the update (SKIP_WAITING -> controllerchange -> reload).
 */
export function ServiceWorker() {
  const t = useTranslations("pwa");

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV === "development"
    ) {
      return;
    }

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        reg.addEventListener("updatefound", () => {
          const next = reg.installing;
          if (!next) return;
          next.addEventListener("statechange", () => {
            if (
              next.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              toast(t("updateAvailable"), {
                duration: Infinity,
                action: {
                  label: t("update"),
                  onClick: () => next.postMessage({ type: "SKIP_WAITING" }),
                },
              });
            }
          });
        });
      })
      .catch(() => {
        /* SW registration is best-effort */
      });
  }, [t]);

  return null;
}
