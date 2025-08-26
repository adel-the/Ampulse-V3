-- Migration: Restore proper equipment hierarchy
-- Date: 2025-08-26
-- Description: Restore hotel_equipments table and implement proper equipment hierarchy
--              where hotels own equipment first, then rooms can select from their hotel's equipment

-- ============================================
-- 1. RECREATE HOTEL EQUIPMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.hotel_equipments (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    equipment_id INTEGER NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
    est_disponible BOOLEAN DEFAULT TRUE,
    est_gratuit BOOLEAN DEFAULT TRUE,
    prix_supplement DECIMAL(8,2) CHECK (prix_supplement >= 0 OR prix_supplement IS NULL),
    description_specifique TEXT,
    horaires_disponibilite JSONB,
    conditions_usage TEXT,
    date_ajout DATE DEFAULT CURRENT_DATE,
    date_derniere_maj DATE DEFAULT CURRENT_DATE,
    notes_internes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(hotel_id, equipment_id)
);

COMMENT ON TABLE public.hotel_equipments IS 'Equipment available at each hotel with specific conditions';
COMMENT ON COLUMN public.hotel_equipments.est_disponible IS 'Whether equipment is currently available';
COMMENT ON COLUMN public.hotel_equipments.est_gratuit IS 'Whether equipment is complimentary';
COMMENT ON COLUMN public.hotel_equipments.prix_supplement IS 'Additional cost for equipment usage';

-- ============================================
-- 2. CREATE FUNCTION TO VALIDATE ROOM EQUIPMENT
-- ============================================
CREATE OR REPLACE FUNCTION validate_room_equipment()
RETURNS TRIGGER AS $$
DECLARE
    room_hotel_id INTEGER;
    equipment_exists BOOLEAN;
BEGIN
    -- Get the hotel_id for this room
    SELECT hotel_id INTO room_hotel_id 
    FROM public.rooms 
    WHERE id = NEW.room_id;
    
    -- Check if the equipment exists for this hotel
    SELECT EXISTS(
        SELECT 1 FROM public.hotel_equipments 
        WHERE hotel_id = room_hotel_id 
        AND equipment_id = NEW.equipment_id
        AND est_disponible = TRUE
    ) INTO equipment_exists;
    
    -- If equipment doesn't exist for this hotel, prevent insertion
    IF NOT equipment_exists THEN
        RAISE EXCEPTION 'Equipment ID % is not available for hotel ID %. Equipment must first be added to the hotel.', NEW.equipment_id, room_hotel_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. RECREATE ROOM EQUIPMENTS TABLE WITH CONSTRAINT
-- ============================================
CREATE TABLE IF NOT EXISTS public.room_equipments (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    equipment_id INTEGER NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
    est_disponible BOOLEAN DEFAULT TRUE,
    est_fonctionnel BOOLEAN DEFAULT TRUE,
    date_installation DATE DEFAULT CURRENT_DATE,
    date_derniere_verification DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(room_id, equipment_id)
);

COMMENT ON TABLE public.room_equipments IS 'Equipment present in individual rooms (must exist in hotel_equipments first)';

-- ============================================
-- 4. CREATE TRIGGER TO ENFORCE HIERARCHY
-- ============================================
CREATE TRIGGER enforce_room_equipment_hierarchy 
    BEFORE INSERT OR UPDATE ON public.room_equipments
    FOR EACH ROW EXECUTE FUNCTION validate_room_equipment();

-- ============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_hotel_equipments_hotel ON public.hotel_equipments(hotel_id);
CREATE INDEX idx_hotel_equipments_equipment ON public.hotel_equipments(equipment_id);
CREATE INDEX idx_hotel_equipments_disponible ON public.hotel_equipments(hotel_id, est_disponible) WHERE est_disponible = TRUE;

CREATE INDEX idx_room_equipments_room ON public.room_equipments(room_id);
CREATE INDEX idx_room_equipments_equipment ON public.room_equipments(equipment_id);
CREATE INDEX idx_room_equipments_fonctionnel ON public.room_equipments(room_id, est_fonctionnel) WHERE est_fonctionnel = TRUE;

-- ============================================
-- 6. CREATE TRIGGERS FOR TIMESTAMP UPDATES
-- ============================================
CREATE TRIGGER update_hotel_equipments_updated_at 
    BEFORE UPDATE ON public.hotel_equipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_equipments_updated_at 
    BEFORE UPDATE ON public.room_equipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. MIGRATE EXISTING DATA FROM JSONB AMENITIES
-- ============================================

-- Helper function to migrate amenities data from rooms
CREATE OR REPLACE FUNCTION migrate_amenities_to_equipment_tables()
RETURNS void AS $$
DECLARE
    room_record RECORD;
    amenity_record RECORD;
    equipment_id INTEGER;
    hotel_id_temp INTEGER;
BEGIN
    -- First pass: Collect all equipment IDs from rooms and add them to their hotels
    FOR room_record IN 
        SELECT DISTINCT r.hotel_id, r.amenities 
        FROM public.rooms r
        WHERE r.amenities IS NOT NULL 
        AND jsonb_array_length(r.amenities) > 0
    LOOP
        -- Process each amenity in the room's amenities array
        FOR amenity_record IN 
            SELECT value AS amenity_data FROM jsonb_array_elements(room_record.amenities)
        LOOP
            equipment_id := NULL;
            
            -- Extract equipment ID from different possible formats
            IF jsonb_typeof(amenity_record.amenity_data) = 'object' THEN
                IF amenity_record.amenity_data ? 'equipment_id' THEN
                    equipment_id := (amenity_record.amenity_data->>'equipment_id')::INTEGER;
                ELSIF amenity_record.amenity_data ? 'id' THEN
                    equipment_id := (amenity_record.amenity_data->>'id')::INTEGER;
                END IF;
            ELSIF jsonb_typeof(amenity_record.amenity_data) = 'number' THEN
                equipment_id := amenity_record.amenity_data::TEXT::INTEGER;
            END IF;
            
            -- Add equipment to hotel if found and valid
            IF equipment_id IS NOT NULL THEN
                -- Verify equipment exists
                IF EXISTS(SELECT 1 FROM public.equipments WHERE id = equipment_id) THEN
                    INSERT INTO public.hotel_equipments (hotel_id, equipment_id, est_disponible, est_gratuit)
                    VALUES (room_record.hotel_id, equipment_id, TRUE, TRUE)
                    ON CONFLICT (hotel_id, equipment_id) DO NOTHING;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
    
    -- Second pass: Add equipment to individual rooms (now that they exist in hotel_equipments)
    FOR room_record IN 
        SELECT r.id, r.hotel_id, r.amenities 
        FROM public.rooms r
        WHERE r.amenities IS NOT NULL 
        AND jsonb_array_length(r.amenities) > 0
    LOOP
        FOR amenity_record IN 
            SELECT value AS amenity_data FROM jsonb_array_elements(room_record.amenities)
        LOOP
            equipment_id := NULL;
            
            -- Extract equipment ID from different possible formats
            IF jsonb_typeof(amenity_record.amenity_data) = 'object' THEN
                IF amenity_record.amenity_data ? 'equipment_id' THEN
                    equipment_id := (amenity_record.amenity_data->>'equipment_id')::INTEGER;
                ELSIF amenity_record.amenity_data ? 'id' THEN
                    equipment_id := (amenity_record.amenity_data->>'id')::INTEGER;
                END IF;
            ELSIF jsonb_typeof(amenity_record.amenity_data) = 'number' THEN
                equipment_id := amenity_record.amenity_data::TEXT::INTEGER;
            END IF;
            
            -- Only add if equipment exists in hotel_equipments for this hotel
            IF equipment_id IS NOT NULL THEN
                IF EXISTS(
                    SELECT 1 FROM public.hotel_equipments 
                    WHERE hotel_id = room_record.hotel_id 
                    AND equipment_id = equipment_id
                ) THEN
                    INSERT INTO public.room_equipments (room_id, equipment_id, est_disponible, est_fonctionnel)
                    VALUES (room_record.id, equipment_id, TRUE, TRUE)
                    ON CONFLICT (room_id, equipment_id) DO NOTHING;
                END IF;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Migration of room amenities to equipment hierarchy completed';
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT migrate_amenities_to_equipment_tables();

-- ============================================
-- 8. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get available equipment for a hotel
CREATE OR REPLACE FUNCTION get_hotel_equipment(p_hotel_id INTEGER)
RETURNS TABLE (
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
        e.id,
        e.nom,
        e.categorie,
        e.icone,
        e.est_premium,
        he.est_disponible,
        he.est_gratuit,
        he.prix_supplement
    FROM public.equipments e
    INNER JOIN public.hotel_equipments he ON e.id = he.equipment_id
    WHERE he.hotel_id = p_hotel_id 
    AND e.est_actif = TRUE
    AND he.est_disponible = TRUE
    ORDER BY e.categorie, e.ordre_affichage, e.nom;
END;
$$ LANGUAGE plpgsql;

-- Function to get room equipment for a specific room
CREATE OR REPLACE FUNCTION get_room_equipment(p_room_id INTEGER)
RETURNS TABLE (
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
        e.id,
        e.nom,
        e.categorie,
        e.icone,
        e.est_premium,
        re.est_fonctionnel
    FROM public.equipments e
    INNER JOIN public.room_equipments re ON e.id = re.equipment_id
    WHERE re.room_id = p_room_id 
    AND e.est_actif = TRUE
    AND re.est_disponible = TRUE
    ORDER BY e.categorie, e.ordre_affichage, e.nom;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. FINAL LOGGING
-- ============================================
DO $$ 
BEGIN 
    RAISE NOTICE 'Successfully restored equipment hierarchy:';
    RAISE NOTICE '- Recreated hotel_equipments table with constraints';
    RAISE NOTICE '- Recreated room_equipments table with validation trigger';
    RAISE NOTICE '- Migrated existing room amenities JSONB data to proper tables';
    RAISE NOTICE '- Added helper functions for equipment queries';
    RAISE NOTICE 'Migration 013_restore_equipment_hierarchy.sql completed at %', now();
END 
$$;