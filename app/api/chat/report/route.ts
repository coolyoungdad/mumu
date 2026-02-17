import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // DEMO MODE - Allow unauthenticated users for testing
    if (!user && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { messageId, reason } = await req.json();

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    const userId = user?.id || 'demo-user';

    // DEMO MODE - Return success without database insert
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Report submitted (demo mode)",
      });
    }

    // Check if already reported by this user
    const { data: existing } = await supabase
      .from('chat_reports')
      .select('id')
      .eq('message_id', messageId)
      .eq('reported_by', userId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You have already reported this message" },
        { status: 400 }
      );
    }

    // Create report
    const { error: insertError } = await supabase
      .from('chat_reports')
      .insert({
        message_id: messageId,
        reported_by: userId,
        reason: reason || 'User reported',
      });

    if (insertError) throw insertError;

    // Log the report action
    await supabase.from('chat_moderation_logs').insert({
      message_id: messageId,
      user_id: userId,
      action: 'reported',
      reason: 'user_report',
      details: { report_reason: reason }
    });

    return NextResponse.json({
      success: true,
      message: "Report submitted successfully",
    });
  } catch (error) {
    console.error("Chat report error:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
