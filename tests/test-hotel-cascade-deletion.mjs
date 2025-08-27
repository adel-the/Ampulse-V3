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

async function testHotelCascadeDeletion() {
  console.log('🧪 Test de la suppression en cascade d\'hôtels...\n');

  try {
    // 1. Créer un hôtel de test
    console.log('1️⃣ Création d\'un hôtel de test...');
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .insert({
        nom: 'Hôtel Test Suppression',
        adresse: '123 Rue de Test',
        ville: 'Test City',
        code_postal: '12345',
        statut: 'ACTIF',
        gestionnaire: 'Test Manager',
        chambres_total: 0,
        chambres_occupees: 0,
        taux_occupation: 0
      })
      .select()
      .single();

    if (hotelError) {
      console.error('❌ Erreur création hôtel:', hotelError);
      return;
    }

    console.log(`✅ Hôtel créé avec ID: ${hotel.id}`);

    // 2. Créer des chambres de test
    console.log('2️⃣ Création de chambres de test...');
    const roomsToCreate = [
      {
        hotel_id: hotel.id,
        numero: 'T001',
        prix: 50,
        statut: 'disponible',
        description: 'Chambre de test 1'
      },
      {
        hotel_id: hotel.id,
        numero: 'T002',
        prix: 60,
        statut: 'occupee',
        description: 'Chambre de test 2'
      }
    ];

    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .insert(roomsToCreate)
      .select();

    if (roomsError) {
      console.error('❌ Erreur création chambres:', roomsError);
      return;
    }

    console.log(`✅ ${rooms.length} chambres créées`);
    rooms.forEach(room => {
      console.log(`   - Chambre ${room.numero} (ID: ${room.id})`);
    });

    // 3. Tester la fonction preview_hotel_deletion
    console.log('3️⃣ Test de l\'aperçu de suppression...');
    const { data: preview, error: previewError } = await supabase
      .rpc('preview_hotel_deletion', {
        p_hotel_id: hotel.id
      });

    if (previewError) {
      console.error('❌ Erreur aperçu:', previewError);
      return;
    }

    const previewResult = preview[0];
    console.log(`✅ Aperçu de suppression:`);
    console.log(`   - Hôtel: ${previewResult.hotel_name}`);
    console.log(`   - Chambres: ${previewResult.rooms_count}`);
    console.log(`   - Réservations actives: ${previewResult.active_reservations_count}`);
    console.log(`   - Peut supprimer: ${previewResult.can_delete ? '✅ OUI' : '❌ NON'}`);
    console.log(`   - Message: ${previewResult.deletion_preview}`);

    // 4. Créer une réservation pour tester le blocage
    console.log('4️⃣ Création d\'une réservation pour tester le blocage...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        hotel_id: hotel.id,
        chambre_id: rooms[0].id,
        date_arrivee: tomorrow.toISOString().split('T')[0],
        date_depart: dayAfter.toISOString().split('T')[0],
        statut: 'confirmed',
        adults_count: 1,
        children_count: 0,
        room_rate: 50,
        total_amount: 50
      })
      .select()
      .single();

    if (reservationError) {
      console.error('❌ Erreur création réservation:', reservationError);
      return;
    }

    console.log(`✅ Réservation créée (ID: ${reservation.id})`);

    // 5. Tester à nouveau l'aperçu (devrait être bloqué)
    console.log('5️⃣ Test aperçu avec réservation active...');
    const { data: preview2, error: preview2Error } = await supabase
      .rpc('preview_hotel_deletion', {
        p_hotel_id: hotel.id
      });

    if (!preview2Error) {
      const previewResult2 = preview2[0];
      console.log(`✅ Aperçu mis à jour:`);
      console.log(`   - Réservations actives: ${previewResult2.active_reservations_count}`);
      console.log(`   - Peut supprimer: ${previewResult2.can_delete ? '✅ OUI' : '❌ NON'}`);
      console.log(`   - Message: ${previewResult2.deletion_preview}`);
    }

    // 6. Tenter la suppression (devrait échouer)
    console.log('6️⃣ Test suppression avec réservations (devrait échouer)...');
    const { data: deletion1, error: deletion1Error } = await supabase
      .rpc('safe_delete_hotel', {
        p_hotel_id: hotel.id
      });

    if (!deletion1Error) {
      const deletionResult = deletion1[0];
      console.log(`${deletionResult.success ? '✅' : '❌'} Suppression: ${deletionResult.message}`);
      if (!deletionResult.success) {
        console.log(`   - Réservations bloquantes: ${deletionResult.blocked_reservations}`);
      }
    }

    // 7. Supprimer la réservation
    console.log('7️⃣ Suppression de la réservation...');
    const { error: deleteReservationError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservation.id);

    if (!deleteReservationError) {
      console.log('✅ Réservation supprimée');
    }

    // 8. Tenter la suppression (devrait réussir)
    console.log('8️⃣ Test suppression sans réservations (devrait réussir)...');
    const { data: deletion2, error: deletion2Error } = await supabase
      .rpc('safe_delete_hotel', {
        p_hotel_id: hotel.id
      });

    if (!deletion2Error) {
      const deletionResult = deletion2[0];
      console.log(`${deletionResult.success ? '✅' : '❌'} Suppression: ${deletionResult.message}`);
      if (deletionResult.success) {
        console.log(`   - Chambres supprimées: ${deletionResult.affected_rooms}`);
      }
    }

    // 9. Vérifier que tout a été supprimé
    console.log('9️⃣ Vérification finale...');
    const { data: remainingRooms } = await supabase
      .from('rooms')
      .select('id')
      .eq('hotel_id', hotel.id);

    const { data: remainingHotel } = await supabase
      .from('hotels')
      .select('id')
      .eq('id', hotel.id);

    console.log(`✅ Verification:`);
    console.log(`   - Chambres restantes: ${remainingRooms?.length || 0}`);
    console.log(`   - Hôtel restant: ${remainingHotel?.length || 0}`);

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

// Exécuter le test
testHotelCascadeDeletion().then(() => {
  console.log('\n✨ Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});