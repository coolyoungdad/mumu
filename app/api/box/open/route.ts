import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BoxOpenResult } from "@/lib/types/database";
import { checkBoxOpenLimit } from "@/lib/rate-limit";

export async function POST() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting: 10 box opens per minute per user
    const { success: withinLimit } = await checkBoxOpenLimit(user.id);
    if (!withinLimit) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before opening another box." },
        { status: 429 }
      );
    }

    // Call database function to open box atomically
    const { data, error } = await supabase.rpc("open_mystery_box", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("Box open error:", error);
      return NextResponse.json(
        { error: "Failed to open box" },
        { status: 500 }
      );
    }

    const result = data[0] as BoxOpenResult;

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: result.message === "Insufficient balance" ? 402 : 409 }
      );
    }

    return NextResponse.json({
      success: true,
      product: {
        id: result.product_id,
        name: result.product_name,
        sku: result.product_sku,
        rarity: result.rarity,
        buyback_price: result.buyback_price,
      },
      inventory_item_id: result.inventory_item_id,
      new_balance: result.new_balance,
    });
  } catch (error) {
    console.error("Box open error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
