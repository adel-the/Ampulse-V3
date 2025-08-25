-- ============================================================================
-- Migration: Suppression de la table room_categories non utilisée
-- Date: 2025-08-25
-- Description: 
--   Supprime la table room_categories qui n'est jamais utilisée dans le code.
--   L'application utilise le champ 'type' dans la table rooms pour catégoriser
--   les chambres (Simple, Double, Suite, etc.) au lieu d'une table séparée.
-- ============================================================================

-- Étape 1: Supprimer la clé étrangère category_id de la table rooms
ALTER TABLE public.rooms 
DROP COLUMN IF EXISTS category_id CASCADE;

-- Étape 2: Supprimer la table room_categories
DROP TABLE IF EXISTS public.room_categories CASCADE;

-- Documentation
COMMENT ON COLUMN public.rooms.type IS 'Type de chambre (Simple, Double, Suite, etc.) - remplace l''ancienne relation avec room_categories';

-- Notifications
DO $$
BEGIN
  RAISE NOTICE 'Successfully removed unused room_categories table';
  RAISE NOTICE 'Room categorization is now handled via the type field in rooms table';
  RAISE NOTICE 'Migration 008_remove_unused_room_categories.sql completed at %', NOW();
END $$;