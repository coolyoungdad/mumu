import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, name, sku, rarity, buyback_price, resale_value, description, inventory(quantity_available)"
      )
      .order("name");

    if (error) {
      console.error("Products fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    const products = (data ?? []).map((p) => {
      const inv = Array.isArray(p.inventory) ? p.inventory[0] : p.inventory;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        rarity: p.rarity,
        buyback_price: parseFloat(p.buyback_price),
        resale_value: parseFloat(p.resale_value),
        brand: p.description ?? "",
        stock: inv?.quantity_available ?? 0,
      };
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Products route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
