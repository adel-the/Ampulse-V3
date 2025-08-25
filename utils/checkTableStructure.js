const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  try {
    console.log('🔍 Vérification de la structure des tables...\n');

    // Vérifier la structure de la table reservations
    console.log('📋 Structure de la table reservations:');
    const { data: reservationsStructure, error: reservationsError } = await supabase
      .rpc('get_table_columns', { table_name: 'reservations' });

    if (reservationsError) {
      console.log('❌ Impossible de récupérer la structure via RPC, tentative directe...');
      
      // Essayer de récupérer une ligne pour voir les colonnes disponibles
      const { data: sampleReservation, error: sampleError } = await supabase
        .from('reservations')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log('❌ Erreur lors de la récupération d\'un échantillon:', sampleError.message);
      } else {
        console.log('✅ Colonnes disponibles dans reservations:');
        if (sampleReservation && sampleReservation.length > 0) {
          Object.keys(sampleReservation[0]).forEach(col => {
            console.log(`   - ${col}`);
          });
        } else {
          console.log('   (table vide)');
        }
      }
    } else {
      console.log('✅ Colonnes de la table reservations:');
      reservationsStructure.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    // Vérifier la structure de la table usagers
    console.log('\n👥 Structure de la table usagers:');
    const { data: usagersStructure, error: usagersError } = await supabase
      .rpc('get_table_columns', { table_name: 'usagers' });

    if (usagersError) {
      const { data: sampleUsager, error: sampleError } = await supabase
        .from('usagers')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log('❌ Erreur lors de la récupération d\'un échantillon:', sampleError.message);
      } else {
        console.log('✅ Colonnes disponibles dans usagers:');
        if (sampleUsager && sampleUsager.length > 0) {
          Object.keys(sampleUsager[0]).forEach(col => {
            console.log(`   - ${col}`);
          });
        } else {
          console.log('   (table vide)');
        }
      }
    } else {
      console.log('✅ Colonnes de la table usagers:');
      usagersStructure.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    // Vérifier la structure de la table operateurs_sociaux
    console.log('\n🏢 Structure de la table operateurs_sociaux:');
    const { data: operateursStructure, error: operateursError } = await supabase
      .rpc('get_table_columns', { table_name: 'operateurs_sociaux' });

    if (operateursError) {
      const { data: sampleOperateur, error: sampleError } = await supabase
        .from('operateurs_sociaux')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log('❌ Erreur lors de la récupération d\'un échantillon:', sampleError.message);
      } else {
        console.log('✅ Colonnes disponibles dans operateurs_sociaux:');
        if (sampleOperateur && sampleOperateur.length > 0) {
          Object.keys(sampleOperateur[0]).forEach(col => {
            console.log(`   - ${col}`);
          });
        } else {
          console.log('   (table vide)');
        }
      }
    } else {
      console.log('✅ Colonnes de la table operateurs_sociaux:');
      operateursStructure.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    // Vérifier la structure de la table rooms
    console.log('\n🏠 Structure de la table rooms:');
    const { data: roomsStructure, error: roomsError } = await supabase
      .rpc('get_table_columns', { table_name: 'rooms' });

    if (roomsError) {
      const { data: sampleRoom, error: sampleError } = await supabase
        .from('rooms')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log('❌ Erreur lors de la récupération d\'un échantillon:', sampleError.message);
      } else {
        console.log('✅ Colonnes disponibles dans rooms:');
        if (sampleRoom && sampleRoom.length > 0) {
          Object.keys(sampleRoom[0]).forEach(col => {
            console.log(`   - ${col}`);
          });
        } else {
          console.log('   (table vide)');
        }
      }
    } else {
      console.log('✅ Colonnes de la table rooms:');
      roomsStructure.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    console.log('\n🎯 RÉSUMÉ:');
    console.log('Si des colonnes manquent, exécutez le script SQL dans Supabase Studio pour les ajouter.');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécuter le script
checkTableStructure(); 