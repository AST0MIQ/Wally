"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Shield, Plus, Download, Wallet, Share2, SquarePlus, ScrollText } from "lucide-react";

import { cn } from "@/lib/utils";
import { PRIMARY_NAV } from "@/components/nav/nav-items";
import { LanguageSwitcher } from "@/components/nav/language-switcher";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuickAdd } from "@/components/transactions/quick-add-provider";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { APP_VERSION } from "@/lib/version";
import { markPatchNotesSeen } from "@/app/actions/preferences";

/** Shared nav body used by the desktop sidebar and the mobile drawer. */
export function SidebarNav({
  role,
  email,
  lastSeenVersion,
  onNavigate,
  onPatchNotesSeen,
}: {
  role: "USER" | "ADMIN";
  email?: string | null;
  lastSeenVersion: string;
  onNavigate?: () => void;
  onPatchNotesSeen?: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tp = useTranslations("pwa");
  const { open: openQuickAdd } = useQuickAdd();
  const { available: canInstall, installed, promptInstall } = usePwaInstall();
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const [hasUnreadPatchNotes, setHasUnreadPatchNotes] = useState(lastSeenVersion !== APP_VERSION);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:translate-x-0.5 hover:bg-muted/70 hover:text-foreground",
    );

  return (
    <div className="flex h-full flex-col gap-1 overflow-y-auto px-4 py-7">
      <Link href="/dashboard" onClick={onNavigate} className="mb-6 flex items-center gap-3 px-2"><span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white"><Wallet className="size-5" /></span><span className="text-2xl font-bold tracking-tight">Wally<span className="text-primary">.</span></span></Link>
      <a href="#main-content" className="sr-only focus:not-sr-only">{t("skipContent")}</a>

      <Button
        size="sm"
        className="mb-7 rounded-xl"
        data-tour="add-transaction"
        onClick={() => {
          onNavigate?.();
          openQuickAdd();
        }}
      >
        <Plus className="size-4" />
        {t("addTransaction")}
      </Button>

      <nav data-tour="primary-nav" className="flex flex-1 flex-col gap-1">
        {PRIMARY_NAV.map(({ href, labelKey, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            onClick={onNavigate}
            className={linkClass(isActive(href))}
          >
            <Icon className="size-4 shrink-0" />
            {t(labelKey)}
          </Link>
        ))}

        {role === "ADMIN" && (
          <Link
            href="/admin"
            aria-current={isActive("/admin") ? "page" : undefined}
            onClick={onNavigate}
            className={linkClass(isActive("/admin"))}
          >
            <Shield className="size-4 shrink-0" />
            {t("admin")}
          </Link>
        )}
        <Link
          href="/patch-notes"
          aria-current={isActive("/patch-notes") ? "page" : undefined}
          onClick={() => {
            setHasUnreadPatchNotes(false);
            onPatchNotesSeen?.();
            void markPatchNotesSeen();
            onNavigate?.();
          }}
          className={linkClass(isActive("/patch-notes"))}
        >
          <span className="relative">
            <ScrollText className="size-4" />
            {hasUnreadPatchNotes && <span className="absolute -right-1.5 -top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-card" />}
          </span>
          {t("patchNotes")}
        </Link>
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-border px-1 pt-4">
        {!installed && (
          <Button
            variant="secondary"
            size="sm"
            className="justify-start"
            onClick={() => {
              if (canInstall) {
                onNavigate?.();
                void promptInstall();
                return;
              }
              setInstallHelpOpen(true);
            }}
          >
            <Download className="size-4" />
            {tp("install")}
          </Button>
        )}
        <LanguageSwitcher />
        {email && (
          <p className="truncate px-2 text-xs text-muted-foreground">{email}</p>
        )}
        <SignOutButton />
        <p className="px-2 text-center text-[11px] text-muted-foreground/70">
          Wally v{APP_VERSION}
        </p>
      </div>

      <Dialog open={installHelpOpen} onOpenChange={setInstallHelpOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{tp("installTitle")}</DialogTitle>
            <DialogDescription>{tp("installDescription")}</DialogDescription>
          </DialogHeader>
          <ol className="grid gap-4 py-2 text-sm">
            <li className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Share2 className="size-4" />
              </span>
              <span className="pt-2">{tp("installStepShare")}</span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SquarePlus className="size-4" />
              </span>
              <span className="pt-2">{tp("installStepHome")}</span>
            </li>
          </ol>
          <DialogFooter>
            <DialogClose asChild>
              <Button>{tp("understood")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
