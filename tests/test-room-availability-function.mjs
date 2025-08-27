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

async function testRoomAvailabilityFunction() {
  console.log('🔍 Test de la fonction get_available_rooms_with_details...\n');

  // Dates de test
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const dateDebut = today.toISOString().split('T')[0];
  const dateFin = nextWeek.toISOString().split('T')[0];

  console.log(`📅 Période de recherche: ${dateDebut} → ${dateFin}`);

  try {
    // Test 1: Appel simple avec dates uniquement
    console.log('\n1️⃣ Test avec dates uniquement...');
    const { data: data1, error: error1 } = await supabase
      .rpc('get_available_rooms_with_details', {
        p_date_debut: dateDebut,
        p_date_fin: dateFin
      });

    if (error1) {
      console.error('❌ Erreur:', error1);
    } else {
      console.log(`✅ Succès! ${data1?.length || 0} chambres trouvées`);
      if (data1 && data1.length > 0) {
        console.log('Première chambre:', data1[0]);
      }
    }

    // Test 2: Appel avec tous les paramètres null
    console.log('\n2️⃣ Test avec paramètres null/vides...');
    const { data: data2, error: error2 } = await supabase
      .rpc('get_available_rooms_with_details', {
        p_date_debut: dateDebut,
        p_date_fin: dateFin,
        p_hotel_id: null,
        p_room_type: null,
        p_capacity: null,
        p_characteristic: null,
        p_room_number: null,
        p_rental_mode: 'night'
      });

    if (error2) {
      console.error('❌ Erreur:', error2);
    } else {
      console.log(`✅ Succès! ${data2?.length || 0} chambres trouvées`);
    }

    // Test 3: Vérifier les chambres dans la table rooms
    console.log('\n3️⃣ Vérification directe de la table rooms...');
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .limit(10);

    if (roomsError) {
      console.error('❌ Erreur rooms:', roomsError);
    } else {
      console.log(`✅ ${rooms?.length || 0} chambres dans la base de données`);
      if (rooms && rooms.length > 0) {
        console.log('Chambres existantes:', rooms.map(r => ({
          id: r.id,
          numero: r.numero,
          hotel_id: r.hotel_id,
          statut: r.statut
        })));
      }
    }

    // Test 4: Vérifier les hôtels
    console.log('\n4️⃣ Vérification des hôtels...');
    const { data: hotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('id, nom, chambres_total');

    if (hotelsError) {
      console.error('❌ Erreur hotels:', hotelsError);
    } else {
      console.log(`✅ ${hotels?.length || 0} hôtels trouvés`);
      if (hotels && hotels.length > 0) {
        const totalRooms = hotels.reduce((sum, h) => sum + (h.chambres_total || 0), 0);
        console.log(`Total chambres déclarées dans hotels: ${totalRooms}`);
        hotels.forEach(h => {
          console.log(`  - ${h.nom}: ${h.chambres_total || 0} chambres`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

// Exécuter le test
testRoomAvailabilityFunction().then(() => {
  console.log('\n✨ Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});