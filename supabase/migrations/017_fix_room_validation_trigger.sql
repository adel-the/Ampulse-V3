-- Migration: Fix room equipment validation trigger
-- Date: 2025-08-26
-- Description: Fix the validation function to use NEW.hotel_id instead of looking up existing room

BEGIN;

-- ============================================
-- 1. FIX VALIDATION FUNCTION
-- ============================================
-- Function to validate that equipment_ids references valid hotel equipment
CREATE OR REPLACE FUNCTION validate_room_equipment_ids()
RETURNS TRIGGER AS $$
DECLARE
    invalid_ids INTEGER[];
BEGIN
    -- Check if all equipment_ids exist and belong to the same hotel
    IF array_length(NEW.equipment_ids, 1) > 0 THEN
        SELECT array_agg(equipment_id) INTO invalid_ids
        FROM unnest(NEW.equipment_ids) AS equipment_id
        WHERE NOT EXISTS (
            SELECT 1 FROM public.hotel_equipment he 
            WHERE he.id = equipment_id 
            AND he.hotel_id = NEW.hotel_id  -- Use NEW.hotel_id directly
            AND he.est_actif = TRUE
        );
        
        IF array_length(invalid_ids, 1) > 0 THEN
            RAISE EXCEPTION 'Invalid equipment IDs for this hotel: %', invalid_ids;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ============================================
-- 2. VERIFICATION
-- ============================================
DO $$ 
BEGIN
    RAISE NOTICE 'Fixed room equipment validation trigger:';
    RAISE NOTICE '- Now uses NEW.hotel_id directly instead of looking up existing room';
    RAISE NOTICE '- This fixes validation issues during room creation';
END $$;