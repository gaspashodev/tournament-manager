-- Migration 004: Add games (manches) support to matches
-- Permet de stocker les scores de chaque manche pour les Best-of

-- Ajouter la colonne games (JSONB) pour stocker les manches
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS games JSONB DEFAULT '[]'::jsonb;

-- Ajouter la colonne best_of pour override spécifique au match (ex: finale en BO5)
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS best_of INTEGER;

-- Ajouter la colonne phase pour identifier la phase du match
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS phase VARCHAR(20);

-- Commentaires pour la documentation
COMMENT ON COLUMN matches.games IS 'Array of game scores for Best-of matches. Each game: {id, gameNumber, participant1Score, participant2Score, winnerId, completedAt}';
COMMENT ON COLUMN matches.best_of IS 'Override Best-of for this specific match (e.g., final in BO5 while rest is BO3)';
COMMENT ON COLUMN matches.phase IS 'Match phase: groups, playoffs, or final';

-- Index pour les requêtes sur la phase
CREATE INDEX IF NOT EXISTS idx_matches_phase ON matches(phase) WHERE phase IS NOT NULL;
