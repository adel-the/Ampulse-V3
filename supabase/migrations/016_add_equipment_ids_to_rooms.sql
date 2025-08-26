-- Migration: Add equipment_ids array to rooms table
-- Date: 2025-08-26
-- Description: Add equipment_ids integer array field to rooms for simplified equipment management

BEGIN;

-- ============================================
-- 1. ADD EQUIPMENT_IDS ARRAY FIELD TO ROOMS
-- ============================================
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS equipment_ids INTEGER[] DEFAULT '{}';

-- Add index for equipment_ids array queries
CREATE INDEX IF NOT EXISTS idx_rooms_equipment_ids ON public.rooms USING GIN (equipment_ids);

-- Add comment
COMMENT ON COLUMN public.rooms.equipment_ids IS 'Array of hotel_equipment IDs assigned to this room';

-- ============================================
-- 2. MIGRATE DATA FROM ROOM_EQUIPMENT_ASSIGNMENTS
-- ============================================
-- Populate equipment_ids from existing room_equipment_assignments
UPDATE public.rooms 
SET equipment_ids = (
    SELECT COALESCE(array_agg(rea.hotel_equipment_id), '{}')
    FROM public.room_equipment_assignments rea
    WHERE rea.room_id = rooms.id
    AND rea.est_fonctionnel = TRUE
);

-- ============================================
-- 3. CREATE HELPER FUNCTIONS
-- ============================================
-- Function to sync equipment_ids with room_equipment_assignments (for backward compatibility if needed)
CREATE OR REPLACE FUNCTION sync_room_equipment_assignments()
RETURNS TRIGGER AS $$
BEGIN
    -- This function can be used to keep room_equipment_assignments in sync with equipment_ids
    -- if both systems need to coexist temporarily
    
    IF TG_OP = 'UPDATE' AND OLD.equipment_ids IS DISTINCT FROM NEW.equipment_ids THEN
        -- Delete existing assignments
        DELETE FROM public.room_equipment_assignments 
        WHERE room_id = NEW.id;
        
        -- Insert new assignments if equipment_ids is not empty
        IF array_length(NEW.equipment_ids, 1) > 0 THEN
            INSERT INTO public.room_equipment_assignments (room_id, hotel_equipment_id, est_fonctionnel, date_installation)
            SELECT NEW.id, unnest(NEW.equipment_ids), TRUE, CURRENT_DATE;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. CREATE VALIDATION FUNCTION
-- ============================================
-- Function to validate that equipment_ids references valid hotel equipment
CREATE OR REPLACE FUNCTION validate_room_equipment_ids()
RETURNS TRIGGER AS $$
DECLARE
    invalid_ids INTEGER[];
    hotel_id_val INTEGER;
BEGIN
    -- Get the hotel_id for this room
    SELECT hotel_id INTO hotel_id_val FROM public.rooms WHERE id = NEW.id;
    
    -- Check if all equipment_ids exist and belong to the same hotel
    IF array_length(NEW.equipment_ids, 1) > 0 THEN
        SELECT array_agg(equipment_id) INTO invalid_ids
        FROM unnest(NEW.equipment_ids) AS equipment_id
        WHERE NOT EXISTS (
            SELECT 1 FROM public.hotel_equipment he 
            WHERE he.id = equipment_id 
            AND he.hotel_id = hotel_id_val 
            AND he.est_actif = TRUE
        );
        
        IF array_length(invalid_ids, 1) > 0 THEN
            RAISE EXCEPTION 'Invalid equipment IDs for this hotel: %', invalid_ids;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the validation trigger
DROP TRIGGER IF EXISTS validate_room_equipment_trigger ON public.rooms;
CREATE TRIGGER validate_room_equipment_trigger
    BEFORE INSERT OR UPDATE ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION validate_room_equipment_ids();

-- ============================================
-- 5. CREATE QUERY HELPER FUNCTIONS
-- ============================================
-- Function to get room equipment details from equipment_ids
CREATE OR REPLACE FUNCTION get_room_equipment_details(p_room_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    nom VARCHAR(255),
    description TEXT,
    categorie VARCHAR(50),
    icone VARCHAR(50),
    couleur VARCHAR(20),
    est_premium BOOLEAN
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
        he.est_premium
    FROM public.rooms r
    CROSS JOIN unnest(r.equipment_ids) AS equipment_id
    JOIN public.hotel_equipment he ON he.id = equipment_id
    WHERE r.id = p_room_id
    AND he.est_actif = TRUE
    ORDER BY he.categorie, he.ordre_affichage, he.nom;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ============================================
-- 6. VERIFICATION
-- ============================================
DO $$ 
DECLARE 
    rooms_with_equipment_count INTEGER;
    total_equipment_assignments INTEGER;
BEGIN
    SELECT COUNT(*) INTO rooms_with_equipment_count 
    FROM public.rooms 
    WHERE array_length(equipment_ids, 1) > 0;
    
    SELECT SUM(array_length(equipment_ids, 1)) INTO total_equipment_assignments 
    FROM public.rooms 
    WHERE equipment_ids IS NOT NULL;
    
    RAISE NOTICE 'Migration completed successfully:';
    RAISE NOTICE '- Rooms with equipment: %', rooms_with_equipment_count;
    RAISE NOTICE '- Total equipment assignments: %', COALESCE(total_equipment_assignments, 0);
    RAISE NOTICE '';
    RAISE NOTICE 'New simplified workflow:';
    RAISE NOTICE '- Equipment IDs are stored directly in rooms.equipment_ids array';
    RAISE NOTICE '- No more separate junction table operations needed';
    RAISE NOTICE '- Validation ensures equipment belongs to room''s hotel';
END $$;