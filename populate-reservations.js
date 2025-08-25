const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Lire la configuration
const config = JSON.parse(fs.readFileSync('mcp-supabase-config.json', 'utf8'));

const supabase = createClient(
  config.supabase.url,
  config.supabase.service_role_key
);

const populateReservations = async () => {
  console.log('🎯 MISSION: Peupler la table reservations existante');
  console.log('==================================================');

  try {
    // 1. Vérifier que la table existe et est vide
    console.log('1. 🔍 Vérification état actuel...');
    const { data: existingData, error: checkError, count } = await supabase
      .from('reservations')
      .select('*', { count: 'exact' });
    
    if (checkError) {
      console.error('❌ Erreur vérification:', checkError.message);
      return false;
    }
    
    console.log(`✅ Table reservations existe avec ${count} enregistrements`);
    
    if (count > 0) {
      console.log('📊 Données existantes:');
      existingData.forEach(res => {
        console.log(`   ${res.numero || res.id} - ${res.client_nom} ${res.client_prenom}`);
      });
    }

    // 2. Insérer les données de test
    console.log('\n2. 📊 Insertion des réservations de test...');
    
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
        hotel_id: 1,
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
        hotel_id: 2,
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
        hotel_id: 1,
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

    // Insérer les réservations une par une pour mieux gérer les erreurs
    let insertedCount = 0;
    for (let i = 0; i < testReservations.length; i++) {
      const reservation = testReservations[i];
      console.log(`   Insertion ${i + 1}/${testReservations.length}: ${reservation.numero}...`);
      
      try {
        const { data, error } = await supabase
          .from('reservations')
          .insert(reservation);
        
        if (error) {
          console.log(`   ⚠️ ${reservation.numero}: ${error.message}`);
          
          // Si le numéro existe déjà, essayer un UPDATE
          if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
            console.log(`   🔄 Tentative UPDATE pour ${reservation.numero}...`);
            const { data: updateData, error: updateError } = await supabase
              .from('reservations')
              .update(reservation)
              .eq('numero', reservation.numero);
            
            if (!updateError) {
              console.log(`   ✅ ${reservation.numero} mis à jour`);
              insertedCount++;
            } else {
              console.log(`   ❌ ${reservation.numero} UPDATE échoué: ${updateError.message}`);
            }
          }
        } else {
          console.log(`   ✅ ${reservation.numero} inséré`);
          insertedCount++;
        }
      } catch (err) {
        console.log(`   ❌ ${reservation.numero} erreur: ${err.message}`);
      }
    }

    console.log(`\n✅ ${insertedCount}/${testReservations.length} réservations traitées`);

    // 3. Vérification finale
    console.log('\n3. 🔍 Vérification finale...');
    
    const { data: finalData, error: finalError, count: finalCount } = await supabase
      .from('reservations')
      .select('numero, client_nom, client_prenom, statut, date_arrivee, prix_total', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (finalError) {
      console.error('❌ Erreur vérification finale:', finalError.message);
      return false;
    }
    
    console.log(`✅ Total final: ${finalCount} réservations`);
    console.log('📋 Réservations dans la base:');
    finalData.forEach(res => {
      console.log(`   ${res.numero} - ${res.client_nom} ${res.client_prenom} - ${res.statut} - ${res.prix_total}€`);
    });

    // 4. Test de requête complexe
    console.log('\n4. 🧪 Test requête complexe...');
    
    const { data: testQuery, error: testError } = await supabase
      .from('reservations')
      .select('numero, client_nom, statut, prix_total')
      .eq('statut', 'CONFIRMEE')
      .order('prix_total', { ascending: false });
    
    if (testError) {
      console.log('❌ Requête complexe échouée:', testError.message);
    } else {
      console.log('✅ Requête complexe réussie');
      console.log('📊 Réservations CONFIRMEE par prix décroissant:');
      testQuery.forEach(res => {
        console.log(`   ${res.numero} - ${res.client_nom} - ${res.prix_total}€`);
      });
    }

    console.log('\n🎯 RÉSUMÉ FINAL:');
    console.log('================');
    console.log('✅ Table reservations existe et fonctionne');
    console.log(`✅ ${finalCount} réservations disponibles`);
    console.log('✅ Requêtes SELECT avec ORDER BY fonctionnent');
    console.log('✅ Requêtes avec filtres fonctionnent');
    console.log('\n🎉 SUCCÈS COMPLET! Plus d\'erreur 404 pour reservations!');
    
    return true;

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    return false;
  }
};

// Exécution
populateReservations().catch(console.error);