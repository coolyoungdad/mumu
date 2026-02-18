import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData || userData.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const status: "completed" | "rejected" = body.status;
    const adminNote: string = body.admin_note ?? "";

    if (!["completed", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Fetch the withdrawal request first
    const { data: withdrawalReq, error: fetchError } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !withdrawalReq) {
      return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 });
    }

    if (withdrawalReq.status !== "pending" && withdrawalReq.status !== "processing") {
      return NextResponse.json({ error: "Request already processed" }, { status: 400 });
    }

    // If rejecting, refund the user's balance
    if (status === "rejected") {
      const { data: currentUser } = await supabase
        .from("users")
        .select("account_balance")
        .eq("id", withdrawalReq.user_id)
        .single();

      if (currentUser) {
        await supabase
          .from("users")
          .update({
            account_balance:
              parseFloat(currentUser.account_balance.toString()) +
              parseFloat(withdrawalReq.amount.toString()),
          })
          .eq("id", withdrawalReq.user_id);
      }

      // Create a refund transaction
      await supabase.from("balance_transactions").insert({
        user_id: withdrawalReq.user_id,
        amount: withdrawalReq.amount,
        type: "refund",
        description: `Withdrawal refund${adminNote ? `: ${adminNote}` : ""}`,
      });
    }

    // Update the withdrawal request
    const { error: updateError } = await supabase
      .from("withdrawal_requests")
      .update({
        status,
        admin_note: adminNote || null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("Admin withdrawal process error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
