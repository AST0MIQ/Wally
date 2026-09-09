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
  ShieldCheck,
  KeyRound,
  UserCog,
  MailPlus,
  ShoppingBag,
  Receipt,
  Flag,
  Settings2,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import type { PermissionKey } from "@/lib/rbac/catalogue";

export type AdminNavItem = {
  href: string;
  labelKey: string; // under the `admin.nav` namespace
  icon: LucideIcon;
  permission?: PermissionKey;
  /** show a "Phase 2" pill */
  placeholder?: boolean;
};

export type AdminNavGroup = {
  labelKey: string; // under `admin.nav.groups`
  icon: LucideIcon;
  items: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    labelKey: "overview",
    icon: LayoutDashboard,
    items: [{ href: "/admin", labelKey: "overview", icon: LayoutDashboard }],
  },
  {
    labelKey: "appearance",
    icon: Palette,
    items: [
      { href: "/admin/appearance/collections", labelKey: "collections", icon: Layers, permission: "collections.read" },
      { href: "/admin/appearance/assets", labelKey: "assets", icon: Box, permission: "assets.read" },
      { href: "/admin/appearance/studio", labelKey: "studio", icon: Palette, permission: "assets.write" },
      { href: "/admin/appearance/preview", labelKey: "previewLab", icon: FlaskConical, permission: "assets.read" },
      { href: "/admin/appearance/media", labelKey: "media", icon: ImageIcon, permission: "assets.write" },
    ],
  },
  {
    labelKey: "rewards",
    icon: Gift,
    items: [
      { href: "/admin/rewards/rules", labelKey: "rewardRules", icon: Gift, permission: "rewards.read" },
      { href: "/admin/rewards/rank-streak", labelKey: "rankStreak", icon: Flame, permission: "users.read" },
    ],
  },
  {
    labelKey: "users",
    icon: Users,
    items: [
      { href: "/admin/users", labelKey: "userDirectory", icon: Users, permission: "users.read" },
      { href: "/admin/users/entitlements", labelKey: "entitlements", icon: Ticket, permission: "entitlements.read" },
      { href: "/admin/users/loadouts", labelKey: "loadouts", icon: Boxes, permission: "entitlements.read" },
    ],
  },
  {
    labelKey: "access",
    icon: ShieldCheck,
    items: [
      { href: "/admin/access/users", labelKey: "accessUsers", icon: UserCog, permission: "roles.read" },
      { href: "/admin/access/roles", labelKey: "accessRoles", icon: ShieldCheck, permission: "roles.read" },
      { href: "/admin/access/permissions", labelKey: "accessPermissions", icon: KeyRound, permission: "roles.read" },
      { href: "/admin/access/invitations", labelKey: "accessInvitations", icon: MailPlus, permission: "roles.read", placeholder: true },
    ],
  },
  {
    labelKey: "commerce",
    icon: ShoppingBag,
    items: [
      { href: "/admin/commerce/products", labelKey: "products", icon: ShoppingBag, permission: "commerce.read" },
      { href: "/admin/commerce/orders", labelKey: "orders", icon: Receipt, permission: "commerce.read" },
    ],
  },
  {
    labelKey: "operations",
    icon: Settings2,
    items: [
      { href: "/admin/operations/flags", labelKey: "featureFlags", icon: Flag, permission: "settings.read" },
      { href: "/admin/operations/config", labelKey: "appConfig", icon: Settings2, permission: "settings.read" },
      { href: "/admin/operations/audit", labelKey: "auditLogs", icon: ScrollText, permission: "audit.read" },
    ],
  },
];
