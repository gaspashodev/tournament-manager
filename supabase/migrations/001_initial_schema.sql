-- ============================================
-- Tournament Manager - Schema Supabase
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE tournament_format AS ENUM (
  'single_elimination',
  'double_elimination',
  'groups',
  'championship'
);

CREATE TYPE tournament_status AS ENUM (
  'draft',
  'registration',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE match_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE seeding_type AS ENUM (
  'random',
  'manual',
  'ranked'
);

CREATE TYPE currency_type AS ENUM (
  '€',
  '£',
  '$',
  'points'
);

-- ============================================
-- TABLES
-- ============================================

-- Tournaments
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  format tournament_format NOT NULL,
  status tournament_status NOT NULL DEFAULT 'draft',
  game VARCHAR(255),
  category VARCHAR(255),
  tags TEXT[],
  winner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Configuration (stored as JSONB for flexibility)
  config JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Participants
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  seed INTEGER,
  team VARCHAR(255),
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(tournament_id, name)
);

-- Groups (for group stage tournaments)
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group participants (many-to-many)
CREATE TABLE group_participants (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, participant_id)
);

-- Group standings
CREATE TABLE group_standings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  played INTEGER NOT NULL DEFAULT 0,
  won INTEGER NOT NULL DEFAULT 0,
  drawn INTEGER NOT NULL DEFAULT 0,
  lost INTEGER NOT NULL DEFAULT 0,
  points_for INTEGER NOT NULL DEFAULT 0,
  points_against INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(group_id, participant_id)
);

-- Matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  position INTEGER NOT NULL,
  participant1_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  participant2_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  score_participant1 INTEGER,
  score_participant2 INTEGER,
  status match_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Penalties
CREATE TABLE penalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Participant statuses (for eliminations)
CREATE TABLE participant_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  is_eliminated BOOLEAN NOT NULL DEFAULT FALSE,
  eliminated_at TIMESTAMPTZ,
  elimination_reason TEXT,
  last_opponent_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(tournament_id, participant_id)
);

-- Cashprize distributions (individual places)
CREATE TABLE cashprize_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  place INTEGER NOT NULL,
  percent DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(tournament_id, place)
);

-- Cashprize ranges
CREATE TABLE cashprize_ranges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  start_place INTEGER NOT NULL,
  end_place INTEGER NOT NULL,
  percent DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Material prizes (individual)
CREATE TABLE material_prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  place INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Material prize ranges
CREATE TABLE material_prize_ranges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  start_place INTEGER NOT NULL,
  end_place INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_participants_tournament ON participants(tournament_id);
CREATE INDEX idx_groups_tournament ON groups(tournament_id);
CREATE INDEX idx_matches_tournament ON matches(tournament_id);
CREATE INDEX idx_matches_group ON matches(group_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_group_standings_group ON group_standings(group_id);
CREATE INDEX idx_penalties_tournament ON penalties(tournament_id);
CREATE INDEX idx_penalties_participant ON penalties(participant_id);
CREATE INDEX idx_participant_statuses_tournament ON participant_statuses(tournament_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_standings_updated_at
  BEFORE UPDATE ON group_standings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participant_statuses_updated_at
  BEFORE UPDATE ON participant_statuses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashprize_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashprize_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_prize_ranges ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you can restrict later based on auth)
-- Public read access
CREATE POLICY "Public read access" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public read access" ON participants FOR SELECT USING (true);
CREATE POLICY "Public read access" ON groups FOR SELECT USING (true);
CREATE POLICY "Public read access" ON group_participants FOR SELECT USING (true);
CREATE POLICY "Public read access" ON group_standings FOR SELECT USING (true);
CREATE POLICY "Public read access" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read access" ON penalties FOR SELECT USING (true);
CREATE POLICY "Public read access" ON participant_statuses FOR SELECT USING (true);
CREATE POLICY "Public read access" ON cashprize_distributions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON cashprize_ranges FOR SELECT USING (true);
CREATE POLICY "Public read access" ON material_prizes FOR SELECT USING (true);
CREATE POLICY "Public read access" ON material_prize_ranges FOR SELECT USING (true);

-- Public write access (for now - restrict later with auth)
CREATE POLICY "Public write access" ON tournaments FOR ALL USING (true);
CREATE POLICY "Public write access" ON participants FOR ALL USING (true);
CREATE POLICY "Public write access" ON groups FOR ALL USING (true);
CREATE POLICY "Public write access" ON group_participants FOR ALL USING (true);
CREATE POLICY "Public write access" ON group_standings FOR ALL USING (true);
CREATE POLICY "Public write access" ON matches FOR ALL USING (true);
CREATE POLICY "Public write access" ON penalties FOR ALL USING (true);
CREATE POLICY "Public write access" ON participant_statuses FOR ALL USING (true);
CREATE POLICY "Public write access" ON cashprize_distributions FOR ALL USING (true);
CREATE POLICY "Public write access" ON cashprize_ranges FOR ALL USING (true);
CREATE POLICY "Public write access" ON material_prizes FOR ALL USING (true);
CREATE POLICY "Public write access" ON material_prize_ranges FOR ALL USING (true);

-- ============================================
-- VIEWS (for easier querying)
-- ============================================

-- Tournament with participant count
CREATE VIEW tournaments_with_stats AS
SELECT 
  t.*,
  COUNT(DISTINCT p.id) as participant_count,
  COUNT(DISTINCT m.id) as match_count,
  COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as completed_match_count
FROM tournaments t
LEFT JOIN participants p ON p.tournament_id = t.id
LEFT JOIN matches m ON m.tournament_id = t.id
GROUP BY t.id;

-- Group standings with participant names
CREATE VIEW group_standings_with_names AS
SELECT 
  gs.*,
  p.name as participant_name,
  g.name as group_name,
  (gs.points_for - gs.points_against) as goal_difference
FROM group_standings gs
JOIN participants p ON p.id = gs.participant_id
JOIN groups g ON g.id = gs.group_id
ORDER BY gs.points DESC, (gs.points_for - gs.points_against) DESC, gs.points_for DESC;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to recalculate standings for a group
CREATE OR REPLACE FUNCTION recalculate_group_standings(p_group_id UUID)
RETURNS void AS $$
DECLARE
  v_match RECORD;
  v_points_win INTEGER;
  v_points_draw INTEGER;
  v_points_loss INTEGER;
  v_tournament_id UUID;
BEGIN
  -- Get tournament config
  SELECT t.id, 
         COALESCE((t.config->>'pointsWin')::INTEGER, 3),
         COALESCE((t.config->>'pointsDraw')::INTEGER, 1),
         COALESCE((t.config->>'pointsLoss')::INTEGER, 0)
  INTO v_tournament_id, v_points_win, v_points_draw, v_points_loss
  FROM groups g
  JOIN tournaments t ON t.id = g.tournament_id
  WHERE g.id = p_group_id;

  -- Reset standings
  UPDATE group_standings 
  SET played = 0, won = 0, drawn = 0, lost = 0, 
      points_for = 0, points_against = 0, points = 0
  WHERE group_id = p_group_id;

  -- Recalculate from matches
  FOR v_match IN 
    SELECT * FROM matches 
    WHERE group_id = p_group_id AND status = 'completed'
  LOOP
    -- Update participant 1
    UPDATE group_standings SET
      played = played + 1,
      points_for = points_for + COALESCE(v_match.score_participant1, 0),
      points_against = points_against + COALESCE(v_match.score_participant2, 0),
      won = won + CASE WHEN v_match.winner_id = v_match.participant1_id THEN 1 ELSE 0 END,
      lost = lost + CASE WHEN v_match.winner_id = v_match.participant2_id THEN 1 ELSE 0 END,
      drawn = drawn + CASE WHEN v_match.winner_id IS NULL THEN 1 ELSE 0 END,
      points = points + CASE 
        WHEN v_match.winner_id = v_match.participant1_id THEN v_points_win
        WHEN v_match.winner_id = v_match.participant2_id THEN v_points_loss
        ELSE v_points_draw
      END
    WHERE group_id = p_group_id AND participant_id = v_match.participant1_id;

    -- Update participant 2
    UPDATE group_standings SET
      played = played + 1,
      points_for = points_for + COALESCE(v_match.score_participant2, 0),
      points_against = points_against + COALESCE(v_match.score_participant1, 0),
      won = won + CASE WHEN v_match.winner_id = v_match.participant2_id THEN 1 ELSE 0 END,
      lost = lost + CASE WHEN v_match.winner_id = v_match.participant1_id THEN 1 ELSE 0 END,
      drawn = drawn + CASE WHEN v_match.winner_id IS NULL THEN 1 ELSE 0 END,
      points = points + CASE 
        WHEN v_match.winner_id = v_match.participant2_id THEN v_points_win
        WHEN v_match.winner_id = v_match.participant1_id THEN v_points_loss
        ELSE v_points_draw
      END
    WHERE group_id = p_group_id AND participant_id = v_match.participant2_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to apply penalty to standings
CREATE OR REPLACE FUNCTION apply_penalty_to_standings()
RETURNS TRIGGER AS $$
BEGIN
  -- Subtract penalty points from standings
  UPDATE group_standings gs
  SET points = points - NEW.points
  FROM groups g
  WHERE gs.group_id = g.id 
    AND g.tournament_id = NEW.tournament_id 
    AND gs.participant_id = NEW.participant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER apply_penalty_on_insert
  AFTER INSERT ON penalties
  FOR EACH ROW EXECUTE FUNCTION apply_penalty_to_standings();

-- Function to restore penalty points when deleted
CREATE OR REPLACE FUNCTION restore_penalty_to_standings()
RETURNS TRIGGER AS $$
BEGIN
  -- Add penalty points back to standings
  UPDATE group_standings gs
  SET points = points + OLD.points
  FROM groups g
  WHERE gs.group_id = g.id 
    AND g.tournament_id = OLD.tournament_id 
    AND gs.participant_id = OLD.participant_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER restore_penalty_on_delete
  BEFORE DELETE ON penalties
  FOR EACH ROW EXECUTE FUNCTION restore_penalty_to_standings();
