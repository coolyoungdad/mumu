import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Blocked keywords (case-insensitive)
const BLOCKED_KEYWORDS = [
  'venmo', 'cashapp', 'cash app', 'paypal', 'zelle',
  'telegram', 'whatsapp', 'discord', 'dm me', 'direct message',
  'off-site', 'offsite', 'bitcoin', 'crypto', 'eth', 'btc'
];

// URL detection regex
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|io|gg|tv|me|co)[^\s]*)/gi;

// Check message for blocked content
function validateMessage(message: string): { valid: boolean; reason?: string } {
  // Check for URLs
  if (URL_REGEX.test(message)) {
    return { valid: false, reason: 'url' };
  }

  // Check for blocked keywords
  const lowerMessage = message.toLowerCase();
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      return { valid: false, reason: 'keywords' };
    }
  }

  return { valid: true };
}

// Call OpenAI Moderation API
async function moderateWithAI(message: string): Promise<{
  flagged: boolean;
  scores: any;
  categories: any;
}> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('OpenAI API key not configured, skipping AI moderation');
    return { flagged: false, scores: {}, categories: {} };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: message }),
    });

    if (!response.ok) {
      console.error('OpenAI moderation API error:', await response.text());
      return { flagged: false, scores: {}, categories: {} };
    }

    const data = await response.json();
    const result = data.results[0];

    return {
      flagged: result.flagged,
      scores: result.category_scores,
      categories: result.categories,
    };
  } catch (error) {
    console.error('AI moderation error:', error);
    return { flagged: false, scores: {}, categories: {} };
  }
}

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

    const { message, type = 'user', rarity, itemName } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (message.length > 200) {
      return NextResponse.json(
        { error: "Message too long (max 200 characters)" },
        { status: 400 }
      );
    }

    const userId = user?.id || 'demo-user';
    const username = user?.email?.split('@')[0] || 'You';

    // DEMO MODE - Skip database checks
    if (user) {
      // Check if user is banned or muted
      const { data: modStatus } = await supabase
        .from('user_moderation')
        .select('is_banned, is_muted, muted_until, last_message_at')
        .eq('user_id', userId)
        .single();

      if (modStatus?.is_banned) {
        return NextResponse.json(
          { error: "You have been banned from chat" },
          { status: 403 }
        );
      }

      if (modStatus?.is_muted) {
        const mutedUntil = modStatus.muted_until ? new Date(modStatus.muted_until) : null;
        if (!mutedUntil || mutedUntil > new Date()) {
          return NextResponse.json(
            { error: "You are muted from chat" },
            { status: 403 }
          );
        }
      }

      // Check 3-second cooldown
      if (modStatus?.last_message_at) {
        const lastMessageTime = new Date(modStatus.last_message_at).getTime();
        const now = Date.now();
        const cooldown = 3000; // 3 seconds

        if (now - lastMessageTime < cooldown) {
          const remainingMs = cooldown - (now - lastMessageTime);
          return NextResponse.json(
            {
              error: "Please wait before sending another message",
              cooldownRemaining: Math.ceil(remainingMs / 1000)
            },
            { status: 429 }
          );
        }
      }
    }

    // Validate message content
    const validation = validateMessage(message);
    if (!validation.valid) {
      // Log blocked message
      if (user) {
        await supabase.from('chat_moderation_logs').insert({
          user_id: userId,
          action: 'blocked',
          reason: validation.reason,
          details: { message }
        });
      }

      return NextResponse.json(
        {
          error: validation.reason === 'url'
            ? "URLs are not allowed in chat"
            : "Message contains blocked keywords"
        },
        { status: 400 }
      );
    }

    // Run AI moderation
    const moderation = await moderateWithAI(message);

    if (moderation.flagged) {
      // Log flagged message
      if (user) {
        await supabase.from('chat_moderation_logs').insert({
          user_id: userId,
          action: 'blocked',
          reason: 'ai_moderation',
          moderation_scores: moderation.scores,
          details: {
            message,
            categories: moderation.categories
          }
        });
      }

      return NextResponse.json(
        { error: "Message violates community guidelines" },
        { status: 400 }
      );
    }

    // DEMO MODE - Return success without database insert
    if (!user) {
      return NextResponse.json({
        success: true,
        message: {
          id: `demo-${Date.now()}`,
          user_id: userId,
          username,
          message,
          type,
          rarity,
          item_name: itemName,
          created_at: new Date().toISOString(),
        }
      });
    }

    // Insert message
    const { data: chatMessage, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        username,
        message,
        type,
        rarity,
        item_name: itemName,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update user's last message time
    await supabase
      .from('user_moderation')
      .upsert({
        user_id: userId,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    // Log successful moderation check
    if (moderation.scores && Object.keys(moderation.scores).length > 0) {
      await supabase.from('chat_moderation_logs').insert({
        message_id: chatMessage.id,
        user_id: userId,
        action: 'flagged',
        reason: 'ai_moderation',
        moderation_scores: moderation.scores,
        details: { passed: true }
      });
    }

    return NextResponse.json({
      success: true,
      message: chatMessage,
    });
  } catch (error) {
    console.error("Chat send error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
