import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { action, targetUserId, messageId, reason, muteDuration } = await req.json();

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case 'ban_user':
        if (!targetUserId) {
          return NextResponse.json(
            { error: "Target user ID is required" },
            { status: 400 }
          );
        }

        // Get current ban count
        const { data: banMod } = await supabase
          .from('user_moderation')
          .select('ban_count')
          .eq('user_id', targetUserId)
          .single();

        await supabase
          .from('user_moderation')
          .upsert({
            user_id: targetUserId,
            is_banned: true,
            banned_at: new Date().toISOString(),
            banned_by: user.id,
            ban_reason: reason || 'Admin action',
            ban_count: (banMod?.ban_count || 0) + 1,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        await supabase.from('chat_moderation_logs').insert({
          user_id: targetUserId,
          action: 'banned',
          reason: 'admin_action',
          moderator_id: user.id,
          details: { ban_reason: reason }
        });

        return NextResponse.json({ success: true, message: "User banned" });

      case 'unban_user':
        if (!targetUserId) {
          return NextResponse.json(
            { error: "Target user ID is required" },
            { status: 400 }
          );
        }

        await supabase
          .from('user_moderation')
          .update({
            is_banned: false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', targetUserId);

        await supabase.from('chat_moderation_logs').insert({
          user_id: targetUserId,
          action: 'unbanned',
          reason: 'admin_action',
          moderator_id: user.id,
        });

        return NextResponse.json({ success: true, message: "User unbanned" });

      case 'mute_user':
        if (!targetUserId) {
          return NextResponse.json(
            { error: "Target user ID is required" },
            { status: 400 }
          );
        }

        const muteUntil = muteDuration
          ? new Date(Date.now() + muteDuration * 1000).toISOString()
          : null;

        // Get current mute count
        const { data: muteMod } = await supabase
          .from('user_moderation')
          .select('mute_count')
          .eq('user_id', targetUserId)
          .single();

        await supabase
          .from('user_moderation')
          .upsert({
            user_id: targetUserId,
            is_muted: true,
            muted_until: muteUntil,
            mute_count: (muteMod?.mute_count || 0) + 1,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        await supabase.from('chat_moderation_logs').insert({
          user_id: targetUserId,
          action: 'muted',
          reason: 'admin_action',
          moderator_id: user.id,
          details: { mute_duration: muteDuration, muted_until: muteUntil }
        });

        return NextResponse.json({ success: true, message: "User muted" });

      case 'unmute_user':
        if (!targetUserId) {
          return NextResponse.json(
            { error: "Target user ID is required" },
            { status: 400 }
          );
        }

        await supabase
          .from('user_moderation')
          .update({
            is_muted: false,
            muted_until: null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', targetUserId);

        await supabase.from('chat_moderation_logs').insert({
          user_id: targetUserId,
          action: 'unmuted',
          reason: 'admin_action',
          moderator_id: user.id,
        });

        return NextResponse.json({ success: true, message: "User unmuted" });

      case 'delete_message':
        if (!messageId) {
          return NextResponse.json(
            { error: "Message ID is required" },
            { status: 400 }
          );
        }

        // Get message details before deleting
        const { data: message } = await supabase
          .from('chat_messages')
          .select('user_id')
          .eq('id', messageId)
          .single();

        await supabase
          .from('chat_messages')
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: user.id,
          })
          .eq('id', messageId);

        await supabase.from('chat_moderation_logs').insert({
          message_id: messageId,
          user_id: message?.user_id,
          action: 'deleted',
          reason: 'admin_action',
          moderator_id: user.id,
          details: { delete_reason: reason }
        });

        return NextResponse.json({ success: true, message: "Message deleted" });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Chat moderate error:", error);
    return NextResponse.json(
      { error: "Failed to perform moderation action" },
      { status: 500 }
    );
  }
}
