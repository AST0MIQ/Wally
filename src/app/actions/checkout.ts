"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/lib/guards";
import { checkoutSchema } from "@/lib/validation/commerce";
import { createCheckout } from "@/server/services/cosmetics/commerce.service";

export async function checkoutAction(formData: FormData) {
  const user = await requireUser();
  const { productId } = checkoutSchema.parse({ productId: formData.get("productId") });
  const h = await headers();
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") === "http" ? "http" : "https";
  const origin = configured
    ? new URL(configured).origin
    : new URL(`${proto}://${host && /^[a-z0-9.-]+(?::\d+)?$/i.test(host) ? host : "localhost:3000"}`).origin;
  redirect(await createCheckout(user.id, productId, origin));
}
