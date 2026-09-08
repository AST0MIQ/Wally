import { NextResponse } from "next/server";
import { constructStripeEvent, fulfillPaidOrder } from "@/server/services/cosmetics/commerce.service";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });
  try {
    const event = constructStripeEvent(await request.text(), signature);
    if (event.type === "checkout.session.completed" && event.data.object.payment_status === "paid") {
      const orderId = event.data.object.metadata?.orderId;
      if (orderId) {
        await fulfillPaidOrder(
          orderId,
          String(event.data.object.payment_intent ?? ""),
          undefined,
          true,
        );
      }
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "invalid webhook" }, { status: 400 });
  }
}
