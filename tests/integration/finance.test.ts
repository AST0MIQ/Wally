import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/server/db";
import { computeAccountBalances } from "@/server/lib/balance";
import { convert, dayFloorUTC } from "@/server/lib/fx";
import {
  createInvestmentTransaction,
  createPortfolio,
  getPortfolio,
} from "@/server/services/portfolio.service";
import { setManualPrice } from "@/server/services/security.service";
import { computeNetWorth } from "@/server/lib/networth";
import { updateCategory, updateSubcategory } from "@/server/services/category.service";
import { seedUserDefaults } from "@/server/services/onboarding";

const hasDb = await prisma
  .$queryRaw`SELECT 1`.then(() => true)
  .catch(() => false);

describe.skipIf(!hasDb)("finance integration (DB)", () => {
  const email = `vitest+${Date.now()}@wally.local`;
  let userId = "";
  let accA = "";
  let accB = "";
  const fxDay = new Date("2020-01-15T00:00:00.000Z");

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email, name: "vitest", baseCurrency: "THB" },
    });
    userId = user.id;

    const a = await prisma.financeAccount.create({
      data: {
        userId,
        name: "A",
        currency: "THB",
        openingBalance: "1000",
        openingBalanceDate: new Date("2020-01-01"),
      },
    });
    const b = await prisma.financeAccount.create({
      data: { userId, name: "B", currency: "THB", openingBalance: "0" },
    });
    accA = a.id;
    accB = b.id;

    await prisma.transaction.createMany({
      data: [
        {
          userId,
          kind: "INCOME",
          amount: "500",
          currency: "THB",
          accountId: accA,
          date: new Date("2020-01-05"),
        },
        {
          userId,
          kind: "EXPENSE",
          amount: "200",
          currency: "THB",
          accountId: accA,
          date: new Date("2020-01-06"),
        },
        {
          userId,
          kind: "EXPENSE",
          amount: "999",
          currency: "THB",
          accountId: accA,
          date: new Date("2020-01-07"),
          deletedAt: new Date(),
        },
      ],
    });

    await prisma.transfer.create({
      data: {
        userId,
        fromAccountId: accA,
        toAccountId: accB,
        fromAmount: "100",
        toAmount: "100",
        fromCurrency: "THB",
        toCurrency: "THB",
        fee: "5",
        date: new Date("2020-01-08"),
      },
    });

    await prisma.fxRate.createMany({
      data: [
        { base: "USD", quote: "THB", rate: "36", asOf: fxDay, source: "test" },
        { base: "USD", quote: "EUR", rate: "0.9", asOf: fxDay, source: "test" },
      ],
      skipDuplicates: true,
    });
  });

  afterAll(async () => {
    await prisma.fxRate.deleteMany({ where: { source: "test", asOf: fxDay } });
    if (userId) await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("computeAccountBalances applies income, expense, transfer + fee, ignores soft-deleted", async () => {
    const balances = await computeAccountBalances(userId);
    // 1000 + 500 - 200 - 100 (transfer out) - 5 (fee) = 1195
    expect(balances.get(accA)?.toString()).toBe("1195");
    // 0 + 100 (transfer in) = 100
    expect(balances.get(accB)?.toString()).toBe("100");
  });

  it("convert() round-trips through the USD pivot", async () => {
    const toUsd = await convert("36", "THB", "USD", fxDay);
    expect(Number(toUsd.amount)).toBeCloseTo(1, 6);
    expect(toUsd.approx).toBe(false);

    const toThb = await convert("1", "USD", "THB", fxDay);
    expect(Number(toThb.amount)).toBeCloseTo(36, 6);

    const thbToEur = await convert("36", "THB", "EUR", fxDay);
    expect(Number(thbToEur.amount)).toBeCloseTo(0.9, 6);
  });

  it("convert() is identity for same currency", async () => {
    const r = await convert("123.45", "THB", "THB", fxDay);
    expect(r.amount).toBe("123.45");
    expect(r.approx).toBe(false);
  });

  it("convert() flags approx when a currency has no rate", async () => {
    const r = await convert("100", "USD", "ZZZ", fxDay);
    expect(r.approx).toBe(true);
  });
});

describe.skipIf(!hasDb)("investment — no double counting (§12)", () => {
  const stamp = Date.now();
  const email = `vitest-inv+${stamp}@wally.local`;
  // unique throwaway symbol so we never collide with a real global Security row
  const SYM = `TST${stamp}`;
  let userId = "";
  let dimeId = "";
  let portfolioId = "";
  let msftId = "";

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email, name: "vitest-inv", baseCurrency: "THB" },
    });
    userId = user.id;

    const dime = await prisma.financeAccount.create({
      data: {
        userId,
        name: "Dime",
        type: "INVESTMENT",
        currency: "THB",
        openingBalance: "60000",
        openingBalanceDate: new Date("2020-01-01"),
      },
    });
    dimeId = dime.id;

    const p = await createPortfolio(userId, {
      name: "Test",
      accountId: dimeId,
      baseCurrency: "THB",
    });
    portfolioId = p.id;

    await createInvestmentTransaction(userId, {
      portfolioId,
      type: "BUY",
      symbol: SYM,
      securityName: "Microsoft",
      securityType: "STOCK",
      securityCurrency: "THB",
      quantity: "2",
      price: "1000",
      fee: "0",
      tradeDate: new Date("2020-02-01"),
      settlementAccountId: dimeId,
    });

    const sec = await prisma.security.findFirstOrThrow({
      where: { symbol: SYM },
    });
    msftId = sec.id;
    await setManualPrice(msftId, "1200", new Date("2020-03-01"));
  });

  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } });
    // throwaway global Security (+ its prices via cascade)
    if (msftId)
      await prisma.security.delete({ where: { id: msftId } }).catch(() => {});
  });

  it("BUY with settlement account moves cash out exactly once", async () => {
    const balances = await computeAccountBalances(userId);
    // 60000 opening - 2000 (2 * 1000) settlement = 58000
    expect(balances.get(dimeId)?.toString()).toBe("58000");
  });

  it("portfolio market value + cash balance do not double-count the buy", async () => {
    const balances = await computeAccountBalances(userId);
    const detail = await getPortfolio(userId, portfolioId);

    expect(detail.totalCost).toBe("2000");
    expect(detail.totalMarketValue).toBe("2400"); // 2 * 1200
    expect(detail.totalUnrealizedPnL).toBe("400");

    const cash = Number(balances.get(dimeId));
    const totalDimeAsset = cash + Number(detail.totalMarketValue);
    expect(totalDimeAsset).toBe(60400); // NOT 60000 + 2000 + 2400
  });

  it("rejects overselling", async () => {
    await expect(
      createInvestmentTransaction(userId, {
        portfolioId,
        type: "SELL",
        symbol: SYM,
        securityType: "STOCK",
        securityCurrency: "THB",
        quantity: "5",
        price: "1200",
        fee: "0",
        tradeDate: new Date("2020-04-01"),
      }),
    ).rejects.toThrow(/oversell/);
  });

  it("SELL realizes P&L and reduces the position", async () => {
    await createInvestmentTransaction(userId, {
      portfolioId,
      type: "SELL",
      symbol: SYM,
      securityType: "STOCK",
      securityCurrency: "THB",
      quantity: "1",
      price: "1200",
      fee: "0",
      tradeDate: new Date("2020-05-01"),
      settlementAccountId: dimeId,
    });

    const detail = await getPortfolio(userId, portfolioId);
    const holding = detail.holdings.find((h) => h.symbol === SYM);
    expect(holding?.quantity).toBe("1");
    expect(detail.totalRealizedPnL).toBe("200"); // sold 1 @1200, cost 1000

    const balances = await computeAccountBalances(userId);
    // 58000 + 1200 (sell proceeds) = 59200
    expect(balances.get(dimeId)?.toString()).toBe("59200");
  });
});

describe.skipIf(!hasDb)("net worth — multi-currency (§N3)", () => {
  const stamp = Date.now();
  const email = `vitest-nw+${stamp}@wally.local`;
  const SYM = `NWT${stamp}`;
  const asOf = new Date("2021-06-15T12:00:00.000Z");
  const fxDay = new Date("2021-06-15T00:00:00.000Z");
  let userId = "";
  let secId = "";

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email, name: "nw", baseCurrency: "THB" },
    });
    userId = user.id;

    await prisma.fxRate.upsert({
      where: { base_quote_asOf: { base: "USD", quote: "THB", asOf: fxDay } },
      create: { base: "USD", quote: "THB", rate: "36", asOf: fxDay, source: "test" },
      update: { rate: "36", source: "test" },
    });

    const thb = await prisma.financeAccount.create({
      data: {
        userId,
        name: "THB acct",
        currency: "THB",
        openingBalance: "10000",
        openingBalanceDate: new Date("2021-01-01"),
      },
    });
    const usd = await prisma.financeAccount.create({
      data: {
        userId,
        name: "USD acct",
        currency: "USD",
        openingBalance: "100",
        openingBalanceDate: new Date("2021-01-01"),
      },
    });
    void thb;

    const p = await createPortfolio(userId, {
      name: "P",
      accountId: usd.id,
      baseCurrency: "USD",
    });
    await createInvestmentTransaction(userId, {
      portfolioId: p.id,
      type: "BUY",
      symbol: SYM,
      securityType: "STOCK",
      securityCurrency: "USD",
      quantity: "2",
      price: "50",
      fee: "0",
      tradeDate: new Date("2021-02-01"),
      settlementAccountId: usd.id,
    });
    const sec = await prisma.security.findFirstOrThrow({ where: { symbol: SYM } });
    secId = sec.id;
    await setManualPrice(secId, "60", new Date("2021-03-01"));
  });

  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } });
    if (secId) await prisma.security.delete({ where: { id: secId } }).catch(() => {});
    await prisma.fxRate.deleteMany({ where: { source: "test", asOf: fxDay } });
  });

  it("converts cash + investments to base currency without double counting", async () => {
    const nw = await computeNetWorth(userId, { asOf });
    // THB acct 10000 ; USD acct 100 - 100 (settlement) = 0
    expect(nw.totalCash).toBe("10000");
    // 2 shares * $60 = $120 -> * 36 = 4320 THB
    expect(nw.totalInvestment).toBe("4320");
    expect(nw.netWorth).toBe("14320");
    expect(nw.approx).toBe(false);
  });

  it("settlement currency must match the security currency", async () => {
    const thbAcct = await prisma.financeAccount.findFirstOrThrow({
      where: { userId, currency: "THB" },
    });
    const p = await prisma.portfolio.findFirstOrThrow({ where: { userId } });
    await expect(
      createInvestmentTransaction(userId, {
        portfolioId: p.id,
        type: "BUY",
        symbol: SYM,
        securityType: "STOCK",
        securityCurrency: "USD",
        quantity: "1",
        price: "50",
        fee: "0",
        tradeDate: new Date("2021-04-01"),
        settlementAccountId: thbAcct.id,
      }),
    ).rejects.toThrow(/settlement_currency_mismatch/);
  });
});

describe("dayFloorUTC", () => {
  it("truncates to UTC midnight", () => {
    const d = dayFloorUTC(new Date("2026-09-02T18:45:12.000Z"));
    expect(d.toISOString()).toBe("2026-09-02T00:00:00.000Z");
  });
});

describe.skipIf(!hasDb)("category rename (DB)", () => {
  const email = `vitest-cat+${Date.now()}@wally.local`;
  let userId = "";

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email, name: "vitest", baseCurrency: "THB" },
    });
    userId = user.id;
    await seedUserDefaults(userId);
  });

  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } });
  });

  it("drops systemKey when a seeded subcategory is renamed", async () => {
    const cat = await prisma.category.findFirstOrThrow({
      where: { userId, systemKey: "food" },
      include: { subcategories: true },
    });
    const sub = cat.subcategories.find((s) => s.systemKey === "delivery")!;

    await updateSubcategory(userId, { id: sub.id, name: "Grab" });

    const after = await prisma.subcategory.findUniqueOrThrow({ where: { id: sub.id } });
    expect(after.name).toBe("Grab");
    expect(after.systemKey).toBeNull();
  });

  it("keeps systemKey for an icon-only edit", async () => {
    const cat = await prisma.category.findFirstOrThrow({
      where: { userId, systemKey: "transport" },
      include: { subcategories: true },
    });
    const sub = cat.subcategories.find((s) => s.systemKey === "fuel")!;

    await updateSubcategory(userId, { id: sub.id, icon: "🔋" });

    const after = await prisma.subcategory.findUniqueOrThrow({ where: { id: sub.id } });
    expect(after.systemKey).toBe("fuel");
    expect(after.icon).toBe("🔋");
  });

  it("drops systemKey when a seeded category is renamed", async () => {
    const cat = await prisma.category.findFirstOrThrow({
      where: { userId, systemKey: "housing" },
    });

    await updateCategory(userId, { id: cat.id, name: "บ้านเช่า" });

    const after = await prisma.category.findUniqueOrThrow({ where: { id: cat.id } });
    expect(after.name).toBe("บ้านเช่า");
    expect(after.systemKey).toBeNull();
  });
});

describe.skipIf(!hasDb)("balance guard — no overdraft", () => {
  const email = `vitest+bal+${Date.now()}@wally.local`;
  let userId = "";
  let acc = "";
  let acc2 = "";

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { email, name: "vitest-bal", baseCurrency: "THB" },
    });
    userId = user.id;
    const a = await prisma.financeAccount.create({
      data: {
        userId,
        name: "Wallet",
        currency: "THB",
        openingBalance: "500",
        openingBalanceDate: new Date("2020-01-01"),
      },
    });
    const b = await prisma.financeAccount.create({
      data: { userId, name: "Savings", currency: "THB", openingBalance: "0" },
    });
    acc = a.id;
    acc2 = b.id;
  });

  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } });
  });

  it("rejects an expense larger than the account balance", async () => {
    const { createTransaction } = await import(
      "@/server/services/transaction.service"
    );
    await expect(
      createTransaction(userId, {
        kind: "EXPENSE",
        amount: "600",
        accountId: acc,
        date: new Date("2020-02-01"),
      }),
    ).rejects.toThrow(/insufficient_balance/);
  });

  it("allows an expense within the balance, then rejects one that would overdraw", async () => {
    const { createTransaction } = await import(
      "@/server/services/transaction.service"
    );
    await createTransaction(userId, {
      kind: "EXPENSE",
      amount: "400",
      accountId: acc,
      date: new Date("2020-02-02"),
    });
    await expect(
      createTransaction(userId, {
        kind: "EXPENSE",
        amount: "150",
        accountId: acc,
        date: new Date("2020-02-03"),
      }),
    ).rejects.toThrow(/insufficient_balance/);
  });

  it("rejects a transfer (amount + fee) that exceeds the source balance", async () => {
    const { createTransfer } = await import(
      "@/server/services/transfer.service"
    );
    // balance is now 100
    await expect(
      createTransfer(userId, {
        fromAccountId: acc,
        toAccountId: acc2,
        fromAmount: "90",
        fee: "20",
        date: new Date("2020-02-04"),
      }),
    ).rejects.toThrow(/insufficient_balance/);
    await createTransfer(userId, {
      fromAccountId: acc,
      toAccountId: acc2,
      fromAmount: "90",
      fee: "10",
      date: new Date("2020-02-05"),
    });
  });
});
