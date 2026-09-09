"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ChevronLeft, ChevronRight, Menu, Shield, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "@/components/admin/admin-nav";
import { Drawer, SideDrawerContent, DrawerTitle } from "@/components/ui/drawer";

function visibleAdminNav(permissions: readonly string[]) {
  return ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || permissions.includes(item.permission)),
  })).filter((group) => group.items.length > 0);
}

function isItemActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function TwoLevelNav({
  email,
  expanded = true,
  onExpandedChange,
  onNavigate,
  permissions,
}: {
  email?: string | null;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onNavigate?: () => void;
  permissions: readonly string[];
}) {
  const pathname = usePathname();
  const t = useTranslations("admin.nav");
  const groups = visibleAdminNav(permissions);
  const activeGroup = groups.find((group) => group.items.some((item) => isItemActive(pathname, item.href))) ?? groups[0];

  if (!activeGroup) return null;
  const activeItemHref = activeGroup.items
    .filter((item) => isItemActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <div className="flex h-full min-h-0 bg-card">
      <div className="flex w-[68px] shrink-0 flex-col items-center border-r border-border/80 px-2 py-5">
        <Link href="/admin" onClick={onNavigate} aria-label={t("consoleTag")} title={t("consoleTag")} className="mb-7 flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
          <Shield className="size-5" />
        </Link>
        <nav aria-label={t("categories")} className="flex w-full flex-1 flex-col items-center gap-2">
          {groups.map((group) => {
            const Icon = group.icon;
            const active = group.labelKey === activeGroup.labelKey;
            return <Link
              key={group.labelKey}
              href={group.items[0]!.href}
              onClick={() => onExpandedChange?.(true)}
              aria-label={t(`groups.${group.labelKey}`)}
              aria-current={active ? "page" : undefined}
              title={t(`groups.${group.labelKey}`)}
              className={cn("flex size-11 items-center justify-center rounded-xl transition-colors", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
            >
              <Icon className="size-5" />
            </Link>;
          })}
        </nav>
        <Link href="/dashboard" onClick={onNavigate} aria-label={t("backToApp")} title={t("backToApp")} className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
      </div>

      {expanded && <div className="flex min-w-0 flex-1 flex-col px-3 py-5">
        <div className="mb-5 flex min-h-10 items-center gap-2 px-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-muted-foreground">{t("consoleTag")}</p>
            <h2 className="truncate text-base font-semibold">{t(`groups.${activeGroup.labelKey}`)}</h2>
          </div>
          {onExpandedChange && <button type="button" onClick={() => onExpandedChange(false)} aria-label={t("collapse")} title={t("collapse")} className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <ChevronLeft className="size-4" />
          </button>}
        </div>

        <nav aria-label={t(`groups.${activeGroup.labelKey}`)} className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {activeGroup.items.map((item) => {
              const Icon = item.icon;
              const active = item.href === activeItemHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
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
        </nav>

        <div className="mt-4 border-t border-border pt-4">
          <p className="truncate px-2 text-xs font-medium">{email}</p>
          <Link href="/dashboard" onClick={onNavigate} className="mt-2 flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            <ArrowLeft className="size-4" />{t("backToApp")}
          </Link>
        </div>
      </div>}

      {!expanded && onExpandedChange && <button type="button" onClick={() => onExpandedChange(true)} aria-label={t("expand")} title={t("expand")} className="absolute bottom-5 left-[76px] hidden size-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground md:flex">
        <ChevronRight className="size-4" />
      </button>}
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
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={cn("md:grid", expanded ? "md:grid-cols-[292px_minmax(0,1fr)]" : "md:grid-cols-[68px_minmax(0,1fr)]")}>
      <aside className="relative sticky top-0 hidden h-dvh border-r border-border bg-card md:block">
        <TwoLevelNav email={email} permissions={permissions} expanded={expanded} onExpandedChange={setExpanded} />
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
            <SideDrawerContent side="left" className="w-[min(22rem,calc(100vw-1rem))] p-0">
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
              <div className="min-h-0 flex-1 pt-2">
                <TwoLevelNav email={email} permissions={permissions} onNavigate={() => setOpen(false)} />
              </div>
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
