"use server";

import { revalidatePath } from "next/cache";

import { action } from "@/server/lib/action";
import {
  transferCreateSchema,
  transferIdSchema,
  transferUpdateSchema,
} from "@/lib/validation/transfer";
import {
  createTransfer,
  softDeleteTransfer,
  updateTransfer,
} from "@/server/services/transfer.service";

function revalidateTransfer() {
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  // the (app) layout renders the header streak ring — keep it in sync
  revalidatePath("/", "layout");
}

export const createTransferAction = action(
  transferCreateSchema,
  async ({ input, user }) => {
    const r = await createTransfer(user.id, input);
    revalidateTransfer();
    return r;
  },
);

export const updateTransferAction = action(
  transferUpdateSchema,
  async ({ input, user }) => {
    const r = await updateTransfer(user.id, input);
    revalidateTransfer();
    return r;
  },
);

export const deleteTransferAction = action(
  transferIdSchema,
  async ({ input, user }) => {
    const r = await softDeleteTransfer(user.id, input.id);
    revalidateTransfer();
    return r;
  },
);
