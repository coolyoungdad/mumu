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

// PATCH — update a product's fields or adjust stock
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { add_stock, ...productFields } = body;

  // If add_stock is provided, adjust inventory quantity
  if (add_stock !== undefined) {
    const qty = parseInt(add_stock);
    if (isNaN(qty) || qty === 0) {
      return NextResponse.json({ error: "Invalid stock amount" }, { status: 400 });
    }

    const { data: inv } = await supabase
      .from("inventory")
      .select("id, quantity_available")
      .eq("product_id", id)
      .single();

    if (inv) {
      const newQty = Math.max(0, inv.quantity_available + qty);
      await supabase
        .from("inventory")
        .update({ quantity_available: newQty })
        .eq("product_id", id);
    } else {
      // No inventory row yet — create one
      await supabase
        .from("inventory")
        .insert({ product_id: id, quantity_available: Math.max(0, qty) });
    }
  }

  // If product fields are provided, update the product
  if (Object.keys(productFields).length > 0) {
    const updateData: Record<string, unknown> = {};
    if (productFields.name !== undefined) updateData.name = productFields.name;
    if (productFields.sku !== undefined) updateData.sku = productFields.sku.toUpperCase();
    if (productFields.rarity !== undefined) updateData.rarity = productFields.rarity;
    if (productFields.wholesale_cost !== undefined) updateData.wholesale_cost = parseFloat(productFields.wholesale_cost);
    if (productFields.resale_value !== undefined) updateData.resale_value = parseFloat(productFields.resale_value);
    if (productFields.buyback_price !== undefined) updateData.buyback_price = parseFloat(productFields.buyback_price);
    if (productFields.description !== undefined) updateData.description = productFields.description;
    if (productFields.image_url !== undefined) updateData.image_url = productFields.image_url;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE — remove a product (only if it has no active user inventory)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Check if any users currently hold this item
  const { count } = await supabase
    .from("user_inventory")
    .select("*", { count: "exact", head: true })
    .eq("product_id", id)
    .in("status", ["kept", "shipping_requested", "shipped"]);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Cannot delete: users currently hold this item in their collection." },
      { status: 409 }
    );
  }

  // Remove inventory row first
  await supabase.from("inventory").delete().eq("product_id", id);
  // Remove the product
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
