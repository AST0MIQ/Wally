import {
  listAccountsMinimal,
  type AccountLite,
} from "@/server/services/account.service";
import {
  listCategories,
  type CategoryNode,
} from "@/server/services/category.service";

export type QuickAddData = {
  accounts: AccountLite[];
  categories: CategoryNode[];
};

/** Lightweight bundle powering the Quick Add sheet (available on every app page). */
export async function getQuickAddData(userId: string): Promise<QuickAddData> {
  const [accounts, categories] = await Promise.all([
    listAccountsMinimal(userId),
    listCategories(userId),
  ]);
  return { accounts, categories };
}
