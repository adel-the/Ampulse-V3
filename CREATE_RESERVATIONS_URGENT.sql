-- ==========================================
-- MISSION URGENTE: CRÉATION TABLE RESERVATIONS
-- ==========================================

-- 1. Créer la table reservations complète
CREATE TABLE IF NOT EXISTS public.reservations (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
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
    source_reservation VARCHAR(100), -- 'direct', 'telephone', 'operateur_social', 'en_ligne'
    canal_reservation VARCHAR(100),
    duree_sejour INTEGER, -- calculé automatiquement
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

-- 2. Créer les index pour performance
CREATE INDEX IF NOT EXISTS idx_reservations_hotel ON public.reservations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room ON public.reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON public.reservations(date_arrivee, date_depart);
CREATE INDEX IF NOT EXISTS idx_reservations_statut ON public.reservations(statut);
CREATE INDEX IF NOT EXISTS idx_reservations_operateur ON public.reservations(operateur_social_id);
CREATE INDEX IF NOT EXISTS idx_reservations_numero ON public.reservations(numero);

-- 3. Créer la fonction trigger pour calculs automatiques
CREATE OR REPLACE FUNCTION update_reservation_calculated_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer la durée du séjour
    NEW.duree_sejour = NEW.date_depart - NEW.date_arrivee;
    
    -- Calculer le reste à payer
    NEW.reste_a_payer = NEW.prix_total - COALESCE(NEW.acompte, 0);
    
    -- Mettre à jour updated_at
    NEW.updated_at = now();
    
    -- Générer un numéro de réservation automatique si absent
    IF NEW.numero IS NULL OR NEW.numero = '' THEN
        NEW.numero = 'RES-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(NEW.id::text, 6, '0');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_reservation_calculated_fields ON public.reservations;
CREATE TRIGGER trigger_update_reservation_calculated_fields
    BEFORE INSERT OR UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_reservation_calculated_fields();

-- 5. Activer RLS (Row Level Security)
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "reservations_all_operations" ON public.reservations;

-- Créer une policy permissive pour le développement
CREATE POLICY "reservations_all_operations" 
ON public.reservations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 6. Insérer des données de test réalistes
INSERT INTO public.reservations (
    numero, hotel_id, client_nom, client_prenom, client_email, client_telephone, 
    date_arrivee, date_depart, nombre_personnes, statut, prix_total, prix_par_nuit, 
    source_reservation, notes
) VALUES
('RES-2024-000001', 1, 'Martin', 'Jean', 'jean.martin@email.fr', '0612345678', '2024-08-20', '2024-08-25', 2, 'CONFIRMEE', 275.00, 55.00, 'operateur_social', 'Placement social d''urgence'),
('RES-2024-000002', 2, 'Dupont', 'Marie', 'marie.dupont@email.fr', '0698765432', '2024-08-22', '2024-08-24', 1, 'EN_COURS', 130.00, 65.00, 'direct', 'Séjour professionnel'),
('RES-2024-000003', 3, 'Bernard', 'Pierre', 'pierre.bernard@email.fr', '0634567890', '2024-08-25', '2024-08-30', 3, 'EN_ATTENTE', 340.00, 68.00, 'operateur_social', 'Famille en situation précaire'),
('RES-2024-000004', 1, 'Moreau', 'Sophie', 'sophie.moreau@email.fr', '0687654321', '2024-08-18', '2024-08-23', 2, 'TERMINEE', 300.00, 60.00, 'telephone', 'Séjour terminé avec satisfaction'),
('RES-2024-000005', 2, 'Leroy', 'Antoine', 'antoine.leroy@email.fr', '0656789012', '2024-08-28', '2024-09-02', 1, 'CONFIRMEE', 325.00, 65.00, 'en_ligne', 'Réservation via site web')
ON CONFLICT (numero) DO NOTHING;

-- 7. VÉRIFICATIONS FINALES
-- Compter les réservations
SELECT COUNT(*) as total_reservations FROM public.reservations;

-- Afficher les dernières réservations avec calculs automatiques
SELECT 
    numero, 
    client_nom, 
    client_prenom,
    statut, 
    date_arrivee, 
    date_depart,
    duree_sejour,
    prix_total,
    acompte,
    reste_a_payer,
    created_at
FROM public.reservations 
ORDER BY created_at DESC 
LIMIT 5;

-- Test du trigger de calcul
SELECT 
    'Trigger test' as test_name,
    COUNT(*) as reservations_with_duree,
    AVG(duree_sejour) as avg_duree_sejour
FROM public.reservations 
WHERE duree_sejour IS NOT NULL;

-- Vérifier les contraintes
SELECT 
    'Constraints test' as test_name,
    COUNT(*) as total_reservations,
    COUNT(CASE WHEN statut IN ('EN_ATTENTE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE') THEN 1 END) as valid_statuts,
    COUNT(CASE WHEN nombre_personnes > 0 THEN 1 END) as valid_nombre_personnes
FROM public.reservations;

-- Affichage du schéma de la table pour confirmation
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'reservations' 
ORDER BY ordinal_position;

-- Message de succès
SELECT 
    '✅ TABLE RESERVATIONS CRÉÉE AVEC SUCCÈS!' as message,
    COUNT(*) as total_reservations_inserted
FROM public.reservations;