import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Check if this is a top-up or regular order
        if (session.metadata?.type === "topup") {
          await handleTopUpCompleted(session);
        } else {
          await handleCheckoutCompleted(session);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("PaymentIntent succeeded:", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleTopUpCompleted(session: Stripe.Checkout.Session) {
  const supabase = await createClient();

  const userId = session.metadata?.user_id;
  const amount = parseFloat(session.metadata?.amount || "0");

  if (!userId || !amount) {
    console.error("Missing user_id or amount in top-up session metadata");
    return;
  }

  // Credit user balance
  const { error: updateError } = await supabase
    .from("users")
    .update({
      account_balance: supabase.rpc("increment_balance", { amount }),
    })
    .eq("id", userId);

  if (updateError) {
    // Fallback: Direct update with SQL
    await supabase.rpc("credit_user_balance", {
      p_user_id: userId,
      p_amount: amount,
    });
  }

  // Create transaction record
  const { error: transactionError } = await supabase
    .from("balance_transactions")
    .insert({
      user_id: userId,
      amount,
      type: "topup",
      description: `Added $${amount.toFixed(2)} to account balance`,
      stripe_session_id: session.id,
    });

  if (transactionError) {
    console.error("Failed to create transaction record:", transactionError);
  }

  console.log(`Top-up completed: $${amount} credited to user ${userId}`);

  // TODO: Send confirmation email
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = await createClient();

  // Update order status to paid (for old flow - may not be used in V2)
  // TODO: Update shipping_details access for new Stripe API version
  const sessionWithShipping = session as any;
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .update({
      status: "paid",
      stripe_payment_intent_id: session.payment_intent as string,
      shipping_address: sessionWithShipping.shipping_details?.address
        ? {
            name: sessionWithShipping.shipping_details.name,
            line1: sessionWithShipping.shipping_details.address.line1,
            line2: sessionWithShipping.shipping_details.address.line2,
            city: sessionWithShipping.shipping_details.address.city,
            state: sessionWithShipping.shipping_details.address.state,
            postal_code: sessionWithShipping.shipping_details.address.postal_code,
            country: sessionWithShipping.shipping_details.address.country,
          }
        : null,
    })
    .eq("stripe_session_id", session.id)
    .select()
    .single();

  if (orderError) {
    console.error("Failed to update order:", orderError);
    return;
  }

  console.log("Order marked as paid:", order?.id);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const supabase = await createClient();

  // Find order by payment intent and mark as cancelled
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  if (error) {
    console.error("Failed to cancel order:", error);
  }
}
