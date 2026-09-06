import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { writeAudit } from "@/server/lib/audit";
import { AppError, notFound } from "@/server/lib/errors";
import { assertAccountOwned } from "@/server/services/account.service";
import { toPlain } from "@/lib/money";
import type {
  TransactionCreateInput,
  TransactionListInput,
  TransactionUpdateInput,
} from "@/lib/validation/transaction";

// ── Unified feed item (transactions + optionally transfers) ────────────
export type FeedTxn = {
  type: "INCOME" | "EXPENSE";
  id: string;
  date: string;
  createdAt: string;
  amount: string;
  currency: string;
  accountId: string;
  accountName: string;
  accountIcon: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySystemKey: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  subcategorySystemKey: string | null;
  description: string | null;
  note: string | null;
};

export type FeedTransfer = {
  type: "TRANSFER";
  id: string;
  date: string;
  createdAt: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  fromAmount: string;
  toAmount: string;
  fromCurrency: string;
  toCurrency: string;
  fee: string;
  note: string | null;
};

export type FeedItem = FeedTxn | FeedTransfer;

export type FeedPage = {
  items: FeedItem[];
  nextCursor: string | null;
};

// ── Cursor helpers ────────────────────────────────────────────────────
type Cursor = { date: Date; createdAt: Date; id: string };

function encodeCursor(c: Cursor): string {
  return Buffer.from(
    `${c.date.toISOString()}|${c.createdAt.toISOString()}|${c.id}`,
  ).toString("base64url");
}

function decodeCursor(raw: string | undefined): Cursor | null {
  if (!raw) return null;
  try {
    const [d, ca, id] = Buffer.from(raw, "base64url").toString().split("|");
    if (!d || !ca || !id) return null;
    return { date: new Date(d), createdAt: new Date(ca), id };
  } catch {
    return null;
  }
}

/** Descending keyset predicate: rows strictly "after" the cursor. */
function keysetWhere(cursor: Cursor | null) {
  if (!cursor) return {};
  return {
    OR: [
      { date: { lt: cursor.date } },
      { date: cursor.date, createdAt: { lt: cursor.createdAt } },
      { date: cursor.date, createdAt: cursor.createdAt, id: { lt: cursor.id } },
    ],
  } satisfies Prisma.TransactionWhereInput;
}

// ── Validation guards ────────────────────────────────────────────────
async function resolveCategory(
  userId: string,
  kind: "INCOME" | "EXPENSE",
  categoryId?: string | null,
  subcategoryId?: string | null,
): Promise<{ categoryId: string | null; subcategoryId: string | null }> {
  if (!categoryId) {
    if (subcategoryId) {
      throw new AppError("subcategory_without_category", "BAD_REQUEST");
    }
    return { categoryId: null, subcategoryId: null };
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true, kind: true },
  });
  if (!category) throw new AppError("category_not_found", "NOT_FOUND");
  if (category.kind !== kind) {
    throw new AppError("category_kind_mismatch", "BAD_REQUEST");
  }

  if (!subcategoryId) return { categoryId: category.id, subcategoryId: null };

  const sub = await prisma.subcategory.findFirst({
    where: { id: subcategoryId, categoryId: category.id },
    select: { id: true },
  });
  if (!sub) throw new AppError("subcategory_not_found", "NOT_FOUND");
  return { categoryId: category.id, subcategoryId: sub.id };
}

// ── Mutations ────────────────────────────────────────────────────────
export async function createTransaction(
  userId: string,
  input: TransactionCreateInput,
): Promise<{ id: string; deduped: boolean }> {
  if (input.idempotencyKey) {
    const existing = await prisma.transaction.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true, userId: true },
    });
    if (existing) {
      if (existing.userId !== userId) {
        throw new AppError("idempotency_conflict", "CONFLICT");
      }
      return { id: existing.id, deduped: true };
    }
  }

  const account = await assertAccountOwned(userId, input.accountId);
  const { categoryId, subcategoryId } = await resolveCategory(
    userId,
    input.kind,
    input.categoryId,
    input.subcategoryId,
  );

  const txn = await prisma.transaction.create({
    data: {
      userId,
      kind: input.kind,
      amount: input.amount,
      currency: account.currency,
      accountId: account.id,
      categoryId,
      subcategoryId,
      date: input.date,
      description: input.description ?? null,
      note: input.note ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
    },
  });

  await writeAudit({
    userId,
    action: "transaction.create",
    entity: "Transaction",
    entityId: txn.id,
    metadata: { kind: input.kind, amount: input.amount },
  });

  return { id: txn.id, deduped: false };
}

export async function updateTransaction(
  userId: string,
  input: TransactionUpdateInput,
): Promise<{ id: string }> {
  const existing = await prisma.transaction.findFirst({
    where: { id: input.id, userId, deletedAt: null },
  });
  if (!existing) notFound("Transaction not found");

  const nextKind = input.kind ?? existing.kind;
  const data: Prisma.TransactionUpdateInput = {};

  if (input.kind !== undefined) data.kind = input.kind;
  if (input.amount !== undefined) data.amount = input.amount;
  if (input.date !== undefined) data.date = input.date;
  if (input.description !== undefined) data.description = input.description;
  if (input.note !== undefined) data.note = input.note;

  if (input.accountId !== undefined) {
    const account = await assertAccountOwned(userId, input.accountId);
    data.account = { connect: { id: account.id } };
    data.currency = account.currency;
  }

  const categoryChanged =
    input.categoryId !== undefined ||
    input.subcategoryId !== undefined ||
    input.kind !== undefined;
  if (categoryChanged) {
    const resolved = await resolveCategory(
      userId,
      nextKind,
      input.categoryId === undefined ? existing.categoryId : input.categoryId,
      input.subcategoryId === undefined
        ? existing.subcategoryId
        : input.subcategoryId,
    );
    data.category = resolved.categoryId
      ? { connect: { id: resolved.categoryId } }
      : { disconnect: true };
    data.subcategory = resolved.subcategoryId
      ? { connect: { id: resolved.subcategoryId } }
      : { disconnect: true };
  }

  await prisma.transaction.update({ where: { id: existing.id }, data });
  await writeAudit({
    userId,
    action: "transaction.update",
    entity: "Transaction",
    entityId: existing.id,
  });
  return { id: existing.id };
}

export async function softDeleteTransaction(
  userId: string,
  id: string,
): Promise<{ id: string }> {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) notFound("Transaction not found");
  await prisma.transaction.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await writeAudit({
    userId,
    action: "transaction.delete",
    entity: "Transaction",
    entityId: id,
  });
  return { id };
}

export async function restoreTransaction(
  userId: string,
  id: string,
): Promise<{ id: string }> {
  const existing = await prisma.transaction.findFirst({
    where: { id, userId, deletedAt: { not: null } },
    select: { id: true },
  });
  if (!existing) notFound("Transaction not found");
  await prisma.transaction.update({
    where: { id },
    data: { deletedAt: null },
  });
  await writeAudit({
    userId,
    action: "transaction.restore",
    entity: "Transaction",
    entityId: id,
  });
  return { id };
}

// ── Queries ──────────────────────────────────────────────────────────
export async function getTransaction(
  userId: string,
  id: string,
): Promise<FeedTxn> {
  const t = await prisma.transaction.findFirst({
    where: { id, userId, deletedAt: null },
    include: {
      account: { select: { name: true, icon: true } },
      category: { select: { name: true, systemKey: true, icon: true, color: true } },
      subcategory: { select: { name: true, systemKey: true } },
    },
  });
  if (!t) notFound("Transaction not found");
  return mapTxn(t);
}

type TxnRow = Prisma.TransactionGetPayload<{
  include: {
    account: { select: { name: true; icon: true } };
    category: { select: { name: true; systemKey: true; icon: true; color: true } };
    subcategory: { select: { name: true; systemKey: true } };
  };
}>;

function mapTxn(t: TxnRow): FeedTxn {
  return {
    type: t.kind,
    id: t.id,
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    amount: toPlain(t.amount),
    currency: t.currency,
    accountId: t.accountId,
    accountName: t.account.name,
    accountIcon: t.account.icon,
    categoryId: t.categoryId,
    categoryName: t.category?.name ?? null,
    categorySystemKey: t.category?.systemKey ?? null,
    categoryIcon: t.category?.icon ?? null,
    categoryColor: t.category?.color ?? null,
    subcategoryId: t.subcategoryId,
    subcategoryName: t.subcategory?.name ?? null,
    subcategorySystemKey: t.subcategory?.systemKey ?? null,
    description: t.description,
    note: t.note,
  };
}

type TransferRow = Prisma.TransferGetPayload<{
  include: {
    fromAccount: { select: { name: true } };
    toAccount: { select: { name: true } };
  };
}>;

function mapTransfer(t: TransferRow): FeedTransfer {
  return {
    type: "TRANSFER",
    id: t.id,
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    fromAccountId: t.fromAccountId,
    fromAccountName: t.fromAccount.name,
    toAccountId: t.toAccountId,
    toAccountName: t.toAccount.name,
    fromAmount: toPlain(t.fromAmount),
    toAmount: toPlain(t.toAmount),
    fromCurrency: t.fromCurrency,
    toCurrency: t.toCurrency,
    fee: toPlain(t.fee),
    note: t.note,
  };
}

function feedSortKey(item: FeedItem): [number, number, string] {
  return [
    -new Date(item.date).getTime(),
    -new Date(item.createdAt).getTime(),
    item.id,
  ];
}

export async function listTransactions(
  userId: string,
  filters: TransactionListInput,
): Promise<FeedPage> {
  const cursor = decodeCursor(filters.cursor);
  const take = filters.limit;

  const dateRange =
    filters.dateFrom || filters.dateTo
      ? {
          date: {
            ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
            ...(filters.dateTo ? { lte: filters.dateTo } : {}),
          },
        }
      : {};

  const searchTxn: Prisma.TransactionWhereInput = filters.search
    ? {
        OR: [
          { description: { contains: filters.search, mode: "insensitive" } },
          { note: { contains: filters.search, mode: "insensitive" } },
        ],
      }
    : {};

  const searchTransfer: Prisma.TransferWhereInput = filters.search
    ? { note: { contains: filters.search, mode: "insensitive" } }
    : {};

  // ── Transfer-only feed ────────────────────────────────────────────
  if (filters.type === "TRANSFER") {
    const rows = await prisma.transfer.findMany({
      where: {
        userId,
        deletedAt: null,
        ...dateRange,
        ...searchTransfer,
        ...(filters.accountId
          ? {
              OR: [
                { fromAccountId: filters.accountId },
                { toAccountId: filters.accountId },
              ],
            }
          : {}),
        ...keysetWhere(cursor),
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      include: {
        fromAccount: { select: { name: true } },
        toAccount: { select: { name: true } },
      },
    });
    return paginate(rows.map(mapTransfer), take);
  }

  // ── Transaction feed (optionally merged with transfers) ───────────
  const kind = filters.type === "ALL" ? undefined : filters.type;

  const orderBy: Prisma.TransactionOrderByWithRelationInput[] =
    filters.sort === "amount"
      ? [{ amount: filters.direction }, { createdAt: "desc" }, { id: "desc" }]
      : [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }];

  const txnRows = await prisma.transaction.findMany({
    where: {
      userId,
      deletedAt: null,
      ...dateRange,
      ...searchTxn,
      ...(kind ? { kind } : {}),
      ...(filters.accountId ? { accountId: filters.accountId } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.sort === "date" ? keysetWhere(cursor) : {}),
    },
    orderBy,
    take: take + 1,
    include: {
      account: { select: { name: true, icon: true } },
      category: { select: { name: true, systemKey: true, icon: true, color: true } },
      subcategory: { select: { name: true, systemKey: true } },
    },
  });

  let items: FeedItem[] = txnRows.map(mapTxn);

  // Merge transfers only for the unfiltered "ALL" feed sorted by date.
  const mergeTransfers =
    filters.type === "ALL" &&
    !filters.categoryId &&
    filters.sort === "date";

  if (mergeTransfers) {
    const transferRows = await prisma.transfer.findMany({
      where: {
        userId,
        deletedAt: null,
        ...dateRange,
        ...searchTransfer,
        ...(filters.accountId
          ? {
              OR: [
                { fromAccountId: filters.accountId },
                { toAccountId: filters.accountId },
              ],
            }
          : {}),
        ...keysetWhere(cursor),
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      include: {
        fromAccount: { select: { name: true } },
        toAccount: { select: { name: true } },
      },
    });
    items = items.concat(transferRows.map(mapTransfer));
    items.sort((a, b) => {
      const ka = feedSortKey(a);
      const kb = feedSortKey(b);
      return ka[0] - kb[0] || ka[1] - kb[1] || (ka[2] < kb[2] ? -1 : 1);
    });
  }

  return paginate(items, take, filters.sort === "date");
}

function paginate(
  items: FeedItem[],
  take: number,
  keyset = true,
): FeedPage {
  const hasMore = items.length > take;
  const page = items.slice(0, take);
  const last = page.at(-1);
  const nextCursor =
    keyset && hasMore && last
      ? encodeCursor({
          date: new Date(last.date),
          createdAt: new Date(last.createdAt),
          id: last.id,
        })
      : null;
  return { items: page, nextCursor };
}
