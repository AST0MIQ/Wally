"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { BOTTOM_NAV } from "@/components/nav/nav-items";
import { useQuickAdd } from "@/components/transactions/quick-add-provider";

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { open: openQuickAdd } = useQuickAdd();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      className={cn(
        "fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-border/80 bg-card/90 shadow-[0_18px_45px_-18px_rgb(15_23_42_/_0.45)] backdrop-blur-xl",
        "mb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      <ul className="mx-auto flex max-w-lg items-center justify-around px-2">
        {BOTTOM_NAV.slice(0, 2).map((item) => (
          <NavCell key={item.href} item={item} active={isActive(item.href)} label={t(item.labelKey)} />
        ))}

        <li className="flex-1">
          <button
            type="button"
            onClick={() => openQuickAdd()}
            aria-label={t("addTransaction")}
            className="mx-auto flex size-13 -translate-y-3 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_24px_-8px_var(--primary)] transition-all duration-200 active:scale-95"
          >
            <Plus className="size-6" />
          </button>
        </li>

        {BOTTOM_NAV.slice(2).map((item) => (
          <NavCell key={item.href} item={item} active={isActive(item.href)} label={t(item.labelKey)} />
        ))}
      </ul>
    </nav>
  );
}

function NavCell({
  item,
  active,
  label,
}: {
  item: (typeof BOTTOM_NAV)[number];
  active: boolean;
  label: string;
}) {
  const { href, icon: Icon } = item;
  return (
    <li className="flex-1">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-16 flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors duration-200",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="size-5" />
        {label}
      </Link>
    </li>
  );
}
