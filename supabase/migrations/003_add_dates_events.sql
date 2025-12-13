-- ============================================
-- Migration 003: Add dates, registration, and events
-- ============================================

-- Add new columns to tournaments table
ALTER TABLE tournaments
ADD COLUMN IF NOT EXISTS scheduled_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS registration_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS registration_open BOOLEAN DEFAULT FALSE;

-- Tournament events table (history)
CREATE TABLE IF NOT EXISTS tournament_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient event queries
CREATE INDEX IF NOT EXISTS idx_tournament_events_tournament_id 
ON tournament_events(tournament_id);

CREATE INDEX IF NOT EXISTS idx_tournament_events_created_at 
ON tournament_events(created_at DESC);

-- Remove the unique constraint on participant name if it still exists
-- (allows multiple participants with the same name)
ALTER TABLE participants
DROP CONSTRAINT IF EXISTS participants_tournament_id_name_key;

-- Comment
COMMENT ON COLUMN tournaments.scheduled_start_date IS 'Planned start date for the tournament';
COMMENT ON COLUMN tournaments.registration_end_date IS 'Deadline for participant registration';
COMMENT ON COLUMN tournaments.registration_open IS 'Whether participants can self-register (true) or only organizer can add them (false)';
COMMENT ON TABLE tournament_events IS 'Audit log of all tournament events for history tracking';
