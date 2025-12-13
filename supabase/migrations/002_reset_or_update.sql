-- ============================================
-- Tournament Manager - Script de mise à jour
-- ============================================
-- Ce script peut être exécuté plusieurs fois sans erreur
-- Il met à jour le schéma existant ou le crée si nécessaire

-- ============================================
-- OPTION 1: RESET COMPLET (décommenter si besoin)
-- ============================================
-- ATTENTION: Cela supprimera toutes les données !

/*
DROP VIEW IF EXISTS group_standings_with_names;
DROP VIEW IF EXISTS tournaments_with_stats;
DROP TABLE IF EXISTS material_prize_ranges CASCADE;
DROP TABLE IF EXISTS material_prizes CASCADE;
DROP TABLE IF EXISTS cashprize_ranges CASCADE;
DROP TABLE IF EXISTS cashprize_distributions CASCADE;
DROP TABLE IF EXISTS participant_statuses CASCADE;
DROP TABLE IF EXISTS penalties CASCADE;
DROP TABLE IF EXISTS group_standings CASCADE;
DROP TABLE IF EXISTS group_participants CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS tournaments CASCADE;
DROP TYPE IF EXISTS currency_type;
DROP TYPE IF EXISTS seeding_type;
DROP TYPE IF EXISTS match_status;
DROP TYPE IF EXISTS tournament_status;
DROP TYPE IF EXISTS tournament_format;
*/

-- ============================================
-- OPTION 2: MISE À JOUR (ajout des nouveaux champs)
-- ============================================

-- Ajouter les nouveaux champs à participant_statuses s'ils n'existent pas
DO $$ 
BEGIN
    -- Ajouter forfeit_match_id si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'participant_statuses' AND column_name = 'forfeit_match_id') THEN
        ALTER TABLE participant_statuses ADD COLUMN forfeit_match_id UUID REFERENCES matches(id) ON DELETE SET NULL;
    END IF;

    -- Ajouter original_match_state si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'participant_statuses' AND column_name = 'original_match_state') THEN
        ALTER TABLE participant_statuses ADD COLUMN original_match_state JSONB;
    END IF;

    -- Ajouter promoted_opponent_id si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'participant_statuses' AND column_name = 'promoted_opponent_id') THEN
        ALTER TABLE participant_statuses ADD COLUMN promoted_opponent_id UUID REFERENCES participants(id) ON DELETE SET NULL;
    END IF;

    -- Supprimer last_opponent_id si existe (remplacé par promoted_opponent_id)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'participant_statuses' AND column_name = 'last_opponent_id') THEN
        ALTER TABLE participant_statuses DROP COLUMN last_opponent_id;
    END IF;
    
    -- Ajouter bracket à matches si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'bracket') THEN
        ALTER TABLE matches ADD COLUMN bracket VARCHAR(50);
    END IF;
    
    -- Ajouter loser_id à matches si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matches' AND column_name = 'loser_id') THEN
        ALTER TABLE matches ADD COLUMN loser_id UUID REFERENCES participants(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Vérifier que tout est ok
SELECT 'Schema updated successfully!' as status;
