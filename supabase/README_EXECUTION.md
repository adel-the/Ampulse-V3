# Guide d'Exécution des Scripts de Base de Données

## 📋 Vue d'ensemble

Ce guide détaille l'exécution des 5 scripts SQL pour créer une architecture complète de base de données pour SoliReserve Enhanced.

## 🗂️ Structure des Scripts

```
supabase/migrations/
├── 001_complete_database_schema.sql    # Création des tables principales
├── 002_rls_security_policies.sql       # Politiques de sécurité RLS
├── 003_test_data_seed.sql              # Données de test réalistes
├── 004_validation_script.sql           # Scripts de validation
└── 005_test_queries_relations.sql      # Tests des relations
```

## ⚠️ IMPORTANT - Ordre d'Exécution

**RESPECTER ABSOLUMENT cet ordre d'exécution :**

1. **001_complete_database_schema.sql** - PREMIER
2. **002_rls_security_policies.sql** - DEUXIÈME  
3. **003_test_data_seed.sql** - TROISIÈME
4. **004_validation_script.sql** - QUATRIÈME
5. **005_test_queries_relations.sql** - CINQUIÈME

## 🚀 Instructions d'Exécution dans Supabase

### Méthode 1: Interface Web Supabase (Recommandée)

1. **Connectez-vous à votre projet Supabase**
   - Allez sur [supabase.com](https://supabase.com)
   - Sélectionnez votre projet

2. **Accédez à l'éditeur SQL**
   - Cliquez sur "SQL Editor" dans la barre latérale
   - Ou allez à l'URL : `https://supabase.com/dashboard/project/[votre-project-id]/sql`

3. **Exécutez chaque script dans l'ordre**

   **Script 1 : 001_complete_database_schema.sql**
   ```sql
   -- Copiez le contenu complet du fichier 001_complete_database_schema.sql
   -- Cliquez sur "Run" (Ctrl+Enter)
   -- ⏱️ Temps d'exécution estimé : 30-60 secondes
   -- ✅ Résultat attendu : 16 tables créées + fonctions + triggers
   ```

   **Script 2 : 002_rls_security_policies.sql**
   ```sql
   -- Copiez le contenu complet du fichier 002_rls_security_policies.sql
   -- Cliquez sur "Run" (Ctrl+Enter)
   -- ⏱️ Temps d'exécution estimé : 20-30 secondes
   -- ✅ Résultat attendu : RLS activé + 40+ politiques créées
   ```

   **Script 3 : 003_test_data_seed.sql**
   ```sql
   -- Copiez le contenu complet du fichier 003_test_data_seed.sql
   -- Cliquez sur "Run" (Ctrl+Enter)
   -- ⏱️ Temps d'exécution estimé : 10-20 secondes
   -- ✅ Résultat attendu : Données insérées dans toutes les tables
   ```

   **Script 4 : 004_validation_script.sql**
   ```sql
   -- Copiez le contenu complet du fichier 004_validation_script.sql
   -- Cliquez sur "Run" (Ctrl+Enter)
   -- ⏱️ Temps d'exécution estimé : 30-45 secondes
   -- ✅ Résultat attendu : Rapport de validation complet
   ```

   **Script 5 : 005_test_queries_relations.sql**
   ```sql
   -- Copiez le contenu complet du fichier 005_test_queries_relations.sql
   -- Cliquez sur "Run" (Ctrl+Enter)
   -- ⏱️ Temps d'exécution estimé : 45-60 secondes
   -- ✅ Résultat attendu : Tests de relations et performances
   ```

### Méthode 2: CLI Supabase

```bash
# 1. Connectez-vous à votre projet
supabase link --project-ref [votre-project-ref]

# 2. Exécutez les migrations dans l'ordre
supabase db push

# 3. Ou exécutez manuellement chaque script
psql -h [host] -U [user] -d [database] -f 001_complete_database_schema.sql
psql -h [host] -U [user] -d [database] -f 002_rls_security_policies.sql
psql -h [host] -U [user] -d [database] -f 003_test_data_seed.sql
psql -h [host] -U [user] -d [database] -f 004_validation_script.sql
psql -h [host] -U [user] -d [database] -f 005_test_queries_relations.sql
```

## ✅ Vérifications Post-Exécution

### 1. Vérification Rapide des Tables

```sql
-- Doit retourner 16 tables
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Liste des tables créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### 2. Vérification des Données de Test

```sql
-- Résumé des données insérées
SELECT * FROM database_health_summary ORDER BY component;
```

### 3. Test de Validation Automatique

```sql
-- Exécute tous les tests de validation
SELECT * FROM validate_database_structure();
```

### 4. Vérification RLS

```sql
-- Vérifie que RLS est activé sur toutes les tables
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    COUNT(policyname) as policy_count
FROM pg_tables pt
LEFT JOIN pg_policies pp ON pt.tablename = pp.tablename
WHERE pt.schemaname = 'public'
GROUP BY pt.tablename, pt.rowsecurity
ORDER BY pt.tablename;
```

## 🔧 Résolution des Problèmes Courants

### Erreur : "relation already exists"

```sql
-- Si vous devez recommencer, supprimez d'abord les tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

### Erreur : "permission denied"

- Vérifiez que vous utilisez le **service_role** key
- Ou connectez-vous avec les permissions d'administrateur

### Erreur : "function does not exist"

- Assurez-vous d'avoir exécuté le script 001 en premier
- Les fonctions sont créées dans le premier script

### Timeout lors de l'exécution

- Exécutez les scripts par sections si nécessaire
- Augmentez le timeout dans votre client SQL

## 📊 Résultats Attendus

### Après le Script 1 (Schema)
- ✅ 16 tables créées
- ✅ 25+ index créés
- ✅ 15+ triggers créés
- ✅ 5+ fonctions personnalisées créées

### Après le Script 2 (RLS)
- ✅ RLS activé sur toutes les tables
- ✅ 40+ politiques de sécurité créées
- ✅ Fonctions helper RLS créées

### Après le Script 3 (Data)
- ✅ 4 hôtels avec données complètes
- ✅ 18+ chambres créées
- ✅ 6 opérateurs sociaux
- ✅ 8 clients/usagers
- ✅ 12+ conventions de prix
- ✅ 11 réservations
- ✅ 4 modèles de documents

### Après le Script 4 (Validation)
- ✅ Fonctions de validation créées
- ✅ Tests d'intégrité opérationnels
- ✅ Rapport de validation automatique

### Après le Script 5 (Tests)
- ✅ 16 tests de relations
- ✅ Fonctions de test métier
- ✅ Analyses de performance
- ✅ Vue de monitoring en temps réel

## 🏗️ Architecture Finale

```
📊 BASE DE DONNÉES COMPLÈTE
├── 👥 Authentification (users)
├── 🏨 Gestion Hôtelière (hotels, rooms, room_categories)
├── 👤 Clients & Usagers (clients, usagers)
├── 🏢 Opérateurs Sociaux (operateurs_sociaux)
├── 💰 Conventions Prix (conventions_prix)
├── 📅 Réservations (reservations, processus_reservations)
├── 💬 Communication (conversations, messages)
├── 📄 Documents (document_templates, documents)
├── 🔔 Notifications (notifications)
└── 🔒 Sécurité RLS (toutes tables protégées)
```

## 🎯 Utilisation Post-Installation

### 1. Créer un Utilisateur Admin

```sql
INSERT INTO public.users (
    id, email, nom, prenom, role, statut
) VALUES (
    uuid_generate_v4(),
    'admin@votredomaine.com',
    'Admin',
    'Principal',
    'admin',
    'actif'
);
```

### 2. Tester une Réservation

```sql
-- Utilise la fonction de test créée
SELECT * FROM test_create_reservation(1, 1, 1, '2024-09-01', '2024-09-10');
```

### 3. Surveiller la Santé de la Base

```sql
-- Vue de monitoring temps réel
SELECT * FROM relations_health_monitor;
```

## 🔄 Maintenance Régulière

### Mise à Jour des Statistiques

```sql
-- Mettre à jour les statistiques d'occupation
UPDATE public.hotels SET 
    chambres_total = (SELECT COUNT(*) FROM public.rooms WHERE hotel_id = hotels.id),
    chambres_occupees = (SELECT COUNT(*) FROM public.rooms WHERE hotel_id = hotels.id AND statut = 'occupee'),
    taux_occupation = calculate_occupation_rate(hotels.id);
```

### Validation Périodique

```sql
-- Exécuter la validation complète
SELECT * FROM validate_database_structure();
SELECT * FROM validate_data_integrity();
```

## 📞 Support

En cas de problème :

1. Vérifiez les logs d'erreur Supabase
2. Consultez la documentation des fonctions créées
3. Utilisez les vues de monitoring pour diagnostiquer
4. Exécutez les fonctions de validation pour identifier les problèmes

---

**🎉 Félicitations ! Votre base de données SoliReserve Enhanced est maintenant opérationnelle avec une architecture robuste, sécurisée et prête pour la production.**