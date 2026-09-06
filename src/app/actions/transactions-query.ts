"use server";

import { requireUser } from "@/server/lib/guards";
import {
  transactionListSchema,
  type TransactionListRaw,
} from "@/lib/validation/transaction";
import {
  listTransactions,
  type FeedPage,
} from "@/server/services/transaction.service";

/** Query action used for "load more" pagination on the transactions feed. */
export async function loadTransactionsAction(
  raw: TransactionListRaw,
): Promise<FeedPage> {
  const user = await requireUser();
  const parsed = transactionListSchema.parse(raw);
  return listTransactions(user.id, parsed);
}
