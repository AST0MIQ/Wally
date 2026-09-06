// Temporary visual QA fixture; removed before delivery.
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { AppShell } from "@/components/nav/app-shell";
import type { DashboardData } from "@/server/services/dashboard.service";
export default async function Preview({ searchParams }: { searchParams: Promise<{ zero?: string }> }) {
  const zero = (await searchParams).zero;
  const accounts = [{ id: "bank", name: "Everyday account", icon: "🏦", color: "#2563eb", currency: "THB", balanceNative: "84500", balanceBase: "84500" }, { id: "savings", name: "Rainy day savings", icon: "🌱", color: "#059669", currency: "THB", balanceNative: "40000", balanceBase: "40000" }];
  const data: DashboardData = {
    baseCurrency: "THB",
    netWorth: { baseCurrency: "THB", asOf: new Date().toISOString(), totalCash: "124500", totalInvestment: "38450", netWorth: "162950", approx: false, accounts, portfolios: [{ id: "portfolio", name: "Long-term investments", marketValueBase: "38450", costBase: "35000", unrealizedBase: "3450" }] },
    thisMonth: { income: "42000", expense: "27850", net: "14150" },
    lastMonth: zero ? { income: "0", expense: "0", net: "0" } : { income: "38750", expense: "29070", net: "9680" },
    expenseByCategory: ["Food & drinks", "Housing", "Shopping", "Transport"].map((name, i) => ({ categoryId: name, name, systemKey: null, icon: ["☕","🏠","🛍️","🚗"][i]!, color: ["#f97316","#14b8a6","#8b5cf6","#3b82f6"][i]!, amount: ["12500","7200","5150","3000"][i]!, pct: [45,26,18,11][i]! })),
    incomeExpense: [], netWorthHistory: [],
    recent: ["Coffee with friends", "Weekly groceries", "September salary", "Train to work"].map((description, i) => ({ id: String(i), type: i === 2 ? "INCOME" : "EXPENSE", date: "2026-09-05T10:00:00Z", createdAt: "2026-09-05T10:00:00Z", amount: ["160","1450","42000","65"][i]!, currency: "THB", accountId: "bank", accountName: "Everyday account", accountIcon: "🏦", categoryId: "food", categoryName: i === 2 ? "Salary" : "Food & drinks", categorySystemKey: null, categoryIcon: i === 2 ? "💰" : "☕", categoryColor: "#f97316", subcategoryId: null, subcategoryName: null, subcategorySystemKey: null, description, note: null })),
  };
  return <AppShell role="USER" email="alex@example.com" accounts={[]} categories={[]}><DashboardView data={data} firstName="Alex" /></AppShell>;
}
