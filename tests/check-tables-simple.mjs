import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Les variables d\'environnement Supabase ne sont pas configurées');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTablesSimple() {
  console.log('🔍 Vérification simple des tables...\n');

  const tablesToCheck = [
    { name: 'hotels', description: 'Table des hôtels' },
    { name: 'rooms', description: 'Table des chambres' },
    { name: 'room_categories', description: 'Catégories de chambres' },
    { name: 'equipment_assignments', description: 'Affectations d\'équipements' },
    { name: 'reservations', description: 'Réservations' },
    { name: 'conventions_prix', description: 'Conventions de prix' }
  ];

  for (const table of tablesToCheck) {
    try {
      console.log(`📋 ${table.description} (${table.name}):`);
      
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log(`  ❌ Table n'existe pas`);
        } else {
          console.log(`  ❌ Erreur: ${error.message}`);
        }
      } else {
        console.log(`  ✅ Table existe`);
        if (data && data.length > 0) {
          console.log(`  🔍 Colonnes trouvées: ${Object.keys(data[0]).join(', ')}`);
        } else {
          console.log(`  📊 Table vide`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Erreur: ${error.message}`);
    }
    console.log('');
  }

  // Test specific relationships that we expect
  console.log('🔗 Test des relations attendues:');
  
  // Test rooms -> hotels relationship
  try {
    const { data: roomsData, error: roomsError } = await supabase
      .from('rooms')
      .select('id, numero, hotel_id')
      .limit(3);

    if (!roomsError && roomsData) {
      console.log('  ✅ rooms.hotel_id existe');
      console.log(`     Exemple: ${roomsData.map(r => `Room ${r.numero} → Hotel ${r.hotel_id}`).join(', ')}`);
    } else {
      console.log('  ❌ rooms.hotel_id problème');
    }
  } catch (error) {
    console.log('  ❌ Erreur rooms:', error.message);
  }

  // Test reservations -> hotels relationship
  try {
    const { data: reservationsData, error: reservationsError } = await supabase
      .from('reservations')
      .select('id, hotel_id, chambre_id')
      .limit(3);

    if (!reservationsError && reservationsData) {
      console.log('  ✅ reservations.hotel_id existe');
      console.log(`     Exemple: ${reservationsData.map(r => `Reservation ${r.id} → Hotel ${r.hotel_id}, Room ${r.chambre_id}`).join(', ')}`);
    } else {
      console.log('  ❌ reservations.hotel_id problème');
    }
  } catch (error) {
    console.log('  ❌ Erreur reservations:', error.message);
  }
}

// Exécuter la vérification
checkTablesSimple().then(() => {
  console.log('\n✨ Vérification terminée');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});