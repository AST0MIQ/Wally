import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  LineChart,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  /** i18n key under the `nav` namespace */
  labelKey: string;
  icon: LucideIcon;
};

/** Full navigation — used by the desktop sidebar. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/transactions", labelKey: "transactions", icon: ArrowLeftRight },
  { href: "/accounts", labelKey: "accounts", icon: Wallet },
  { href: "/portfolio", labelKey: "portfolio", icon: LineChart },
  { href: "/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

/** Condensed set for the mobile bottom bar (the center "+" is added separately). */
export const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/accounts", labelKey: "accounts", icon: Wallet },
  { href: "/portfolio", labelKey: "portfolio", icon: LineChart },
  { href: "/settings", labelKey: "settings", icon: Settings },
];
