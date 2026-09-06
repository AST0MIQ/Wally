import type { Metadata } from "next";

import { requireUser } from "@/server/lib/guards";
import { listAccounts } from "@/server/services/account.service";
import { AccountsView } from "@/components/accounts/accounts-view";

export const metadata: Metadata = { title: "Accounts" };

export default async function AccountsPage() {
  const user = await requireUser();
  const accounts = await listAccounts(user.id, { includeArchived: true });

  return <AccountsView accounts={accounts} />;
}
