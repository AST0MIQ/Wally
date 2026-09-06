import type { Metadata } from "next";

import { requireUser } from "@/server/lib/guards";
import { listCategories } from "@/server/services/category.service";
import { CategoriesManager } from "@/components/categories/categories-manager";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesSettingsPage() {
  const user = await requireUser();
  const categories = await listCategories(user.id);

  return <CategoriesManager initial={categories} />;
}
