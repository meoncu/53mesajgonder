-- SQL script to create the calendar_notes table in Supabase
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS calendar_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TEXT NOT NULL, -- Format: YYYY-MM-DD
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'user_note', -- 'user_note' or 'religious_day'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_calendar_notes_date ON calendar_notes(date);

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE calendar_notes ENABLE ROW LEVEL SECURITY;
