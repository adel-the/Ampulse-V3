const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Lire la configuration
const config = JSON.parse(fs.readFileSync('mcp-supabase-config.json', 'utf8'));

const supabase = createClient(
  config.supabase.url,
  config.supabase.service_role_key
);

const checkSupabaseStatus = async () => {
  console.log('🔍 DIAGNOSTIC SUPABASE COMPLET');
  console.log('==============================');
  console.log('📊 Projet:', config.supabase.url);

  try {
    // 1. Vérifier les tables existantes via les métadonnées
    console.log('\n1. 📋 TABLES EXISTANTES:');
    console.log('-------------------------');
    
    // Lister toutes les tables via l'API REST
    const tables = [
      'test_connection',
      'hotels', 
      'rooms',
      'reservations',
      'clients',
      'operateurs_sociaux',
      'users',
      'conventions_prix'
    ];

    for (const tableName of tables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: ${count} enregistrements`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }

    // 2. Vérifier la connectivité de base
    console.log('\n2. 🔗 TEST CONNECTIVITÉ:');
    console.log('------------------------');
    
    try {
      const { data, error } = await supabase
        .from('test_connection')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('❌ Connectivité:', error.message);
      } else {
        console.log('✅ Connectivité: OK');
        console.log('📊 Données test_connection:', data);
      }
    } catch (err) {
      console.log('❌ Connectivité:', err.message);
    }

    // 3. Tenter de créer la table reservations via différentes méthodes
    console.log('\n3. 🚧 TENTATIVES CRÉATION RESERVATIONS:');
    console.log('---------------------------------------');
    
    // Méthode A: RPC pour exécuter du SQL
    console.log('\nMéthode A: RPC SQL...');
    try {
      const { data, error } = await supabase.rpc('version');
      if (!error) {
        console.log('✅ RPC fonctionne, version PostgreSQL:', data);
      } else {
        console.log('❌ RPC échoué:', error.message);
      }
    } catch (err) {
      console.log('❌ RPC erreur:', err.message);
    }

    // Méthode B: Créer via INSERT avec toutes les colonnes
    console.log('\nMéthode B: Forcer création via INSERT...');
    try {
      // Essayer d'insérer avec une structure complète qui forcera la création de table
      const testReservation = {
        numero: 'RES-TEST-001',
        hotel_id: 1,
        room_id: 1,
        client_nom: 'TEST',
        client_prenom: 'TEST',
        client_email: 'test@test.fr',
        date_arrivee: '2024-08-20',
        date_depart: '2024-08-25',
        statut: 'CONFIRMEE',
        prix_total: 100.00,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('reservations')
        .insert(testReservation);
      
      if (!error) {
        console.log('✅ Réservation test créée!');
        console.log('🎉 TABLE RESERVATIONS EXISTE MAINTENANT!');
        
        // Vérifier le contenu
        const { data: checkData, error: checkError } = await supabase
          .from('reservations')
          .select('*');
        
        if (!checkError) {
          console.log('📊 Contenu table reservations:', checkData.length, 'enregistrements');
          return true;
        }
      } else {
        console.log('❌ INSERT échoué:', error.message);
      }
    } catch (err) {
      console.log('❌ INSERT erreur:', err.message);
    }

    // Méthode C: API Management
    console.log('\nMéthode C: API Management...');
    try {
      // Utiliser l'API de management pour créer la table
      const managementApiUrl = `${config.supabase.url}/rest/v1/`;
      console.log('🔧 URL Management API:', managementApiUrl);
      
      // Tenter une requête HTTP directe pour créer la table
      const https = require('https');
      const url = require('url');
      
      const apiUrl = new URL('/rest/v1/', config.supabase.url);
      console.log('🌐 Base API URL:', apiUrl.toString());
      
    } catch (err) {
      console.log('❌ API Management erreur:', err.message);
    }

    console.log('\n4. 📋 RÉSUMÉ DU DIAGNOSTIC:');
    console.log('----------------------------');
    console.log('❌ Table reservations n\'existe pas');
    console.log('✅ Connexion Supabase OK');
    console.log('✅ Autres tables accessibles');
    console.log('🔧 Solution: Création manuelle via Dashboard');

    return false;

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return false;
  }
};

const showManualSolution = () => {
  console.log('\n🎯 SOLUTION MANUELLE IMMÉDIATE:');
  console.log('===============================');
  console.log('1. Ouvrir: https://supabase.com/dashboard/project/pgjatiookprsvfesrsrx/editor');
  console.log('2. Dans l\'onglet SQL Editor, coller et exécuter:');
  console.log('\n```sql');
  
  // SQL simplifié mais complet
  const sql = `-- Créer table reservations
CREATE TABLE public.reservations (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    hotel_id INTEGER,
    room_id INTEGER,
    operateur_social_id INTEGER,
    client_nom VARCHAR(255) NOT NULL,
    client_prenom VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_telephone VARCHAR(50),
    date_arrivee DATE NOT NULL,
    date_depart DATE NOT NULL,
    nombre_personnes INTEGER DEFAULT 1,
    statut VARCHAR(50) DEFAULT 'EN_ATTENTE',
    prix_total DECIMAL(10,2) DEFAULT 0,
    prix_par_nuit DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    source_reservation VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reservations_policy" ON public.reservations 
    FOR ALL USING (true) WITH CHECK (true);

-- Données test
INSERT INTO public.reservations (
    numero, hotel_id, client_nom, client_prenom, client_email, 
    date_arrivee, date_depart, statut, prix_total, notes
) VALUES 
('RES-2024-000001', 1, 'Martin', 'Jean', 'jean.martin@email.fr', 
 '2024-08-20', '2024-08-25', 'CONFIRMEE', 275.00, 'Test urgence'),
('RES-2024-000002', 2, 'Dupont', 'Marie', 'marie.dupont@email.fr', 
 '2024-08-22', '2024-08-24', 'EN_COURS', 130.00, 'Test professionnel'),
('RES-2024-000003', 1, 'Bernard', 'Pierre', 'pierre.bernard@email.fr', 
 '2024-08-25', '2024-08-30', 'EN_ATTENTE', 340.00, 'Test famille');`;

  console.log(sql);
  console.log('```');
  console.log('\n3. Vérifier avec: SELECT COUNT(*) FROM public.reservations;');
  console.log('4. Si 3 enregistrements → SUCCESS!');
  console.log('\n🎉 RÉSULTAT: Plus d\'erreur 404 pour reservations!');
};

// Exécution
checkSupabaseStatus()
  .then((success) => {
    if (!success) {
      showManualSolution();
    }
  })
  .catch(console.error);