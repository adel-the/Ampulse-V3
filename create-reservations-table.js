#!/usr/bin/env node

/**
 * Script pour créer la table 'reservations' manquante dans Supabase
 * Utilise l'API Supabase REST pour exécuter le SQL directement
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.error('\nVeuillez créer un fichier .env.local avec vos credentials Supabase');
  process.exit(1);
}

// Créer le client Supabase avec la clé service_role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL pour créer la table reservations avec structure complète
const createReservationsTableSQL = `
-- Créer la table des réservations
CREATE TABLE IF NOT EXISTS public.reservations (
    id BIGSERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL DEFAULT 'RES-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('reservations_numero_seq')::text, 3, '0'),
    hotel_id BIGINT NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    room_id BIGINT REFERENCES public.rooms(id) ON DELETE SET NULL,
    
    -- Informations client (optionnel si lié à usager_id)
    client_nom VARCHAR(255) NOT NULL,
    client_prenom VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_telephone VARCHAR(50),
    
    -- Dates et durée
    date_arrivee DATE NOT NULL,
    date_depart DATE NOT NULL,
    nombre_personnes INTEGER DEFAULT 1,
    
    -- Statut et workflow
    statut VARCHAR(50) DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE')),
    
    -- Informations financières
    prix_total DECIMAL(10,2) DEFAULT 0,
    acompte DECIMAL(10,2) DEFAULT 0,
    
    -- Informations supplémentaires
    notes TEXT,
    operateur_social_id BIGINT,
    
    -- Compatibilité avec l'ancien schéma
    usager_id BIGINT REFERENCES public.usagers(id) ON DELETE SET NULL,
    chambre_id BIGINT, -- Alias pour room_id
    prescripteur VARCHAR(255),
    prix DECIMAL(10,2), -- Alias pour prix_total
    duree INTEGER, -- Calculé automatiquement
    operateur_id BIGINT, -- Alias pour operateur_social_id
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT check_dates CHECK (date_depart > date_arrivee),
    CONSTRAINT check_nombres_positifs CHECK (nombre_personnes > 0 AND prix_total >= 0 AND acompte >= 0)
);

-- Créer une séquence pour les numéros de réservation
CREATE SEQUENCE IF NOT EXISTS public.reservations_numero_seq START 1;

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_reservations_hotel ON public.reservations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room ON public.reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_statut ON public.reservations(statut);
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON public.reservations(date_arrivee, date_depart);
CREATE INDEX IF NOT EXISTS idx_reservations_client ON public.reservations(client_nom, client_prenom);
CREATE INDEX IF NOT EXISTS idx_reservations_numero ON public.reservations(numero);

-- Activer Row Level Security
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Créer une politique RLS permissive pour les tests
CREATE POLICY IF NOT EXISTS "Allow all operations on reservations" 
ON public.reservations FOR ALL USING (true);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER IF NOT EXISTS trigger_reservations_updated_at 
    BEFORE UPDATE ON public.reservations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour calculer automatiquement la durée
CREATE OR REPLACE FUNCTION calculate_reservation_duration()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer la durée en jours
    NEW.duree = NEW.date_depart - NEW.date_arrivee;
    
    -- Synchroniser les champs alias
    NEW.chambre_id = NEW.room_id;
    NEW.prix = COALESCE(NEW.prix_total, 0);
    NEW.operateur_id = NEW.operateur_social_id;
    
    -- Générer un numéro si pas fourni
    IF NEW.numero IS NULL OR NEW.numero = '' THEN
        NEW.numero = 'RES-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('reservations_numero_seq')::text, 3, '0');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_calculate_reservation_duration
    BEFORE INSERT OR UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION calculate_reservation_duration();

-- Commentaire sur la table
COMMENT ON TABLE public.reservations IS 'Réservations de chambres avec informations client et statuts';
`;

// SQL pour insérer des données de test
const insertTestDataSQL = `
-- Insérer des données de test dans reservations
INSERT INTO public.reservations (
    numero, 
    hotel_id, 
    client_nom, 
    client_prenom, 
    client_email,
    client_telephone,
    date_arrivee, 
    date_depart, 
    nombre_personnes,
    statut,
    prix_total,
    acompte,
    notes
) VALUES
    ('RES-2024-001', 1, 'Martin', 'Jean', 'jean.martin@email.com', '0123456789', '2024-08-20', '2024-08-25', 1, 'CONFIRMEE', 225.00, 50.00, 'Réservation confirmée par opérateur social'),
    ('RES-2024-002', 1, 'Dupont', 'Marie', 'marie.dupont@email.com', '0987654321', '2024-08-22', '2024-08-24', 1, 'EN_COURS', 90.00, 45.00, 'Client en cours de séjour'),
    ('RES-2024-003', 2, 'Bernard', 'Pierre', 'pierre.bernard@email.com', '0156789123', '2024-08-25', '2024-08-30', 2, 'EN_ATTENTE', 275.00, 0.00, 'En attente de confirmation')
ON CONFLICT (numero) DO NOTHING;
`;

async function createReservationsTable() {
  console.log('🚀 Création de la table reservations...');
  
  try {
    // Vérifier la connexion
    console.log('📡 Test de connexion Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('hotels')
      .select('count')
      .limit(1);
    
    if (testError) {
      throw new Error(`Erreur de connexion: ${testError.message}`);
    }
    
    console.log('✅ Connexion Supabase réussie');
    
    // Exécuter le SQL de création
    console.log('📝 Exécution du SQL de création...');
    const { data: createData, error: createError } = await supabase.rpc('exec_sql', {
      sql: createReservationsTableSQL
    });
    
    if (createError) {
      // Si la fonction exec_sql n'existe pas, essayer avec l'API REST directe
      console.log('🔄 Tentative avec méthode alternative...');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: createReservationsTableSQL })
      });
      
      if (!response.ok) {
        // Dernière tentative : exécuter le SQL ligne par ligne
        console.log('🔄 Exécution directe du SQL...');
        await executeDirectSQL();
      }
    }
    
    console.log('✅ Table reservations créée avec succès');
    
    // Insérer les données de test
    console.log('📊 Insertion des données de test...');
    const { data: insertData, error: insertError } = await supabase
      .from('reservations')
      .insert([
        {
          numero: 'RES-2024-001',
          hotel_id: 1,
          client_nom: 'Martin',
          client_prenom: 'Jean',
          client_email: 'jean.martin@email.com',
          client_telephone: '0123456789',
          date_arrivee: '2024-08-20',
          date_depart: '2024-08-25',
          nombre_personnes: 1,
          statut: 'CONFIRMEE',
          prix_total: 225.00,
          acompte: 50.00,
          notes: 'Réservation confirmée par opérateur social'
        },
        {
          numero: 'RES-2024-002',
          hotel_id: 1,
          client_nom: 'Dupont',
          client_prenom: 'Marie',
          client_email: 'marie.dupont@email.com',
          client_telephone: '0987654321',
          date_arrivee: '2024-08-22',
          date_depart: '2024-08-24',
          nombre_personnes: 1,
          statut: 'EN_COURS',
          prix_total: 90.00,
          acompte: 45.00,
          notes: 'Client en cours de séjour'
        },
        {
          numero: 'RES-2024-003',
          hotel_id: 2,
          client_nom: 'Bernard',
          client_prenom: 'Pierre',
          client_email: 'pierre.bernard@email.com',
          client_telephone: '0156789123',
          date_arrivee: '2024-08-25',
          date_depart: '2024-08-30',
          nombre_personnes: 2,
          statut: 'EN_ATTENTE',
          prix_total: 275.00,
          acompte: 0.00,
          notes: 'En attente de confirmation'
        }
      ]);
    
    if (insertError) {
      console.log('⚠️ Erreur lors de l\'insertion des données de test:', insertError.message);
      console.log('💡 Les données de test peuvent être ajoutées manuellement plus tard');
    } else {
      console.log('✅ Données de test insérées avec succès');
    }
    
    // Vérifier que la table existe
    console.log('🔍 Vérification de la table...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('reservations')
      .select('count')
      .limit(1);
    
    if (verifyError) {
      throw new Error(`La table n'a pas été créée correctement: ${verifyError.message}`);
    }
    
    console.log('✅ Table reservations créée et vérifiée avec succès!');
    console.log('📊 Vous pouvez maintenant utiliser la table reservations dans votre application');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error.message);
    console.error('🔍 Détails:', error);
    process.exit(1);
  }
}

async function executeDirectSQL() {
  // Exécution directe via l'ORM Supabase
  console.log('🔧 Exécution SQL directe...');
  
  try {
    // Utiliser une requête SQL brute via postgrest
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sql',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Accept': 'application/json'
      },
      body: createReservationsTableSQL
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    console.log('✅ SQL exécuté avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution SQL directe:', error.message);
    throw error;
  }
}

// Exécuter le script
if (require.main === module) {
  createReservationsTable();
}

module.exports = { createReservationsTable };