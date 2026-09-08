"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Menu, Shield, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "@/components/admin/admin-nav";
import { Drawer, SideDrawerContent, DrawerTitle } from "@/components/ui/drawer";

function NavBody({ onNavigate, permissions }: { onNavigate?: () => void; permissions: readonly string[] }) {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-4 py-6">
      <Link
        href="/admin"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-2"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white">
          <Shield className="size-4" />
        </span>
        <span className="text-lg font-bold tracking-tight">
          Wally<span className="text-primary">.</span>
          <span className="ml-1 text-xs font-medium text-muted-foreground">
            {t("consoleTag")}
          </span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-4">
        {ADMIN_NAV.map((group) => ({
          ...group,
          items: group.items.filter((item) => !item.permission || permissions.includes(item.permission)),
        })).filter((group) => group.items.length > 0).map((group) => (
          <div key={group.labelKey} className="flex flex-col gap-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              {t(`groups.${group.labelKey}`)}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{t(item.labelKey)}</span>
                  {item.placeholder && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {t("soon")}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
      >
        <ArrowLeft className="size-4" />
        {t("backToApp")}
      </Link>
    </div>
  );
}

/** Admin Console shell — deliberately separate from the app AppShell: no
 *  QuickAdd, no bottom nav, no streak. */
export function AdminShell({
  email,
  permissions,
  children,
}: {
  email?: string | null;
  permissions: readonly string[];
  children: React.ReactNode;
}) {
  const t = useTranslations("admin.nav");
  const [open, setOpen] = useState(false);

  return (
    <div className="md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh border-r border-border bg-card md:block">
        <NavBody permissions={permissions} />
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-card/80 px-3 py-2.5 backdrop-blur md:px-8">
          <Drawer direction="left" open={open} onOpenChange={setOpen}>
            <button
              type="button"
              aria-label={t("menu")}
              onClick={() => setOpen(true)}
              className="flex size-9 items-center justify-center rounded-md hover:bg-muted md:hidden"
            >
              <Menu className="size-5" />
            </button>
            <SideDrawerContent side="left" className="w-72">
              <div className="flex items-center justify-between px-4 pt-4">
                <DrawerTitle className="text-sm font-semibold">
                  {t("consoleTag")}
                </DrawerTitle>
                <button
                  type="button"
                  aria-label={t("close")}
                  onClick={() => setOpen(false)}
                  className="flex size-8 items-center justify-center rounded-md hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>
              <NavBody permissions={permissions} onNavigate={() => setOpen(false)} />
            </SideDrawerContent>
          </Drawer>

          <span className="text-sm font-semibold md:hidden">
            {t("consoleTag")}
          </span>
          <span className="ml-auto truncate text-xs text-muted-foreground">
            {email}
          </span>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
