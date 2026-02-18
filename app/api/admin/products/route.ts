import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!data || data.role !== "admin") return null;
  return supabase;
}

// GET — list all products with current stock
export async function GET() {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("products")
    .select("*, inventory(quantity_available)")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const products = (data ?? []).map((p) => {
    const inv = Array.isArray(p.inventory) ? p.inventory[0] : p.inventory;
    return { ...p, stock: inv?.quantity_available ?? 0 };
  });

  return NextResponse.json({ products });
}

// POST — create a new product + initial inventory entry
export async function POST(req: Request) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    name, sku, rarity, wholesale_cost, resale_value,
    buyback_price, description, image_url, initial_stock,
  } = body;

  if (!name || !sku || !rarity || !buyback_price) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name,
      sku: sku.toUpperCase(),
      rarity,
      wholesale_cost: parseFloat(wholesale_cost) || 12.00,
      resale_value: parseFloat(resale_value) || 0,
      buyback_price: parseFloat(buyback_price),
      description: description || "",
      image_url: image_url || null,
    })
    .select()
    .single();

  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });

  // Create inventory row for this product
  const qty = parseInt(initial_stock) || 0;
  if (qty > 0) {
    await supabase
      .from("inventory")
      .insert({ product_id: product.id, quantity_available: qty });
  }

  return NextResponse.json({ product });
}
