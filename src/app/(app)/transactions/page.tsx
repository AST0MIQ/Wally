import type { Metadata } from "next";

import { requireUser } from "@/server/lib/guards";
import { transactionListSchema } from "@/lib/validation/transaction";
import { listTransactions } from "@/server/services/transaction.service";
import {
  listAccountsMinimal,
} from "@/server/services/account.service";
import { listCategories } from "@/server/services/category.service";
import {
  TransactionsView,
  type FeedFilters,
} from "@/components/transactions/transactions-view";

export const metadata: Metadata = { title: "Transactions" };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const parsed = transactionListSchema.parse({
    type: sp.type,
    accountId: sp.accountId,
    categoryId: sp.categoryId,
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
    search: sp.search,
    cursor: sp.cursor,
  });

  const [page, accounts, categories] = await Promise.all([
    listTransactions(user.id, parsed),
    listAccountsMinimal(user.id),
    listCategories(user.id),
  ]);

  const filters: FeedFilters = {
    type: parsed.type,
    accountId: parsed.accountId,
    categoryId: parsed.categoryId,
    dateFrom: typeof sp.dateFrom === "string" ? sp.dateFrom : undefined,
    dateTo: typeof sp.dateTo === "string" ? sp.dateTo : undefined,
    search: typeof sp.search === "string" ? sp.search : undefined,
  };

  return (
    <TransactionsView
      initialPage={page}
      filters={filters}
      accounts={accounts}
      categories={categories}
    />
  );
}
