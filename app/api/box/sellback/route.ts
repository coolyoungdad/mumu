import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SellbackResult } from "@/lib/types/database";

export async function POST(request: NextRequest) {
  try {
    const { inventory_item_id, buyback_price } = await request.json();

    if (!inventory_item_id) {
      return NextResponse.json(
        { error: "inventory_item_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call database function to sell back item atomically
    const { data, error } = await supabase.rpc("sellback_item", {
      p_user_id: user.id,
      p_inventory_item_id: inventory_item_id,
    });

    if (error) {
      console.error("Sellback error:", error);
      return NextResponse.json(
        { error: "Failed to sell back item" },
        { status: 500 }
      );
    }

    const result = data[0] as SellbackResult;

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      amount_credited: result.amount_credited,
      new_balance: result.new_balance,
    });
  } catch (error) {
    console.error("Sellback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
