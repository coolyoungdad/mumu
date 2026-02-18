import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Set balance back to $500
    const { error } = await supabase
      .from("users")
      .update({ account_balance: 500 })
      .eq("id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, balance: 500 });
  } catch (error) {
    console.error("Demo refill error:", error);
    return NextResponse.json(
      { error: "Failed to refill balance" },
      { status: 500 }
    );
  }
}
