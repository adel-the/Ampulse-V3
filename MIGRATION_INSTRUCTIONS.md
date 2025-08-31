# Instructions pour appliquer la migration 056

## Problème résolu
Cette migration corrige l'erreur : **"Key (usager_id)=(35) is not present in table 'clients'"**

Le problème était que la contrainte de clé étrangère `usager_id` dans la table `reservations` pointait vers la table `clients` au lieu de la table `usagers`.

## Comment appliquer la migration

### Option 1 : Via le Dashboard Supabase (Recommandé)

1. **Connectez-vous à votre dashboard Supabase**
   - URL : https://supabase.com/dashboard/project/pgjatiookprsvfesrsrx

2. **Allez dans l'éditeur SQL**
   - Dans le menu de gauche, cliquez sur "SQL Editor"

3. **Copiez le contenu de la migration**
   - Ouvrez le fichier : `supabase/migrations/056_fix_reservations_usager_constraint.sql`
   - Copiez tout le contenu

4. **Exécutez la migration**
   - Collez le SQL dans l'éditeur
   - Cliquez sur "Run" ou appuyez sur Ctrl+Enter

5. **Vérifiez le succès**
   - Vous devriez voir un message de succès
   - La contrainte est maintenant corrigée

### Option 2 : Via Supabase CLI

Si vous avez les credentials de la base de données :

```bash
npx supabase db push
```

Entrez le mot de passe de la base de données quand demandé.

### Option 3 : Script automatisé (Expérimental)

Un script a été créé pour tenter d'appliquer la migration automatiquement :

```bash
node scripts/apply-migration-056.js
```

⚠️ **Note** : Ce script nécessite que les variables d'environnement soient correctement configurées dans `.env.local`

## Changements appliqués par la migration

1. **Correction de la contrainte de clé étrangère**
   - `usager_id` pointe maintenant vers `usagers(id)` au lieu de `clients(id)`

2. **Ajout du champ `prescripteur_id`**
   - Permet de tracer directement quel prescripteur (client) a prescrit la réservation

3. **Ajout/vérification du champ `duree`**
   - Stocke la durée du séjour en jours

4. **Création d'index pour les performances**
   - Index sur `usager_id` et `prescripteur_id`

## Changements dans le code

### API (`lib/api/reservations.ts`)
- Récupération automatique du prescripteur depuis l'usager
- Suppression des champs `created_at` et `updated_at` (auto-gérés par la DB)
- Ajout du `prescripteur_id` lors de la création

### Types TypeScript (`lib/supabase.ts`)
- Ajout du champ `prescripteur_id` dans les types `Row`, `Insert` et `Update`
- Suppression de `created_at` et `updated_at` du type `Insert`

## Test après migration

Pour vérifier que tout fonctionne :

1. Allez sur la page de réservation
2. Sélectionnez un prescripteur
3. Sélectionnez ou créez un usager
4. Complétez la réservation
5. La réservation devrait être créée sans erreur

## En cas de problème

Si la migration échoue ou si des erreurs persistent :

1. Vérifiez que tous les usagers ont bien un `prescripteur_id` valide
2. Vérifiez que la table `usagers` existe et contient des données
3. Consultez les logs dans le dashboard Supabase

## Support

En cas de difficultés, contactez l'équipe de développement avec :
- Le message d'erreur exact
- La version de la base de données
- Les logs du dashboard Supabase