"use server";

import { revalidatePath } from "next/cache";

import { action } from "@/server/lib/action";
import {
  accountCreateSchema,
  accountIdSchema,
  accountUpdateSchema,
} from "@/lib/validation/account";
import {
  createAccount,
  deleteAccount,
  setAccountStatus,
  updateAccount,
} from "@/server/services/account.service";

function revalidateAccounts() {
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export const createAccountAction = action(
  accountCreateSchema,
  async ({ input, user }) => {
    const res = await createAccount(user.id, input);
    revalidateAccounts();
    return res;
  },
);

export const updateAccountAction = action(
  accountUpdateSchema,
  async ({ input, user }) => {
    const res = await updateAccount(user.id, input);
    revalidateAccounts();
    revalidatePath(`/accounts/${input.id}`);
    return res;
  },
);

export const archiveAccountAction = action(
  accountIdSchema,
  async ({ input, user }) => {
    const res = await setAccountStatus(user.id, input.id, "ARCHIVED");
    revalidateAccounts();
    return res;
  },
);

export const unarchiveAccountAction = action(
  accountIdSchema,
  async ({ input, user }) => {
    const res = await setAccountStatus(user.id, input.id, "ACTIVE");
    revalidateAccounts();
    return res;
  },
);

export const deleteAccountAction = action(
  accountIdSchema,
  async ({ input, user }) => {
    const res = await deleteAccount(user.id, input.id);
    revalidateAccounts();
    return res;
  },
);
