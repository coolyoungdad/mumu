import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BoxOpenResult } from "@/lib/types/database";
import { checkBoxOpenLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
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

    // Parse optional excluded_ids from shake feature
    const body = await req.json().catch(() => ({}));
    const excludedIds: string[] = Array.isArray(body?.excluded_ids) ? body.excluded_ids : [];

    let data, error;

    if (excludedIds.length > 0) {
      // Open box with shake exclusions
      ({ data, error } = await supabase.rpc("open_mystery_box_with_exclusions", {
        p_user_id: user.id,
        p_excluded_ids: excludedIds,
      }));
    } else {
      // Standard box open
      ({ data, error } = await supabase.rpc("open_mystery_box", {
        p_user_id: user.id,
      }));
    }

    if (error) {
      console.error("Box open error:", error);
      return NextResponse.json(
        { error: "Failed to open box", details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.error("Box open returned no data");
      return NextResponse.json(
        { error: "Failed to open box - no data returned" },
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
        rarity: result.rarity,
        buyback_price: result.buyback_price,
        resale_value: result.resale_value,
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
