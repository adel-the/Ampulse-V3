-- SCRIPT SQL À EXÉCUTER MANUELLEMENT DANS SUPABASE SQL EDITOR
-- Dashboard Supabase > SQL Editor > New Query > Coller ce script

-- 1. Créer la table processus_reservations
CREATE TABLE IF NOT EXISTS public.processus_reservations (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER,
    type_processus VARCHAR(100) NOT NULL,
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
    duree_estimee INTEGER,
    priorite VARCHAR(20) DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
    commentaires TEXT,
    erreurs JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Créer les index pour performance
CREATE INDEX IF NOT EXISTS idx_processus_reservations_type ON public.processus_reservations(type_processus);
CREATE INDEX IF NOT EXISTS idx_processus_reservations_statut ON public.processus_reservations(statut);
CREATE INDEX IF NOT EXISTS idx_processus_reservations_date ON public.processus_reservations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_processus_reservations_reservation ON public.processus_reservations(reservation_id);

-- 3. Activer Row Level Security
ALTER TABLE public.processus_reservations ENABLE ROW LEVEL SECURITY;

-- 4. Créer une politique permissive pour développement
DROP POLICY IF EXISTS "processus_reservations_all_operations" ON public.processus_reservations;
CREATE POLICY "processus_reservations_all_operations" 
ON public.processus_reservations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 5. Insérer des données de test
INSERT INTO public.processus_reservations (
    type_processus, 
    statut, 
    etape_actuelle, 
    hotel_id, 
    priorite, 
    commentaires
) VALUES
('arrivee', 'en_cours', 'verification_documents', 1, 'normale', 'Processus d''arrivée standard'),
('depart', 'termine', 'nettoyage_chambre', 2, 'normale', 'Départ effectué'),
('modification', 'en_attente', 'validation_manager', 3, 'haute', 'Modification dates séjour'),
('prolongation', 'en_cours', 'verification_disponibilite', 1, 'normale', 'Demande prolongation 3 jours'),
('annulation', 'termine', 'remboursement_effectue', 2, 'basse', 'Annulation pour motif personnel')
ON CONFLICT DO NOTHING;

-- 6. Vérification
SELECT COUNT(*) as total_processus FROM public.processus_reservations;
SELECT * FROM public.processus_reservations ORDER BY created_at DESC;