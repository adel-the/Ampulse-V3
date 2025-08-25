-- Création du système complet d'équipements pour SoliReserve
-- Tables: equipments et hotel_equipments
-- Date: 2025-08-18

-- Table des équipements disponibles
CREATE TABLE IF NOT EXISTS equipments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('amenity', 'facility', 'service', 'safety', 'accessibility', 'technology', 'other')),
    category VARCHAR(100),
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table de liaison hôtel-équipements  
CREATE TABLE IF NOT EXISTS hotel_equipments (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    equipment_id INTEGER NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
    is_available BOOLEAN DEFAULT true,
    quantity INTEGER DEFAULT 1,
    condition VARCHAR(50) DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'out_of_order')),
    location VARCHAR(255),
    notes TEXT,
    price_per_use DECIMAL(10,2) DEFAULT 0,
    last_maintenance TIMESTAMPTZ,
    next_maintenance TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(hotel_id, equipment_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_equipments_type ON equipments(type);
CREATE INDEX IF NOT EXISTS idx_equipments_active ON equipments(is_active);
CREATE INDEX IF NOT EXISTS idx_hotel_equipments_hotel ON hotel_equipments(hotel_id);

-- Configuration RLS (Row Level Security) - Politiques permissives
ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_equipments ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow all operations on equipments" ON equipments;
DROP POLICY IF EXISTS "Allow all operations on hotel_equipments" ON hotel_equipments;

-- Créer les nouvelles politiques permissives
CREATE POLICY "Allow all operations on equipments" ON equipments FOR ALL USING (true);
CREATE POLICY "Allow all operations on hotel_equipments" ON hotel_equipments FOR ALL USING (true);

-- Insertion des 20 équipements par défaut
INSERT INTO equipments (name, type, category, description, icon, display_order) VALUES
    ('WiFi gratuit', 'technology', 'Connectivité', 'Connexion internet sans fil gratuite', 'Wifi', 1),
    ('Télévision', 'amenity', 'Divertissement', 'Télévision avec chaînes locales', 'Tv', 2),
    ('Climatisation', 'amenity', 'Climatisation', 'Système de climatisation individuelle', 'Wind', 3),
    ('Chauffage', 'amenity', 'Climatisation', 'Système de chauffage central', 'Thermometer', 4),
    ('Salle de bain privée', 'facility', 'Salle de bain', 'Salle de bain privative avec douche', 'Bath', 5),
    ('Minibar', 'amenity', 'Confort', 'Minibar réfrigéré avec boissons', 'Coffee', 6),
    ('Kitchenette', 'facility', 'Cuisine', 'Coin cuisine équipé avec réfrigérateur', 'Utensils', 7),
    ('Balcon', 'amenity', 'Confort', 'Balcon privatif avec mobilier', 'Home', 8),
    ('Vue mer', 'amenity', 'Vue', 'Vue panoramique sur la mer', 'Waves', 9),
    ('Vue jardin', 'amenity', 'Vue', 'Vue sur le jardin de l''établissement', 'MapPin', 10),
    ('Parking', 'service', 'Transport', 'Place de parking sécurisée', 'Car', 11),
    ('Accès PMR', 'accessibility', 'Accessibilité', 'Accès et équipements pour personnes à mobilité réduite', 'Users', 12),
    ('Service ménage', 'service', 'Services', 'Service de ménage quotidien', 'Home', 13),
    ('Coffre-fort', 'safety', 'Sécurité', 'Coffre-fort individuel dans la chambre', 'Shield', 14),
    ('Jacuzzi', 'amenity', 'Bien-être', 'Bain à remous privatif', 'Bath', 15),
    ('Piscine', 'facility', 'Bien-être', 'Accès à la piscine de l''établissement', 'Waves', 16),
    ('Salle de sport', 'facility', 'Bien-être', 'Accès à la salle de fitness', 'Dumbbell', 17),
    ('Restaurant', 'service', 'Restauration', 'Service de restauration sur place', 'Utensils', 18),
    ('Room service', 'service', 'Services', 'Service en chambre 24h/24', 'Clock', 19),
    ('Spa', 'facility', 'Bien-être', 'Accès aux soins de spa et wellness', 'Bath', 20)
ON CONFLICT (name) DO NOTHING;

-- Vérifications finales
SELECT 'Tables créées avec succès' as status;
SELECT COUNT(*) as total_equipments FROM equipments;
SELECT type, COUNT(*) as count FROM equipments GROUP BY type ORDER BY type;