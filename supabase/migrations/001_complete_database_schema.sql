-- ====================================
-- SCRIPT COMPLET DE CRÉATION DE BASE DE DONNÉES
-- SoliReserve Enhanced - Système de gestion hôtelière
-- ====================================

-- Active les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================
-- 1. SUPPRESSION DES TABLES EXISTANTES (si nécessaire)
-- ====================================

DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.document_templates CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.processus_reservations CASCADE;
DROP TABLE IF EXISTS public.reservations CASCADE;
DROP TABLE IF EXISTS public.conventions_prix CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.usagers CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.room_categories CASCADE;
DROP TABLE IF EXISTS public.operateurs_sociaux CASCADE;
DROP TABLE IF EXISTS public.hotels CASCADE;
DROP TABLE IF EXISTS public.establishments CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ====================================
-- 2. CRÉATION DES TABLES PRINCIPALES
-- ====================================

-- Table des utilisateurs (système d'authentification)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'comptable', 'receptionniste')),
    hotel_id BIGINT,
    statut VARCHAR(10) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
    date_creation TIMESTAMPTZ DEFAULT NOW(),
    derniere_connexion TIMESTAMPTZ,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des hôtels/établissements
CREATE TABLE public.hotels (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    adresse TEXT NOT NULL,
    ville VARCHAR(100) NOT NULL,
    code_postal VARCHAR(10) NOT NULL,
    telephone VARCHAR(20),
    email VARCHAR(255),
    gestionnaire VARCHAR(100),
    statut VARCHAR(10) DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF', 'INACTIF')),
    chambres_total INTEGER DEFAULT 0,
    chambres_occupees INTEGER DEFAULT 0,
    taux_occupation DECIMAL(5,2) DEFAULT 0.00,
    siret VARCHAR(14),
    tva_intracommunautaire VARCHAR(20),
    directeur VARCHAR(100),
    telephone_directeur VARCHAR(20),
    email_directeur VARCHAR(255),
    capacite INTEGER,
    categories TEXT[],
    services TEXT[],
    horaires JSONB DEFAULT '{}'::jsonb,
    
    -- Champs d'adresse étendus
    adresse_ligne_2 TEXT,
    region VARCHAR(100),
    pays VARCHAR(100) DEFAULT 'France',
    telephone_2 VARCHAR(20),
    fax VARCHAR(20),
    site_web VARCHAR(255),
    
    -- Champs de description et branding
    description TEXT,
    logo_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    amenities JSONB DEFAULT '[]'::jsonb,
    
    -- Champs opérationnels
    check_in_time TIME DEFAULT '14:00',
    check_out_time TIME DEFAULT '11:00',
    policies JSONB DEFAULT '{}'::jsonb,
    contact_info JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    
    -- Champs de gestion avancée
    type_etablissement VARCHAR(20) DEFAULT 'hotel' CHECK (type_etablissement IN ('hotel', 'residence', 'foyer', 'chrs', 'chr', 'autre')),
    license_number VARCHAR(50),
    date_ouverture DATE,
    classement_etoiles INTEGER CHECK (classement_etoiles BETWEEN 1 AND 5),
    surface_totale DECIMAL(10,2),
    nombre_etages INTEGER,
    parking_places INTEGER DEFAULT 0,
    accessibilite JSONB DEFAULT '{}'::jsonb,
    certifications TEXT[],
    notes_internes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des catégories de chambres
CREATE TABLE public.room_categories (
    id BIGSERIAL PRIMARY KEY,
    hotel_id BIGINT NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 45.00,
    max_occupancy INTEGER DEFAULT 2,
    amenities JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_category_per_hotel UNIQUE(hotel_id, name)
);

-- Table des chambres
CREATE TABLE public.rooms (
    id BIGSERIAL PRIMARY KEY,
    hotel_id BIGINT NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    prix DECIMAL(10,2) NOT NULL DEFAULT 45.00,
    statut VARCHAR(20) DEFAULT 'disponible' CHECK (statut IN ('disponible', 'occupee', 'maintenance')),
    description TEXT,
    category_id BIGINT REFERENCES public.room_categories(id) ON DELETE SET NULL,
    floor INTEGER DEFAULT 0,
    room_size DECIMAL(8,2),
    bed_type VARCHAR(50),
    view_type VARCHAR(50),
    is_smoking BOOLEAN DEFAULT false,
    images JSONB DEFAULT '[]'::jsonb,
    amenities JSONB DEFAULT '[]'::jsonb,
    last_cleaned DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_room_per_hotel UNIQUE(hotel_id, numero)
);

-- Table des opérateurs sociaux
CREATE TABLE public.operateurs_sociaux (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    organisation VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    email VARCHAR(255),
    statut VARCHAR(10) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
    specialite VARCHAR(255),
    zone_intervention VARCHAR(255),
    nombre_reservations INTEGER DEFAULT 0,
    date_creation TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    siret VARCHAR(14),
    adresse TEXT,
    responsable VARCHAR(100),
    telephone_responsable VARCHAR(20),
    email_responsable VARCHAR(255),
    agrement VARCHAR(50),
    date_agrement DATE,
    zone_intervention_array TEXT[],
    specialites TEXT[],
    partenariats TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des clients/usagers
CREATE TABLE public.clients (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(20),
    adresse TEXT,
    ville VARCHAR(100),
    code_postal VARCHAR(10),
    date_naissance DATE,
    numero_secu VARCHAR(15),
    situation_familiale VARCHAR(50),
    nombre_enfants INTEGER DEFAULT 0,
    revenus DECIMAL(10,2),
    prestations TEXT[],
    prix_uniques JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des usagers (alias pour compatibilité)
CREATE TABLE public.usagers (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE,
    adresse TEXT,
    telephone VARCHAR(20),
    email VARCHAR(255),
    numero_secu VARCHAR(15),
    situation_familiale VARCHAR(50),
    nombre_enfants INTEGER DEFAULT 0,
    revenus DECIMAL(10,2),
    prestations TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des conventions de prix
CREATE TABLE public.conventions_prix (
    id BIGSERIAL PRIMARY KEY,
    operateur_id BIGINT NOT NULL REFERENCES public.operateurs_sociaux(id) ON DELETE CASCADE,
    hotel_id BIGINT NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    type_chambre VARCHAR(50) NOT NULL,
    prix_conventionne DECIMAL(10,2) NOT NULL,
    prix_standard DECIMAL(10,2) NOT NULL,
    reduction DECIMAL(5,2) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE,
    statut VARCHAR(20) DEFAULT 'active' CHECK (statut IN ('active', 'expiree', 'suspendue')),
    conditions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des réservations
CREATE TABLE public.reservations (
    id BIGSERIAL PRIMARY KEY,
    usager_id BIGINT REFERENCES public.usagers(id) ON DELETE CASCADE,
    chambre_id BIGINT NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    hotel_id BIGINT NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    date_arrivee DATE NOT NULL,
    date_depart DATE NOT NULL,
    statut VARCHAR(20) DEFAULT 'CONFIRMEE' CHECK (statut IN ('CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE')),
    prescripteur VARCHAR(255) NOT NULL,
    prix DECIMAL(10,2) NOT NULL,
    duree INTEGER NOT NULL,
    operateur_id BIGINT REFERENCES public.operateurs_sociaux(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_dates CHECK (date_depart > date_arrivee)
);

-- Table des processus de réservations
CREATE TABLE public.processus_reservations (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
    statut VARCHAR(20) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'annule')),
    date_debut TIMESTAMPTZ DEFAULT NOW(),
    date_fin TIMESTAMPTZ,
    duree_estimee INTEGER,
    priorite VARCHAR(20) DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
    etapes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des conversations
CREATE TABLE public.conversations (
    id BIGSERIAL PRIMARY KEY,
    operateur_id BIGINT NOT NULL REFERENCES public.operateurs_sociaux(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    sujet VARCHAR(255) NOT NULL,
    date_creation TIMESTAMPTZ DEFAULT NOW(),
    date_dernier_message TIMESTAMPTZ DEFAULT NOW(),
    nombre_messages INTEGER DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'active' CHECK (statut IN ('active', 'terminee', 'archivée')),
    derniere_message TEXT,
    non_lus INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des messages
CREATE TABLE public.messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    expediteur_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    expediteur_type VARCHAR(20) NOT NULL CHECK (expediteur_type IN ('admin', 'operateur')),
    destinataire_id BIGINT,
    destinataire_type VARCHAR(20) NOT NULL CHECK (destinataire_type IN ('admin', 'operateur')),
    sujet VARCHAR(255),
    contenu TEXT NOT NULL,
    date_envoi TIMESTAMPTZ DEFAULT NOW(),
    date_lecture TIMESTAMPTZ,
    statut VARCHAR(20) DEFAULT 'envoye' CHECK (statut IN ('envoye', 'lu', 'repondu')),
    priorite VARCHAR(20) DEFAULT 'normale' CHECK (priorite IN ('normale', 'importante', 'urgente')),
    piece_jointe TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des modèles de documents
CREATE TABLE public.document_templates (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('facture', 'bon_reservation', 'prolongation_reservation', 'fin_prise_charge')),
    description TEXT,
    contenu TEXT NOT NULL,
    variables JSONB DEFAULT '{}'::jsonb,
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
    date_creation TIMESTAMPTZ DEFAULT NOW(),
    date_modification TIMESTAMPTZ DEFAULT NOW(),
    version VARCHAR(10) DEFAULT '1.0',
    format VARCHAR(10) DEFAULT 'pdf' CHECK (format IN ('pdf', 'docx', 'html')),
    en_tete TEXT,
    pied_de_page TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des documents générés
CREATE TABLE public.documents (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
    reservation_id BIGINT REFERENCES public.reservations(id) ON DELETE SET NULL,
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    contenu TEXT NOT NULL,
    variables_remplies JSONB DEFAULT '{}'::jsonb,
    date_generation TIMESTAMPTZ DEFAULT NOW(),
    fichier_url TEXT,
    statut VARCHAR(20) DEFAULT 'genere' CHECK (statut IN ('genere', 'envoye', 'archive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des notifications
CREATE TABLE public.notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('success', 'warning', 'info', 'error')),
    message TEXT NOT NULL,
    lu BOOLEAN DEFAULT false,
    date_creation TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des établissements (alias pour hotels)
CREATE VIEW public.establishments AS
SELECT 
    id,
    nom as name,
    type_etablissement as type,
    adresse as address,
    ville as city,
    code_postal as postal_code,
    pays as country,
    telephone as phone,
    email,
    site_web as website,
    description,
    logo_url as logo,
    amenities as facilities,
    policies,
    is_active,
    created_at,
    updated_at
FROM public.hotels;

-- ====================================
-- 3. CRÉATION DES INDEX
-- ====================================

-- Index pour les hôtels
CREATE INDEX idx_hotels_statut ON public.hotels(statut);
CREATE INDEX idx_hotels_type ON public.hotels(type_etablissement);
CREATE INDEX idx_hotels_ville ON public.hotels(ville);

-- Index pour les chambres
CREATE INDEX idx_rooms_hotel_id ON public.rooms(hotel_id);
CREATE INDEX idx_rooms_statut ON public.rooms(statut);
CREATE INDEX idx_rooms_type ON public.rooms(type);
CREATE INDEX idx_rooms_category_id ON public.rooms(category_id);

-- Index pour les catégories de chambres
CREATE INDEX idx_room_categories_hotel_id ON public.room_categories(hotel_id);
CREATE INDEX idx_room_categories_active ON public.room_categories(is_active);

-- Index pour les réservations
CREATE INDEX idx_reservations_hotel_id ON public.reservations(hotel_id);
CREATE INDEX idx_reservations_chambre_id ON public.reservations(chambre_id);
CREATE INDEX idx_reservations_usager_id ON public.reservations(usager_id);
CREATE INDEX idx_reservations_operateur_id ON public.reservations(operateur_id);
CREATE INDEX idx_reservations_statut ON public.reservations(statut);
CREATE INDEX idx_reservations_dates ON public.reservations(date_arrivee, date_depart);

-- Index pour les opérateurs sociaux
CREATE INDEX idx_operateurs_statut ON public.operateurs_sociaux(statut);
CREATE INDEX idx_operateurs_organisation ON public.operateurs_sociaux(organisation);

-- Index pour les clients
CREATE INDEX idx_clients_nom_prenom ON public.clients(nom, prenom);
CREATE INDEX idx_clients_email ON public.clients(email);

-- Index pour les usagers
CREATE INDEX idx_usagers_nom_prenom ON public.usagers(nom, prenom);

-- Index pour les conventions de prix
CREATE INDEX idx_conventions_operateur_hotel ON public.conventions_prix(operateur_id, hotel_id);
CREATE INDEX idx_conventions_statut ON public.conventions_prix(statut);
CREATE INDEX idx_conventions_dates ON public.conventions_prix(date_debut, date_fin);

-- Index pour les messages et conversations
CREATE INDEX idx_conversations_operateur_id ON public.conversations(operateur_id);
CREATE INDEX idx_conversations_admin_id ON public.conversations(admin_id);
CREATE INDEX idx_conversations_statut ON public.conversations(statut);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_expediteur ON public.messages(expediteur_id, expediteur_type);

-- Index pour les documents
CREATE INDEX idx_documents_template_id ON public.documents(template_id);
CREATE INDEX idx_documents_reservation_id ON public.documents(reservation_id);
CREATE INDEX idx_document_templates_type ON public.document_templates(type);

-- Index pour les notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_lu ON public.notifications(lu);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- ====================================
-- 4. FONCTIONS ET TRIGGERS
-- ====================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER trigger_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_hotels_updated_at 
    BEFORE UPDATE ON public.hotels 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_room_categories_updated_at 
    BEFORE UPDATE ON public.room_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_rooms_updated_at 
    BEFORE UPDATE ON public.rooms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_operateurs_sociaux_updated_at 
    BEFORE UPDATE ON public.operateurs_sociaux 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_clients_updated_at 
    BEFORE UPDATE ON public.clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_usagers_updated_at 
    BEFORE UPDATE ON public.usagers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_conventions_prix_updated_at 
    BEFORE UPDATE ON public.conventions_prix 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_reservations_updated_at 
    BEFORE UPDATE ON public.reservations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_processus_reservations_updated_at 
    BEFORE UPDATE ON public.processus_reservations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_conversations_updated_at 
    BEFORE UPDATE ON public.conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_messages_updated_at 
    BEFORE UPDATE ON public.messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_document_templates_updated_at 
    BEFORE UPDATE ON public.document_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_documents_updated_at 
    BEFORE UPDATE ON public.documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer le taux d'occupation
CREATE OR REPLACE FUNCTION calculate_occupation_rate(hotel_id_param BIGINT)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_rooms INTEGER;
    occupied_rooms INTEGER;
    rate DECIMAL(5,2);
BEGIN
    SELECT COUNT(*) INTO total_rooms 
    FROM public.rooms 
    WHERE hotel_id = hotel_id_param;
    
    SELECT COUNT(*) INTO occupied_rooms 
    FROM public.rooms 
    WHERE hotel_id = hotel_id_param AND statut = 'occupee';
    
    IF total_rooms > 0 THEN
        rate = (occupied_rooms::DECIMAL / total_rooms::DECIMAL) * 100;
    ELSE
        rate = 0;
    END IF;
    
    RETURN rate;
END;
$$ LANGUAGE 'plpgsql';

-- Fonction pour mettre à jour les statistiques de l'hôtel
CREATE OR REPLACE FUNCTION update_hotel_statistics()
RETURNS TRIGGER AS $$
DECLARE
    hotel_id_val BIGINT;
    total_rooms INTEGER;
    occupied_rooms INTEGER;
BEGIN
    -- Récupérer l'ID de l'hôtel
    IF TG_OP = 'DELETE' THEN
        hotel_id_val = OLD.hotel_id;
    ELSE
        hotel_id_val = NEW.hotel_id;
    END IF;
    
    -- Calculer les statistiques
    SELECT COUNT(*) INTO total_rooms 
    FROM public.rooms 
    WHERE hotel_id = hotel_id_val;
    
    SELECT COUNT(*) INTO occupied_rooms 
    FROM public.rooms 
    WHERE hotel_id = hotel_id_val AND statut = 'occupee';
    
    -- Mettre à jour l'hôtel
    UPDATE public.hotels 
    SET 
        chambres_total = total_rooms,
        chambres_occupees = occupied_rooms,
        taux_occupation = calculate_occupation_rate(hotel_id_val),
        updated_at = NOW()
    WHERE id = hotel_id_val;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger pour les statistiques des hôtels
CREATE TRIGGER trigger_update_hotel_stats_on_room_change
    AFTER INSERT OR UPDATE OR DELETE ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_hotel_statistics();

-- ====================================
-- 5. CONTRAINTES ADDITIONNELLES
-- ====================================

-- Contrainte pour vérifier que l'utilisateur appartient bien à l'hôtel
ALTER TABLE public.users 
ADD CONSTRAINT fk_users_hotel 
FOREIGN KEY (hotel_id) REFERENCES public.hotels(id) ON DELETE SET NULL;

-- Contrainte pour vérifier la cohérence des dates de convention
ALTER TABLE public.conventions_prix 
ADD CONSTRAINT check_convention_dates 
CHECK (date_fin IS NULL OR date_fin > date_debut);

-- ====================================
-- CRÉATION RÉUSSIE
-- ====================================

-- Commentaires sur les tables
COMMENT ON TABLE public.users IS 'Utilisateurs du système avec authentification et rôles';
COMMENT ON TABLE public.hotels IS 'Établissements hôteliers avec informations complètes';
COMMENT ON TABLE public.room_categories IS 'Catégories de chambres pour classification';
COMMENT ON TABLE public.rooms IS 'Inventaire des chambres avec statuts et prix';
COMMENT ON TABLE public.operateurs_sociaux IS 'Opérateurs sociaux gérant les placements';
COMMENT ON TABLE public.clients IS 'Base de données des clients avec informations sociales';
COMMENT ON TABLE public.usagers IS 'Usagers des services (alias pour clients)';
COMMENT ON TABLE public.conventions_prix IS 'Accords de prix entre hôtels et opérateurs';
COMMENT ON TABLE public.reservations IS 'Réservations avec dates et statuts';
COMMENT ON TABLE public.processus_reservations IS 'Workflow des processus de réservation';
COMMENT ON TABLE public.conversations IS 'Conversations entre opérateurs et admins';
COMMENT ON TABLE public.messages IS 'Messages dans les conversations';
COMMENT ON TABLE public.document_templates IS 'Modèles de documents pour génération automatique';
COMMENT ON TABLE public.documents IS 'Documents générés à partir des modèles';
COMMENT ON TABLE public.notifications IS 'Notifications utilisateurs';

-- Affichage du résumé
SELECT 
    'Tables créées' as action,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';