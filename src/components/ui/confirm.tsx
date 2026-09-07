"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ConfirmTone = "default" | "danger";

export type ConfirmOptions = {
  /** Main question — shown bold. */
  title: string;
  /** Optional supporting sentence. */
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** "danger" paints the confirm button red and adds a warning glyph. */
  tone?: ConfirmTone;
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

let notify: ((p: Pending) => void) | null = null;

/**
 * Themed replacement for `window.confirm`. Resolves `true` when the user
 * confirms, `false` on cancel / dismiss. Requires <ConfirmHost /> mounted once
 * (see root layout).
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (!notify) {
      resolve(false); // host not mounted — fail closed
      return;
    }
    notify({ ...options, resolve });
  });
}

export function ConfirmHost() {
  const t = useTranslations("common");
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    notify = (next) =>
      setPending((prev) => {
        prev?.resolve(false); // a new request supersedes an open one
        return next;
      });
    return () => {
      notify = null;
    };
  }, []);

  function settle(ok: boolean) {
    pending?.resolve(ok);
    setPending(null);
  }

  const danger = pending?.tone === "danger";

  return (
    <Dialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
    >
      {pending && (
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-start gap-3 pr-6">
              {danger && (
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-negative/10 text-negative">
                  <AlertTriangle className="size-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <DialogTitle>{pending.title}</DialogTitle>
                {pending.description && (
                  <DialogDescription className="mt-1.5">
                    {pending.description}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => settle(false)}>
              {pending.cancelText ?? t("cancel")}
            </Button>
            <Button
              variant={danger ? "destructive" : "primary"}
              onClick={() => settle(true)}
            >
              {pending.confirmText ?? t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
