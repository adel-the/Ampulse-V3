-- ============================================
-- FIX MAINTENANCE TASKS RLS POLICIES
-- ============================================
-- Cette migration corrige les politiques RLS pour maintenance_tasks
-- en permettant l'accès via les propriétaires d'hôtels

-- Nettoyer les politiques existantes
DROP POLICY IF EXISTS "maintenance_tasks_tenant_isolation" ON maintenance_tasks;
DROP POLICY IF EXISTS "Users can view maintenance tasks" ON maintenance_tasks;
DROP POLICY IF EXISTS "Users can create maintenance tasks" ON maintenance_tasks;
DROP POLICY IF EXISTS "Users can update their maintenance tasks" ON maintenance_tasks;
DROP POLICY IF EXISTS "Users can delete their maintenance tasks" ON maintenance_tasks;
DROP POLICY IF EXISTS "Development mode - allow all for authenticated users" ON maintenance_tasks;

-- Désactiver temporairement RLS pour nettoyer
ALTER TABLE maintenance_tasks DISABLE ROW LEVEL SECURITY;

-- Réactiver RLS
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLITIQUES RLS CORRECTIVES
-- ============================================

-- Politique pour SELECT (tous peuvent voir leurs tâches)
CREATE POLICY "Users can view maintenance tasks"
ON maintenance_tasks FOR SELECT
TO authenticated
USING (
  user_owner_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM hotels 
    WHERE hotels.id = maintenance_tasks.hotel_id 
    AND hotels.user_owner_id = auth.uid()
  )
);

-- Politique pour INSERT (créer des tâches)
CREATE POLICY "Users can create maintenance tasks"
ON maintenance_tasks FOR INSERT
TO authenticated
WITH CHECK (
  user_owner_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM hotels 
    WHERE hotels.id = hotel_id 
    AND hotels.user_owner_id = auth.uid()
  )
);

-- Politique pour UPDATE (modifier ses tâches)
CREATE POLICY "Users can update their maintenance tasks"
ON maintenance_tasks FOR UPDATE
TO authenticated
USING (
  user_owner_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM hotels 
    WHERE hotels.id = maintenance_tasks.hotel_id 
    AND hotels.user_owner_id = auth.uid()
  )
)
WITH CHECK (
  user_owner_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM hotels 
    WHERE hotels.id = maintenance_tasks.hotel_id 
    AND hotels.user_owner_id = auth.uid()
  )
);

-- Politique pour DELETE
CREATE POLICY "Users can delete their maintenance tasks"
ON maintenance_tasks FOR DELETE
TO authenticated
USING (
  user_owner_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM hotels 
    WHERE hotels.id = maintenance_tasks.hotel_id 
    AND hotels.user_owner_id = auth.uid()
  )
);

-- ============================================
-- MODE DÉVELOPPEMENT (Optionnel)
-- ============================================
-- Décommentez cette politique pour un accès total en développement
-- ATTENTION: Ne jamais activer en production !

/*
CREATE POLICY "Development mode - allow all for authenticated users"
ON maintenance_tasks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
*/

-- ============================================
-- VÉRIFICATIONS
-- ============================================

-- Vérifier que RLS est activé
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'maintenance_tasks' AND relnamespace = 'public'::regnamespace) THEN
    RAISE EXCEPTION 'RLS n''est pas activé sur maintenance_tasks !';
  END IF;
  
  RAISE NOTICE 'RLS correctement activé sur maintenance_tasks';
END $$;

-- Lister les politiques créées
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'maintenance_tasks' 
ORDER BY policyname;