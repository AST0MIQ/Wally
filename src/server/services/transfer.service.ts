import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { writeAudit } from "@/server/lib/audit";
import { AppError, notFound } from "@/server/lib/errors";
import { assertAccountOwned } from "@/server/services/account.service";
import { registerStreakActivity } from "@/server/services/streak.service";
import { toPlain } from "@/lib/money";
import type {
  TransferCreateInput,
  TransferUpdateInput,
} from "@/lib/validation/transfer";

export type TransferDetail = {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  fromAmount: string;
  toAmount: string;
  fromCurrency: string;
  toCurrency: string;
  fee: string;
  feeAccountId: string | null;
  date: string;
  note: string | null;
};

function mapDetail(t: Prisma.TransferGetPayload<object>): TransferDetail {
  return {
    id: t.id,
    fromAccountId: t.fromAccountId,
    toAccountId: t.toAccountId,
    fromAmount: toPlain(t.fromAmount),
    toAmount: toPlain(t.toAmount),
    fromCurrency: t.fromCurrency,
    toCurrency: t.toCurrency,
    fee: toPlain(t.fee),
    feeAccountId: t.feeAccountId,
    date: t.date.toISOString(),
    note: t.note,
  };
}

function resolveToAmount(
  fromCurrency: string,
  toCurrency: string,
  fromAmount: string,
  toAmount?: string,
): string {
  if (toAmount) return toAmount;
  if (fromCurrency === toCurrency) return fromAmount;
  throw new AppError("to_amount_required", "BAD_REQUEST");
}

export async function createTransfer(
  userId: string,
  input: TransferCreateInput,
): Promise<{ id: string; deduped: boolean }> {
  if (input.idempotencyKey) {
    const existing = await prisma.transfer.findUnique({
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

  const [from, to] = await Promise.all([
    assertAccountOwned(userId, input.fromAccountId),
    assertAccountOwned(userId, input.toAccountId),
  ]);
  if (input.feeAccountId) {
    await assertAccountOwned(userId, input.feeAccountId);
  }

  const toAmount = resolveToAmount(
    from.currency,
    to.currency,
    input.fromAmount,
    input.toAmount,
  );

  const transfer = await prisma.transfer.create({
    data: {
      userId,
      fromAccountId: from.id,
      toAccountId: to.id,
      fromAmount: input.fromAmount,
      toAmount,
      fromCurrency: from.currency,
      toCurrency: to.currency,
      fee: input.fee ?? "0",
      feeAccountId: input.feeAccountId ?? null,
      date: input.date,
      note: input.note ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
    },
  });

  await writeAudit({
    userId,
    action: "transfer.create",
    entity: "Transfer",
    entityId: transfer.id,
    metadata: { fromAmount: input.fromAmount, toAmount },
  });

  await registerStreakActivity(userId);

  return { id: transfer.id, deduped: false };
}

export async function updateTransfer(
  userId: string,
  input: TransferUpdateInput,
): Promise<{ id: string }> {
  const existing = await prisma.transfer.findFirst({
    where: { id: input.id, userId, deletedAt: null },
  });
  if (!existing) notFound("Transfer not found");

  const data: Prisma.TransferUpdateInput = {};
  let fromCurrency = existing.fromCurrency;
  let toCurrency = existing.toCurrency;

  if (input.fromAccountId) {
    const from = await assertAccountOwned(userId, input.fromAccountId);
    data.fromAccount = { connect: { id: from.id } };
    data.fromCurrency = from.currency;
    fromCurrency = from.currency;
  }
  if (input.toAccountId) {
    const to = await assertAccountOwned(userId, input.toAccountId);
    data.toAccount = { connect: { id: to.id } };
    data.toCurrency = to.currency;
    toCurrency = to.currency;
  }
  const nextFrom = input.fromAccountId ?? existing.fromAccountId;
  const nextTo = input.toAccountId ?? existing.toAccountId;
  if (nextFrom === nextTo) {
    throw new AppError("same_account", "BAD_REQUEST");
  }

  if (input.fromAmount !== undefined) data.fromAmount = input.fromAmount;
  if (input.toAmount !== undefined) {
    data.toAmount = input.toAmount;
  } else if (input.fromAmount !== undefined && fromCurrency === toCurrency) {
    data.toAmount = input.fromAmount;
  }
  if (input.fee !== undefined) data.fee = input.fee;
  if (input.feeAccountId !== undefined) {
    if (input.feeAccountId) await assertAccountOwned(userId, input.feeAccountId);
    data.feeAccount = input.feeAccountId
      ? { connect: { id: input.feeAccountId } }
      : { disconnect: true };
  }
  if (input.date !== undefined) data.date = input.date;
  if (input.note !== undefined) data.note = input.note;

  await prisma.transfer.update({ where: { id: existing.id }, data });
  await writeAudit({
    userId,
    action: "transfer.update",
    entity: "Transfer",
    entityId: existing.id,
  });
  return { id: existing.id };
}

export async function softDeleteTransfer(
  userId: string,
  id: string,
): Promise<{ id: string }> {
  const existing = await prisma.transfer.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) notFound("Transfer not found");
  await prisma.transfer.update({ where: { id }, data: { deletedAt: new Date() } });
  await writeAudit({
    userId,
    action: "transfer.delete",
    entity: "Transfer",
    entityId: id,
  });
  return { id };
}

export async function getTransfer(
  userId: string,
  id: string,
): Promise<TransferDetail> {
  const t = await prisma.transfer.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!t) notFound("Transfer not found");
  return mapDetail(t);
}
