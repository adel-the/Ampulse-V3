-- ===================================================================
-- SCRIPT DE CRÉATION DES TABLES D'ÉQUIPEMENTS POUR SOLIRESERVE ENHANCED
-- ===================================================================
-- Ce script créé la structure complète pour gérer les équipements et services
-- dans l'application de gestion hôtelière SoliReserve Enhanced
-- ===================================================================

-- 1. TABLE EQUIPMENTS (Équipements disponibles)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.equipments (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    nom_en VARCHAR(100) NULL, -- Nom en anglais pour l'internationalisation
    description TEXT NULL,
    description_en TEXT NULL, -- Description en anglais
    icone VARCHAR(50) NULL, -- Nom de l'icône (ex: "wifi", "pool", "parking")
    categorie VARCHAR(50) NOT NULL DEFAULT 'general', -- 'connectivity', 'recreation', 'services', 'accessibility', 'security', 'wellness'
    couleur VARCHAR(7) NULL DEFAULT '#3B82F6', -- Couleur hexadécimale pour l'affichage
    est_premium BOOLEAN NOT NULL DEFAULT false, -- Équipement premium/payant
    ordre_affichage INTEGER NOT NULL DEFAULT 0, -- Ordre pour l'affichage dans l'interface
    est_actif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_equipments_categorie ON public.equipments(categorie);
CREATE INDEX IF NOT EXISTS idx_equipments_actif ON public.equipments(est_actif);
CREATE INDEX IF NOT EXISTS idx_equipments_ordre ON public.equipments(ordre_affichage);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_equipments_updated_at 
    BEFORE UPDATE ON public.equipments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 2. TABLE HOTEL_EQUIPMENTS (Relation many-to-many)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.hotel_equipments (
    id BIGSERIAL PRIMARY KEY,
    hotel_id BIGINT NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    equipment_id BIGINT NOT NULL REFERENCES public.equipments(id) ON DELETE CASCADE,
    est_disponible BOOLEAN NOT NULL DEFAULT true, -- Peut être temporairement indisponible
    est_gratuit BOOLEAN NOT NULL DEFAULT true, -- Payant ou gratuit
    prix_supplement DECIMAL(10,2) NULL, -- Prix supplément si payant
    description_specifique TEXT NULL, -- Description spécifique pour cet hôtel
    horaires_disponibilite JSONB NULL, -- Horaires de disponibilité spécifiques
    conditions_usage TEXT NULL, -- Conditions d'usage spécifiques
    date_ajout TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date_derniere_maj TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes_internes TEXT NULL, -- Notes pour l'équipe
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contrainte d'unicité (un équipement ne peut être ajouté qu'une fois par hôtel)
    UNIQUE(hotel_id, equipment_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_hotel_equipments_hotel ON public.hotel_equipments(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_equipments_equipment ON public.hotel_equipments(equipment_id);
CREATE INDEX IF NOT EXISTS idx_hotel_equipments_disponible ON public.hotel_equipments(est_disponible);
CREATE INDEX IF NOT EXISTS idx_hotel_equipments_gratuit ON public.hotel_equipments(est_gratuit);

-- Trigger pour updated_at
CREATE OR REPLACE TRIGGER update_hotel_equipments_updated_at 
    BEFORE UPDATE ON public.hotel_equipments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 3. INSERTION DES ÉQUIPEMENTS DE BASE
-- ===================================================================

-- Équipements de connectivité
INSERT INTO public.equipments (nom, nom_en, description, description_en, icone, categorie, couleur, est_premium, ordre_affichage) VALUES
('WiFi Gratuit', 'Free WiFi', 'Accès internet sans fil gratuit dans tout l''établissement', 'Free wireless internet access throughout the property', 'wifi', 'connectivity', '#10B981', false, 1),
('WiFi Premium', 'Premium WiFi', 'Connexion internet haut débit premium', 'Premium high-speed internet connection', 'wifi-off', 'connectivity', '#F59E0B', true, 2),
('Ethernet', 'Ethernet', 'Connexion internet filaire dans les chambres', 'Wired internet connection in rooms', 'ethernet', 'connectivity', '#6366F1', false, 3),
('Borne WiFi', 'WiFi Hotspot', 'Borne WiFi dédiée pour les groupes', 'Dedicated WiFi hotspot for groups', 'router', 'connectivity', '#8B5CF6', false, 4)

ON CONFLICT (nom) DO NOTHING;

-- Équipements de transport et stationnement
INSERT INTO public.equipments (nom, nom_en, description, description_en, icone, categorie, couleur, est_premium, ordre_affichage) VALUES
('Parking Gratuit', 'Free Parking', 'Stationnement gratuit sur place', 'Free on-site parking', 'car', 'services', '#10B981', false, 10),
('Parking Payant', 'Paid Parking', 'Stationnement payant sécurisé', 'Secure paid parking', 'car-front', 'services', '#F59E0B', true, 11),
('Garage Fermé', 'Closed Garage', 'Garage fermé et sécurisé', 'Closed and secure garage', 'garage', 'services', '#3B82F6', true, 12),
('Borne Recharge Électrique', 'Electric Charging', 'Borne de recharge pour véhicules électriques', 'Electric vehicle charging station', 'zap', 'services', '#22C55E', true, 13),
('Service Navette', 'Shuttle Service', 'Navette gratuite vers les transports', 'Free shuttle to transport hubs', 'bus', 'services', '#06B6D4', false, 14)

ON CONFLICT (nom) DO NOTHING;

-- Équipements de loisirs et bien-être
INSERT INTO public.equipments (nom, nom_en, description, description_en, icone, categorie, couleur, est_premium, ordre_affichage) VALUES
('Piscine Intérieure', 'Indoor Pool', 'Piscine couverte chauffée', 'Heated indoor swimming pool', 'waves', 'wellness', '#0EA5E9', true, 20),
('Piscine Extérieure', 'Outdoor Pool', 'Piscine extérieure avec terrasse', 'Outdoor pool with terrace', 'sun', 'wellness', '#F97316', true, 21),
('Spa', 'Spa', 'Centre de bien-être et détente', 'Wellness and relaxation center', 'sparkles', 'wellness', '#EC4899', true, 22),
('Sauna', 'Sauna', 'Sauna traditionnel', 'Traditional sauna', 'thermometer', 'wellness', '#EF4444', true, 23),
('Hammam', 'Steam Room', 'Bain de vapeur oriental', 'Oriental steam bath', 'droplets', 'wellness', '#06B6D4', true, 24),
('Salle de Sport', 'Fitness Center', 'Salle de fitness équipée', 'Fully equipped fitness center', 'dumbbell', 'wellness', '#F97316', true, 25),
('Salle de Jeux', 'Game Room', 'Espace de jeux et divertissement', 'Games and entertainment area', 'gamepad-2', 'recreation', '#A855F7', false, 26),
('Bibliothèque', 'Library', 'Espace de lecture calme', 'Quiet reading space', 'book', 'recreation', '#64748B', false, 27)

ON CONFLICT (nom) DO NOTHING;

-- Équipements de restauration
INSERT INTO public.equipments (nom, nom_en, description, description_en, icone, categorie, couleur, est_premium, ordre_affichage) VALUES
('Restaurant', 'Restaurant', 'Restaurant sur place', 'On-site restaurant', 'utensils', 'services', '#DC2626', false, 30),
('Bar', 'Bar', 'Bar avec boissons variées', 'Bar with various beverages', 'wine', 'services', '#7C3AED', false, 31),
('Room Service', 'Room Service', 'Service en chambre 24h/24', '24-hour room service', 'concierge-bell', 'services', '#059669', true, 32),
('Petit-Déjeuner', 'Breakfast', 'Petit-déjeuner continental', 'Continental breakfast', 'coffee', 'services', '#D97706', true, 33),
('Buffet', 'Buffet', 'Buffet à volonté', 'All-you-can-eat buffet', 'chef-hat', 'services', '#DC2626', true, 34),
('Kitchenette', 'Kitchenette', 'Coin cuisine équipé', 'Equipped kitchenette', 'chef-hat', 'services', '#0891B2', false, 35)

ON CONFLICT (nom) DO NOTHING;

-- Équipements de services généraux
INSERT INTO public.equipments (nom, nom_en, description, description_en, icone, categorie, couleur, est_premium, ordre_affichage) VALUES
('Réception 24h/24', '24h Reception', 'Accueil ouvert en permanence', 'Round-the-clock reception', 'clock', 'services', '#1F2937', false, 40),
('Concierge', 'Concierge', 'Service de conciergerie', 'Concierge service', 'user-check', 'services', '#374151', true, 41),
('Bagagerie', 'Luggage Storage', 'Consigne à bagages', 'Luggage storage service', 'luggage', 'services', '#6B7280', false, 42),
('Service Ménage Quotidien', 'Daily Housekeeping', 'Ménage quotidien des chambres', 'Daily room housekeeping', 'sparkles', 'services', '#10B981', false, 43),
('Blanchisserie', 'Laundry', 'Service de blanchisserie', 'Laundry service', 'washing-machine', 'services', '#3B82F6', true, 44),
('Pressing', 'Dry Cleaning', 'Service de pressing', 'Dry cleaning service', 'iron', 'services', '#8B5CF6', true, 45),
('Coffre-Fort', 'Safe', 'Coffre-fort en chambre', 'In-room safe', 'shield-check', 'security', '#EF4444', false, 46)

ON CONFLICT (nom) DO NOTHING;

-- Équipements d'accessibilité
INSERT INTO public.equipments (nom, nom_en, description, description_en, icone, categorie, couleur, est_premium, ordre_affichage) VALUES
('Accès PMR', 'Wheelchair Access', 'Accès pour personnes à mobilité réduite', 'Wheelchair accessible', 'wheelchair', 'accessibility', '#059669', false, 50),
('Ascenseur', 'Elevator', 'Ascenseur dans le bâtiment', 'Building elevator', 'arrow-up-down', 'accessibility', '#0891B2', false, 51),
('Salle de Bain PMR', 'Accessible Bathroom', 'Salle de bain adaptée PMR', 'Wheelchair accessible bathroom', 'bath', 'accessibility', '#06B6D4', false, 52),
('Signalétique Braille', 'Braille Signage', 'Signalisation en braille', 'Braille signage', 'eye-off', 'accessibility', '#6366F1', false, 53)

ON CONFLICT (nom) DO NOTHING;

-- Équipements de sécurité
INSERT INTO public.equipments (nom, nom_en, description, description_en, icone, categorie, couleur, est_premium, ordre_affichage) VALUES
('Surveillance 24h/24', '24h Security', 'Surveillance sécurisée permanente', 'Round-the-clock security surveillance', 'shield', 'security', '#DC2626', false, 60),
('Vidéosurveillance', 'CCTV', 'Système de vidéosurveillance', 'CCTV security system', 'video', 'security', '#7C3AED', false, 61),
('Contrôle d''Accès', 'Access Control', 'Système de contrôle d''accès par badges', 'Badge access control system', 'key', 'security', '#059669', false, 62),
('Détecteurs Incendie', 'Fire Detectors', 'Système de détection incendie', 'Fire detection system', 'flame', 'security', '#F97316', false, 63)

ON CONFLICT (nom) DO NOTHING;

-- Équipements business et professionnels
INSERT INTO public.equipments (nom, nom_en, description, description_en, icone, categorie, couleur, est_premium, ordre_affichage) VALUES
('Centre d''Affaires', 'Business Center', 'Centre d''affaires équipé', 'Equipped business center', 'briefcase', 'services', '#1F2937', true, 70),
('Salle de Réunion', 'Meeting Room', 'Salle de réunion professionnelle', 'Professional meeting room', 'users', 'services', '#374151', true, 71),
('Équipement Audiovisuel', 'AV Equipment', 'Matériel audiovisuel professionnel', 'Professional audiovisual equipment', 'projector', 'services', '#6B7280', true, 72),
('Fax/Photocopie', 'Fax/Copy', 'Services de fax et photocopie', 'Fax and copy services', 'printer', 'services', '#9CA3AF', false, 73)

ON CONFLICT (nom) DO NOTHING;

-- 4. POLITIQUES RLS (ROW LEVEL SECURITY)
-- ===================================================================

-- Activation RLS sur les tables
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_equipments ENABLE ROW LEVEL SECURITY;

-- Politique pour equipments : lecture libre pour tous les utilisateurs authentifiés
CREATE POLICY "equipments_select_policy" ON public.equipments
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Politique pour equipments : modification uniquement pour les admins
CREATE POLICY "equipments_modify_policy" ON public.equipments
    FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Politique pour hotel_equipments : les utilisateurs peuvent voir les équipements de leurs hôtels
CREATE POLICY "hotel_equipments_select_policy" ON public.hotel_equipments
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            auth.jwt() ->> 'role' = 'admin' OR
            hotel_id IN (
                SELECT hotel_id FROM public.users 
                WHERE id = auth.uid()::text
            )
        )
    );

-- Politique pour hotel_equipments : modification selon les droits utilisateur
CREATE POLICY "hotel_equipments_modify_policy" ON public.hotel_equipments
    FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'manager' OR
        (auth.jwt() ->> 'role' = 'service_role' AND 
         hotel_id IN (
             SELECT hotel_id FROM public.users 
             WHERE id = auth.uid()::text
         ))
    );

-- 5. FONCTIONS UTILITAIRES
-- ===================================================================

-- Fonction pour obtenir tous les équipements d'un hôtel avec leurs détails
CREATE OR REPLACE FUNCTION get_hotel_equipments(p_hotel_id BIGINT)
RETURNS TABLE (
    equipment_id BIGINT,
    nom VARCHAR(100),
    nom_en VARCHAR(100),
    description TEXT,
    description_en TEXT,
    icone VARCHAR(50),
    categorie VARCHAR(50),
    couleur VARCHAR(7),
    est_premium BOOLEAN,
    est_disponible BOOLEAN,
    est_gratuit BOOLEAN,
    prix_supplement DECIMAL(10,2),
    description_specifique TEXT,
    horaires_disponibilite JSONB,
    conditions_usage TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.nom,
        e.nom_en,
        e.description,
        e.description_en,
        e.icone,
        e.categorie,
        e.couleur,
        e.est_premium,
        he.est_disponible,
        he.est_gratuit,
        he.prix_supplement,
        he.description_specifique,
        he.horaires_disponibilite,
        he.conditions_usage
    FROM public.equipments e
    INNER JOIN public.hotel_equipments he ON e.id = he.equipment_id
    WHERE he.hotel_id = p_hotel_id 
      AND e.est_actif = true
    ORDER BY e.categorie, e.ordre_affichage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour ajouter un équipement à un hôtel
CREATE OR REPLACE FUNCTION add_equipment_to_hotel(
    p_hotel_id BIGINT,
    p_equipment_id BIGINT,
    p_est_disponible BOOLEAN DEFAULT true,
    p_est_gratuit BOOLEAN DEFAULT true,
    p_prix_supplement DECIMAL(10,2) DEFAULT NULL,
    p_description_specifique TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO public.hotel_equipments (
        hotel_id,
        equipment_id,
        est_disponible,
        est_gratuit,
        prix_supplement,
        description_specifique
    ) VALUES (
        p_hotel_id,
        p_equipment_id,
        p_est_disponible,
        p_est_gratuit,
        p_prix_supplement,
        p_description_specifique
    );
    
    RETURN true;
EXCEPTION
    WHEN unique_violation THEN
        RETURN false; -- L'équipement est déjà associé à cet hôtel
    WHEN OTHERS THEN
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour supprimer un équipement d'un hôtel
CREATE OR REPLACE FUNCTION remove_equipment_from_hotel(
    p_hotel_id BIGINT,
    p_equipment_id BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    DELETE FROM public.hotel_equipments 
    WHERE hotel_id = p_hotel_id AND equipment_id = p_equipment_id;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques d'équipements par catégorie
CREATE OR REPLACE FUNCTION get_equipment_statistics()
RETURNS TABLE (
    categorie VARCHAR(50),
    nombre_equipements BIGINT,
    nombre_hotels_utilisant BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.categorie,
        COUNT(e.id) as nombre_equipements,
        COUNT(DISTINCT he.hotel_id) as nombre_hotels_utilisant
    FROM public.equipments e
    LEFT JOIN public.hotel_equipments he ON e.id = he.equipment_id
    WHERE e.est_actif = true
    GROUP BY e.categorie
    ORDER BY e.categorie;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- COMMENTAIRES DES TABLES POUR LA DOCUMENTATION
-- ===================================================================

COMMENT ON TABLE public.equipments IS 'Table principale des équipements et services disponibles dans l''application';
COMMENT ON TABLE public.hotel_equipments IS 'Table de liaison many-to-many entre les hôtels et leurs équipements';

COMMENT ON COLUMN public.equipments.nom IS 'Nom de l''équipement en français';
COMMENT ON COLUMN public.equipments.nom_en IS 'Nom de l''équipement en anglais pour l''internationalisation';
COMMENT ON COLUMN public.equipments.icone IS 'Nom de l''icône à utiliser dans l''interface (basé sur Lucide React)';
COMMENT ON COLUMN public.equipments.categorie IS 'Catégorie de l''équipement : connectivity, recreation, services, accessibility, security, wellness';
COMMENT ON COLUMN public.equipments.couleur IS 'Couleur hexadécimale pour l''affichage dans l''interface utilisateur';
COMMENT ON COLUMN public.equipments.est_premium IS 'Indique si l''équipement est considéré comme premium/haut de gamme';

COMMENT ON COLUMN public.hotel_equipments.est_disponible IS 'Indique si l''équipement est actuellement disponible (peut être temporairement en maintenance)';
COMMENT ON COLUMN public.hotel_equipments.est_gratuit IS 'Indique si l''équipement est gratuit ou payant pour les clients';
COMMENT ON COLUMN public.hotel_equipments.prix_supplement IS 'Prix du supplément si l''équipement est payant';
COMMENT ON COLUMN public.hotel_equipments.horaires_disponibilite IS 'Horaires de disponibilité au format JSON (ex: {"lundi": "09:00-18:00"})';

-- ===================================================================
-- FIN DU SCRIPT
-- ===================================================================