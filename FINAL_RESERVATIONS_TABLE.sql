-- ============================================
-- CRÉATION TABLE RESERVATIONS - SUPABASE
-- Script SQL final à exécuter manuellement
-- ============================================

-- Créer la table des réservations compatible avec les types TypeScript existants
CREATE TABLE IF NOT EXISTS public.reservations (
    id BIGSERIAL PRIMARY KEY,
    
    -- Colonnes obligatoires selon les types TypeScript existants
    usager_id BIGINT REFERENCES public.usagers(id) ON DELETE SET NULL,
    chambre_id BIGINT NOT NULL, -- Référence aux chambres (rooms.id)
    hotel_id BIGINT NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    date_arrivee DATE NOT NULL,
    date_depart DATE NOT NULL,
    statut VARCHAR(20) DEFAULT 'CONFIRMEE' CHECK (statut IN ('CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE')),
    prescripteur VARCHAR(255) NOT NULL DEFAULT 'Administration',
    prix DECIMAL(10,2) NOT NULL DEFAULT 0,
    duree INTEGER NOT NULL DEFAULT 1,
    
    -- Colonnes optionnelles
    operateur_id BIGINT REFERENCES public.operateurs_sociaux(id) ON DELETE SET NULL,
    notes TEXT,
    
    -- Colonnes système
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes de validation
    CONSTRAINT check_reservation_dates CHECK (date_depart > date_arrivee),
    CONSTRAINT check_positive_values CHECK (prix >= 0 AND duree > 0)
);

-- Ajouter la référence à rooms via chambre_id (si la table rooms existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rooms' AND table_schema = 'public') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'reservations_chambre_id_fkey'
            AND table_name = 'reservations'
        ) THEN
            ALTER TABLE public.reservations 
            ADD CONSTRAINT reservations_chambre_id_fkey 
            FOREIGN KEY (chambre_id) REFERENCES public.rooms(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_reservations_hotel_id ON public.reservations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reservations_chambre_id ON public.reservations(chambre_id);
CREATE INDEX IF NOT EXISTS idx_reservations_usager_id ON public.reservations(usager_id);
CREATE INDEX IF NOT EXISTS idx_reservations_operateur_id ON public.reservations(operateur_id);
CREATE INDEX IF NOT EXISTS idx_reservations_statut ON public.reservations(statut);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON public.reservations(date_arrivee, date_depart);

-- Activer Row Level Security
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Créer politique RLS permissive pour développement/tests
DROP POLICY IF EXISTS "Allow all operations on reservations" ON public.reservations;
CREATE POLICY "Allow all operations on reservations" 
ON public.reservations FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Politique pour les utilisateurs anonymes (si nécessaire)
CREATE POLICY "Allow anonymous read on reservations" 
ON public.reservations FOR SELECT 
TO anon
USING (true);

-- Fonction pour mettre à jour updated_at (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_reservations_updated_at ON public.reservations;
CREATE TRIGGER trigger_reservations_updated_at 
    BEFORE UPDATE ON public.reservations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer automatiquement la durée et valider les données
CREATE OR REPLACE FUNCTION auto_calculate_reservation_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer la durée automatiquement (en jours)
    NEW.duree = NEW.date_depart - NEW.date_arrivee;
    
    -- S'assurer que la durée est positive
    IF NEW.duree <= 0 THEN
        NEW.duree = 1;
    END IF;
    
    -- Valider le prescripteur (ne peut pas être vide)
    IF NEW.prescripteur IS NULL OR trim(NEW.prescripteur) = '' THEN
        NEW.prescripteur = 'Administration';
    END IF;
    
    -- S'assurer que le prix est positif
    IF NEW.prix < 0 THEN
        NEW.prix = 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement les champs
DROP TRIGGER IF EXISTS trigger_auto_calculate_reservation_fields ON public.reservations;
CREATE TRIGGER trigger_auto_calculate_reservation_fields
    BEFORE INSERT OR UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_reservation_fields();

-- Insérer des données de test (seulement si les hôtels existent)
DO $$
DECLARE
    hotel_count INTEGER;
    room_count INTEGER;
    test_hotel_id BIGINT;
    test_room_id BIGINT;
BEGIN
    -- Vérifier si on a des hôtels
    SELECT COUNT(*) INTO hotel_count FROM public.hotels WHERE statut = 'ACTIF';
    
    IF hotel_count > 0 THEN
        -- Obtenir un hôtel de test
        SELECT id INTO test_hotel_id FROM public.hotels WHERE statut = 'ACTIF' LIMIT 1;
        
        -- Vérifier si on a des chambres pour cet hôtel
        SELECT COUNT(*) INTO room_count FROM public.rooms WHERE hotel_id = test_hotel_id;
        
        IF room_count > 0 THEN
            -- Obtenir une chambre de test
            SELECT id INTO test_room_id FROM public.rooms WHERE hotel_id = test_hotel_id LIMIT 1;
            
            -- Insérer des réservations de test
            INSERT INTO public.reservations (
                usager_id,
                chambre_id,
                hotel_id,
                date_arrivee,
                date_depart,
                statut,
                prescripteur,
                prix,
                notes
            ) VALUES
            (
                NULL,
                test_room_id,
                test_hotel_id,
                CURRENT_DATE + INTERVAL '1 day',
                CURRENT_DATE + INTERVAL '6 days',
                'CONFIRMEE',
                'Service Social Ville',
                225.00,
                'Réservation test - placement d''urgence'
            ),
            (
                NULL,
                test_room_id,
                test_hotel_id,
                CURRENT_DATE + INTERVAL '7 days',
                CURRENT_DATE + INTERVAL '9 days',
                'EN_ATTENTE',
                'CCAS Marseille',
                90.00,
                'Séjour temporaire en attente de confirmation'
            ),
            (
                NULL,
                test_room_id,
                test_hotel_id,
                CURRENT_DATE + INTERVAL '10 days',
                CURRENT_DATE + INTERVAL '15 days',
                'EN_COURS',
                'Préfecture',
                275.00,
                'Hébergement d''urgence en cours'
            )
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Données de test insérées avec succès pour l''hôtel % et la chambre %', test_hotel_id, test_room_id;
        ELSE
            RAISE NOTICE 'Aucune chambre trouvée pour l''hôtel %. Données de test non insérées.', test_hotel_id;
        END IF;
    ELSE
        RAISE NOTICE 'Aucun hôtel actif trouvé. Données de test non insérées.';
    END IF;
END $$;

-- Commentaire sur la table
COMMENT ON TABLE public.reservations IS 'Réservations de chambres avec informations de séjour et statuts - Compatible avec les types TypeScript de l''application';

-- Afficher un résumé
SELECT 
    'Table reservations créée' as statut,
    COUNT(*) as nombre_reservations
FROM public.reservations;

-- Vérification finale des contraintes
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'reservations' 
AND table_schema = 'public'
ORDER BY constraint_type, constraint_name;