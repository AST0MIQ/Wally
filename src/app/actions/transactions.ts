"use server";

import { revalidatePath } from "next/cache";

import { action } from "@/server/lib/action";
import {
  transactionCreateSchema,
  transactionIdSchema,
  transactionUpdateSchema,
} from "@/lib/validation/transaction";
import {
  createTransaction,
  restoreTransaction,
  softDeleteTransaction,
  updateTransaction,
} from "@/server/services/transaction.service";

function revalidateTxn() {
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export const createTransactionAction = action(
  transactionCreateSchema,
  async ({ input, user }) => {
    const r = await createTransaction(user.id, input);
    revalidateTxn();
    return r;
  },
);

export const updateTransactionAction = action(
  transactionUpdateSchema,
  async ({ input, user }) => {
    const r = await updateTransaction(user.id, input);
    revalidateTxn();
    return r;
  },
);

export const deleteTransactionAction = action(
  transactionIdSchema,
  async ({ input, user }) => {
    const r = await softDeleteTransaction(user.id, input.id);
    revalidateTxn();
    return r;
  },
);

export const restoreTransactionAction = action(
  transactionIdSchema,
  async ({ input, user }) => {
    const r = await restoreTransaction(user.id, input.id);
    revalidateTxn();
    return r;
  },
);
