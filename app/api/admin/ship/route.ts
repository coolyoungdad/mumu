import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inventory_item_id, tracking_number } = await req.json();

  if (!inventory_item_id) {
    return NextResponse.json({ error: "Missing inventory_item_id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_inventory")
    .update({
      status: "shipped",
      tracking_number: tracking_number || null,
      shipped_at: new Date().toISOString(),
    })
    .eq("id", inventory_item_id)
    .eq("status", "shipping_requested");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
