-- 🚨 DIAGNOSTIC COMPLET ERREUR RLS EQUIPMENTS
-- Diagnostic approfondi des politiques RLS pour la table equipments
-- Date: 2025-08-18
-- Erreur: "new row violates row-level security policy for table equipments"

-- ==================================================
-- 1. VÉRIFICATION DE L'EXISTENCE DES TABLES
-- ==================================================

SELECT '=== VÉRIFICATION TABLES EQUIPMENTS ===' as section;

-- Vérifier si la table equipments existe
SELECT 
    'Table equipments existe:' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipments') 
        THEN 'OUI' 
        ELSE 'NON - PROBLÈME CRITIQUE!' 
    END as status;

-- Structure de la table equipments
SELECT 'Structure table equipments:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'equipments'
ORDER BY ordinal_position;

-- ==================================================
-- 2. ÉTAT DE ROW LEVEL SECURITY
-- ==================================================

SELECT '=== ÉTAT ROW LEVEL SECURITY ===' as section;

-- Vérifier si RLS est activé
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as force_rls
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('equipments', 'hotel_equipments')
ORDER BY tablename;

-- ==================================================
-- 3. POLITIQUES RLS ACTUELLES
-- ==================================================

SELECT '=== POLITIQUES RLS ACTUELLES ===' as section;

-- Lister toutes les politiques RLS pour equipments
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command_type,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('equipments', 'hotel_equipments')
ORDER BY tablename, policyname;

-- ==================================================
-- 4. COMPTAGE DES POLITIQUES
-- ==================================================

SELECT '=== COMPTAGE POLITIQUES ===' as section;

SELECT 
    tablename,
    COUNT(*) as nombre_politiques
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('equipments', 'hotel_equipments')
GROUP BY tablename
ORDER BY tablename;

-- ==================================================
-- 5. VÉRIFICATION DES PERMISSIONS
-- ==================================================

SELECT '=== PERMISSIONS UTILISATEUR ===' as section;

-- Vérifier les permissions sur la table equipments
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND table_name = 'equipments'
ORDER BY grantee, privilege_type;

-- ==================================================
-- 6. TEST DE CONTEXTE AUTHENTIFICATION
-- ==================================================

SELECT '=== CONTEXTE AUTHENTIFICATION ===' as section;

-- Vérifier le contexte utilisateur actuel
SELECT 
    'Utilisateur courant:' as info,
    current_user as value
UNION ALL
SELECT 
    'Rôle courant:',
    current_role
UNION ALL
SELECT 
    'Session user:',
    session_user;

-- Vérifier si auth.uid() fonctionne
SELECT 'auth.uid():' as info, 
    CASE 
        WHEN auth.uid() IS NOT NULL THEN auth.uid()::text 
        ELSE 'NULL - PAS D''AUTHENTIFICATION!'
    END as value;

-- ==================================================
-- 7. DONNÉES EXISTANTES DANS EQUIPMENTS
-- ==================================================

SELECT '=== DONNÉES EXISTANTES ===' as section;

SELECT 
    'Nombre équipements:' as info,
    COUNT(*)::text as value
FROM public.equipments;

-- Échantillon des équipements existants
SELECT 'Échantillon équipements (5 premiers):' as info;
SELECT id, name, type, is_active, created_at 
FROM public.equipments 
LIMIT 5;

-- ==================================================
-- 8. TEST D'INSERTION SIMPLE
-- ==================================================

SELECT '=== TEST INSERTION ===' as section;

-- Essayer une insertion simple (sera rollback)
BEGIN;
    INSERT INTO public.equipments (name, type, category, description) 
    VALUES ('TEST DIAGNOSTIC', 'amenity', 'Test', 'Test pour diagnostic RLS');
    
    SELECT 'Insertion test réussie!' as test_result;
ROLLBACK;

-- ==================================================
-- 9. DIAGNOSTIC FINAL
-- ==================================================

SELECT '=== DIAGNOSTIC FINAL ===' as section;

SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipments')
        THEN '❌ ERREUR: Table equipments inexistante'
        
        WHEN (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'equipments') = false
        THEN '❌ ERREUR: RLS désactivé sur equipments'
        
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'equipments') = 0
        THEN '❌ ERREUR: Aucune politique RLS définie'
        
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'equipments' AND cmd = 'ALL' AND qual = 'true') > 0
        THEN '✅ POLITIQUES PERMISSIVES TROUVÉES - Problème ailleurs'
        
        ELSE '⚠️ PROBLÈME DE POLITIQUES RLS RESTRICTIVES'
    END as diagnostic_principal;

-- ==================================================
-- 10. RECOMMANDATIONS
-- ==================================================

SELECT '=== RECOMMANDATIONS ===' as section;

SELECT 
    'SOLUTION RECOMMANDÉE:' as action,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipments')
        THEN 'Exécuter CORRECTION_COMPLETE_404.sql pour créer la table'
        
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'equipments' AND cmd = 'ALL' AND qual = 'true') = 0
        THEN 'Exécuter FIX_RLS_URGENT.sql pour corriger les politiques'
        
        ELSE 'Vérifier l''authentification utilisateur et les headers de requête'
    END as solution;