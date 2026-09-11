"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";
import { useKeyboardInset } from "@/hooks/use-keyboard-inset";

/**
 * vaul's own keyboard handling writes `bottom` and `height` as inline styles
 * from `visualViewport.height` alone — it never reads `visualViewport.offsetTop`,
 * so on iOS the sheet lands too high by exactly that offset. We turn it off and
 * position the sheet from both numbers in CSS instead (see `sheet-keyboard-safe`
 * in globals.css and src/hooks/use-keyboard-inset.ts). A caller can still opt
 * back in by passing `repositionInputs`.
 */
export function Drawer({
  repositionInputs = false,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root repositionInputs={repositionInputs} {...props} />;
}
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
          "glass fixed inset-x-0 z-50 mt-8 flex flex-col rounded-t-2xl border-t border-glass",
          // Owns `bottom`, `max-height` and the bottom padding, all three of
          // which depend on the keyboard — see globals.css.
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
