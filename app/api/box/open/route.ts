import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BoxOpenResult } from "@/lib/types/database";

export async function POST() {
  try {
    // DEMO MODE - Return mock box opening result
    const productsByRarity = {
      common: [
        "Aries Molly", "Astronaut Dimoo", "Ballet Girl Molly", "Beach Time Hangyodon",
        "Bee Elf Labubu", "Bunny Pajamas My Melody", "Carnival Dancer Labubu", "Chef Molly",
        "Christmas Baby Pucky", "Circus Ringmaster Labubu", "Clown Labubu", "Cloud Traveler Dimoo",
        "Flower Elf Labubu", "Forest Baby Pucky", "Gothic Dress Kuromi", "Ice Cream Labubu",
        "Milk Tea Cinnamoroll", "Monster Baby Pucky", "Moonlight Dimoo", "Pajama Time Pompompurin",
        "Party Queen Kuromi", "Pisces Molly", "Planet Explorer Dimoo", "Pudding Chef Pompompurin",
        "Rainy Day Keroppi", "Retro TV Molly", "Rock Star Badtz-Maru", "Rose Elf Labubu",
        "Sakura Kimono Hello Kitty", "Schoolgirl Molly"
      ],
      uncommon: [
        "Shadow Labubu", "Sky Angel Cinnamoroll", "Sleeping Baby Pucky", "Sleeping Deer Dimoo",
        "Space Bunny Dimoo", "Space Molly", "Stargazer Dimoo", "Starry Night Little Twin Stars",
        "Strawberry Dress Hello Kitty", "Strawberry Macaron Labubu", "Sweet Tooth Labubu",
        "Tea Party My Melody", "Winter Coat Tuxedosam"
      ],
      rare: [
        "The Awakening Skullpanda", "The Grief Skullpanda", "The Joy Skullpanda",
        "The Obsession Skullpanda", "The Riddle Skullpanda"
      ],
      ultra: [
        "The Other One Hirono", "The Warmth Skullpanda"
      ]
    };

    const rarities = ["common", "uncommon", "rare", "ultra"];
    const weights = [60, 25, 10, 5]; // Weighted probabilities
    const random = Math.random() * 100;
    let cumulativeWeight = 0;
    let selectedRarity = "common";

    for (let i = 0; i < rarities.length; i++) {
      cumulativeWeight += weights[i];
      if (random < cumulativeWeight) {
        selectedRarity = rarities[i];
        break;
      }
    }

    const items = productsByRarity[selectedRarity as keyof typeof productsByRarity];
    const randomItem = items[Math.floor(Math.random() * items.length)];

    // Buyback price ranges - most lose money, some profit
    const buybackRanges: Record<string, { min: number; max: number }> = {
      common: { min: 8, max: 15 },      // Users lose $5-12 most of the time (60%)
      uncommon: { min: 25, max: 40 },   // Users break even or profit $5-20 (25%)
      rare: { min: 50, max: 80 },       // Nice profit $30-60 (10%)
      ultra: { min: 150, max: 300 },    // Big win $130-280 (5%)
    };

    const range = buybackRanges[selectedRarity];
    const buybackPrice = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

    return NextResponse.json({
      success: true,
      product: {
        id: `demo-${Date.now()}`,
        name: randomItem,
        sku: `ITEM-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        rarity: selectedRarity,
        buyback_price: buybackPrice,
      },
      inventory_item_id: `inv-${Date.now()}`,
      new_balance: 80.01, // Mock new balance after opening
    });

    // REAL CODE - Uncomment when Supabase is set up
    // const supabase = await createClient();

    // // Get authenticated user
    // const {
    //   data: { user },
    //   error: authError,
    // } = await supabase.auth.getUser();

    // if (authError || !user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // // Call database function to open box atomically
    // const { data, error } = await supabase.rpc("open_mystery_box", {
    //   p_user_id: user.id,
    // });

    // if (error) {
    //   console.error("Box open error:", error);
    //   return NextResponse.json(
    //     { error: "Failed to open box" },
    //     { status: 500 }
    //   );
    // }

    // const result = data[0] as BoxOpenResult;

    // if (!result.success) {
    //   return NextResponse.json(
    //     { error: result.message },
    //     { status: result.message === "Insufficient balance" ? 402 : 409 }
    //   );
    // }

    // return NextResponse.json({
    //   success: true,
    //   product: {
    //     id: result.product_id,
    //     name: result.product_name,
    //     sku: result.product_sku,
    //     rarity: result.rarity,
    //     buyback_price: result.buyback_price,
    //   },
    //   inventory_item_id: result.inventory_item_id,
    //   new_balance: result.new_balance,
    // });
  } catch (error) {
    console.error("Box open error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
