-- ============================================
-- PMS Hotel System - Complete Schema Migration
-- ============================================
-- This migration creates the complete database schema for the hotel management system
-- including establishments (hotels), rooms, and equipment with proper relationships

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ESTABLISHMENTS (HOTELS) TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.hotels (
    id SERIAL PRIMARY KEY,
    
    -- Basic Information (Required)
    nom TEXT NOT NULL,
    adresse TEXT NOT NULL,
    ville TEXT NOT NULL,
    code_postal TEXT NOT NULL CHECK (code_postal ~ '^\d{5}$'),
    type_etablissement TEXT CHECK (type_etablissement IN ('hotel', 'residence', 'foyer', 'chrs', 'chr', 'autre')) DEFAULT 'hotel',
    
    -- Contact Information
    telephone TEXT,
    email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL),
    site_web TEXT,
    
    -- Management & Status
    gestionnaire TEXT,
    statut TEXT CHECK (statut IN ('ACTIF', 'INACTIF')) DEFAULT 'ACTIF',
    
    -- Room Statistics
    chambres_total INTEGER DEFAULT 0 CHECK (chambres_total >= 0),
    chambres_occupees INTEGER DEFAULT 0 CHECK (chambres_occupees >= 0),
    taux_occupation DECIMAL(5,2) DEFAULT 0.0 CHECK (taux_occupation >= 0 AND taux_occupation <= 100),
    
    -- Legal & Business Information
    siret TEXT UNIQUE CHECK (siret ~ '^\d{14}$' OR siret IS NULL),
    tva_intracommunautaire TEXT,
    classement_etoiles INTEGER CHECK (classement_etoiles BETWEEN 1 AND 5 OR classement_etoiles IS NULL),
    
    -- Director Information
    directeur TEXT,
    telephone_directeur TEXT,
    email_directeur TEXT CHECK (email_directeur ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email_directeur IS NULL),
    
    -- Operational Details
    capacite INTEGER CHECK (capacite > 0 OR capacite IS NULL),
    description TEXT,
    check_in_time TIME DEFAULT '14:00:00',
    check_out_time TIME DEFAULT '11:00:00',
    
    -- Property Details
    parking_places INTEGER DEFAULT 0 CHECK (parking_places >= 0),
    surface_totale DECIMAL(10,2) CHECK (surface_totale > 0 OR surface_totale IS NULL),
    nombre_etages INTEGER CHECK (nombre_etages > 0 OR nombre_etages IS NULL),
    
    -- Multi-tenancy: Each hotel is owned by a user
    user_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chambres_coherence CHECK (chambres_occupees <= chambres_total)
);

-- Comments for hotels table
COMMENT ON TABLE public.hotels IS 'Main establishments table supporting various accommodation types';
COMMENT ON COLUMN public.hotels.user_owner_id IS 'Owner of the establishment for multi-tenancy';
COMMENT ON COLUMN public.hotels.type_etablissement IS 'Type of establishment (hotel, residence, social housing, etc.)';
COMMENT ON COLUMN public.hotels.taux_occupation IS 'Current occupancy rate percentage';

-- ============================================
-- 2. ROOM CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.room_categories (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price > 0),
    max_occupancy INTEGER NOT NULL DEFAULT 2 CHECK (max_occupancy > 0),
    amenities JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(hotel_id, name)
);

COMMENT ON TABLE public.room_categories IS 'Room categories for each establishment';

-- ============================================
-- 3. ROOMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.rooms (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    numero TEXT NOT NULL,
    type TEXT NOT NULL,
    prix DECIMAL(10,2) NOT NULL CHECK (prix > 0),
    statut TEXT CHECK (statut IN ('disponible', 'occupee', 'maintenance')) DEFAULT 'disponible',
    description TEXT,
    category_id INTEGER REFERENCES public.room_categories(id) ON DELETE SET NULL,
    floor INTEGER DEFAULT 1 CHECK (floor >= 0),
    room_size DECIMAL(8,2) CHECK (room_size > 0 OR room_size IS NULL),
    bed_type TEXT,
    view_type TEXT,
    is_smoking BOOLEAN DEFAULT FALSE,
    images JSONB DEFAULT '[]'::jsonb,
    amenities JSONB DEFAULT '[]'::jsonb,
    last_cleaned TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(hotel_id, numero)
);

COMMENT ON TABLE public.rooms IS 'Individual rooms within establishments';
COMMENT ON COLUMN public.rooms.numero IS 'Room number (unique within hotel)';
COMMENT ON COLUMN public.rooms.statut IS 'Current room status';
COMMENT ON COLUMN public.rooms.room_size IS 'Room size in square meters';

-- ============================================
-- 4. EQUIPMENT MASTER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.equipments (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL UNIQUE,
    nom_en TEXT,
    description TEXT,
    description_en TEXT,
    icone TEXT DEFAULT 'Home',
    categorie TEXT CHECK (categorie IN ('connectivity', 'services', 'wellness', 'accessibility', 'security', 'recreation', 'general')) DEFAULT 'general',
    couleur TEXT,
    est_premium BOOLEAN DEFAULT FALSE,
    ordre_affichage INTEGER DEFAULT 0,
    est_actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.equipments IS 'Master catalog of available equipment and amenities';
COMMENT ON COLUMN public.equipments.categorie IS 'Equipment category for grouping and filtering';
COMMENT ON COLUMN public.equipments.est_premium IS 'Whether this is a premium/paid amenity';

-- ============================================
-- 5. HOTEL-EQUIPMENT ASSOCIATION TABLE
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

-- ============================================
-- 6. ROOM-EQUIPMENT ASSOCIATION TABLE
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

COMMENT ON TABLE public.room_equipments IS 'Equipment present in individual rooms';

-- ============================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================

-- Hotels indexes
CREATE INDEX idx_hotels_user_owner ON public.hotels(user_owner_id);
CREATE INDEX idx_hotels_statut ON public.hotels(statut) WHERE statut = 'ACTIF';
CREATE INDEX idx_hotels_type ON public.hotels(type_etablissement);

-- Rooms indexes
CREATE INDEX idx_rooms_hotel_id ON public.rooms(hotel_id);
CREATE INDEX idx_rooms_statut ON public.rooms(statut);
CREATE INDEX idx_rooms_hotel_statut ON public.rooms(hotel_id, statut);
CREATE INDEX idx_rooms_floor ON public.rooms(floor);
CREATE INDEX idx_rooms_category ON public.rooms(category_id);

-- Room categories indexes
CREATE INDEX idx_room_categories_hotel ON public.room_categories(hotel_id);
CREATE INDEX idx_room_categories_active ON public.room_categories(is_active) WHERE is_active = TRUE;

-- Equipment indexes
CREATE INDEX idx_equipments_category ON public.equipments(categorie);
CREATE INDEX idx_equipments_active ON public.equipments(est_actif) WHERE est_actif = TRUE;

-- Association table indexes
CREATE INDEX idx_hotel_equipments_hotel ON public.hotel_equipments(hotel_id);
CREATE INDEX idx_hotel_equipments_equipment ON public.hotel_equipments(equipment_id);
CREATE INDEX idx_room_equipments_room ON public.room_equipments(room_id);
CREATE INDEX idx_room_equipments_equipment ON public.room_equipments(equipment_id);

-- ============================================
-- 8. TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON public.hotels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_categories_updated_at BEFORE UPDATE ON public.room_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipments_updated_at BEFORE UPDATE ON public.equipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotel_equipments_updated_at BEFORE UPDATE ON public.hotel_equipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_equipments_updated_at BEFORE UPDATE ON public.room_equipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();