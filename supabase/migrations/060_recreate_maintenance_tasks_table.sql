-- Migration pour recréer la table maintenance_tasks
-- Date: 2025-08-31
-- Raison: Table supprimée accidentellement de Supabase

-- Supprimer la table si elle existe encore (pour éviter les erreurs)
DROP TABLE IF EXISTS public.maintenance_tasks CASCADE;

-- Recréer la table maintenance_tasks avec tous les champs nécessaires
CREATE TABLE public.maintenance_tasks (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    priorite VARCHAR(20) NOT NULL DEFAULT 'moyenne' CHECK (priorite IN ('faible', 'moyenne', 'haute', 'urgente')),
    statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'terminee', 'annulee')),
    responsable VARCHAR(255),
    date_echeance DATE,
    notes TEXT,
    hotel_id INTEGER NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Créer les index pour optimiser les performances
CREATE INDEX idx_maintenance_tasks_hotel_id ON public.maintenance_tasks(hotel_id);
CREATE INDEX idx_maintenance_tasks_room_id ON public.maintenance_tasks(room_id);
CREATE INDEX idx_maintenance_tasks_user_owner_id ON public.maintenance_tasks(user_owner_id);
CREATE INDEX idx_maintenance_tasks_statut ON public.maintenance_tasks(statut);
CREATE INDEX idx_maintenance_tasks_priorite ON public.maintenance_tasks(priorite);
CREATE INDEX idx_maintenance_tasks_created_at ON public.maintenance_tasks(created_at DESC);

-- Créer un trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_maintenance_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maintenance_tasks_updated_at
    BEFORE UPDATE ON public.maintenance_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_maintenance_tasks_updated_at();

-- Trigger pour mettre à jour completed_at quand statut devient 'terminee'
CREATE OR REPLACE FUNCTION update_maintenance_tasks_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statut = 'terminee' AND OLD.statut != 'terminee' THEN
        NEW.completed_at = NOW();
    ELSIF NEW.statut != 'terminee' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maintenance_tasks_completed_at
    BEFORE UPDATE ON public.maintenance_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_maintenance_tasks_completed_at();

-- Politiques RLS (Row Level Security)
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leurs propres tâches
CREATE POLICY "maintenance_tasks_select_own" ON public.maintenance_tasks
    FOR SELECT 
    USING (user_owner_id = auth.uid());

-- Politique pour permettre aux utilisateurs d'insérer leurs propres tâches
CREATE POLICY "maintenance_tasks_insert_own" ON public.maintenance_tasks
    FOR INSERT 
    WITH CHECK (user_owner_id = auth.uid());

-- Politique pour permettre aux utilisateurs de modifier leurs propres tâches
CREATE POLICY "maintenance_tasks_update_own" ON public.maintenance_tasks
    FOR UPDATE 
    USING (user_owner_id = auth.uid())
    WITH CHECK (user_owner_id = auth.uid());

-- Politique pour permettre aux utilisateurs de supprimer leurs propres tâches
CREATE POLICY "maintenance_tasks_delete_own" ON public.maintenance_tasks
    FOR DELETE 
    USING (user_owner_id = auth.uid());

-- En développement : permettre l'accès sans authentification (temporaire)
CREATE POLICY "maintenance_tasks_dev_access" ON public.maintenance_tasks
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Activer la publication en temps réel pour cette table
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_tasks;

-- Insérer quelques tâches de test pour validation
INSERT INTO public.maintenance_tasks (
    titre, 
    description, 
    priorite, 
    statut, 
    hotel_id, 
    room_id, 
    user_owner_id, 
    created_by, 
    responsable
) VALUES 
(
    'Test - Vérification climatisation',
    'Tâche de test pour vérifier la création de maintenance',
    'moyenne',
    'en_attente',
    1,  -- Assumant que hotel_id 1 existe
    1,  -- Assumant que room_id 1 existe
    '1f7ebf50-b1be-4304-be67-48f49d38c69e',  -- User ID de test
    '1f7ebf50-b1be-4304-be67-48f49d38c69e',
    'Technicien Test'
);

-- Vérification de la création
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.maintenance_tasks LIMIT 1) THEN
        RAISE NOTICE 'Table maintenance_tasks créée avec succès avec % tâches', 
            (SELECT COUNT(*) FROM public.maintenance_tasks);
    ELSE
        RAISE EXCEPTION 'Erreur: Table maintenance_tasks créée mais aucune donnée insérée';
    END IF;
END $$;