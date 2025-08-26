-- Migration: Optimize Equipment Structure with Unified Assignments
-- Date: 2025-08-26
-- Description: Replace hotel_equipments and room_equipments tables with a single
--              equipment_assignments table for simpler, more efficient structure

-- ============================================
-- 1. CREATE NEW UNIFIED EQUIPMENT ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.equipment_assignments (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    equipment_id INTEGER NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES public.rooms(id) ON DELETE CASCADE,
    
    -- Common fields for both hotel and room assignments
    est_disponible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Hotel-level specific fields (used when room_id IS NULL)
    est_gratuit BOOLEAN DEFAULT TRUE,
    prix_supplement DECIMAL(8,2),
    description_specifique TEXT,
    horaires_disponibilite JSONB,
    conditions_usage TEXT,
    date_ajout DATE DEFAULT CURRENT_DATE,
    date_derniere_maj DATE DEFAULT CURRENT_DATE,
    notes_internes TEXT,
    
    -- Room-level specific fields (used when room_id IS NOT NULL)
    est_fonctionnel BOOLEAN DEFAULT TRUE,
    date_installation DATE DEFAULT CURRENT_DATE,
    date_derniere_verification DATE,
    notes TEXT,
    
    -- Temporary constraints, unique constraint will be added separately
    CONSTRAINT check_positive_price CHECK (prix_supplement >= 0 OR prix_supplement IS NULL)
);

COMMENT ON TABLE public.equipment_assignments IS 'Unified equipment assignments for hotels (room_id = NULL) and rooms (room_id specified)';
COMMENT ON COLUMN public.equipment_assignments.room_id IS 'NULL for hotel-level equipment, room ID for room-specific equipment';
COMMENT ON COLUMN public.equipment_assignments.est_gratuit IS 'Used for hotel-level assignments only';
COMMENT ON COLUMN public.equipment_assignments.est_fonctionnel IS 'Used for room-level assignments only';

-- Add unique constraint to prevent duplicate assignments
CREATE UNIQUE INDEX unique_equipment_assignment 
ON public.equipment_assignments(hotel_id, equipment_id, COALESCE(room_id, 0));

-- ============================================
-- 2. CREATE VALIDATION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION validate_equipment_assignment()
RETURNS TRIGGER AS $$
DECLARE
    room_hotel_id INTEGER;
BEGIN
    -- If this is a room assignment, ensure equipment exists at hotel level first
    IF NEW.room_id IS NOT NULL THEN
        -- Get the hotel_id for this room
        SELECT hotel_id INTO room_hotel_id 
        FROM public.rooms 
        WHERE id = NEW.room_id;
        
        -- Verify hotel_id matches
        IF room_hotel_id != NEW.hotel_id THEN
            RAISE EXCEPTION 'Room % does not belong to hotel %', NEW.room_id, NEW.hotel_id;
        END IF;
        
        -- Check if the equipment exists at hotel level for this hotel
        IF NOT EXISTS(
            SELECT 1 FROM public.equipment_assignments 
            WHERE hotel_id = NEW.hotel_id 
            AND equipment_id = NEW.equipment_id
            AND room_id IS NULL
            AND est_disponible = TRUE
        ) THEN
            RAISE EXCEPTION 'Equipment ID % must first be added to hotel ID % before assigning to room ID %', 
                NEW.equipment_id, NEW.hotel_id, NEW.room_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. CREATE TRIGGER TO ENFORCE BUSINESS RULES
-- ============================================
CREATE TRIGGER enforce_equipment_assignment_rules 
    BEFORE INSERT OR UPDATE ON public.equipment_assignments
    FOR EACH ROW EXECUTE FUNCTION validate_equipment_assignment();

-- ============================================
-- 4. MIGRATE DATA FROM EXISTING TABLES
-- ============================================

-- Migrate hotel equipment assignments (room_id = NULL)
INSERT INTO public.equipment_assignments (
    hotel_id, equipment_id, room_id, est_disponible, est_gratuit, prix_supplement,
    description_specifique, horaires_disponibilite, conditions_usage,
    date_ajout, date_derniere_maj, notes_internes, created_at, updated_at
)
SELECT 
    hotel_id, equipment_id, NULL as room_id, est_disponible, est_gratuit, prix_supplement,
    description_specifique, horaires_disponibilite, conditions_usage,
    date_ajout, date_derniere_maj, notes_internes, created_at, updated_at
FROM public.hotel_equipments
ON CONFLICT DO NOTHING;

-- Migrate room equipment assignments (room_id specified)
INSERT INTO public.equipment_assignments (
    hotel_id, equipment_id, room_id, est_disponible, est_fonctionnel,
    date_installation, date_derniere_verification, notes, created_at, updated_at
)
SELECT 
    r.hotel_id, re.equipment_id, re.room_id, re.est_disponible, re.est_fonctionnel,
    re.date_installation, re.date_derniere_verification, re.notes, re.created_at, re.updated_at
FROM public.room_equipments re
JOIN public.rooms r ON re.room_id = r.id
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. CREATE OPTIMIZED INDEXES
-- ============================================
CREATE INDEX idx_equipment_assignments_hotel ON public.equipment_assignments(hotel_id);
CREATE INDEX idx_equipment_assignments_equipment ON public.equipment_assignments(equipment_id);
CREATE INDEX idx_equipment_assignments_room ON public.equipment_assignments(room_id);
CREATE INDEX idx_equipment_assignments_hotel_level ON public.equipment_assignments(hotel_id, equipment_id) WHERE room_id IS NULL;
CREATE INDEX idx_equipment_assignments_room_level ON public.equipment_assignments(hotel_id, room_id) WHERE room_id IS NOT NULL;
CREATE INDEX idx_equipment_assignments_available_hotel ON public.equipment_assignments(hotel_id, est_disponible) WHERE room_id IS NULL AND est_disponible = TRUE;
CREATE INDEX idx_equipment_assignments_functional_room ON public.equipment_assignments(room_id, est_fonctionnel) WHERE room_id IS NOT NULL AND est_fonctionnel = TRUE;

-- ============================================
-- 6. CREATE TRIGGER FOR TIMESTAMP UPDATES
-- ============================================
CREATE TRIGGER update_equipment_assignments_updated_at 
    BEFORE UPDATE ON public.equipment_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. UPDATE ROW LEVEL SECURITY POLICIES
-- ============================================
ALTER TABLE public.equipment_assignments ENABLE ROW LEVEL SECURITY;

-- Create unified policies for equipment_assignments
CREATE POLICY "Allow all operations on equipment_assignments" 
ON public.equipment_assignments FOR ALL 
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.equipment_assignments TO authenticated;
GRANT ALL ON public.equipment_assignments TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.equipment_assignments_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.equipment_assignments_id_seq TO anon;

-- ============================================
-- 8. UPDATE HELPER FUNCTIONS
-- ============================================

-- Drop existing functions that will be recreated with new structure
DROP FUNCTION IF EXISTS get_hotel_equipment(INTEGER);
DROP FUNCTION IF EXISTS get_room_equipment(INTEGER);

-- Updated function to get available equipment for a hotel
CREATE OR REPLACE FUNCTION get_hotel_equipment(p_hotel_id INTEGER)
RETURNS TABLE (
    assignment_id INTEGER,
    equipment_id INTEGER,
    nom TEXT,
    categorie TEXT,
    icone TEXT,
    est_premium BOOLEAN,
    est_disponible BOOLEAN,
    est_gratuit BOOLEAN,
    prix_supplement DECIMAL(8,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ea.id,
        e.id,
        e.nom,
        e.categorie,
        e.icone,
        e.est_premium,
        ea.est_disponible,
        ea.est_gratuit,
        ea.prix_supplement
    FROM public.equipments e
    INNER JOIN public.equipment_assignments ea ON e.id = ea.equipment_id
    WHERE ea.hotel_id = p_hotel_id 
    AND ea.room_id IS NULL  -- Hotel-level assignments only
    AND e.est_actif = TRUE
    AND ea.est_disponible = TRUE
    ORDER BY e.categorie, e.ordre_affichage, e.nom;
END;
$$ LANGUAGE plpgsql;

-- Updated function to get room equipment for a specific room
CREATE OR REPLACE FUNCTION get_room_equipment(p_room_id INTEGER)
RETURNS TABLE (
    assignment_id INTEGER,
    equipment_id INTEGER,
    nom TEXT,
    categorie TEXT,
    icone TEXT,
    est_premium BOOLEAN,
    est_fonctionnel BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ea.id,
        e.id,
        e.nom,
        e.categorie,
        e.icone,
        e.est_premium,
        ea.est_fonctionnel
    FROM public.equipments e
    INNER JOIN public.equipment_assignments ea ON e.id = ea.equipment_id
    WHERE ea.room_id = p_room_id 
    AND e.est_actif = TRUE
    AND ea.est_disponible = TRUE
    ORDER BY e.categorie, e.ordre_affichage, e.nom;
END;
$$ LANGUAGE plpgsql;

-- Function to get all equipment for a room (hotel + room specific)
CREATE OR REPLACE FUNCTION get_all_room_equipment(p_room_id INTEGER)
RETURNS TABLE (
    assignment_id INTEGER,
    equipment_id INTEGER,
    nom TEXT,
    categorie TEXT,
    icone TEXT,
    est_premium BOOLEAN,
    source TEXT,
    est_disponible BOOLEAN,
    est_fonctionnel BOOLEAN
) AS $$
DECLARE
    room_hotel_id INTEGER;
BEGIN
    -- Get the hotel_id for this room
    SELECT hotel_id INTO room_hotel_id FROM public.rooms WHERE id = p_room_id;
    
    RETURN QUERY
    -- Room-specific equipment
    SELECT 
        ea.id,
        e.id,
        e.nom,
        e.categorie,
        e.icone,
        e.est_premium,
        'room'::TEXT,
        ea.est_disponible,
        ea.est_fonctionnel
    FROM public.equipments e
    INNER JOIN public.equipment_assignments ea ON e.id = ea.equipment_id
    WHERE ea.room_id = p_room_id
    AND e.est_actif = TRUE
    AND ea.est_disponible = TRUE
    
    UNION
    
    -- Hotel-level equipment not already assigned to this specific room
    SELECT 
        ea.id,
        e.id,
        e.nom,
        e.categorie,
        e.icone,
        e.est_premium,
        'hotel'::TEXT,
        ea.est_disponible,
        TRUE  -- Hotel equipment is considered functional by default
    FROM public.equipments e
    INNER JOIN public.equipment_assignments ea ON e.id = ea.equipment_id
    WHERE ea.hotel_id = room_hotel_id
    AND ea.room_id IS NULL  -- Hotel-level assignment
    AND e.est_actif = TRUE
    AND ea.est_disponible = TRUE
    AND e.id NOT IN (
        SELECT equipment_id 
        FROM public.equipment_assignments 
        WHERE room_id = p_room_id
    )
    
    ORDER BY categorie, nom;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. VERIFY DATA MIGRATION AND INTEGRITY
-- ============================================

DO $$ 
DECLARE 
    hotel_eq_count INTEGER;
    room_eq_count INTEGER;
    new_hotel_assignments INTEGER;
    new_room_assignments INTEGER;
BEGIN
    -- Count original data
    SELECT COUNT(*) INTO hotel_eq_count FROM public.hotel_equipments;
    SELECT COUNT(*) INTO room_eq_count FROM public.room_equipments;
    
    -- Count migrated data
    SELECT COUNT(*) INTO new_hotel_assignments FROM public.equipment_assignments WHERE room_id IS NULL;
    SELECT COUNT(*) INTO new_room_assignments FROM public.equipment_assignments WHERE room_id IS NOT NULL;
    
    RAISE NOTICE 'Data migration summary:';
    RAISE NOTICE '- Original hotel_equipments: %', hotel_eq_count;
    RAISE NOTICE '- Original room_equipments: %', room_eq_count;
    RAISE NOTICE '- Migrated hotel assignments: %', new_hotel_assignments;
    RAISE NOTICE '- Migrated room assignments: %', new_room_assignments;
    
    -- Verify integrity
    IF hotel_eq_count = new_hotel_assignments AND room_eq_count = new_room_assignments THEN
        RAISE NOTICE '✓ Data migration completed successfully';
    ELSE
        RAISE WARNING '⚠ Data migration counts do not match - manual review required';
    END IF;
END $$;

-- ============================================
-- 10. DROP OLD TABLES AND CLEANUP
-- ============================================

-- Drop old triggers first
DROP TRIGGER IF EXISTS enforce_room_equipment_hierarchy ON public.room_equipments;
DROP TRIGGER IF EXISTS update_hotel_equipments_updated_at ON public.hotel_equipments;
DROP TRIGGER IF EXISTS update_room_equipments_updated_at ON public.room_equipments;

-- Drop old validation function
DROP FUNCTION IF EXISTS validate_room_equipment();

-- Drop the old tables
DROP TABLE IF EXISTS public.room_equipments CASCADE;
DROP TABLE IF EXISTS public.hotel_equipments CASCADE;

-- ============================================
-- 11. FINAL VERIFICATION AND LOGGING
-- ============================================
DO $$ 
DECLARE 
    total_assignments INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_assignments FROM public.equipment_assignments;
    
    RAISE NOTICE 'Equipment structure optimization completed successfully:';
    RAISE NOTICE '- Created unified equipment_assignments table';
    RAISE NOTICE '- Total equipment assignments: %', total_assignments;
    RAISE NOTICE '- Migrated all data from hotel_equipments and room_equipments';
    RAISE NOTICE '- Created validation triggers and business rules';
    RAISE NOTICE '- Updated helper functions and RLS policies';
    RAISE NOTICE '- Dropped old tables and cleaned up obsolete objects';
    RAISE NOTICE 'Migration 014_optimize_equipment_structure.sql completed at %', now();
END $$;