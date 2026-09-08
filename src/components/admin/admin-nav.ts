import {
  LayoutDashboard,
  Palette,
  Layers,
  Box,
  FlaskConical,
  Image as ImageIcon,
  Gift,
  Flame,
  Users,
  Ticket,
  Boxes,
  ShoppingBag,
  Receipt,
  Flag,
  Settings2,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  labelKey: string; // under the `admin.nav` namespace
  icon: LucideIcon;
  /** show a "Phase 2" pill */
  placeholder?: boolean;
};

export type AdminNavGroup = {
  labelKey: string; // under `admin.nav.groups`
  items: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    labelKey: "overview",
    items: [{ href: "/admin", labelKey: "overview", icon: LayoutDashboard }],
  },
  {
    labelKey: "appearance",
    items: [
      { href: "/admin/appearance/collections", labelKey: "collections", icon: Layers },
      { href: "/admin/appearance/assets", labelKey: "assets", icon: Box },
      { href: "/admin/appearance/studio", labelKey: "studio", icon: Palette },
      { href: "/admin/appearance/preview", labelKey: "previewLab", icon: FlaskConical },
      { href: "/admin/appearance/media", labelKey: "media", icon: ImageIcon, placeholder: true },
    ],
  },
  {
    labelKey: "rewards",
    items: [
      { href: "/admin/rewards/rules", labelKey: "rewardRules", icon: Gift },
      { href: "/admin/rewards/rank-streak", labelKey: "rankStreak", icon: Flame },
    ],
  },
  {
    labelKey: "users",
    items: [
      { href: "/admin/users", labelKey: "userDirectory", icon: Users },
      { href: "/admin/users/entitlements", labelKey: "entitlements", icon: Ticket },
      { href: "/admin/users/loadouts", labelKey: "loadouts", icon: Boxes },
    ],
  },
  {
    labelKey: "commerce",
    items: [
      { href: "/admin/commerce/products", labelKey: "products", icon: ShoppingBag, placeholder: true },
      { href: "/admin/commerce/orders", labelKey: "orders", icon: Receipt, placeholder: true },
    ],
  },
  {
    labelKey: "operations",
    items: [
      { href: "/admin/operations/flags", labelKey: "featureFlags", icon: Flag, placeholder: true },
      { href: "/admin/operations/config", labelKey: "appConfig", icon: Settings2, placeholder: true },
      { href: "/admin/operations/audit", labelKey: "auditLogs", icon: ScrollText },
    ],
  },
];
