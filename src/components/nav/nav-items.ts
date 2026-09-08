import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  LineChart,
  BarChart3,
  Settings,
  Sparkles,
  UserRound,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  /** i18n key under the `nav` namespace */
  labelKey: string;
  icon: LucideIcon;
};

/** Full navigation — used by the desktop sidebar and the mobile drawer. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/transactions", labelKey: "transactions", icon: ArrowLeftRight },
  { href: "/accounts", labelKey: "accounts", icon: Wallet },
  { href: "/portfolio", labelKey: "portfolio", icon: LineChart },
  { href: "/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/cosmetics", labelKey: "cosmetics", icon: Sparkles },
  { href: "/shop", labelKey: "shop", icon: ShoppingBag },
  { href: "/profile", labelKey: "profile", icon: UserRound },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

/** Condensed set for the mobile bottom bar (the center "+" is added separately). */
export const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/accounts", labelKey: "accounts", icon: Wallet },
  { href: "/portfolio", labelKey: "portfolio", icon: LineChart },
  { href: "/profile", labelKey: "profile", icon: UserRound },
];
