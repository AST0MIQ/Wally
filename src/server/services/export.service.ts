import { prisma } from "@/server/db";

/**
 * Full export of a single user's own data (JSON). Excludes OAuth tokens and
 * anything belonging to other users.
 */
export async function buildUserExport(userId: string): Promise<unknown> {
  const [
    user,
    accounts,
    categories,
    transactions,
    transfers,
    portfolios,
    investmentTransactions,
    netWorthSnapshots,
    recurringRules,
  ] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        locale: true,
        baseCurrency: true,
        timezone: true,
        theme: true,
        createdAt: true,
      },
    }),
    prisma.financeAccount.findMany({ where: { userId } }),
    prisma.category.findMany({
      where: { userId },
      include: { subcategories: true },
    }),
    prisma.transaction.findMany({ where: { userId } }),
    prisma.transfer.findMany({ where: { userId } }),
    prisma.portfolio.findMany({ where: { userId } }),
    prisma.investmentTransaction.findMany({
      where: { userId },
      include: { security: { select: { symbol: true, name: true } } },
    }),
    prisma.netWorthSnapshot.findMany({ where: { userId } }),
    prisma.recurringRule.findMany({ where: { userId } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    user,
    accounts,
    categories,
    transactions,
    transfers,
    portfolios,
    investmentTransactions,
    netWorthSnapshots,
    recurringRules,
  };
}

/** Permanently delete the user and everything they own (cascades). */
export async function deleteUserAccount(userId: string): Promise<void> {
  await prisma.user.delete({ where: { id: userId } });
}
