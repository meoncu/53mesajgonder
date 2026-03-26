-- SQL to add archive columns to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sent_recipients JSONB DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_is_archived ON campaigns(is_archived);
