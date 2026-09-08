"use server";
import { revalidatePath } from "next/cache";
import { adminAction } from "@/server/lib/admin-action";
import { productIdSchema, productSchema, productStatusSchema } from "@/lib/validation/commerce";
import { createProduct, retryPaidOrder, setProductStatus } from "@/server/services/cosmetics/commerce.service";

export const createProductAction = adminAction(productSchema, async ({ input, admin }) => { const item = await createProduct(admin.id, input); revalidatePath("/admin/commerce/products"); return { id: item.id }; }, { permission: "commerce.write", name: "commerce.product.create" });
export const setProductStatusAction = adminAction(productStatusSchema, async ({ input, admin }) => { await setProductStatus(admin.id, input.id, input.status); revalidatePath("/admin/commerce/products"); }, { permission: "commerce.write", name: "commerce.product.status" });
export const fulfillOrderAction = adminAction(productIdSchema, async ({ input, admin }) => { await retryPaidOrder(input.id, admin.id); revalidatePath("/admin/commerce/orders"); }, { permission: "commerce.write", name: "commerce.order.fulfill" });
