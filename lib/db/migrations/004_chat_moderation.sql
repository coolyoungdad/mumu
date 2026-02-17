-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'user', -- 'user' or 'pull'
  rarity TEXT, -- for pull announcements
  item_name TEXT, -- for pull announcements
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id)
);

-- Chat moderation logs
CREATE TABLE IF NOT EXISTS chat_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'blocked', 'flagged', 'reported', 'deleted'
  reason TEXT NOT NULL, -- 'url', 'keywords', 'ai_moderation', 'user_report', 'admin_action'
  moderation_scores JSONB, -- AI moderation API scores
  moderator_id UUID REFERENCES users(id), -- admin who took action
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB -- additional context
);

-- User moderation status
CREATE TABLE IF NOT EXISTS user_moderation (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_banned BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  muted_until TIMESTAMPTZ,
  banned_at TIMESTAMPTZ,
  banned_by UUID REFERENCES users(id),
  ban_reason TEXT,
  mute_count INTEGER DEFAULT 0,
  ban_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Message reports
CREATE TABLE IF NOT EXISTS chat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT -- 'deleted', 'ignored', 'user_banned', 'user_muted'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON chat_messages(type);
CREATE INDEX IF NOT EXISTS idx_chat_moderation_logs_user_id ON chat_moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_moderation_logs_created_at ON chat_moderation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_moderation_banned ON user_moderation(is_banned);
CREATE INDEX IF NOT EXISTS idx_user_moderation_muted ON user_moderation(is_muted);
CREATE INDEX IF NOT EXISTS idx_chat_reports_reviewed ON chat_reports(reviewed);

-- Add is_admin flag to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'users' AND column_name = 'is_admin') THEN
    ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;
