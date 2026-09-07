import type { Metadata } from "next";

import { requireUser } from "@/server/lib/guards";
import { listAccounts } from "@/server/services/account.service";
import { AccountsView } from "@/components/accounts/accounts-view";
import { convert } from "@/server/lib/fx";

export const metadata: Metadata = { title: "Accounts" };

export default async function AccountsPage() {
  const user = await requireUser();
  const accounts = await listAccounts(user.id, { includeArchived: true });
  const convertedBalances = Object.fromEntries(
    await Promise.all(
      accounts.map(async (account) => [
        account.id,
        account.currency === user.baseCurrency
          ? account.balance
          : (await convert(account.balance, account.currency, user.baseCurrency)).amount,
      ]),
    ),
  );

  return (
    <AccountsView
      accounts={accounts}
      baseCurrency={user.baseCurrency}
      convertedBalances={convertedBalances}
    />
  );
}
