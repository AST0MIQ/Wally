import { z } from "zod";
import {
  zAmount,
  zCuid,
  zDate,
  zIdempotencyKey,
  zLongText,
  zOptionalText,
} from "@/lib/validation/common";
import { TXN_KINDS } from "@/lib/validation/category";

export const transactionCreateSchema = z.object({
  kind: z.enum(TXN_KINDS),
  amount: zAmount,
  accountId: zCuid,
  categoryId: zCuid.optional(),
  subcategoryId: zCuid.optional(),
  date: zDate.default(() => new Date()),
  description: zOptionalText(200),
  note: zLongText.optional().transform((v) => v || undefined),
  idempotencyKey: zIdempotencyKey,
});

export const transactionUpdateSchema = z.object({
  id: zCuid,
  kind: z.enum(TXN_KINDS).optional(),
  amount: zAmount.optional(),
  accountId: zCuid.optional(),
  categoryId: zCuid.nullable().optional(),
  subcategoryId: zCuid.nullable().optional(),
  date: zDate.optional(),
  description: z.string().trim().max(200).nullable().optional(),
  note: z.string().trim().max(2000).nullable().optional(),
});

export const transactionIdSchema = z.object({ id: zCuid });

export const TXN_SORT_FIELDS = ["date", "amount"] as const;
export const FEED_TYPES = ["ALL", "INCOME", "EXPENSE", "TRANSFER"] as const;

export const transactionListSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  type: z.enum(FEED_TYPES).default("ALL"),
  accountId: zCuid.optional(),
  categoryId: zCuid.optional(),
  dateFrom: zDate.optional(),
  dateTo: zDate.optional(),
  search: z.string().trim().max(120).optional(),
  sort: z.enum(TXN_SORT_FIELDS).default("date"),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
export type TransactionListInput = z.infer<typeof transactionListSchema>;

/** Loose, string-based filter shape (URL params / client → action). */
export type TransactionListRaw = {
  type?: string;
  accountId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  cursor?: string;
  sort?: string;
  direction?: string;
  limit?: number;
};
