import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { BOX_PRICE, SHIPPING_FEE } from "@/lib/types/database";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-01-28.clover",
  });
  try {
    const { quantity = 1 } = await request.json();

    // Validate quantity
    if (quantity < 1 || quantity > 10) {
      return NextResponse.json(
        { error: "Quantity must be between 1 and 10" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Start a transaction to select product and reserve inventory atomically
    const { data: selectedProducts, error: selectionError } = await supabase.rpc(
      "reserve_mystery_boxes",
      { p_quantity: quantity }
    );

    if (selectionError || !selectedProducts || selectedProducts.length === 0) {
      return NextResponse.json(
        { error: "No products available. Please try again later." },
        { status: 409 }
      );
    }

    // Calculate totals
    const subtotal = BOX_PRICE * quantity;
    const shippingFee = SHIPPING_FEE; // Flat rate regardless of quantity
    const total = subtotal + shippingFee;

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Mumu Mystery Box",
              description: "One curated mystery item from top brands",
              images: ["https://your-domain.com/mystery-box.jpg"], // TODO: Replace with actual image
            },
            unit_amount: Math.round(BOX_PRICE * 100), // Convert to cents
          },
          quantity,
        },
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Shipping",
              description: "USPS First Class shipping",
            },
            unit_amount: Math.round(SHIPPING_FEE * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
      metadata: {
        product_ids: JSON.stringify(selectedProducts.map((p: any) => p.id)),
      },
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
    });

    // Create order record with pending status
    const { data: user } = await supabase.auth.getUser();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.user?.id || null,
        status: "pending",
        stripe_session_id: session.id,
        subtotal,
        shipping_fee: shippingFee,
        total_amount: total,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Failed to create order:", orderError);
      // Note: Inventory is already reserved at this point
      // TODO: Implement compensation logic to release inventory
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = selectedProducts.map((product: any) => ({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      rarity: product.rarity,
      price_at_purchase: BOX_PRICE,
      resale_value_at_purchase: product.resale_value,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Failed to create order items:", itemsError);
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
