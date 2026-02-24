# Chat Moderation System

Mumu includes a comprehensive chat moderation system to keep the community safe and friendly.

## Features

### 1. **Rate Limiting**
- 3-second cooldown between messages per user
- Prevents spam and flooding
- Visual countdown timer in UI

### 2. **Content Filtering**

**Blocked URLs:**
- All URLs are automatically blocked from chat messages
- Prevents phishing and malicious links

**Blocked Keywords:**
- Venmo, CashApp, PayPal, Zelle
- Telegram, WhatsApp, Discord
- "DM me", "Direct message"
- "Off-site", "Bitcoin", "Crypto", "ETH", "BTC"

### 3. **AI Moderation**
- Every message is scanned by OpenAI's Moderation API
- Checks for:
  - Hate speech
  - Harassment
  - Sexual content
  - Threats and violence
- High-risk messages are automatically blocked
- Moderation scores are logged for review

### 4. **User Reporting**
- Report button on every message (appears on hover)
- Users can report inappropriate content
- Reports are logged for admin review

### 5. **Admin Controls**

**For each message, admins can:**
- Delete the message
- Mute the user (1 hour)
- Ban the user permanently

**Admin actions are:**
- Logged in `chat_moderation_logs` table
- Include moderator ID and timestamp
- Preserved for audit trail

### 6. **Database Logging**
All moderation events are logged to `chat_moderation_logs`:
- Blocked messages (URL, keywords, AI)
- User reports
- Admin actions (delete, mute, ban)
- AI moderation scores

## Setup

### 1. Run Database Migrations

```bash
# Apply the chat moderation schema
psql -h <your-supabase-host> -U postgres -d postgres -f lib/db/migrations/004_chat_moderation.sql
```

Or in Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `lib/db/migrations/004_chat_moderation.sql`
3. Run the migration

### 2. Configure OpenAI API (Optional but Recommended)

Add to `.env.local`:

```bash
OPENAI_API_KEY=sk-your-openai-api-key
```

**Get an API key:**
1. Sign up at https://platform.openai.com
2. Go to API Keys section
3. Create new secret key
4. The Moderation API is FREE to use

**Without OpenAI API:**
- System will still work with URL and keyword filtering
- AI moderation will be skipped (logged as warning)

### 3. Set Admin Users

After migration, mark users as admin:

```sql
UPDATE users
SET is_admin = true
WHERE email = 'your-admin-email@example.com';
```

## Database Schema

### Tables Created

**`chat_messages`**
- Stores all chat messages
- Tracks message type (user or pull announcement)
- Soft delete support (is_deleted flag)

**`chat_moderation_logs`**
- Audit trail of all moderation events
- Stores AI moderation scores
- Links to moderator who took action

**`user_moderation`**
- Tracks user moderation status
- Ban and mute states
- Last message timestamp (for cooldown)
- Mute expiration time

**`chat_reports`**
- User-submitted reports
- Review status tracking
- Action taken on each report

## API Endpoints

### `/api/chat/send` (POST)
Send a chat message.

**Request:**
```json
{
  "message": "Hello world!",
  "type": "user"
}
```

**Validation:**
1. Check authentication
2. Check ban/mute status
3. Check 3-second cooldown
4. Validate message (URLs, keywords)
5. Run AI moderation
6. Insert message if all checks pass

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "uuid",
    "user_id": "uuid",
    "username": "User123",
    "message": "Hello world!",
    "created_at": "2026-02-16T..."
  }
}
```

**Error Codes:**
- `401` - Unauthorized
- `403` - Banned or muted
- `429` - Cooldown active
- `400` - Invalid message, URL, keywords, or AI flagged

### `/api/chat/report` (POST)
Report a message.

**Request:**
```json
{
  "messageId": "uuid",
  "reason": "Inappropriate content"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report submitted successfully"
}
```

### `/api/chat/moderate` (POST)
Admin-only moderation actions.

**Request (Ban User):**
```json
{
  "action": "ban_user",
  "targetUserId": "uuid",
  "reason": "Spam"
}
```

**Request (Mute User):**
```json
{
  "action": "mute_user",
  "targetUserId": "uuid",
  "muteDuration": 3600
}
```

**Request (Delete Message):**
```json
{
  "action": "delete_message",
  "messageId": "uuid",
  "targetUserId": "uuid",
  "reason": "Spam"
}
```

**Available Actions:**
- `ban_user` - Permanently ban user
- `unban_user` - Remove ban
- `mute_user` - Temporarily mute user
- `unmute_user` - Remove mute
- `delete_message` - Delete/hide message

## Demo Mode

The system works in demo mode without Supabase:
- Messages are validated but not stored
- Cooldowns work
- URL and keyword blocking works
- AI moderation works if API key is set
- Admin features require database

## User Experience

### For Regular Users:
1. Type a message
2. Submit (or see error if blocked)
3. 3-second cooldown before next message
4. Can report other users' messages

### For Admins:
1. Hover over any message
2. Click "..." menu
3. See "Report" option (like all users)
4. See additional "Admin Actions" section:
   - Delete Message
   - Mute User (1h)
   - Ban User

### Moderation Feedback:
- Blocked for URL: "URLs are not allowed in chat"
- Blocked for keywords: "Message contains blocked keywords"
- Blocked by AI: "Message violates community guidelines"
- Cooldown active: "Please wait before sending another message"
- Banned: "You have been banned from chat"
- Muted: "You are muted from chat"

## Best Practices

1. **Review Reports Regularly**
   - Check `chat_reports` table for unreviewed reports
   - Take appropriate action (ignore, mute, or ban)

2. **Monitor Moderation Logs**
   - Review `chat_moderation_logs` for patterns
   - Identify users with multiple violations

3. **Adjust Keyword List**
   - Add new blocked keywords as needed in `/api/chat/send/route.ts`
   - Keep list updated with emerging spam patterns

4. **Set Appropriate Mute Durations**
   - First offense: 1 hour
   - Repeat offense: 24 hours
   - Severe violations: permanent ban

5. **Admin Accountability**
   - All admin actions are logged with moderator ID
   - Regular audit of moderation actions recommended

## Troubleshooting

**Messages not being blocked:**
- Check OpenAI API key is set correctly
- Verify moderation logs for errors
- Check keyword list is up to date

**Cooldown not working:**
- Ensure `user_moderation` table exists
- Check `last_message_at` is being updated

**Admin controls not showing:**
- Verify user has `is_admin = true` in database
- Check browser console for errors
- Ensure admin is logged in

**Reports not being saved:**
- Check `chat_reports` table exists
- Verify user is authenticated
- Check API logs for errors
