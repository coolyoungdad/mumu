import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkShakeLimit } from "@/lib/rate-limit";
import { SHAKE_PRICE } from "@/lib/types/database";

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 5 shakes per minute
    const { success: withinLimit } = await checkShakeLimit(user.id);
    if (!withinLimit) {
      return NextResponse.json(
        { error: "Too many shakes. Please wait a moment." },
        { status: 429 }
      );
    }

    // Parse body
    const body = await req.json().catch(() => ({}));
    const { idempotency_key } = body as { idempotency_key?: string };

    if (!idempotency_key || typeof idempotency_key !== "string" || idempotency_key.length > 64) {
      return NextResponse.json({ error: "Invalid idempotency key" }, { status: 400 });
    }

    // Charge the user atomically (with idempotency check)
    const { data: chargeResult, error: chargeError } = await supabase.rpc("charge_for_shake", {
      p_user_id: user.id,
      p_shake_price: SHAKE_PRICE,
      p_idempotency_key: idempotency_key,
    });

    if (chargeError) {
      console.error("Shake charge error:", chargeError);
      return NextResponse.json({ error: "Failed to process shake" }, { status: 500 });
    }

    const charge = chargeResult[0];

    if (!charge.success) {
      return NextResponse.json({ error: charge.message }, { status: 402 });
    }

    // If already charged (idempotency hit), return without new eliminations
    // The client should use its cached localStorage state
    if (charge.already_charged) {
      return NextResponse.json({
        success: true,
        already_charged: true,
        eliminated_product_ids: [],
        eliminated_count: 0,
        new_balance: charge.new_balance,
      });
    }

    // Fetch all products with stock > 0 to build the elimination pool
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, rarity, inventory!inner(quantity_available)")
      .gt("inventory.quantity_available", 0);

    if (productsError || !products) {
      console.error("Products fetch error:", productsError);
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    // Never eliminate ultra items — they're the jackpot
    // Eliminate 50% within each rarity tier so no tier can be wiped out
    const rarities = ["common", "uncommon", "rare"] as const;
    const eliminatedIds: string[] = [];

    for (const rarity of rarities) {
      const tier = products.filter((p) => p.rarity === rarity);
      const count = Math.floor(tier.length * 0.5);
      const eliminated = shuffle(tier).slice(0, count);
      eliminatedIds.push(...eliminated.map((p) => p.id));
    }

    return NextResponse.json({
      success: true,
      already_charged: false,
      eliminated_product_ids: eliminatedIds,
      eliminated_count: eliminatedIds.length,
      new_balance: charge.new_balance,
    });
  } catch (error) {
    console.error("Shake route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
