-- Migration: Final Equipment Structure Cleanup
-- Date: 2025-08-26
-- Description: Remove all obsolete equipment tables, keeping only hotel_equipment and rooms.equipment_ids

BEGIN;

-- ============================================
-- 1. DROP OLD EQUIPMENT TABLES AND RELATED OBJECTS
-- ============================================

-- Drop old functions that reference obsolete tables
DROP FUNCTION IF EXISTS get_room_equipment_list(INTEGER);
DROP FUNCTION IF EXISTS sync_room_equipment_assignments();
DROP FUNCTION IF EXISTS validate_equipment_assignments();

-- Note: Triggers are automatically dropped when tables are dropped CASCADE
-- So we don't need to explicitly drop them

-- Drop old junction tables if they still exist
DROP TABLE IF EXISTS public.equipment_assignments CASCADE;
DROP TABLE IF EXISTS public.room_equipment_assignments CASCADE;
DROP TABLE IF EXISTS public.hotel_equipments CASCADE;
DROP TABLE IF EXISTS public.room_equipments CASCADE;

-- Drop the global equipments catalog table (replaced by hotel_equipment)
DROP TABLE IF EXISTS public.equipments CASCADE;

-- ============================================
-- 2. VERIFY FINAL STRUCTURE
-- ============================================

-- Ensure hotel_equipment table has all necessary indexes
CREATE INDEX IF NOT EXISTS idx_hotel_equipment_hotel_id ON public.hotel_equipment(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_equipment_categorie ON public.hotel_equipment(categorie);
CREATE INDEX IF NOT EXISTS idx_hotel_equipment_est_actif ON public.hotel_equipment(est_actif);

-- Ensure rooms.equipment_ids has proper index
CREATE INDEX IF NOT EXISTS idx_rooms_equipment_ids ON public.rooms USING GIN (equipment_ids);

-- ============================================
-- 3. CREATE FINAL HELPER FUNCTIONS IF NOT EXISTS
-- ============================================

-- Function to get all equipment for a hotel
CREATE OR REPLACE FUNCTION get_hotel_equipment_catalog(p_hotel_id INTEGER)
RETURNS TABLE (
    id INTEGER,
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
    FROM public.hotel_equipment he
    WHERE he.hotel_id = p_hotel_id
    AND he.est_actif = TRUE
    ORDER BY he.categorie, he.ordre_affichage, he.nom;
END;
$$ LANGUAGE plpgsql;

-- Function to get equipment stats for a hotel
CREATE OR REPLACE FUNCTION get_hotel_equipment_stats(p_hotel_id INTEGER)
RETURNS TABLE (
    total_equipment INTEGER,
    categories_count INTEGER,
    premium_count INTEGER,
    most_used_equipment_id INTEGER,
    most_used_equipment_name VARCHAR(255),
    rooms_with_equipment INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH equipment_stats AS (
        SELECT 
            COUNT(DISTINCT he.id) as total,
            COUNT(DISTINCT he.categorie) as categories,
            COUNT(DISTINCT CASE WHEN he.est_premium THEN he.id END) as premium
        FROM public.hotel_equipment he
        WHERE he.hotel_id = p_hotel_id
        AND he.est_actif = TRUE
    ),
    usage_stats AS (
        SELECT 
            equipment_id,
            COUNT(*) as usage_count
        FROM public.rooms r
        CROSS JOIN LATERAL unnest(r.equipment_ids) AS equipment_id
        WHERE r.hotel_id = p_hotel_id
        GROUP BY equipment_id
        ORDER BY usage_count DESC
        LIMIT 1
    ),
    room_stats AS (
        SELECT COUNT(DISTINCT id) as rooms_with_eq
        FROM public.rooms
        WHERE hotel_id = p_hotel_id
        AND equipment_ids IS NOT NULL
        AND array_length(equipment_ids, 1) > 0
    )
    SELECT 
        es.total,
        es.categories,
        es.premium,
        us.equipment_id,
        he.nom,
        rs.rooms_with_eq
    FROM equipment_stats es
    CROSS JOIN room_stats rs
    LEFT JOIN usage_stats us ON TRUE
    LEFT JOIN public.hotel_equipment he ON he.id = us.equipment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. CLEANUP AND VERIFICATION
-- ============================================

DO $$ 
DECLARE 
    hotel_equipment_count INTEGER;
    rooms_with_equipment INTEGER;
    total_equipment_assignments INTEGER;
BEGIN
    -- Count hotel equipment
    SELECT COUNT(*) INTO hotel_equipment_count
    FROM public.hotel_equipment
    WHERE est_actif = TRUE;

    -- Count rooms with equipment
    SELECT COUNT(*) INTO rooms_with_equipment
    FROM public.rooms
    WHERE equipment_ids IS NOT NULL 
    AND array_length(equipment_ids, 1) > 0;

    -- Count total equipment assignments
    SELECT COALESCE(SUM(array_length(equipment_ids, 1)), 0) INTO total_equipment_assignments
    FROM public.rooms
    WHERE equipment_ids IS NOT NULL;

    RAISE NOTICE '';
    RAISE NOTICE '===== EQUIPMENT STRUCTURE CLEANUP COMPLETE =====';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Removed obsolete tables:';
    RAISE NOTICE '   - equipments (global catalog)';
    RAISE NOTICE '   - equipment_assignments';
    RAISE NOTICE '   - room_equipment_assignments';
    RAISE NOTICE '   - hotel_equipments';
    RAISE NOTICE '   - room_equipments';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Final structure:';
    RAISE NOTICE '   - hotel_equipment: Hotel-specific equipment catalog';
    RAISE NOTICE '   - rooms.equipment_ids: Array of equipment IDs per room';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Current statistics:';
    RAISE NOTICE '   - Hotel equipment items: %', hotel_equipment_count;
    RAISE NOTICE '   - Rooms with equipment: %', rooms_with_equipment;
    RAISE NOTICE '   - Total equipment assignments: %', total_equipment_assignments;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Benefits:';
    RAISE NOTICE '   - No junction tables';
    RAISE NOTICE '   - Direct array storage';
    RAISE NOTICE '   - Better performance';
    RAISE NOTICE '   - Simpler queries';
END $$;

COMMIT;