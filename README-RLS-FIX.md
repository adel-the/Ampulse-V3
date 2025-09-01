# Corrections RLS pour Maintenance Tasks

Ce document explique les corrections apportées aux politiques RLS (Row Level Security) pour la table `maintenance_tasks`.

## Problème identifié

Les politiques RLS initiales étaient trop restrictives et ne permettaient pas l'accès aux tâches de maintenance via la relation avec les hôtels. Les utilisateurs ne pouvaient accéder qu'aux tâches où `user_owner_id = auth.uid()`, mais pas à celles de leurs hôtels.

## Solutions fournies

### 1. Migration SQL - `055_fix_maintenance_tasks_rls.sql`

**Localisation:** `D:\Dev\Ampulse v3\M\supabase\migrations\055_fix_maintenance_tasks_rls.sql`

Cette migration :
- Nettoie toutes les politiques RLS existantes
- Désactive temporairement RLS pour éviter les conflits
- Réactive RLS avec de nouvelles politiques correctes
- Inclut des vérifications et une politique développement commentée

**Politiques créées :**
- **SELECT** : Accès aux tâches via `user_owner_id` OU via propriété d'hôtel
- **INSERT** : Création de tâches avec vérifications similaires  
- **UPDATE** : Modification avec USING et WITH CHECK
- **DELETE** : Suppression avec les mêmes règles d'accès

### 2. Script d'application - `apply-rls-fix.js`

**Localisation:** `D:\Dev\Ampulse v3\M\scripts\apply-rls-fix.js`

Script Node.js pour appliquer les corrections via l'API Supabase :

```bash
# Application standard
node scripts/apply-rls-fix.js

# Avec mode développement (politique permissive)
node scripts/apply-rls-fix.js --dev-mode

# Désactivation complète RLS (développement uniquement)
node scripts/apply-rls-fix.js --disable-rls
```

**Fonctionnalités :**
- Nettoyage automatique des anciennes politiques
- Application séquentielle des nouvelles politiques
- Vérification des résultats
- Mode développement optionnel
- Gestion d'erreurs complète

### 3. Script de désactivation - `disable-rls-dev.js`

**Localisation:** `D:\Dev\Ampulse v3\M\scripts\disable-rls-dev.js`

Script pour désactiver complètement RLS en développement :

```bash
# Avec confirmation interactive
node scripts/disable-rls-dev.js

# Confirmation automatique
node scripts/disable-rls-dev.js --confirm
```

**Sécurités incluses :**
- Vérification d'environnement (empêche l'exécution en production)
- Confirmation utilisateur obligatoire
- Vérifications finales du statut
- Avertissements de sécurité

## Commandes d'application

### Via Supabase CLI (Recommandé)

```bash
# Appliquer la migration
cd "D:/Dev/Ampulse v3/M"
npx supabase db push

# Ou spécifiquement cette migration
npx supabase db reset --linked
```

### Via Script JavaScript

```bash
# Installation des dépendances si nécessaire
npm install @supabase/supabase-js dotenv

# Application des corrections
node scripts/apply-rls-fix.js

# Mode développement (accès total)
node scripts/apply-rls-fix.js --dev-mode
```

### Désactivation complète (Développement uniquement)

```bash
# Désactivation avec confirmation
node scripts/disable-rls-dev.js

# Restauration ultérieure
node scripts/apply-rls-fix.js
```

## Structure des nouvelles politiques

```sql
-- Exemple de politique SELECT
CREATE POLICY "Users can view maintenance tasks"
ON maintenance_tasks FOR SELECT
TO authenticated
USING (
  user_owner_id = auth.uid()           -- Propriétaire direct
  OR 
  EXISTS (                             -- OU propriétaire d'hôtel
    SELECT 1 FROM hotels 
    WHERE hotels.id = maintenance_tasks.hotel_id 
    AND hotels.user_owner_id = auth.uid()
  )
);
```

## Variables d'environnement requises

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role
```

## Vérification du succès

Après application, vérifiez que :
1. RLS est activé sur `maintenance_tasks`
2. 4 politiques sont présentes (SELECT, INSERT, UPDATE, DELETE)
3. Les utilisateurs peuvent accéder aux tâches de leurs hôtels
4. L'isolation entre utilisateurs est maintenue

```sql
-- Vérifier le statut RLS
SELECT relrowsecurity 
FROM pg_class 
WHERE relname = 'maintenance_tasks';

-- Lister les politiques
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'maintenance_tasks';
```

## Dépannage

### Erreur "policies already exist"
```bash
# Nettoyer d'abord
node scripts/apply-rls-fix.js --disable-rls
# Puis réappliquer
node scripts/apply-rls-fix.js
```

### Accès refusé aux tâches
1. Vérifier que l'utilisateur possède l'hôtel associé
2. Contrôler que `user_owner_id` est correctement défini
3. Tester avec le mode développement temporairement

### Environnement de production
⚠️ **Ne jamais utiliser les scripts de désactivation RLS en production !**

Pour la production, utilisez uniquement :
- La migration SQL `055_fix_maintenance_tasks_rls.sql`
- Le script `apply-rls-fix.js` sans options particulières

## Support

En cas de problème :
1. Vérifier les logs Supabase dans l'interface admin
2. Tester les requêtes SQL manuellement
3. Contrôler les variables d'environnement
4. Examiner les relations entre `maintenance_tasks` et `hotels`