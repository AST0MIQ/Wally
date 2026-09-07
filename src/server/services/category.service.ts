import { prisma } from "@/server/db";
import { writeAudit } from "@/server/lib/audit";
import { AppError, notFound } from "@/server/lib/errors";
import type {
  CategoryCreateInput,
  SubcategoryCreateInput,
} from "@/lib/validation/category";

export type SubcategoryNode = {
  id: string;
  name: string;
  systemKey: string | null;
  icon: string | null;
  sortOrder: number;
};

export type CategoryNode = {
  id: string;
  name: string;
  systemKey: string | null;
  kind: "INCOME" | "EXPENSE";
  icon: string | null;
  color: string | null;
  sortOrder: number;
  subcategories: SubcategoryNode[];
};

export async function listCategories(
  userId: string,
  kind?: "INCOME" | "EXPENSE",
): Promise<CategoryNode[]> {
  const rows = await prisma.category.findMany({
    where: { userId, ...(kind ? { kind } : {}) },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      subcategories: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    systemKey: c.systemKey,
    kind: c.kind,
    icon: c.icon,
    color: c.color,
    sortOrder: c.sortOrder,
    subcategories: c.subcategories.map((s) => ({
      id: s.id,
      name: s.name,
      systemKey: s.systemKey,
      icon: s.icon,
      sortOrder: s.sortOrder,
    })),
  }));
}

async function nextCategorySort(userId: string, kind: string) {
  const max = await prisma.category.aggregate({
    where: { userId, kind: kind as "INCOME" | "EXPENSE" },
    _max: { sortOrder: true },
  });
  return (max._max.sortOrder ?? -1) + 1;
}

export async function createCategory(
  userId: string,
  input: CategoryCreateInput,
): Promise<{ id: string }> {
  const category = await prisma.category.create({
    data: {
      userId,
      name: input.name,
      kind: input.kind,
      icon: input.icon ?? null,
      color: input.color ?? null,
      sortOrder: await nextCategorySort(userId, input.kind),
    },
  });
  await writeAudit({
    userId,
    action: "category.create",
    entity: "Category",
    entityId: category.id,
  });
  return { id: category.id };
}

export async function updateCategory(
  userId: string,
  input: { id: string; name?: string; icon?: string; color?: string },
): Promise<{ id: string }> {
  const existing = await prisma.category.findFirst({
    where: { id: input.id, userId },
    select: { id: true, name: true, systemKey: true },
  });
  if (!existing) notFound("Category not found");

  // A supplied name means the user edited the label (the client omits `name`
  // for icon/colour-only edits). Once a seeded row is renamed it becomes the
  // user's own label and stops being translated.
  const renamedSystemRow = input.name !== undefined && existing.systemKey !== null;

  await prisma.category.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.icon !== undefined ? { icon: input.icon || null } : {}),
      ...(input.color !== undefined ? { color: input.color || null } : {}),
      ...(renamedSystemRow ? { systemKey: null } : {}),
    },
  });
  await writeAudit({
    userId,
    action: "category.update",
    entity: "Category",
    entityId: existing.id,
  });
  return { id: existing.id };
}

export async function deleteCategory(
  userId: string,
  input: { id: string; reassignToCategoryId?: string },
): Promise<{ id: string; movedTransactions: number }> {
  const category = await prisma.category.findFirst({
    where: { id: input.id, userId },
    select: { id: true, kind: true, subcategories: { select: { id: true } } },
  });
  if (!category) notFound("Category not found");

  let target: { id: string } | null = null;
  if (input.reassignToCategoryId) {
    if (input.reassignToCategoryId === category.id) {
      throw new AppError("cannot_reassign_to_self", "BAD_REQUEST");
    }
    const t = await prisma.category.findFirst({
      where: { id: input.reassignToCategoryId, userId, kind: category.kind },
      select: { id: true },
    });
    if (!t) throw new AppError("reassign_target_invalid", "BAD_REQUEST");
    target = t;
  }

  const subIds = category.subcategories.map((s) => s.id);

  const moved = await prisma.$transaction(async (tx) => {
    const affected = await tx.transaction.updateMany({
      where: {
        userId,
        OR: [
          { categoryId: category.id },
          ...(subIds.length ? [{ subcategoryId: { in: subIds } }] : []),
        ],
      },
      data: {
        categoryId: target ? target.id : null,
        subcategoryId: null,
      },
    });
    await tx.subcategory.deleteMany({ where: { categoryId: category.id } });
    await tx.category.delete({ where: { id: category.id } });
    return affected.count;
  });

  await writeAudit({
    userId,
    action: "category.delete",
    entity: "Category",
    entityId: category.id,
    metadata: { movedTransactions: moved, reassignTo: target?.id ?? null },
  });

  return { id: category.id, movedTransactions: moved };
}

async function assertCategoryOwned(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  });
  if (!category) notFound("Category not found");
  return category;
}

export async function createSubcategory(
  userId: string,
  input: SubcategoryCreateInput,
): Promise<{ id: string }> {
  await assertCategoryOwned(userId, input.categoryId);
  const max = await prisma.subcategory.aggregate({
    where: { categoryId: input.categoryId },
    _max: { sortOrder: true },
  });
  const sub = await prisma.subcategory.create({
    data: {
      categoryId: input.categoryId,
      name: input.name,
      icon: input.icon ?? null,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
  await writeAudit({
    userId,
    action: "subcategory.create",
    entity: "Subcategory",
    entityId: sub.id,
  });
  return { id: sub.id };
}

export async function updateSubcategory(
  userId: string,
  input: { id: string; name?: string; icon?: string },
): Promise<{ id: string }> {
  const sub = await prisma.subcategory.findFirst({
    where: { id: input.id, category: { userId } },
    select: { id: true, name: true, systemKey: true },
  });
  if (!sub) notFound("Subcategory not found");

  // A supplied name means the user edited the label (the client omits `name`
  // for icon-only edits). Once a seeded row is renamed it becomes the user's
  // own label and stops being translated.
  const renamedSystemRow = input.name !== undefined && sub.systemKey !== null;

  await prisma.subcategory.update({
    where: { id: sub.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.icon !== undefined ? { icon: input.icon || null } : {}),
      ...(renamedSystemRow ? { systemKey: null } : {}),
    },
  });
  await writeAudit({
    userId,
    action: "subcategory.update",
    entity: "Subcategory",
    entityId: sub.id,
  });
  return { id: sub.id };
}

export async function deleteSubcategory(
  userId: string,
  id: string,
): Promise<{ id: string }> {
  const sub = await prisma.subcategory.findFirst({
    where: { id, category: { userId } },
    select: { id: true },
  });
  if (!sub) notFound("Subcategory not found");

  await prisma.$transaction(async (tx) => {
    await tx.transaction.updateMany({
      where: { userId, subcategoryId: sub.id },
      data: { subcategoryId: null },
    });
    await tx.subcategory.delete({ where: { id: sub.id } });
  });
  await writeAudit({
    userId,
    action: "subcategory.delete",
    entity: "Subcategory",
    entityId: sub.id,
  });
  return { id: sub.id };
}
