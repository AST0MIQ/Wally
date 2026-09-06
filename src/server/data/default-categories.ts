/**
 * Default category set seeded for every new user (see docs/ARCHITECTURE.md §2 review answer).
 *
 * `key` doubles as:
 *   - the `systemKey` stored on the row, and
 *   - the i18n message key under `categories.*` (so the label follows the UI language).
 *
 * Users can freely rename / delete / re-icon / re-color these afterwards.
 */

export type DefaultSubcategory = {
  key: string;
  icon: string;
};

export type DefaultCategory = {
  key: string;
  kind: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  subcategories: DefaultSubcategory[];
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // ── EXPENSE ────────────────────────────────────────────────
  {
    key: "food",
    kind: "EXPENSE",
    icon: "🍜",
    color: "#F97316",
    subcategories: [
      { key: "groceries", icon: "🛒" },
      { key: "restaurant", icon: "🍽️" },
      { key: "delivery", icon: "🛵" },
      { key: "coffee_drinks", icon: "☕" },
    ],
  },
  {
    key: "transport",
    kind: "EXPENSE",
    icon: "🚗",
    color: "#0EA5E9",
    subcategories: [
      { key: "fuel", icon: "⛽" },
      { key: "taxi", icon: "🚕" },
      { key: "public_transport", icon: "🚌" },
      { key: "parking", icon: "🅿️" },
      { key: "tolls", icon: "🛣️" },
    ],
  },
  {
    key: "housing",
    kind: "EXPENSE",
    icon: "🏠",
    color: "#8B5CF6",
    subcategories: [
      { key: "rent_mortgage", icon: "🔑" },
      { key: "utilities", icon: "💡" },
      { key: "internet_phone", icon: "🌐" },
      { key: "maintenance", icon: "🔧" },
    ],
  },
  {
    key: "shopping",
    kind: "EXPENSE",
    icon: "🛍️",
    color: "#EC4899",
    subcategories: [
      { key: "clothing", icon: "👕" },
      { key: "electronics", icon: "🔌" },
      { key: "household", icon: "🧴" },
    ],
  },
  {
    key: "entertainment",
    kind: "EXPENSE",
    icon: "🎮",
    color: "#6366F1",
    subcategories: [
      { key: "streaming", icon: "📺" },
      { key: "games", icon: "🎮" },
      { key: "movies_events", icon: "🎬" },
      { key: "hobbies", icon: "🎨" },
    ],
  },
  {
    key: "health",
    kind: "EXPENSE",
    icon: "🏥",
    color: "#10B981",
    subcategories: [
      { key: "medical", icon: "🩺" },
      { key: "pharmacy", icon: "💊" },
      { key: "fitness", icon: "🏋️" },
      { key: "insurance", icon: "🛡️" },
    ],
  },
  {
    key: "personal_care",
    kind: "EXPENSE",
    icon: "💇",
    color: "#14B8A6",
    subcategories: [
      { key: "haircut_beauty", icon: "💅" },
      { key: "cosmetics", icon: "💄" },
    ],
  },
  {
    key: "education",
    kind: "EXPENSE",
    icon: "📚",
    color: "#F59E0B",
    subcategories: [
      { key: "courses", icon: "🎓" },
      { key: "books", icon: "📖" },
    ],
  },
  {
    key: "bills_fees",
    kind: "EXPENSE",
    icon: "🧾",
    color: "#64748B",
    subcategories: [
      { key: "bank_fees", icon: "🏦" },
      { key: "taxes", icon: "🧾" },
      { key: "subscriptions", icon: "🔁" },
    ],
  },
  {
    key: "family_kids",
    kind: "EXPENSE",
    icon: "👨‍👩‍👧",
    color: "#EF4444",
    subcategories: [
      { key: "childcare", icon: "🧸" },
      { key: "allowance", icon: "💵" },
      { key: "pets", icon: "🐾" },
    ],
  },
  {
    key: "travel",
    kind: "EXPENSE",
    icon: "✈️",
    color: "#06B6D4",
    subcategories: [
      { key: "flights", icon: "🎫" },
      { key: "accommodation", icon: "🏨" },
      { key: "activities", icon: "🎡" },
    ],
  },
  {
    key: "gifts_donations",
    kind: "EXPENSE",
    icon: "🎁",
    color: "#D946EF",
    subcategories: [
      { key: "gifts", icon: "🎁" },
      { key: "charity", icon: "❤️" },
    ],
  },
  {
    key: "other_expense",
    kind: "EXPENSE",
    icon: "📦",
    color: "#94A3B8",
    subcategories: [],
  },

  // ── INCOME ─────────────────────────────────────────────────
  {
    key: "salary",
    kind: "INCOME",
    icon: "💰",
    color: "#22C55E",
    subcategories: [],
  },
  {
    key: "freelance",
    kind: "INCOME",
    icon: "💻",
    color: "#3B82F6",
    subcategories: [],
  },
  {
    key: "bonus",
    kind: "INCOME",
    icon: "🎯",
    color: "#F59E0B",
    subcategories: [],
  },
  {
    key: "investment_income",
    kind: "INCOME",
    icon: "📈",
    color: "#8B5CF6",
    subcategories: [
      { key: "dividends", icon: "💵" },
      { key: "interest", icon: "🪙" },
      { key: "capital_gains", icon: "📊" },
    ],
  },
  {
    key: "business",
    kind: "INCOME",
    icon: "🏪",
    color: "#0EA5E9",
    subcategories: [],
  },
  {
    key: "rental_income",
    kind: "INCOME",
    icon: "🔑",
    color: "#14B8A6",
    subcategories: [],
  },
  {
    key: "refunds",
    kind: "INCOME",
    icon: "↩️",
    color: "#64748B",
    subcategories: [],
  },
  {
    key: "other_income",
    kind: "INCOME",
    icon: "📦",
    color: "#94A3B8",
    subcategories: [],
  },
];
