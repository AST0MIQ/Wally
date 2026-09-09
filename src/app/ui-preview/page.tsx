// Temporary visual QA fixture; removed before delivery.
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { AdminShell } from "@/components/admin/admin-shell";
import { AppShell } from "@/components/nav/app-shell";
import { PERMISSION_KEYS } from "@/lib/rbac/catalogue";
import type { DashboardData } from "@/server/services/dashboard.service";
export default async function Preview({ searchParams }: { searchParams: Promise<{ zero?: string; view?: string }> }) {
  const params = await searchParams;
  if (params.view === "admin") {
    return <AdminShell email="admin@example.com" permissions={PERMISSION_KEYS}>
      <section className="space-y-3">
        <p className="text-sm font-medium text-primary">Admin navigation preview</p>
        <h1 className="text-3xl font-bold tracking-tight">ภาพรวมผู้ดูแล</h1>
        <p className="max-w-xl text-muted-foreground">เลือกหมวดจากแถบไอคอนด้านซ้าย แล้วเลือกหน้าที่ต้องการจากเมนูระดับสอง</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {["ผู้ใช้ทั้งหมด", "ไอเทมที่เผยแพร่", "รางวัลที่มอบแล้ว"].map((label, index) => <div key={label} className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{[128, 24, 356][index]}</p></div>)}
        </div>
      </section>
    </AdminShell>;
  }
  const zero = params.zero;
  const accounts = [{ id: "bank", name: "Everyday account", icon: "🏦", color: "#2563eb", currency: "THB", balanceNative: "84500", balanceBase: "84500" }, { id: "savings", name: "Rainy day savings", icon: "🌱", color: "#059669", currency: "THB", balanceNative: "40000", balanceBase: "40000" }];
  const data: DashboardData = {
    baseCurrency: "THB",
    netWorth: { baseCurrency: "THB", asOf: new Date().toISOString(), totalCash: "124500", totalInvestment: "38450", netWorth: "162950", approx: false, accounts, portfolios: [{ id: "portfolio", name: "Long-term investments", marketValueBase: "38450", costBase: "35000", unrealizedBase: "3450" }] },
    thisMonth: { income: "42000", expense: "27850", net: "14150" },
    lastMonth: zero ? { income: "0", expense: "0", net: "0" } : { income: "38750", expense: "29070", net: "9680" },
    expenseByCategory: ["Food & drinks", "Housing", "Shopping", "Transport"].map((name, i) => ({ categoryId: name, name, systemKey: null, icon: ["☕","🏠","🛍️","🚗"][i]!, color: ["#f97316","#14b8a6","#8b5cf6","#3b82f6"][i]!, amount: ["12500","7200","5150","3000"][i]!, pct: [45,26,18,11][i]! })),
    incomeExpense: [], netWorthHistory: [],
    recentTransactions: [
      { type: "EXPENSE", id: "preview-expense", date: new Date().toISOString(), createdAt: new Date().toISOString(), amount: "850", currency: "THB", accountId: "bank", accountName: "Everyday account", accountIcon: "🏦", categoryId: "food", categoryName: "Food & drinks", categorySystemKey: null, categoryIcon: "☕", categoryColor: "#f97316", subcategoryId: null, subcategoryName: null, subcategorySystemKey: null, description: "Lunch", note: null },
      { type: "INCOME", id: "preview-income", date: new Date().toISOString(), createdAt: new Date().toISOString(), amount: "42000", currency: "THB", accountId: "bank", accountName: "Everyday account", accountIcon: "🏦", categoryId: "salary", categoryName: "Salary", categorySystemKey: null, categoryIcon: "💼", categoryColor: "#10b981", subcategoryId: null, subcategoryName: null, subcategorySystemKey: null, description: "Salary", note: null },
    ],
  };
  return <AppShell role="USER" email="alex@example.com" lastSeenVersion="1.0.0" accounts={[]} categories={[]}><DashboardView data={data} firstName="Alex" /></AppShell>;
}
