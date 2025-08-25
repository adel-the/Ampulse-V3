#!/usr/bin/env node

/**
 * Script pour créer la table reservations via l'API Management de Supabase
 * Utilise l'API Management pour exécuter du SQL directement
 */

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

// Extraire l'ID du projet depuis l'URL
const projectId = supabaseUrl.replace('https://', '').split('.')[0];
console.log('🎯 Projet Supabase:', projectId);

// SQL simplifié pour créer la table reservations
const createTableSQL = `
-- Créer la table des réservations compatible avec les types TypeScript existants
CREATE TABLE IF NOT EXISTS public.reservations (
    id BIGSERIAL PRIMARY KEY,
    
    -- Colonnes obligatoires selon les types TypeScript
    usager_id BIGINT REFERENCES public.usagers(id) ON DELETE SET NULL,
    chambre_id BIGINT NOT NULL, -- Référence aux chambres (sera room_id)
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
    
    -- Contraintes
    CONSTRAINT check_reservation_dates CHECK (date_depart > date_arrivee),
    CONSTRAINT check_positive_values CHECK (prix >= 0 AND duree > 0)
);

-- Ajouter la référence à rooms via chambre_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reservations_chambre_id_fkey'
    ) THEN
        ALTER TABLE public.reservations 
        ADD CONSTRAINT reservations_chambre_id_fkey 
        FOREIGN KEY (chambre_id) REFERENCES public.rooms(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_reservations_hotel_id ON public.reservations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reservations_chambre_id ON public.reservations(chambre_id);
CREATE INDEX IF NOT EXISTS idx_reservations_usager_id ON public.reservations(usager_id);
CREATE INDEX IF NOT EXISTS idx_reservations_operateur_id ON public.reservations(operateur_id);
CREATE INDEX IF NOT EXISTS idx_reservations_statut ON public.reservations(statut);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON public.reservations(date_arrivee, date_depart);

-- Activer Row Level Security
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Créer politique RLS permissive pour tests
DROP POLICY IF EXISTS "Allow all operations on reservations" ON public.reservations;
CREATE POLICY "Allow all operations on reservations" 
ON public.reservations FOR ALL 
USING (true);

-- Trigger pour updated_at
CREATE TRIGGER trigger_reservations_updated_at 
    BEFORE UPDATE ON public.reservations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer automatiquement la durée
CREATE OR REPLACE FUNCTION auto_calculate_reservation_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer la durée automatiquement
    NEW.duree = NEW.date_depart - NEW.date_arrivee;
    
    -- S'assurer que la durée est positive
    IF NEW.duree <= 0 THEN
        NEW.duree = 1;
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
`;

async function createTableViaManagement() {
  console.log('🚀 Création de la table reservations via l\'API Management...');
  
  try {
    // URL de l'API Management pour exécuter du SQL
    const managementUrl = `https://api.supabase.com/v1/projects/${projectId}/database/query`;
    
    console.log('📡 Envoi de la requête SQL...');
    
    const response = await fetch(managementUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        query: createTableSQL
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Table créée avec succès!');
    console.log('📊 Résultat:', result);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur avec l\'API Management:', error.message);
    return false;
  }
}

async function createTableViaDirectSQL() {
  console.log('🔄 Tentative via SQL direct...');
  
  try {
    // URL pour exécuter du SQL via PostgREST
    const sqlUrl = `${supabaseUrl}/rest/v1/rpc/exec`;
    
    const response = await fetch(sqlUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: createTableSQL
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ SQL exécuté avec succès!');
    console.log('📊 Résultat:', result);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur avec SQL direct:', error.message);
    return false;
  }
}

async function insertTestData() {
  console.log('📝 Insertion de données de test...');
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Obtenir une chambre existante pour les tests
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id, hotel_id')
      .limit(1);
    
    if (!rooms || rooms.length === 0) {
      console.log('⚠️ Aucune chambre trouvée pour les tests');
      return;
    }
    
    const room = rooms[0];
    
    const testReservations = [
      {
        usager_id: null,
        chambre_id: room.id,
        hotel_id: room.hotel_id,
        date_arrivee: '2024-08-20',
        date_depart: '2024-08-25',
        statut: 'CONFIRMEE',
        prescripteur: 'Service Social Ville',
        prix: 225.00,
        duree: 5,
        notes: 'Réservation test - placement d\'urgence'
      },
      {
        usager_id: null,
        chambre_id: room.id,
        hotel_id: room.hotel_id,
        date_arrivee: '2024-08-26',
        date_depart: '2024-08-28',
        statut: 'EN_COURS',
        prescripteur: 'CCAS Marseille',
        prix: 90.00,
        duree: 2,
        notes: 'Séjour temporaire'
      }
    ];
    
    const { data, error } = await supabase
      .from('reservations')
      .insert(testReservations);
    
    if (error) {
      console.log('⚠️ Erreur insertion:', error.message);
    } else {
      console.log('✅ Données de test insérées avec succès!');
      console.log('📊 Réservations créées:', data?.length || testReservations.length);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion:', error.message);
  }
}

async function verifyTable() {
  console.log('🔍 Vérification de la table créée...');
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Table non accessible:', error.message);
      return false;
    }
    
    console.log('✅ Table reservations opérationnelle!');
    console.log(`📊 ${data.length} réservations trouvées`);
    
    if (data.length > 0) {
      console.log('🎯 Exemple de réservation:', {
        id: data[0].id,
        hotel_id: data[0].hotel_id,
        chambre_id: data[0].chambre_id,
        statut: data[0].statut,
        prix: data[0].prix
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erreur de vérification:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎯 SoliReserve - Création table reservations');
  console.log('=' .repeat(45));
  
  let success = false;
  
  // Essayer via l'API Management
  success = await createTableViaManagement();
  
  // Si échec, essayer SQL direct
  if (!success) {
    success = await createTableViaDirectSQL();
  }
  
  if (success) {
    console.log('\n📊 Insertion des données de test...');
    await insertTestData();
    
    console.log('\n🔍 Vérification finale...');
    const verified = await verifyTable();
    
    if (verified) {
      console.log('\n🎉 SUCCESS! Table reservations créée et opérationnelle');
      console.log('✅ Vous pouvez maintenant utiliser les réservations dans votre app');
    }
  } else {
    console.log('\n❌ ÉCHEC - Impossible de créer la table automatiquement');
    console.log('💡 Solution manuelle : Exécutez le SQL dans l\'interface Supabase');
    console.log('📝 SQL à exécuter :');
    console.log(createTableSQL);
  }
}

if (require.main === module) {
  main();
}