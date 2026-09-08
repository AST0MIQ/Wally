import Stripe from "stripe";
import { prisma } from "@/server/db";
import { auditInTx } from "@/server/lib/audit";
import { conflict, notFound } from "@/server/lib/errors";
import { serializableTx } from "@/server/lib/tx";
import { grantAssetInTx } from "@/server/services/cosmetics/entitlement.service";

function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) conflict("stripe_not_configured");
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-07-29.dahlia" });
}

export function listProducts(admin = false) {
  return prisma.cosmeticProduct.findMany({ where: admin ? {} : { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, include: { grantsAsset: true, grantsCollection: true, _count: { select: { orders: true } } } });
}
export function listOrders() {
  return prisma.cosmeticOrder.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { user: { select: { email: true, name: true } }, product: { select: { name: true } } } });
}

export async function createProduct(adminId: string, input: { slug: string; name: string; description?: string; price: number; currency: string; grantsCollectionId?: string; grantsAssetId?: string }) {
  if (Boolean(input.grantsCollectionId) === Boolean(input.grantsAssetId)) conflict("choose_one_reward");
  return serializableTx(async (tx) => {
    const product = await tx.cosmeticProduct.create({ data: { ...input, price: input.price } });
    await auditInTx(tx, { userId: adminId, action: "commerce.product.create", entity: "CosmeticProduct", entityId: product.id });
    return product;
  });
}

export async function setProductStatus(adminId: string, id: string, status: "DRAFT" | "ACTIVE" | "ARCHIVED") {
  return serializableTx(async (tx) => {
    const current = await tx.cosmeticProduct.findUnique({
      where: { id },
      include: { grantsAsset: true, grantsCollection: { include: { assets: { include: { asset: true } } } } },
    });
    if (!current) notFound("product_not_found");
    if (status === "ACTIVE") {
      if (current.grantsAsset && current.grantsAsset.status !== "PUBLISHED") conflict("product_asset_not_published");
      if (current.grantsCollection && (current.grantsCollection.status !== "PUBLISHED" || current.grantsCollection.assets.length === 0 || current.grantsCollection.assets.some((item) => item.asset.status !== "PUBLISHED"))) conflict("product_collection_not_ready");
    }
    const product = await tx.cosmeticProduct.update({ where: { id }, data: { status } });
    await auditInTx(tx, { userId: adminId, action: "commerce.product.status", entity: "CosmeticProduct", entityId: id, metadata: { status } });
    return product;
  });
}

export async function createCheckout(userId: string, productId: string, origin: string) {
  const product = await prisma.cosmeticProduct.findUnique({ where: { id: productId } });
  if (!product) notFound("product_not_found");
  if (product.status !== "ACTIVE") conflict("product_not_available");
  const order = await prisma.cosmeticOrder.create({ data: { userId, productId, amount: product.price, currency: product.currency } });
  try {
    const session = await stripeClient().checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}/shop?paid=1`,
      cancel_url: `${origin}/shop?cancelled=1`,
      client_reference_id: order.id,
      metadata: { orderId: order.id, userId },
      line_items: [{ quantity: 1, price_data: { currency: product.currency.toLowerCase(), unit_amount: Math.round(Number(product.price) * 100), product_data: { name: product.name, description: product.description ?? undefined } } }],
    });
    await prisma.cosmeticOrder.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
    if (!session.url) conflict("checkout_url_missing");
    return session.url;
  } catch (error) {
    await prisma.cosmeticOrder.update({ where: { id: order.id }, data: { status: "CANCELLED" } }).catch(() => undefined);
    throw error;
  }
}

export async function fulfillPaidOrder(
  orderId: string,
  paymentId?: string,
  adminId?: string,
  paymentVerified = false,
) {
  return serializableTx(async (tx) => {
    const order = await tx.cosmeticOrder.findUnique({ where: { id: orderId }, include: { product: { include: { grantsCollection: { include: { assets: true } } } } } });
    if (!order) notFound("order_not_found");
    if (order.status === "FULFILLED") return order;
    // A signed Stripe webhook may move PENDING straight to fulfillment. Manual
    // retries are only valid after an order has already been marked PAID.
    if (!paymentVerified && order.status !== "PAID") conflict("order_not_paid");
    if (order.status === "CANCELLED" || order.status === "REFUNDED") conflict("order_not_fulfillable");
    const assetIds = order.product.grantsAssetId ? [order.product.grantsAssetId] : order.product.grantsCollection?.assets.map((x) => x.assetId) ?? [];
    for (const assetId of assetIds) await grantAssetInTx(tx, order.userId, assetId, { acquisitionType: "PURCHASE", sourceRef: `order:${order.id}`, sourceCollectionId: order.product.grantsCollectionId ?? undefined, grantedByAdminId: adminId });
    const done = await tx.cosmeticOrder.update({ where: { id: order.id }, data: { status: "FULFILLED", stripePaymentId: paymentId ?? order.stripePaymentId, fulfilledAt: new Date(), fulfilledById: adminId } });
    await auditInTx(tx, { userId: adminId ?? order.userId, action: "commerce.order.fulfill", entity: "CosmeticOrder", entityId: order.id, metadata: { assetCount: assetIds.length } });
    return done;
  });
}

/** Admin recovery path: verify the Checkout Session with Stripe before granting. */
export async function retryPaidOrder(orderId: string, adminId: string) {
  const order = await prisma.cosmeticOrder.findUnique({ where: { id: orderId } });
  if (!order) notFound("order_not_found");
  if (order.status === "FULFILLED") return order;
  if (!order.stripeSessionId) conflict("checkout_session_missing");
  const session = await stripeClient().checkout.sessions.retrieve(order.stripeSessionId);
  if (session.payment_status !== "paid") conflict("order_not_paid");
  return fulfillPaidOrder(
    order.id,
    String(session.payment_intent ?? order.stripePaymentId ?? ""),
    adminId,
    true,
  );
}

export function constructStripeEvent(body: string, signature: string) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) conflict("stripe_webhook_not_configured");
  return stripeClient().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
}
