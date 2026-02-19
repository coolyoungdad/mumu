import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { inventory_item_id, address } = body as {
      inventory_item_id: string;
      address: ShippingAddress;
    };

    if (!inventory_item_id || !address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate required address fields
    if (
      !address.name?.trim() ||
      !address.line1?.trim() ||
      !address.city?.trim() ||
      !address.state?.trim() ||
      !address.postal_code?.trim() ||
      !address.country?.trim()
    ) {
      return NextResponse.json(
        { error: "Please fill in all required address fields" },
        { status: 400 }
      );
    }

    // Get user's current balance to determine shipping fee
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("account_balance")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentBalance = userData.account_balance;

    // Calculate shipping fee: $5 if balance < $50, free if >= $50
    const shippingFee = currentBalance >= 50 ? 0 : 5.00;

    // Check if user can afford shipping
    if (shippingFee > 0 && currentBalance < shippingFee) {
      return NextResponse.json(
        {
          error: `Insufficient balance for shipping. $${shippingFee.toFixed(2)} required, you have $${currentBalance.toFixed(2)}`,
        },
        { status: 402 }
      );
    }

    // Verify this item belongs to the user and is in 'kept' status
    const { data: item, error: itemError } = await supabase
      .from("user_inventory")
      .select("id, status, product_name")
      .eq("id", inventory_item_id)
      .eq("user_id", user.id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.status !== "kept") {
      return NextResponse.json(
        { error: "This item is not available for shipping" },
        { status: 409 }
      );
    }

    // Deduct shipping fee from balance (if applicable)
    if (shippingFee > 0) {
      const { error: balanceError } = await supabase
        .from("users")
        .update({ account_balance: currentBalance - shippingFee })
        .eq("id", user.id);

      if (balanceError) {
        console.error("Balance deduction error:", balanceError);
        return NextResponse.json(
          { error: "Failed to process shipping fee" },
          { status: 500 }
        );
      }

      // Record shipping fee transaction
      await supabase.from("balance_transactions").insert({
        user_id: user.id,
        amount: -shippingFee,
        type: "box_purchase", // Reuse existing type for fees
        description: "Shipping fee",
        related_inventory_id: inventory_item_id,
      });
    }

    // Update item: store address, shipping fee, and mark as shipping_requested
    const { error: updateError } = await supabase
      .from("user_inventory")
      .update({
        status: "shipping_requested",
        shipping_fee: shippingFee,
        shipping_address: {
          name: address.name.trim(),
          line1: address.line1.trim(),
          line2: address.line2?.trim() || null,
          city: address.city.trim(),
          state: address.state.trim(),
          postal_code: address.postal_code.trim(),
          country: address.country.trim(),
        },
      })
      .eq("id", inventory_item_id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Shipping request update error:", updateError);
      return NextResponse.json(
        { error: "Failed to submit shipping request" },
        { status: 500 }
      );
    }

    console.log(
      `Shipping requested: ${item.product_name} → ${address.name}, ${address.city}, ${address.state} (fee: $${shippingFee.toFixed(2)})`
    );

    return NextResponse.json({
      success: true,
      shipping_fee: shippingFee,
      new_balance: currentBalance - shippingFee,
    });
  } catch (error) {
    console.error("Shipping request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
