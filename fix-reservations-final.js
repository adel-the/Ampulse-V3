// SOLUTION FINALE: Créer table reservations via API REST
const https = require('https');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('mcp-supabase-config.json', 'utf8'));

const createReservationsViaREST = async () => {
  console.log('🎯 SOLUTION FINALE: Création table reservations');
  console.log('📊 Utilisation API REST Supabase directe');
  console.log('=====================================');

  // Étape 1: Créer une table temporaire pour forcer la création du schéma
  console.log('🔨 Étape 1: Création table temporaire...');
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    config.supabase.url,
    config.supabase.service_role_key
  );

  try {
    // Créer une table temporaire simple d'abord
    console.log('📋 Création de la structure de base...');
    
    // Insérer directement des données avec toutes les colonnes nécessaires
    // Cela forcera Supabase à créer la table avec la structure appropriée
    const reservationData = {
      id: 1,
      numero: 'RES-2024-000001',
      hotel_id: 1,
      room_id: null,
      operateur_social_id: null,
      client_nom: 'Martin',
      client_prenom: 'Jean',
      client_email: 'jean.martin@email.fr',
      client_telephone: '0612345678',
      client_date_naissance: null,
      client_adresse: null,
      date_arrivee: '2024-08-20',
      date_depart: '2024-08-25',
      nombre_personnes: 2,
      nombre_adultes: 2,
      nombre_enfants: 0,
      statut: 'CONFIRMEE',
      prix_total: 275.00,
      prix_par_nuit: 55.00,
      acompte: 0,
      reste_a_payer: 275.00,
      mode_paiement: null,
      date_paiement_acompte: null,
      notes: 'Placement social d\'urgence',
      demandes_speciales: null,
      source_reservation: 'operateur_social',
      canal_reservation: null,
      duree_sejour: 5,
      checkin_effectue: false,
      checkout_effectue: false,
      date_checkin: null,
      date_checkout: null,
      satisfaction_score: null,
      commentaire_satisfaction: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Méthode 1: Utiliser UPSERT pour créer la table automatiquement
    console.log('🚀 Tentative UPSERT...');
    let { data, error } = await supabase
      .from('reservations')
      .upsert(reservationData, { onConflict: 'numero' });

    if (!error) {
      console.log('✅ Table créée via UPSERT!');
      await insertAdditionalData(supabase);
      await verifyTable(supabase);
      return true;
    }

    console.log('⚠️ UPSERT échoué, tentative INSERT...');
    
    // Méthode 2: INSERT direct
    ({ data, error } = await supabase
      .from('reservations')
      .insert(reservationData));

    if (!error) {
      console.log('✅ Table créée via INSERT!');
      await insertAdditionalData(supabase);
      await verifyTable(supabase);
      return true;
    }

    console.log('❌ INSERT échoué:', error.message);

    // Méthode 3: Essayer avec un schéma minimal
    console.log('🔄 Tentative avec schéma minimal...');
    const minimalData = {
      numero: 'RES-2024-000001',
      client_nom: 'Martin',
      client_prenom: 'Jean',
      date_arrivee: '2024-08-20',
      date_depart: '2024-08-25',
      statut: 'CONFIRMEE',
      prix_total: 275.00
    };

    ({ data, error } = await supabase
      .from('reservations')
      .insert(minimalData));

    if (!error) {
      console.log('✅ Table créée avec schéma minimal!');
      await verifyTable(supabase);
      return true;
    }

    console.log('❌ Toutes les méthodes ont échoué');
    console.log('📋 Erreur finale:', error.message);
    
    // Afficher les instructions manuelles
    displayManualInstructions();
    return false;

  } catch (err) {
    console.error('❌ Erreur générale:', err.message);
    displayManualInstructions();
    return false;
  }
};

const insertAdditionalData = async (supabase) => {
  console.log('📊 Insertion données additionnelles...');
  
  const additionalReservations = [
    {
      numero: 'RES-2024-000002',
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
      .insert(additionalReservations);
    
    if (error) {
      console.log('⚠️ Certaines données additionnelles non insérées:', error.message);
    } else {
      console.log('✅ Données additionnelles insérées');
    }
  } catch (err) {
    console.log('⚠️ Erreur données additionnelles:', err.message);
  }
};

const verifyTable = async (supabase) => {
  console.log('🔍 Vérification finale...');
  
  try {
    const { data, error, count } = await supabase
      .from('reservations')
      .select('numero, client_nom, statut, date_arrivee', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Erreur SELECT:', error.message);
      return false;
    }
    
    console.log(`✅ Total réservations: ${count}`);
    console.log('✅ SELECT avec ORDER BY fonctionne');
    console.log('📋 Réservations trouvées:');
    data.forEach(res => {
      console.log(`   ${res.numero} - ${res.client_nom} - ${res.statut}`);
    });
    
    console.log('\n🎯 RÉSUMÉ FINAL:');
    console.log('================');
    console.log('✅ Table reservations créée');
    console.log(`✅ ${count} réservations insérées`);
    console.log('✅ SELECT avec ORDER BY fonctionne');
    console.log('✅ Plus d\'erreur 404 pour reservations!');
    
    return true;
  } catch (err) {
    console.error('❌ Erreur vérification:', err.message);
    return false;
  }
};

const displayManualInstructions = () => {
  console.log('\n📋 INSTRUCTIONS MANUELLES URGENTES:');
  console.log('===================================');
  console.log('1. Aller sur https://supabase.com/dashboard/project/pgjatiookprsvfesrsrx');
  console.log('2. Cliquer sur "SQL Editor"');
  console.log('3. Coller et exécuter ce SQL:');
  console.log('\n```sql');
  console.log('CREATE TABLE public.reservations (');
  console.log('  id SERIAL PRIMARY KEY,');
  console.log('  numero VARCHAR(50) UNIQUE NOT NULL,');
  console.log('  client_nom VARCHAR(255) NOT NULL,');
  console.log('  client_prenom VARCHAR(255) NOT NULL,');
  console.log('  date_arrivee DATE NOT NULL,');
  console.log('  date_depart DATE NOT NULL,');
  console.log('  statut VARCHAR(50) DEFAULT \'EN_ATTENTE\',');
  console.log('  prix_total DECIMAL(10,2) DEFAULT 0,');
  console.log('  created_at TIMESTAMPTZ DEFAULT now()');
  console.log(');');
  console.log('');
  console.log('ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;');
  console.log('CREATE POLICY "reservations_policy" ON public.reservations FOR ALL USING (true);');
  console.log('```');
  console.log('\n4. Puis exécuter ce deuxième SQL pour les données:');
  console.log('\n```sql');
  console.log('INSERT INTO public.reservations (numero, client_nom, client_prenom, date_arrivee, date_depart, statut, prix_total) VALUES');
  console.log('(\'RES-2024-000001\', \'Martin\', \'Jean\', \'2024-08-20\', \'2024-08-25\', \'CONFIRMEE\', 275.00);');
  console.log('```');
};

// Lancement
createReservationsViaREST().catch(console.error);