"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";
import { useKeyboardInset } from "@/hooks/use-keyboard-inset";

export const Drawer = DrawerPrimitive.Root;
export const DrawerTrigger = DrawerPrimitive.Trigger;
export const DrawerClose = DrawerPrimitive.Close;
export const DrawerTitle = DrawerPrimitive.Title;
export const DrawerDescription = DrawerPrimitive.Description;

export function DrawerContent({
  className,
  children,
  footer,
  ...props
}: React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & { footer?: React.ReactNode }) {
  useKeyboardInset();
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/45" />
      <DrawerPrimitive.Content
        className={cn(
          "glass fixed inset-x-0 bottom-0 z-50 mt-8 flex flex-col rounded-t-2xl border-t border-glass",
          // Height cap + bottom padding both depend on the keyboard, so they
          // live together in one class — see globals.css.
          "sheet-keyboard-safe",
          className,
        )}
        {...props}
      >
        <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/40" />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">{children}</div>
        {footer && <div className="shrink-0 border-t border-glass px-5 py-4">{footer}</div>}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
}

/** Left-edge drawer (mobile navigation). Use with <Drawer direction="left">. */
export function SideDrawerContent({
  className,
  children,
  side = "left",
  ...props
}: React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
  side?: "left" | "right";
}) {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/45" />
      <DrawerPrimitive.Content
        className={cn(
          "glass fixed inset-y-0 z-50 flex w-[82%] max-w-xs flex-col border-glass",
          side === "right" ? "right-0 border-l" : "left-0 border-r",
          className,
        )}
        {...props}
      >
        {children}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
}
