-- Migration: Create sent_nurture_emails table
-- Purpose: Track which nurture emails have been sent to prevent duplicates
-- Used by: /api/cron/nurture endpoint

CREATE TABLE IF NOT EXISTS sent_nurture_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  email_type TEXT NOT NULL, -- 'day3', 'day5', 'day7', 'day14'
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent sending the same email type twice to the same user
  UNIQUE(user_email, email_type)
);

-- Index for faster lookups when checking if email was already sent
CREATE INDEX IF NOT EXISTS idx_sent_nurture_emails_lookup 
ON sent_nurture_emails(user_email, email_type);

-- Enable Row Level Security (table is accessed server-side only)
ALTER TABLE sent_nurture_emails ENABLE ROW LEVEL SECURITY;

-- Comment for documentation
COMMENT ON TABLE sent_nurture_emails IS 'Tracks nurture emails sent to non-converting users to prevent duplicates';
COMMENT ON COLUMN sent_nurture_emails.email_type IS 'day3, day5, day7, or day14 - corresponds to days since user signup';
