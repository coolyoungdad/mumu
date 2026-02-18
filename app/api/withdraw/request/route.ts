import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  sendWithdrawalConfirmation,
  scheduleWithdrawalNudge,
  scheduleWinBackEmail,
} from "@/lib/email";

const MIN_WITHDRAWAL = 10;
const MAX_WITHDRAWAL = 500;
const HOLD_DAYS = 7;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const amount = parseFloat(body.amount);
    const paypalEmail = (body.paypal_email ?? "").trim();

    // Validate amount
    if (!amount || isNaN(amount) || amount < MIN_WITHDRAWAL) {
      return NextResponse.json({ error: `Minimum withdrawal is $${MIN_WITHDRAWAL}` }, { status: 400 });
    }
    if (amount > MAX_WITHDRAWAL) {
      return NextResponse.json({ error: `Maximum withdrawal is $${MAX_WITHDRAWAL} per request` }, { status: 400 });
    }

    // Validate PayPal email
    if (!paypalEmail || !paypalEmail.includes("@")) {
      return NextResponse.json({ error: "Valid PayPal email is required" }, { status: 400 });
    }

    // 7-day chargeback hold: check when the user last topped up
    const holdDate = new Date();
    holdDate.setDate(holdDate.getDate() - HOLD_DAYS);

    const { data: lastTopup } = await supabase
      .from("balance_transactions")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("type", "topup")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lastTopup) {
      const lastTopupDate = new Date(lastTopup.created_at);
      if (lastTopupDate > holdDate) {
        const releaseDate = new Date(lastTopupDate);
        releaseDate.setDate(releaseDate.getDate() + HOLD_DAYS);
        const releaseStr = releaseDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });
        return NextResponse.json(
          { error: `Withdrawals are held 7 days after your last deposit. Available from ${releaseStr}.` },
          { status: 400 }
        );
      }
    }

    // Check balance and deduct atomically via RPC
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("account_balance, email")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 });
    }

    const currentBalance = parseFloat(userData.account_balance.toString());
    if (currentBalance < amount) {
      return NextResponse.json(
        { error: `Insufficient balance. You have $${currentBalance.toFixed(2)}.` },
        { status: 400 }
      );
    }

    // Deduct balance
    const { data: updatedUser, error: deductError } = await supabase
      .from("users")
      .update({ account_balance: currentBalance - amount })
      .eq("id", user.id)
      .eq("account_balance", userData.account_balance) // optimistic lock
      .select("account_balance")
      .single();

    if (deductError || !updatedUser) {
      return NextResponse.json({ error: "Failed to deduct balance. Please try again." }, { status: 500 });
    }

    const newBalance = parseFloat(updatedUser.account_balance.toString());

    // Create balance_transactions record
    const { error: txError } = await supabase
      .from("balance_transactions")
      .insert({
        user_id: user.id,
        amount: -amount,
        type: "withdrawal",
        description: `Withdrawal to PayPal (${paypalEmail})`,
      });

    if (txError) {
      console.error("Failed to create transaction record:", txError);
      // Non-fatal — balance was already deducted, withdrawal request will still be created
    }

    // Create withdrawal request
    const { error: reqError } = await supabase
      .from("withdrawal_requests")
      .insert({
        user_id: user.id,
        user_email: userData.email,
        amount,
        paypal_email: paypalEmail,
        status: "pending",
      });

    if (reqError) {
      console.error("Failed to create withdrawal request:", reqError);
      // Refund if request creation failed
      await supabase
        .from("users")
        .update({ account_balance: currentBalance })
        .eq("id", user.id);
      return NextResponse.json({ error: "Failed to submit request. Your balance has been restored." }, { status: 500 });
    }

    // Fire re-engagement emails (all non-blocking — never delay the response for email)
    const userName = userData.email.split("@")[0] ?? "there";
    void sendWithdrawalConfirmation({ to: userData.email, name: userName, amount, paypalEmail });
    void scheduleWithdrawalNudge({ to: userData.email, name: userName, amount });
    void scheduleWinBackEmail({ to: userData.email, name: userName });

    return NextResponse.json({
      success: true,
      new_balance: newBalance,
      message: `Withdrawal of $${amount.toFixed(2)} submitted. You'll receive payment to ${paypalEmail} within 2–3 business days.`,
    });
  } catch (err) {
    console.error("Withdrawal request error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
