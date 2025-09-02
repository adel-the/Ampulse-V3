const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkReservationColumns() {
  console.log('📋 Vérification des colonnes de la table reservations...\n');

  try {
    // Récupérer une ligne pour voir les colonnes
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erreur:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('Colonnes disponibles dans la table reservations:');
      console.log('-'.repeat(50));
      Object.keys(data[0]).forEach(col => {
        console.log(`- ${col}: ${typeof data[0][col]} (${data[0][col] === null ? 'null' : 'valeur présente'})`);
      });
    } else {
      // Si pas de données, créer une réservation minimale pour voir les colonnes
      console.log('Aucune réservation trouvée. Test d\'insertion minimale...\n');
      
      const testData = {
        hotel_id: 1,
        chambre_id: 1,
        usager_id: 1,
        date_arrivee: '2025-09-02',
        date_depart: '2025-09-03',
        prescripteur: 'Test',
        prix: 50
      };

      const { data: inserted, error: insertError } = await supabase
        .from('reservations')
        .insert(testData)
        .select('*')
        .single();

      if (insertError) {
        console.error('Erreur lors de l\'insertion de test:', insertError);
        console.log('\nChamps tentés:', Object.keys(testData));
        console.log('\nMessage d\'erreur complet:', JSON.stringify(insertError, null, 2));
      } else {
        console.log('Colonnes disponibles après insertion:');
        console.log('-'.repeat(50));
        Object.keys(inserted).forEach(col => {
          console.log(`- ${col}: ${typeof inserted[col]}`);
        });

        // Supprimer la réservation de test
        await supabase.from('reservations').delete().eq('id', inserted.id);
        console.log('\n✅ Réservation de test supprimée');
      }
    }
  } catch (err) {
    console.error('Erreur inattendue:', err);
  }
}

checkReservationColumns();