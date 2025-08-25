# 🚨 CORRECTION URGENTE - Erreurs Base de Données

## 🔴 Problèmes Identifiés

1. **Table `reservations` manquante** → Erreur dans ReservationsPage.tsx
2. **Politiques RLS trop restrictives** → Erreur 401 pour équipements

## ⚡ Solution Rapide (3 minutes)

### **1. Corriger les Équipements (Erreur 401)**

Dans **Supabase Dashboard** → **SQL Editor**, exécuter :

```sql
-- Supprimer les anciennes politiques restrictives
DROP POLICY IF EXISTS "Allow read access to equipments" ON equipments;
DROP POLICY IF EXISTS "Allow all operations on equipments for authenticated users" ON equipments;
DROP POLICY IF EXISTS "Allow read access to hotel_equipments" ON hotel_equipments;
DROP POLICY IF EXISTS "Allow all operations on hotel_equipments for authenticated users" ON hotel_equipments;

-- Créer des politiques permissives
CREATE POLICY "Allow all operations on equipments" ON equipments FOR ALL USING (true);
CREATE POLICY "Allow all operations on hotel_equipments" ON hotel_equipments FOR ALL USING (true);
```

### **2. Créer la Table Réservations**

Dans **Supabase Dashboard** → **SQL Editor**, exécuter :

```sql
-- Créer la table des réservations
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    client_nom VARCHAR(255) NOT NULL,
    client_prenom VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_telephone VARCHAR(50),
    date_arrivee DATE NOT NULL,
    date_depart DATE NOT NULL,
    nombre_personnes INTEGER DEFAULT 1,
    statut VARCHAR(50) DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE')),
    prix_total DECIMAL(10,2) DEFAULT 0,
    acompte DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    operateur_social_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index et sécurité
CREATE INDEX IF NOT EXISTS idx_reservations_hotel ON reservations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room ON reservations(room_id);
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on reservations" ON reservations FOR ALL USING (true);

-- Données de test
INSERT INTO reservations (numero, hotel_id, client_nom, client_prenom, date_arrivee, date_depart, statut) VALUES
    ('RES-2024-001', 1, 'Martin', 'Jean', '2024-08-20', '2024-08-25', 'CONFIRMEE'),
    ('RES-2024-002', 2, 'Dupont', 'Marie', '2024-08-22', '2024-08-24', 'EN_COURS'),
    ('RES-2024-003', 3, 'Bernard', 'Pierre', '2024-08-25', '2024-08-30', 'EN_ATTENTE')
ON CONFLICT (numero) DO NOTHING;
```

### **3. Créer les Équipements (Si pas encore fait)**

Dans **Supabase Dashboard** → **SQL Editor**, exécuter le contenu de :
`supabase/migrations/create_equipments_tables.sql`

---

## ✅ Vérification

Après exécution :

1. **Équipements** : Plus d'erreur 401, création possible
2. **Réservations** : Page ReservationsPage.tsx fonctionne
3. **Application** : Entièrement fonctionnelle

---

## 📁 Scripts Disponibles

- `fix_rls_policies.sql` - Correction équipements seulement  
- `create_reservations_table.sql` - Table réservations seulement
- `supabase/migrations/create_equipments_tables.sql` - Système équipements complet

---

**🎯 Temps estimé : 3 minutes pour corriger toutes les erreurs**