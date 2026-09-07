"use client";

import { useEffect, useState } from "react";
import { Toaster as SonnerToaster } from "sonner";

/** Keep sonner in sync with the app's theme (cookie override + system). */
function useAppTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const compute = () => {
      const attr = document.documentElement.dataset.theme;
      if (attr === "light" || attr === "dark") {
        setTheme(attr);
        return;
      }
      setTheme(mq.matches ? "dark" : "light");
    };
    compute();
    mq.addEventListener("change", compute);
    const observer = new MutationObserver(compute);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      mq.removeEventListener("change", compute);
      observer.disconnect();
    };
  }, []);

  return theme;
}

export function Toaster() {
  const theme = useAppTheme();

  return (
    <SonnerToaster
      theme={theme}
      position="top-center"
      mobileOffset={{
        top: "calc(env(safe-area-inset-top, 0px) + 1rem)",
        right: "max(env(safe-area-inset-right, 0px), 1rem)",
        left: "max(env(safe-area-inset-left, 0px), 1rem)",
      }}
      toastOptions={{
        classNames: {
          toast:
            "glass rounded-xl border border-glass text-popover-foreground text-sm",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
          success: "[&_[data-icon]]:text-positive",
          error: "[&_[data-icon]]:text-negative",
        },
      }}
      style={
        {
          "--normal-bg": "var(--glass-bg)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--glass-border)",
        } as React.CSSProperties
      }
    />
  );
}

export { toast } from "sonner";
