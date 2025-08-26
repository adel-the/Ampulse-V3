-- Migration: Simplify Equipment to Hotel-First Ownership Model
-- Date: 2025-08-26
-- Description: Transform equipment from global catalog to hotel-specific equipment

BEGIN;

-- ============================================
-- 1. CREATE NEW SIMPLIFIED HOTEL EQUIPMENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.hotel_equipment (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(50) NOT NULL DEFAULT 'general',
    icone VARCHAR(50),
    couleur VARCHAR(20),
    est_premium BOOLEAN DEFAULT FALSE,
    est_actif BOOLEAN DEFAULT TRUE,
    ordre_affichage INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique equipment names per hotel
    CONSTRAINT unique_equipment_per_hotel UNIQUE(hotel_id, nom)
);

-- Add indexes for performance
CREATE INDEX idx_hotel_equipment_hotel_id ON public.hotel_equipment(hotel_id);
CREATE INDEX idx_hotel_equipment_active ON public.hotel_equipment(hotel_id, est_actif) WHERE est_actif = TRUE;
CREATE INDEX idx_hotel_equipment_category ON public.hotel_equipment(hotel_id, categorie);

-- Add trigger for timestamp updates
CREATE TRIGGER update_hotel_equipment_updated_at 
    BEFORE UPDATE ON public.hotel_equipment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.hotel_equipment IS 'Hotel-specific equipment catalog owned and managed by each hotel';
COMMENT ON COLUMN public.hotel_equipment.hotel_id IS 'The hotel that owns this equipment';
COMMENT ON COLUMN public.hotel_equipment.nom IS 'Equipment name unique within the hotel';

-- ============================================
-- 2. CREATE ROOM EQUIPMENT ASSIGNMENTS TABLE  
-- ============================================
CREATE TABLE IF NOT EXISTS public.room_equipment_assignments (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    hotel_equipment_id INTEGER NOT NULL REFERENCES public.hotel_equipment(id) ON DELETE CASCADE,
    est_fonctionnel BOOLEAN DEFAULT TRUE,
    notes TEXT,
    date_installation DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique equipment per room
    CONSTRAINT unique_equipment_per_room UNIQUE(room_id, hotel_equipment_id)
);

-- Add indexes
CREATE INDEX idx_room_equipment_assignments_room ON public.room_equipment_assignments(room_id);
CREATE INDEX idx_room_equipment_assignments_equipment ON public.room_equipment_assignments(hotel_equipment_id);
CREATE INDEX idx_room_equipment_assignments_functional ON public.room_equipment_assignments(room_id, est_fonctionnel) WHERE est_fonctionnel = TRUE;

-- Add trigger for timestamp updates
CREATE TRIGGER update_room_equipment_assignments_updated_at 
    BEFORE UPDATE ON public.room_equipment_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.room_equipment_assignments IS 'Simple assignments of hotel equipment to rooms';
COMMENT ON COLUMN public.room_equipment_assignments.hotel_equipment_id IS 'Equipment from the hotel catalog';

-- ============================================
-- 3. MIGRATE DATA FROM EXISTING STRUCTURE
-- ============================================

-- Migrate hotel-level equipment assignments to new hotel_equipment table
INSERT INTO public.hotel_equipment (hotel_id, nom, description, categorie, icone, couleur, est_premium, est_actif, ordre_affichage, created_at, updated_at)
SELECT DISTINCT 
    ea.hotel_id,
    e.nom,
    e.description,
    e.categorie,
    e.icone,
    e.couleur,
    e.est_premium,
    e.est_actif,
    e.ordre_affichage,
    COALESCE(ea.created_at, NOW()),
    COALESCE(ea.updated_at, NOW())
FROM public.equipment_assignments ea
JOIN public.equipments e ON ea.equipment_id = e.id
WHERE ea.room_id IS NULL
AND ea.est_disponible = TRUE
ON CONFLICT (hotel_id, nom) DO UPDATE SET
    description = EXCLUDED.description,
    categorie = EXCLUDED.categorie,
    icone = EXCLUDED.icone,
    couleur = EXCLUDED.couleur,
    updated_at = EXCLUDED.updated_at;

-- Also add any equipment that was directly assigned to rooms (to ensure consistency)
INSERT INTO public.hotel_equipment (hotel_id, nom, description, categorie, icone, couleur, est_premium, est_actif, ordre_affichage, created_at, updated_at)
SELECT DISTINCT 
    r.hotel_id,
    e.nom,
    e.description,
    e.categorie,
    e.icone,
    e.couleur,
    e.est_premium,
    e.est_actif,
    e.ordre_affichage,
    NOW(),
    NOW()
FROM public.equipment_assignments ea
JOIN public.equipments e ON ea.equipment_id = e.id
JOIN public.rooms r ON ea.room_id = r.id
WHERE ea.room_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.hotel_equipment he 
    WHERE he.hotel_id = r.hotel_id AND he.nom = e.nom
)
ON CONFLICT (hotel_id, nom) DO NOTHING;

-- Migrate room-level equipment assignments to new room_equipment_assignments table
INSERT INTO public.room_equipment_assignments (room_id, hotel_equipment_id, est_fonctionnel, notes, date_installation, created_at, updated_at)
SELECT 
    ea.room_id,
    he.id as hotel_equipment_id,
    COALESCE(ea.est_fonctionnel, TRUE),
    ea.notes,
    COALESCE(ea.date_installation, CURRENT_DATE),
    COALESCE(ea.created_at, NOW()),
    COALESCE(ea.updated_at, NOW())
FROM public.equipment_assignments ea
JOIN public.equipments e ON ea.equipment_id = e.id
JOIN public.rooms r ON ea.room_id = r.id
JOIN public.hotel_equipment he ON he.hotel_id = r.hotel_id AND he.nom = e.nom
WHERE ea.room_id IS NOT NULL
ON CONFLICT (room_id, hotel_equipment_id) DO NOTHING;

-- ============================================
-- 4. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get all equipment for a hotel
CREATE OR REPLACE FUNCTION get_hotel_equipment_list(p_hotel_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    nom VARCHAR(255),
    description TEXT,
    categorie VARCHAR(50),
    icone VARCHAR(50),
    couleur VARCHAR(20),
    est_premium BOOLEAN,
    est_actif BOOLEAN,
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
        he.est_actif,
        he.ordre_affichage
    FROM public.hotel_equipment he
    WHERE he.hotel_id = p_hotel_id 
    AND he.est_actif = TRUE
    ORDER BY he.categorie, he.ordre_affichage, he.nom;
END;
$$ LANGUAGE plpgsql;

-- Function to get equipment for a specific room
CREATE OR REPLACE FUNCTION get_room_equipment_list(p_room_id INTEGER)
RETURNS TABLE (
    assignment_id INTEGER,
    equipment_id INTEGER,
    nom VARCHAR(255),
    description TEXT,
    categorie VARCHAR(50),
    icone VARCHAR(50),
    est_fonctionnel BOOLEAN,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rea.id,
        he.id,
        he.nom,
        he.description,
        he.categorie,
        he.icone,
        rea.est_fonctionnel,
        rea.notes
    FROM public.room_equipment_assignments rea
    JOIN public.hotel_equipment he ON rea.hotel_equipment_id = he.id
    WHERE rea.room_id = p_room_id
    AND he.est_actif = TRUE
    ORDER BY he.categorie, he.ordre_affichage, he.nom;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. SET UP ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.hotel_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_equipment_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for hotel_equipment
CREATE POLICY "Allow all operations on hotel_equipment" 
ON public.hotel_equipment FOR ALL 
USING (true) WITH CHECK (true);

-- Policies for room_equipment_assignments  
CREATE POLICY "Allow all operations on room_equipment_assignments" 
ON public.room_equipment_assignments FOR ALL 
USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.hotel_equipment TO authenticated, anon;
GRANT ALL ON public.room_equipment_assignments TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE public.hotel_equipment_id_seq TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE public.room_equipment_assignments_id_seq TO authenticated, anon;

-- ============================================
-- 6. DROP OLD STRUCTURE (COMMENTED FOR SAFETY)
-- ============================================
-- We keep these commented for safety during initial deployment
-- Uncomment and run separately after verifying migration success
-- DROP TABLE IF EXISTS public.equipment_assignments CASCADE;
-- DROP TABLE IF EXISTS public.equipments CASCADE;

COMMIT;

-- ============================================
-- 7. VERIFICATION
-- ============================================
DO $$ 
DECLARE 
    hotel_count INTEGER;
    room_assignments_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO hotel_count FROM public.hotel_equipment;
    SELECT COUNT(*) INTO room_assignments_count FROM public.room_equipment_assignments;
    
    RAISE NOTICE 'Migration completed successfully:';
    RAISE NOTICE '- Hotel equipment entries: %', hotel_count;
    RAISE NOTICE '- Room equipment assignments: %', room_assignments_count;
    RAISE NOTICE '';
    RAISE NOTICE 'New simplified structure is ready:';
    RAISE NOTICE '- Each hotel manages its own equipment catalog';
    RAISE NOTICE '- Equipment is created in hotel equipment section';
    RAISE NOTICE '- Rooms select from their hotel equipment only';
END $$;