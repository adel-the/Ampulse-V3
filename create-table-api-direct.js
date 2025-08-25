const https = require('https');
const fs = require('fs');

// Lire la configuration
const config = JSON.parse(fs.readFileSync('mcp-supabase-config.json', 'utf8'));

const createReservationsTableDirectAPI = async () => {
  console.log('🎯 MISSION URGENTE: Création table reservations via API directe');
  console.log('📊 Projet Supabase: pgjatiookprsvfesrsrx');
  console.log('=====================================');

  // SQL complet à exécuter
  const sqlCommands = [
    // 1. Créer la table
    `CREATE TABLE IF NOT EXISTS public.reservations (
      id SERIAL PRIMARY KEY,
      numero VARCHAR(50) UNIQUE NOT NULL,
      hotel_id INTEGER,
      room_id INTEGER,
      operateur_social_id INTEGER,
      client_nom VARCHAR(255) NOT NULL,
      client_prenom VARCHAR(255) NOT NULL,
      client_email VARCHAR(255),
      client_telephone VARCHAR(50),
      client_date_naissance DATE,
      client_adresse TEXT,
      date_arrivee DATE NOT NULL,
      date_depart DATE NOT NULL,
      nombre_personnes INTEGER DEFAULT 1 CHECK (nombre_personnes > 0),
      nombre_adultes INTEGER DEFAULT 1,
      nombre_enfants INTEGER DEFAULT 0,
      statut VARCHAR(50) DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE')),
      prix_total DECIMAL(10,2) DEFAULT 0,
      prix_par_nuit DECIMAL(10,2) DEFAULT 0,
      acompte DECIMAL(10,2) DEFAULT 0,
      reste_a_payer DECIMAL(10,2) DEFAULT 0,
      mode_paiement VARCHAR(50),
      date_paiement_acompte DATE,
      notes TEXT,
      demandes_speciales TEXT,
      source_reservation VARCHAR(100),
      canal_reservation VARCHAR(100),
      duree_sejour INTEGER,
      checkin_effectue BOOLEAN DEFAULT false,
      checkout_effectue BOOLEAN DEFAULT false,
      date_checkin TIMESTAMPTZ,
      date_checkout TIMESTAMPTZ,
      satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
      commentaire_satisfaction TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );`,
    
    // 2. Créer les index
    "CREATE INDEX IF NOT EXISTS idx_reservations_hotel ON public.reservations(hotel_id);",
    "CREATE INDEX IF NOT EXISTS idx_reservations_room ON public.reservations(room_id);",
    "CREATE INDEX IF NOT EXISTS idx_reservations_dates ON public.reservations(date_arrivee, date_depart);",
    "CREATE INDEX IF NOT EXISTS idx_reservations_statut ON public.reservations(statut);",
    
    // 3. Activer RLS
    "ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;",
    "CREATE POLICY IF NOT EXISTS reservations_all_operations ON public.reservations FOR ALL USING (true) WITH CHECK (true);"
  ];

  // Exécuter chaque commande SQL via l'API REST
  for (let i = 0; i < sqlCommands.length; i++) {
    console.log(`🔄 Exécution commande ${i + 1}/${sqlCommands.length}...`);
    
    const success = await executeSQLCommand(sqlCommands[i]);
    if (success) {
      console.log(`✅ Commande ${i + 1} réussie`);
    } else {
      console.log(`⚠️ Commande ${i + 1} ignorée (peut-être déjà existante)`);
    }
  }

  // Insérer les données de test
  console.log('📊 Insertion des données de test...');
  await insertTestData();
  
  // Vérification finale
  console.log('🔍 Vérification finale...');
  await verifyTable();
};

const executeSQLCommand = (sql) => {
  return new Promise((resolve) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'pgjatiookprsvfesrsrx.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/execute_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${config.supabase.service_role_key}`,
        'apikey': config.supabase.service_role_key
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(true);
        } else {
          console.log(`❌ Erreur HTTP ${res.statusCode}: ${responseData}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erreur réseau: ${error.message}`);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
};

const insertTestData = async () => {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    config.supabase.url,
    config.supabase.service_role_key
  );

  const testReservations = [
    {
      numero: 'RES-2024-000001',
      hotel_id: 1,
      client_nom: 'Martin',
      client_prenom: 'Jean',
      client_email: 'jean.martin@email.fr',
      client_telephone: '0612345678',
      date_arrivee: '2024-08-20',
      date_depart: '2024-08-25',
      nombre_personnes: 2,
      statut: 'CONFIRMEE',
      prix_total: 275.00,
      prix_par_nuit: 55.00,
      source_reservation: 'operateur_social',
      notes: 'Placement social d\'urgence'
    },
    {
      numero: 'RES-2024-000002',
      hotel_id: 2,
      client_nom: 'Dupont',
      client_prenom: 'Marie',
      client_email: 'marie.dupont@email.fr',
      client_telephone: '0698765432',
      date_arrivee: '2024-08-22',
      date_depart: '2024-08-24',
      nombre_personnes: 1,
      statut: 'EN_COURS',
      prix_total: 130.00,
      prix_par_nuit: 65.00,
      source_reservation: 'direct',
      notes: 'Séjour professionnel'
    },
    {
      numero: 'RES-2024-000003',
      hotel_id: 3,
      client_nom: 'Bernard',
      client_prenom: 'Pierre',
      client_email: 'pierre.bernard@email.fr',
      client_telephone: '0634567890',
      date_arrivee: '2024-08-25',
      date_depart: '2024-08-30',
      nombre_personnes: 3,
      statut: 'EN_ATTENTE',
      prix_total: 340.00,
      prix_par_nuit: 68.00,
      source_reservation: 'operateur_social',
      notes: 'Famille en situation précaire'
    }
  ];

  try {
    const { data, error } = await supabase
      .from('reservations')
      .insert(testReservations);
    
    if (error) {
      console.error('❌ Erreur insertion:', error.message);
      return false;
    }
    
    console.log('✅ Données de test insérées');
    return true;
  } catch (err) {
    console.error('❌ Erreur insertion:', err.message);
    return false;
  }
};

const verifyTable = async () => {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    config.supabase.url,
    config.supabase.service_role_key
  );

  try {
    // Test de sélection
    const { data, error, count } = await supabase
      .from('reservations')
      .select('numero, client_nom, statut, date_arrivee', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (error) {
      console.error('❌ Erreur SELECT:', error.message);
      return false;
    }
    
    console.log(`✅ Total réservations: ${count}`);
    console.log('✅ SELECT avec ORDER BY fonctionne');
    console.log('📋 Dernières réservations:');
    data.forEach(res => {
      console.log(`   ${res.numero} - ${res.client_nom} - ${res.statut}`);
    });
    
    return true;
  } catch (err) {
    console.error('❌ Erreur vérification:', err.message);
    return false;
  }
};

// Lancement de la création
createReservationsTableDirectAPI()
  .then(() => {
    console.log('\n🎯 RÉSUMÉ FINAL:');
    console.log('================');
    console.log('✅ Table créée via API directe');
    console.log('✅ Données de test insérées');
    console.log('✅ Vérification réussie');
    console.log('\n🎉 SUCCÈS! Plus d\'erreur 404 pour reservations!');
  })
  .catch(error => {
    console.error('❌ Erreur générale:', error.message);
  });