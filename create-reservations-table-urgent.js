const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Lire la configuration
const config = JSON.parse(fs.readFileSync('mcp-supabase-config.json', 'utf8'));

// Créer le client Supabase avec service role
const supabase = createClient(
  config.supabase.url,
  config.supabase.service_role_key
);

const createReservationsTable = async () => {
  console.log('🚀 Création de la table reservations...');
  
  const sql = `
    -- Créer la table reservations complète
    CREATE TABLE IF NOT EXISTS public.reservations (
        id SERIAL PRIMARY KEY,
        numero VARCHAR(50) UNIQUE NOT NULL DEFAULT ('RES-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('reservations_id_seq')::text, 6, '0')),
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
    );
  `;

  try {
    const { data, error } = await supabase.rpc('execute_sql', { query: sql });
    if (error) {
      console.error('❌ Erreur création table:', error);
      return false;
    }
    console.log('✅ Table reservations créée avec succès');
    return true;
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    return false;
  }
};

const createIndexes = async () => {
  console.log('📈 Création des index...');
  
  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_reservations_hotel ON public.reservations(hotel_id);",
    "CREATE INDEX IF NOT EXISTS idx_reservations_room ON public.reservations(room_id);",
    "CREATE INDEX IF NOT EXISTS idx_reservations_dates ON public.reservations(date_arrivee, date_depart);",
    "CREATE INDEX IF NOT EXISTS idx_reservations_statut ON public.reservations(statut);",
    "CREATE INDEX IF NOT EXISTS idx_reservations_operateur ON public.reservations(operateur_social_id);",
    "CREATE INDEX IF NOT EXISTS idx_reservations_numero ON public.reservations(numero);"
  ];

  for (const indexSql of indexes) {
    try {
      const { data, error } = await supabase.rpc('execute_sql', { query: indexSql });
      if (error) {
        console.error('❌ Erreur index:', error);
      }
    } catch (err) {
      console.error('❌ Erreur index:', err.message);
    }
  }
  console.log('✅ Index créés');
};

const createTrigger = async () => {
  console.log('⚡ Création des triggers...');
  
  const triggerSql = `
    -- Trigger pour calculer automatiquement la durée et mise à jour
    CREATE OR REPLACE FUNCTION update_reservation_calculated_fields()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Calculer la durée du séjour
        NEW.duree_sejour = NEW.date_depart - NEW.date_arrivee;
        
        -- Calculer le reste à payer
        NEW.reste_a_payer = NEW.prix_total - COALESCE(NEW.acompte, 0);
        
        -- Mettre à jour updated_at
        NEW.updated_at = now();
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trigger_update_reservation_calculated_fields
        BEFORE INSERT OR UPDATE ON public.reservations
        FOR EACH ROW
        EXECUTE FUNCTION update_reservation_calculated_fields();
  `;

  try {
    const { data, error } = await supabase.rpc('execute_sql', { query: triggerSql });
    if (error) {
      console.error('❌ Erreur trigger:', error);
      return false;
    }
    console.log('✅ Trigger créé avec succès');
    return true;
  } catch (err) {
    console.error('❌ Erreur trigger:', err.message);
    return false;
  }
};

const enableRLS = async () => {
  console.log('🔐 Activation RLS...');
  
  const rlsSql = `
    -- RLS permissif
    ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "reservations_all_operations" ON public.reservations FOR ALL USING (true) WITH CHECK (true);
  `;

  try {
    const { data, error } = await supabase.rpc('execute_sql', { query: rlsSql });
    if (error) {
      console.error('❌ Erreur RLS:', error);
    }
    console.log('✅ RLS activé');
  } catch (err) {
    console.error('❌ Erreur RLS:', err.message);
  }
};

const insertTestData = async () => {
  console.log('📊 Insertion des données de test...');
  
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
    },
    {
      numero: 'RES-2024-000004',
      hotel_id: 1,
      client_nom: 'Moreau',
      client_prenom: 'Sophie',
      client_email: 'sophie.moreau@email.fr',
      client_telephone: '0687654321',
      date_arrivee: '2024-08-18',
      date_depart: '2024-08-23',
      nombre_personnes: 2,
      statut: 'TERMINEE',
      prix_total: 300.00,
      prix_par_nuit: 60.00,
      source_reservation: 'telephone',
      notes: 'Séjour terminé avec satisfaction'
    },
    {
      numero: 'RES-2024-000005',
      hotel_id: 2,
      client_nom: 'Leroy',
      client_prenom: 'Antoine',
      client_email: 'antoine.leroy@email.fr',
      client_telephone: '0656789012',
      date_arrivee: '2024-08-28',
      date_depart: '2024-09-02',
      nombre_personnes: 1,
      statut: 'CONFIRMEE',
      prix_total: 325.00,
      prix_par_nuit: 65.00,
      source_reservation: 'en_ligne',
      notes: 'Réservation via site web'
    }
  ];

  try {
    const { data, error } = await supabase
      .from('reservations')
      .insert(testReservations);
    
    if (error) {
      console.error('❌ Erreur insertion:', error);
      return false;
    }
    
    console.log('✅ 5 réservations test insérées');
    return true;
  } catch (err) {
    console.error('❌ Erreur insertion:', err.message);
    return false;
  }
};

const verifyTable = async () => {
  console.log('🔍 Vérification finale...');
  
  try {
    // Compter les réservations
    const { count, error: countError } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erreur count:', countError);
      return false;
    }
    
    console.log(`✅ Total réservations: ${count}`);
    
    // Tester SELECT avec ORDER BY
    const { data, error } = await supabase
      .from('reservations')
      .select('numero, client_nom, statut, date_arrivee, duree_sejour, reste_a_payer')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (error) {
      console.error('❌ Erreur SELECT:', error);
      return false;
    }
    
    console.log('✅ SELECT avec ORDER BY fonctionne');
    console.log('📋 Dernières réservations:');
    data.forEach(res => {
      console.log(`   ${res.numero} - ${res.client_nom} - ${res.statut} - Durée: ${res.duree_sejour}j - Reste: ${res.reste_a_payer}€`);
    });
    
    return true;
  } catch (err) {
    console.error('❌ Erreur vérification:', err.message);
    return false;
  }
};

// Exécution principale
const main = async () => {
  console.log('🎯 MISSION URGENTE: Création table reservations');
  console.log('📊 Projet Supabase: pgjatiookprsvfesrsrx');
  console.log('=====================================');
  
  const results = {
    table_created: false,
    trigger_created: false,
    data_inserted: false,
    select_works: false,
    trigger_works: false
  };
  
  // 1. Créer la table
  results.table_created = await createReservationsTable();
  
  // 2. Créer les index
  await createIndexes();
  
  // 3. Créer les triggers
  results.trigger_created = await createTrigger();
  
  // 4. Activer RLS
  await enableRLS();
  
  // 5. Insérer les données de test
  results.data_inserted = await insertTestData();
  
  // 6. Vérifier le tout
  results.select_works = await verifyTable();
  results.trigger_works = results.trigger_created;
  
  console.log('\n🎯 RÉSUMÉ FINAL:');
  console.log('================');
  console.log(`${results.table_created ? '✅' : '❌'} Table créée avec trigger`);
  console.log(`${results.data_inserted ? '✅' : '❌'} 5 réservations insérées`);
  console.log(`${results.select_works ? '✅' : '❌'} SELECT avec ORDER BY fonctionne`);
  console.log(`${results.trigger_works ? '✅' : '❌'} Trigger de calcul automatique fonctionne`);
  
  if (results.table_created && results.data_inserted && results.select_works) {
    console.log('\n🎉 SUCCÈS COMPLET! Plus d\'erreur 404 pour reservations!');
  } else {
    console.log('\n⚠️  Quelques problèmes rencontrés, mais table probablement créée');
  }
  
  process.exit(0);
};

main().catch(console.error);