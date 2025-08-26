-- Migration: Fix equipment functions for ultra-simple structure
-- Date: 2025-08-26
-- Description: Drop and recreate equipment functions with correct signatures

BEGIN;

-- ============================================
-- 1. DROP EXISTING FUNCTIONS
-- ============================================
DROP FUNCTION IF EXISTS get_room_equipment_details(INTEGER);
DROP FUNCTION IF EXISTS add_equipment_to_room(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS remove_equipment_from_room(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS set_room_equipment(INTEGER, INTEGER[]);
DROP FUNCTION IF EXISTS get_room_equipment_list(INTEGER);
DROP FUNCTION IF EXISTS sync_room_equipment_assignments();

-- ============================================
-- 2. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get equipment details for a room
CREATE OR REPLACE FUNCTION get_room_equipment_details(p_room_id INTEGER)
RETURNS TABLE (
    equipment_id INTEGER,
    nom VARCHAR(255),
    description TEXT,
    categorie VARCHAR(50),
    icone VARCHAR(50),
    couleur VARCHAR(20),
    est_premium BOOLEAN,
    ordre_affichage INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        he.id,
        he.nom,
        he.description,
        he.categorie,
        he.icone,
        he.couleur,
        he.est_premium,
        he.ordre_affichage
    FROM public.rooms r
    CROSS JOIN LATERAL unnest(r.equipment_ids) AS equipment_id
    JOIN public.hotel_equipment he ON he.id = equipment_id
    WHERE r.id = p_room_id
    AND he.est_actif = TRUE
    ORDER BY he.categorie, he.ordre_affichage, he.nom;
END;
$$ LANGUAGE plpgsql;

-- Function to add equipment to a room
CREATE OR REPLACE FUNCTION add_equipment_to_room(p_room_id INTEGER, p_equipment_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_ids INTEGER[];
BEGIN
    -- Get current equipment IDs
    SELECT equipment_ids INTO current_ids 
    FROM public.rooms 
    WHERE id = p_room_id;

    -- Check if equipment already exists
    IF p_equipment_id = ANY(current_ids) THEN
        RETURN FALSE; -- Already exists
    END IF;

    -- Add the new equipment ID
    UPDATE public.rooms 
    SET equipment_ids = array_append(equipment_ids, p_equipment_id)
    WHERE id = p_room_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to remove equipment from a room
CREATE OR REPLACE FUNCTION remove_equipment_from_room(p_room_id INTEGER, p_equipment_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.rooms 
    SET equipment_ids = array_remove(equipment_ids, p_equipment_id)
    WHERE id = p_room_id
    AND p_equipment_id = ANY(equipment_ids);

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to set all equipment for a room at once
CREATE OR REPLACE FUNCTION set_room_equipment(p_room_id INTEGER, p_equipment_ids INTEGER[])
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.rooms 
    SET equipment_ids = p_equipment_ids
    WHERE id = p_room_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. DROP OLD TABLES IF THEY EXIST
-- ============================================
DROP TABLE IF EXISTS public.room_equipment_assignments CASCADE;

-- ============================================
-- 4. VERIFICATION
-- ============================================
DO $$ 
DECLARE 
    rooms_with_equipment_count INTEGER;
    total_equipment_assignments INTEGER;
BEGIN
    -- Count rooms with equipment
    SELECT COUNT(*) INTO rooms_with_equipment_count
    FROM public.rooms
    WHERE equipment_ids IS NOT NULL 
    AND array_length(equipment_ids, 1) > 0;

    -- Count total equipment assignments
    SELECT SUM(array_length(equipment_ids, 1)) INTO total_equipment_assignments
    FROM public.rooms
    WHERE equipment_ids IS NOT NULL;

    RAISE NOTICE '';
    RAISE NOTICE '===== EQUIPMENT FUNCTIONS FIXED =====';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Functions have been recreated with correct signatures';
    RAISE NOTICE '   - get_room_equipment_details';
    RAISE NOTICE '   - add_equipment_to_room';
    RAISE NOTICE '   - remove_equipment_from_room';
    RAISE NOTICE '   - set_room_equipment';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Current statistics:';
    RAISE NOTICE '   - Rooms with equipment: %', rooms_with_equipment_count;
    RAISE NOTICE '   - Total equipment assignments: %', total_equipment_assignments;
END $$;