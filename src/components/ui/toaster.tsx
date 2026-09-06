"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "rounded-md border border-border bg-card text-card-foreground text-sm shadow-lg",
        },
      }}
    />
  );
}

export { toast } from "sonner";
