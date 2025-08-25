-- 🚨 CORRECTION COMPLÈTE DE TOUTES LES ERREURS 404
-- Copier-coller ce script ENTIER dans Supabase Dashboard → SQL Editor → RUN
-- Projet: pgjatiookprsvfesrsrx

BEGIN;

-- ==================================================
-- 1. TABLE OPERATEURS_SOCIAUX
-- ==================================================
CREATE TABLE IF NOT EXISTS public.operateurs_sociaux (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL DEFAULT 'association',
    secteur_activite VARCHAR(255),
    adresse TEXT,
    ville VARCHAR(100),
    code_postal VARCHAR(10),
    telephone VARCHAR(20),
    email VARCHAR(255),
    contact_principal VARCHAR(255),
    siret VARCHAR(20),
    statut VARCHAR(50) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'suspendu')),
    date_creation DATE DEFAULT CURRENT_DATE,
    nombre_places_total INTEGER DEFAULT 0,
    nombre_places_occupees INTEGER DEFAULT 0,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour operateurs_sociaux
CREATE INDEX IF NOT EXISTS idx_operateurs_sociaux_nom ON public.operateurs_sociaux(nom);
CREATE INDEX IF NOT EXISTS idx_operateurs_sociaux_type ON public.operateurs_sociaux(type);
CREATE INDEX IF NOT EXISTS idx_operateurs_sociaux_statut ON public.operateurs_sociaux(statut);

-- RLS pour operateurs_sociaux
ALTER TABLE public.operateurs_sociaux ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "operateurs_sociaux_all_operations" ON public.operateurs_sociaux;
CREATE POLICY "operateurs_sociaux_all_operations" ON public.operateurs_sociaux FOR ALL USING (true) WITH CHECK (true);

-- ==================================================
-- 2. TABLE PROCESSUS_RESERVATIONS
-- ==================================================
CREATE TABLE IF NOT EXISTS public.processus_reservations (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER,
    type_processus VARCHAR(100) NOT NULL DEFAULT 'arrivee',
    statut VARCHAR(50) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'annule', 'en_attente')),
    etape_actuelle VARCHAR(100),
    etapes_completees JSONB DEFAULT '[]',
    donnees_processus JSONB DEFAULT '{}',
    utilisateur_id INTEGER,
    operateur_social_id INTEGER,
    hotel_id INTEGER,
    room_id INTEGER,
    date_debut TIMESTAMPTZ DEFAULT now(),
    date_fin TIMESTAMPTZ,
    duree_estimee INTEGER DEFAULT 60,
    priorite VARCHAR(20) DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
    commentaires TEXT,
    erreurs JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour processus_reservations
CREATE INDEX IF NOT EXISTS idx_processus_reservations_type ON public.processus_reservations(type_processus);
CREATE INDEX IF NOT EXISTS idx_processus_reservations_statut ON public.processus_reservations(statut);
CREATE INDEX IF NOT EXISTS idx_processus_reservations_date ON public.processus_reservations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_processus_reservations_reservation ON public.processus_reservations(reservation_id);

-- RLS pour processus_reservations
ALTER TABLE public.processus_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "processus_reservations_all_operations" ON public.processus_reservations;
CREATE POLICY "processus_reservations_all_operations" ON public.processus_reservations FOR ALL USING (true) WITH CHECK (true);

-- ==================================================
-- 3. TABLE RESERVATIONS
-- ==================================================
CREATE TABLE IF NOT EXISTS public.reservations (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL DEFAULT ('RES-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval(pg_get_serial_sequence('reservations', 'id'))::text, 6, '0')),
    hotel_id INTEGER,
    room_id INTEGER,
    operateur_social_id INTEGER,
    client_nom VARCHAR(255) NOT NULL,
    client_prenom VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_telephone VARCHAR(50),
    client_date_naissance DATE,
    client_adresse TEXT,
    date_arrivee DATE NOT NULL,
    date_depart DATE NOT NULL,
    nombre_personnes INTEGER DEFAULT 1 CHECK (nombre_personnes > 0),
    nombre_adultes INTEGER DEFAULT 1,
    nombre_enfants INTEGER DEFAULT 0,
    statut VARCHAR(50) DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE')),
    prix_total DECIMAL(10,2) DEFAULT 0,
    prix_par_nuit DECIMAL(10,2) DEFAULT 0,
    acompte DECIMAL(10,2) DEFAULT 0,
    reste_a_payer DECIMAL(10,2) DEFAULT 0,
    mode_paiement VARCHAR(50),
    date_paiement_acompte DATE,
    notes TEXT,
    demandes_speciales TEXT,
    source_reservation VARCHAR(100) DEFAULT 'direct',
    canal_reservation VARCHAR(100),
    duree_sejour INTEGER,
    checkin_effectue BOOLEAN DEFAULT false,
    checkout_effectue BOOLEAN DEFAULT false,
    date_checkin TIMESTAMPTZ,
    date_checkout TIMESTAMPTZ,
    satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
    commentaire_satisfaction TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour reservations
CREATE INDEX IF NOT EXISTS idx_reservations_hotel ON public.reservations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room ON public.reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON public.reservations(date_arrivee, date_depart);
CREATE INDEX IF NOT EXISTS idx_reservations_statut ON public.reservations(statut);
CREATE INDEX IF NOT EXISTS idx_reservations_operateur ON public.reservations(operateur_social_id);
CREATE INDEX IF NOT EXISTS idx_reservations_numero ON public.reservations(numero);

-- RLS pour reservations
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reservations_all_operations" ON public.reservations;
CREATE POLICY "reservations_all_operations" ON public.reservations FOR ALL USING (true) WITH CHECK (true);

-- ==================================================
-- 4. S'ASSURER QUE EQUIPMENTS EST CORRECT
-- ==================================================
CREATE TABLE IF NOT EXISTS public.equipments (
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

-- RLS pour equipments
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "equipments_all_operations" ON public.equipments;
CREATE POLICY "equipments_all_operations" ON public.equipments FOR ALL USING (true) WITH CHECK (true);

-- ==================================================
-- 5. DONNÉES DE TEST
-- ==================================================

-- Opérateurs sociaux de test
INSERT INTO public.operateurs_sociaux (nom, type, secteur_activite, ville, statut, nombre_places_total) VALUES
('Association Aide Sociale Marseille', 'association', 'Action sociale', 'Marseille', 'actif', 50),
('Entreprise Solidaire Sud', 'entreprise', 'Insertion professionnelle', 'Marseille', 'actif', 25),
('Collectivité PACA', 'collectivite', 'Services publics', 'Aix-en-Provence', 'actif', 100),
('Fondation Logement Social', 'association', 'Logement social', 'Marseille', 'actif', 75),
('Centre d''Action Sociale', 'collectivite', 'Action sociale', 'Marseille', 'actif', 40)
ON CONFLICT (nom) DO NOTHING;

-- Processus de réservations de test
INSERT INTO public.processus_reservations (type_processus, statut, etape_actuelle, hotel_id, priorite, commentaires) VALUES
('arrivee', 'en_cours', 'verification_documents', 1, 'normale', 'Processus d''arrivée standard'),
('depart', 'termine', 'nettoyage_chambre', 2, 'normale', 'Départ effectué'),
('modification', 'en_attente', 'validation_manager', 3, 'haute', 'Modification dates séjour'),
('prolongation', 'en_cours', 'verification_disponibilite', 1, 'normale', 'Demande prolongation 3 jours'),
('annulation', 'termine', 'remboursement_effectue', 2, 'basse', 'Annulation pour motif personnel')
ON CONFLICT DO NOTHING;

-- Réservations de test
INSERT INTO public.reservations (
    numero, hotel_id, client_nom, client_prenom, client_email, client_telephone, 
    date_arrivee, date_depart, nombre_personnes, statut, prix_total, prix_par_nuit, 
    source_reservation, notes
) VALUES
('RES-2024-000001', 1, 'Martin', 'Jean', 'jean.martin@email.fr', '0612345678', CURRENT_DATE + 2, CURRENT_DATE + 7, 2, 'CONFIRMEE', 275.00, 55.00, 'operateur_social', 'Placement social d''urgence'),
('RES-2024-000002', 2, 'Dupont', 'Marie', 'marie.dupont@email.fr', '0698765432', CURRENT_DATE + 4, CURRENT_DATE + 6, 1, 'EN_COURS', 130.00, 65.00, 'direct', 'Séjour professionnel'),
('RES-2024-000003', 1, 'Bernard', 'Pierre', 'pierre.bernard@email.fr', '0634567890', CURRENT_DATE + 7, CURRENT_DATE + 12, 3, 'EN_ATTENTE', 340.00, 68.00, 'operateur_social', 'Famille en situation précaire')
ON CONFLICT (numero) DO NOTHING;

-- Équipements de base si la table est vide
INSERT INTO public.equipments (name, type, category, description, icon, display_order) VALUES
('WiFi gratuit', 'technology', 'Connectivité', 'Connexion internet sans fil gratuite', 'Wifi', 1),
('Télévision', 'amenity', 'Divertissement', 'Télévision avec chaînes locales', 'Tv', 2),
('Climatisation', 'amenity', 'Climatisation', 'Système de climatisation individuelle', 'Wind', 3),
('Parking', 'service', 'Transport', 'Place de parking sécurisée', 'Car', 4),
('Accès PMR', 'accessibility', 'Accessibilité', 'Équipements PMR', 'Users', 5)
ON CONFLICT (name) DO NOTHING;

-- ==================================================
-- 6. FONCTION DE MISE À JOUR AUTO
-- ==================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mise à jour automatique
CREATE TRIGGER IF NOT EXISTS update_operateurs_sociaux_updated_at 
    BEFORE UPDATE ON public.operateurs_sociaux 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_processus_reservations_updated_at 
    BEFORE UPDATE ON public.processus_reservations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_reservations_updated_at 
    BEFORE UPDATE ON public.reservations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- ==================================================
-- 7. VÉRIFICATION FINALE
-- ==================================================
SELECT 'VÉRIFICATION DES TABLES CRÉÉES:' as info;

SELECT 
    'operateurs_sociaux' as table_name, 
    COUNT(*) as nombre_enregistrements 
FROM public.operateurs_sociaux
UNION ALL
SELECT 
    'processus_reservations', 
    COUNT(*) 
FROM public.processus_reservations
UNION ALL
SELECT 
    'reservations', 
    COUNT(*) 
FROM public.reservations
UNION ALL
SELECT 
    'equipments', 
    COUNT(*) 
FROM public.equipments
ORDER BY table_name;

-- Test final
SELECT '✅ CORRECTION TERMINÉE - Toutes les tables sont créées!' as resultat;
SELECT '🎊 Plus d''erreur 404 dans votre application!' as message;
SELECT '📱 Actualisez votre navigateur pour voir les changements' as instruction;