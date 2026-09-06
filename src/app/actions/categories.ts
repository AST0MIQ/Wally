"use server";

import { revalidatePath } from "next/cache";

import { action } from "@/server/lib/action";
import {
  categoryCreateSchema,
  categoryDeleteSchema,
  categoryUpdateSchema,
  subcategoryCreateSchema,
  subcategoryDeleteSchema,
  subcategoryUpdateSchema,
} from "@/lib/validation/category";
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  updateCategory,
  updateSubcategory,
} from "@/server/services/category.service";

function revalidateCategories() {
  revalidatePath("/settings/categories");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export const createCategoryAction = action(
  categoryCreateSchema,
  async ({ input, user }) => {
    const r = await createCategory(user.id, input);
    revalidateCategories();
    return r;
  },
);

export const updateCategoryAction = action(
  categoryUpdateSchema,
  async ({ input, user }) => {
    const r = await updateCategory(user.id, input);
    revalidateCategories();
    return r;
  },
);

export const deleteCategoryAction = action(
  categoryDeleteSchema,
  async ({ input, user }) => {
    const r = await deleteCategory(user.id, input);
    revalidateCategories();
    return r;
  },
);

export const createSubcategoryAction = action(
  subcategoryCreateSchema,
  async ({ input, user }) => {
    const r = await createSubcategory(user.id, input);
    revalidateCategories();
    return r;
  },
);

export const updateSubcategoryAction = action(
  subcategoryUpdateSchema,
  async ({ input, user }) => {
    const r = await updateSubcategory(user.id, input);
    revalidateCategories();
    return r;
  },
);

export const deleteSubcategoryAction = action(
  subcategoryDeleteSchema,
  async ({ input, user }) => {
    const r = await deleteSubcategory(user.id, input.id);
    revalidateCategories();
    return r;
  },
);
