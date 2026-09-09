/**
 * LOCAL ONLY — fill a user's account with realistic-looking finance data so
 * the dashboard, analytics and portfolio charts have something to show.
 *
 *   pnpm mock:finance <email> [--days=90] [--reset] [--force]
 *
 *   --days     how far back to generate (default 90)
 *   --reset    wipe the user's existing finance data first (accounts,
 *              transactions, transfers, investments, net-worth snapshots)
 *   --force    run even if DATABASE_URL doesn't look like localhost
 *
 * Everything is THB so no FX rates are needed. After generating rows it
 * rebuilds the daily net-worth snapshots that feed the trend line.
 */
import { PrismaClient } from "@prisma/client";

import { seedUserDefaults } from "../src/server/services/onboarding";
import { backfillNetWorthSnapshots } from "../src/server/lib/networth";

const prisma = new PrismaClient();

// ── args ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const email = argv.find((a) => !a.startsWith("--"));
const days = Number(
  (argv.find((a) => a.startsWith("--days=")) ?? "--days=90").split("=")[1],
);
const doReset = argv.includes("--reset");
const force = argv.includes("--force");

function bail(msg: string): never {
  console.error(`[mock:finance] ${msg}`);
  process.exit(1);
}

// ── deterministic PRNG so re-runs produce the same picture ──────────────────
let _seed = 0x9e3779b9;
function rand(): number {
  _seed |= 0;
  _seed = (_seed + 0x6d2b79f5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (lo: number, hi: number) => lo + rand() * (hi - lo);
const money = (lo: number, hi: number) => Math.round(between(lo, hi) * 100) / 100;
const chance = (p: number) => rand() < p;
const pick = <T,>(xs: T[]): T => xs[Math.floor(rand() * xs.length)]!;

const DAY = 86_400_000;
const dayFloorUTC = (d: Date) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

async function main() {
  if (!email) bail("usage: pnpm mock:finance <email> [--days=90] [--reset]");
  if (process.env.NODE_ENV === "production")
    bail("refusing to run with NODE_ENV=production");

  const dbUrl = process.env.DATABASE_URL ?? "";
  if (!/(localhost|127\.0\.0\.1|::1)/.test(dbUrl) && !force)
    bail("DATABASE_URL is not localhost — pass --force if you really mean it");
  if (!Number.isFinite(days) || days < 7 || days > 730)
    bail("--days must be between 7 and 730");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) bail(`no user with email ${email}`);

  console.log(`[mock:finance] user ${user.email} · ${days} days · reset=${doReset}`);
  if (user.baseCurrency !== "THB")
    console.warn(
      `[mock:finance] note: base currency is ${user.baseCurrency}; mock data is THB, ` +
        `so totals need FX rates (run pnpm fx:backfill) or set base to THB in Settings.`,
    );

  await seedUserDefaults(user.id);

  if (doReset) {
    await prisma.investmentTransaction.deleteMany({ where: { userId: user.id } });
    await prisma.portfolio.deleteMany({ where: { userId: user.id } });
    await prisma.transfer.deleteMany({ where: { userId: user.id } });
    await prisma.transaction.deleteMany({ where: { userId: user.id } });
    await prisma.netWorthSnapshot.deleteMany({ where: { userId: user.id } });
    await prisma.financeAccount.deleteMany({ where: { userId: user.id } });
    console.log("[mock:finance] wiped existing finance data");
  }

  // ── categories (systemKey → { id, subs }) ────────────────────────────────
  const cats = await prisma.category.findMany({
    where: { userId: user.id },
    include: { subcategories: true },
  });
  const cat = (key: string) => {
    const c = cats.find((x) => x.systemKey === key);
    if (!c) bail(`missing default category "${key}" — sign in once to seed them`);
    return c;
  };
  const subId = (key: string) => {
    const subs = cat(key).subcategories;
    return subs.length ? pick(subs).id : null;
  };

  const start = dayFloorUTC(new Date(Date.now() - days * DAY));

  // ── accounts ────────────────────────────────────────────────────────────
  const mk = (
    name: string,
    type: "CASH" | "BANK" | "SAVINGS" | "EWALLET" | "INVESTMENT",
    opening: number,
    icon: string,
    sortOrder: number,
  ) =>
    prisma.financeAccount.create({
      data: {
        userId: user.id,
        name,
        type,
        currency: "THB",
        openingBalance: opening,
        openingBalanceDate: start,
        icon,
        sortOrder,
        status: "ACTIVE",
      },
    });

  const cash = await mk("เงินสด", "CASH", 4_000, "💵", 0);
  const bank = await mk("กสิกร (เดินสะพัด)", "BANK", 68_000, "🏦", 1);
  const savings = await mk("SCB ออมทรัพย์", "SAVINGS", 220_000, "🐷", 2);
  const wallet = await mk("TrueMoney", "EWALLET", 900, "📱", 3);
  const invAcct = await mk("พอร์ตลงทุน", "INVESTMENT", 0, "📈", 4);

  // ── day-by-day transactions ─────────────────────────────────────────────
  type TxRow = {
    userId: string;
    kind: "INCOME" | "EXPENSE";
    amount: number;
    currency: string;
    accountId: string;
    categoryId: string;
    subcategoryId: string | null;
    date: Date;
    description: string;
    source: "MANUAL";
  };
  const txns: TxRow[] = [];
  const transfers: {
    userId: string;
    fromAccountId: string;
    toAccountId: string;
    fromAmount: number;
    toAmount: number;
    fromCurrency: string;
    toCurrency: string;
    date: Date;
    note: string;
  }[] = [];

  const add = (
    kind: "INCOME" | "EXPENSE",
    key: string,
    accountId: string,
    amount: number,
    date: Date,
    description: string,
  ) =>
    txns.push({
      userId: user.id,
      kind,
      amount,
      currency: "THB",
      accountId,
      categoryId: cat(key).id,
      subcategoryId: subId(key),
      date,
      description,
      source: "MANUAL",
    });

  const at = (base: Date, h: number, m: number) =>
    new Date(base.getTime() + h * 3_600_000 + m * 60_000);

  for (let i = 0; i <= days; i += 1) {
    const d = new Date(start.getTime() + i * DAY);
    const dom = d.getUTCDate();
    const dow = d.getUTCDay(); // 0 Sun … 6 Sat
    const weekend = dow === 0 || dow === 6;

    if (dom === 25) add("INCOME", "salary", bank.id, money(58_000, 72_000), at(d, 9, 12), "เงินเดือน");
    if (dom === 1) add("EXPENSE", "housing", bank.id, 12_000, at(d, 8, 0), "ค่าเช่าห้อง");
    if (dom === 6) add("EXPENSE", "housing", bank.id, money(1_400, 2_300), at(d, 19, 30), "ค่าน้ำค่าไฟ");
    if (dom === 10) add("EXPENSE", "bills_fees", bank.id, 359, at(d, 12, 0), "ค่าสมัครสมาชิก");
    if (dom === 15) add("EXPENSE", "bills_fees", bank.id, money(500, 900), at(d, 12, 5), "ค่าเน็ต/มือถือ");

    if (dom === 5) {
      const amt = 10_000;
      transfers.push({
        userId: user.id,
        fromAccountId: bank.id,
        toAccountId: savings.id,
        fromAmount: amt,
        toAmount: amt,
        fromCurrency: "THB",
        toCurrency: "THB",
        date: at(d, 9, 30),
        note: "ออมประจำเดือน",
      });
    }

    if (dow === 0) add("EXPENSE", "food", bank.id, money(700, 1_900), at(d, 11, 0), "ซื้อของเข้าบ้าน");
    if (chance(0.85)) add("EXPENSE", "food", chance(0.5) ? cash.id : wallet.id, money(60, 380), at(d, 12, 30), "มื้อกลางวัน");
    if (chance(0.45)) add("EXPENSE", "food", cash.id, money(55, 170), at(d, 15, 0), "กาแฟ/ของว่าง");
    if (chance(0.6)) add("EXPENSE", "transport", chance(0.5) ? cash.id : wallet.id, money(30, 260), at(d, 8, 40), "เดินทาง");
    if (chance(0.12)) add("EXPENSE", "transport", bank.id, money(700, 1_400), at(d, 18, 0), "เติมน้ำมัน");
    if (weekend && chance(0.4)) add("EXPENSE", "entertainment", chance(0.5) ? bank.id : wallet.id, money(150, 950), at(d, 20, 0), "สังสรรค์");
    if (chance(0.08)) add("EXPENSE", "shopping", bank.id, money(350, 3_800), at(d, 17, 20), "ช้อปปิ้ง");
    if (chance(0.04)) add("EXPENSE", "health", bank.id, money(220, 1_600), at(d, 16, 0), "สุขภาพ");
    if (chance(0.05)) add("INCOME", "freelance", bank.id, money(2_500, 16_000), at(d, 21, 0), "งานฟรีแลนซ์");
  }

  await prisma.transaction.createMany({ data: txns });
  if (transfers.length) await prisma.transfer.createMany({ data: transfers });

  // ── investments (THB-priced, no FX) ─────────────────────────────────────
  const secDefs = [
    { symbol: "SET50", name: "SET50 Index Fund", type: "FUND" as const, p0: 420, vol: 0.012 },
    { symbol: "THDG", name: "Thai Gold 96.5%", type: "OTHER" as const, p0: 2_600, vol: 0.008 },
    { symbol: "BTCx", name: "Bitcoin (THB)", type: "CRYPTO" as const, p0: 2_150_000, vol: 0.03 },
  ];

  const portfolio = await prisma.portfolio.create({
    data: {
      userId: user.id,
      accountId: invAcct.id,
      name: "พอร์ตลงทุน",
      baseCurrency: "THB",
    },
  });

  let invCount = 0;
  let priceCount = 0;
  for (const s of secDefs) {
    const security = await prisma.security.upsert({
      where: { symbol_exchange: { symbol: s.symbol, exchange: "MOCK" } },
      update: { name: s.name, type: s.type, currency: "THB" },
      create: { symbol: s.symbol, exchange: "MOCK", name: s.name, type: s.type, currency: "THB" },
    });

    // random-walk daily closes
    const prices: { securityId: string; price: number; currency: string; asOf: Date; source: string }[] = [];
    let p = s.p0;
    for (let i = 0; i <= days; i += 1) {
      p = Math.max(p * (1 + between(-s.vol, s.vol) + 0.0006), s.p0 * 0.4);
      prices.push({
        securityId: security.id,
        price: Math.round(p * 100) / 100,
        currency: "THB",
        asOf: new Date(start.getTime() + i * DAY),
        source: "manual",
      });
    }
    await prisma.securityPrice.deleteMany({
      where: { securityId: security.id, asOf: { gte: start } },
    });
    await prisma.securityPrice.createMany({ data: prices });
    priceCount += prices.length;

    // one buy early, top-up mid-window
    const buyPlan = [
      { dayOffset: 2, budget: s.p0 * (s.symbol === "BTCx" ? 0.06 : 12) },
      { dayOffset: Math.floor(days / 2), budget: s.p0 * (s.symbol === "BTCx" ? 0.03 : 6) },
    ];
    for (const b of buyPlan) {
      const priceRow = prices[b.dayOffset]!;
      const qty =
        s.symbol === "BTCx"
          ? Math.round((b.budget / priceRow.price) * 1e6) / 1e6
          : Math.max(1, Math.round(b.budget / priceRow.price));
      const gross = qty * priceRow.price;
      const fee = Math.round(gross * 0.0015 * 100) / 100;
      await prisma.investmentTransaction.create({
        data: {
          userId: user.id,
          portfolioId: portfolio.id,
          securityId: security.id,
          type: "BUY",
          quantity: qty,
          price: priceRow.price,
          fee,
          amount: Math.round((gross + fee) * 100) / 100,
          currency: "THB",
          tradeDate: new Date(priceRow.asOf.getTime() + 3_600_000 * 10),
          settlementAccountId: invAcct.id,
          note: "mock buy",
        },
      });
      invCount += 1;
    }
  }

  // ── net-worth history for the trend line ────────────────────────────────
  process.stdout.write("[mock:finance] building net-worth snapshots… ");
  await backfillNetWorthSnapshots(user.id, days);
  console.log("done");

  console.log(
    `[mock:finance] +${txns.length} transactions · +${transfers.length} transfers · ` +
      `+${invCount} trades · +${priceCount} prices`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
