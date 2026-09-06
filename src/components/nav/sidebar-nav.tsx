"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Shield, Plus, Download, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";
import { PRIMARY_NAV } from "@/components/nav/nav-items";
import { LanguageSwitcher } from "@/components/nav/language-switcher";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { useQuickAdd } from "@/components/transactions/quick-add-provider";
import { usePwaInstall } from "@/hooks/use-pwa-install";

/** Shared nav body used by the desktop sidebar and the mobile drawer. */
export function SidebarNav({
  role,
  email,
  onNavigate,
}: {
  role: "USER" | "ADMIN";
  email?: string | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tp = useTranslations("pwa");
  const { open: openQuickAdd } = useQuickAdd();
  const { available: canInstall, promptInstall } = usePwaInstall();

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
        onClick={() => {
          onNavigate?.();
          openQuickAdd();
        }}
      >
        <Plus className="size-4" />
        {t("addTransaction")}
      </Button>

      <nav className="flex flex-1 flex-col gap-1">
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
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-border px-1 pt-4">
        {canInstall && (
          <Button
            variant="secondary"
            size="sm"
            className="justify-start"
            onClick={() => {
              onNavigate?.();
              void promptInstall();
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
      </div>
    </div>
  );
}
