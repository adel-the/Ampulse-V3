-- ============================================================================
-- Migration: Suppression de la vue room_details_view non utilisée
-- Date: 2025-08-25
-- Description: 
--   Supprime la vue room_details_view qui n'est jamais utilisée dans le code
--   et qui peut impacter les performances avec ses multiples JOINs et GROUP BY
-- ============================================================================

-- Suppression de la vue room_details_view
DROP VIEW IF EXISTS public.room_details_view CASCADE;

-- Commentaire pour documentation
COMMENT ON TABLE public.rooms IS 'Table principale des chambres. Utilisée directement par l''application sans besoin de vue enrichie.';

-- Note: La vue room_details_view était définie comme :
-- SELECT r.*, h.nom as hotel_nom, h.adresse as hotel_adresse, h.ville as hotel_ville,
--        rc.name as category_name, rc.base_price as category_base_price,
--        COUNT(DISTINCT re.equipment_id) as equipment_count
-- FROM rooms r
-- LEFT JOIN hotels h ON r.hotel_id = h.id
-- LEFT JOIN room_categories rc ON r.category_id = rc.id
-- LEFT JOIN room_equipments re ON r.id = re.room_id
-- GROUP BY r.id, h.id, rc.id;
--
-- Cette vue n'était pas utilisée dans le code et générait des calculs inutiles.
-- Les données enrichies peuvent être obtenues via des requêtes JOIN spécifiques
-- quand nécessaire, directement dans l'API ou les hooks.