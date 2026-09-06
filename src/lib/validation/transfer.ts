import { z } from "zod";
import {
  zAmount,
  zAmountNonNegative,
  zCuid,
  zDate,
  zIdempotencyKey,
  zOptionalText,
} from "@/lib/validation/common";

export const transferCreateSchema = z
  .object({
    fromAccountId: zCuid,
    toAccountId: zCuid,
    fromAmount: zAmount,
    /** required only when the two accounts use different currencies */
    toAmount: zAmount.optional(),
    fee: zAmountNonNegative.default("0"),
    feeAccountId: zCuid.optional(),
    date: zDate.default(() => new Date()),
    note: zOptionalText(2000),
    idempotencyKey: zIdempotencyKey,
  })
  .refine((v) => v.fromAccountId !== v.toAccountId, {
    message: "cannot transfer to the same account",
    path: ["toAccountId"],
  });

export const transferUpdateSchema = z.object({
  id: zCuid,
  fromAccountId: zCuid.optional(),
  toAccountId: zCuid.optional(),
  fromAmount: zAmount.optional(),
  toAmount: zAmount.optional(),
  fee: zAmountNonNegative.optional(),
  feeAccountId: zCuid.nullable().optional(),
  date: zDate.optional(),
  note: z.string().trim().max(2000).nullable().optional(),
});

export const transferIdSchema = z.object({ id: zCuid });

export type TransferCreateInput = z.infer<typeof transferCreateSchema>;
export type TransferUpdateInput = z.infer<typeof transferUpdateSchema>;
