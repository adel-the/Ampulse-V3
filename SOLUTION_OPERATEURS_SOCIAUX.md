# 🚨 SOLUTION URGENTE : Créer la table operateurs_sociaux

## 📊 DIAGNOSTIC ACTUEL

**ERREUR CONFIRMÉE :**
```
GET operateurs_sociaux 404 (Not Found)
Could not find the table 'public.operateurs_sociaux'
```

**TABLES EXISTANTES :** ✅ hotels, ✅ rooms  
**TABLES MANQUANTES :** ❌ operateurs_sociaux, ❌ clients, ❌ users, ❌ reservations, ❌ conventions_prix

## 🎯 SOLUTION IMMÉDIATE

### 1. Aller sur l'interface Supabase
🔗 **URL :** https://supabase.com/dashboard/project/pgjatiookprsvfesrsrx/editor

### 2. Ouvrir l'éditeur SQL
- Cliquer sur "SQL Editor" dans le menu de gauche
- Cliquer sur "New query"

### 3. Copier-coller ce SQL minimal

```sql
-- Créer la table operateurs_sociaux
CREATE TABLE IF NOT EXISTS public.operateurs_sociaux (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    organisation VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    email VARCHAR(255),
    statut VARCHAR(10) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif')),
    specialite VARCHAR(255),
    zone_intervention VARCHAR(255),
    nombre_reservations INTEGER DEFAULT 0,
    date_creation TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    siret VARCHAR(14),
    adresse TEXT,
    responsable VARCHAR(100),
    telephone_responsable VARCHAR(20),
    email_responsable VARCHAR(255),
    agrement VARCHAR(50),
    date_agrement DATE,
    zone_intervention_array TEXT[],
    specialites TEXT[],
    partenariats TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_operateurs_statut ON public.operateurs_sociaux(statut);
CREATE INDEX IF NOT EXISTS idx_operateurs_organisation ON public.operateurs_sociaux(organisation);

-- RLS permissif
ALTER TABLE public.operateurs_sociaux ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "operateurs_sociaux_all_operations" ON public.operateurs_sociaux;
CREATE POLICY "operateurs_sociaux_all_operations" ON public.operateurs_sociaux FOR ALL USING (true) WITH CHECK (true);

-- Données de test
INSERT INTO public.operateurs_sociaux (nom, prenom, organisation, telephone, email, statut, specialite, zone_intervention) VALUES
('Dupont', 'Jean', 'Association Aide Sociale Marseille', '04.91.00.00.01', 'j.dupont@aide-sociale-marseille.fr', 'actif', 'Action sociale', 'Marseille'),
('Martin', 'Sophie', 'Entreprise Solidaire Sud', '04.91.00.00.02', 's.martin@solidaire-sud.fr', 'actif', 'Insertion professionnelle', 'Marseille'),
('Bernard', 'Pierre', 'Collectivité PACA', '04.42.00.00.03', 'p.bernard@collectivite-paca.fr', 'actif', 'Services publics', 'Aix-en-Provence'),
('Leclerc', 'Marie', 'Fondation Logement Social', '04.91.00.00.04', 'm.leclerc@fondation-logement.fr', 'actif', 'Logement social', 'Marseille'),
('Moreau', 'Alain', 'Centre d Action Sociale', '04.91.00.00.05', 'a.moreau@centre-action-sociale.fr', 'actif', 'Action sociale', 'Marseille')
ON CONFLICT (id) DO NOTHING;

-- Vérification
SELECT 'operateurs_sociaux créée avec ' || COUNT(*) || ' enregistrements' as result 
FROM public.operateurs_sociaux;
```

### 4. Exécuter le script
- Cliquer sur "Run" (bouton bleu)
- Vérifier que ça affiche "operateurs_sociaux créée avec 5 enregistrements"

## 🧪 VÉRIFICATION

Après création, tester avec cette requête :
```sql
SELECT nom, prenom, organisation, statut 
FROM public.operateurs_sociaux 
LIMIT 5;
```

## 📝 RÉSULTAT ATTENDU

✅ **Table créée :** operateurs_sociaux  
✅ **5 opérateurs insérés :** Association Aide Sociale, Entreprise Solidaire, etc.  
✅ **SELECT fonctionne :** Plus d'erreur 404  
✅ **RLS configuré :** Politiques d'accès permissives  

## 🎉 OBJECTIF FINAL

**PLUS D'ERREUR 404 POUR operateurs_sociaux !**

L'application pourra maintenant :
- Lister les opérateurs sociaux
- Créer de nouvelles réservations
- Afficher la gestion des clients
- Fonctionner sans erreurs de table manquante

---

*Si le problème persiste après cette solution, c'est que d'autres tables essentielles manquent aussi (clients, users, reservations, conventions_prix) et nécessitent le même traitement.*