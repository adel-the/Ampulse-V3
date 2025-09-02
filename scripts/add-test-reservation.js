const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTestReservation() {
  console.log('🚀 Ajout d\'une réservation de test pour vérifier l\'affichage dynamique\n');
  console.log('=' .repeat(50));

  try {
    // 1. Récupérer les données nécessaires
    console.log('\n📋 Récupération des données de test...');
    
    // Récupérer un hôtel
    const { data: hotels, error: hotelError } = await supabase
      .from('hotels')
      .select('*')
      .limit(1)
      .single();
    
    if (hotelError) throw hotelError;
    console.log('✅ Hôtel trouvé:', hotels.nom);

    // Récupérer une chambre différente
    const { data: rooms, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', hotels.id);
    
    if (roomError) throw roomError;
    
    // Prendre une chambre différente ou la première disponible
    const room = rooms[rooms.length > 1 ? 1 : 0];
    console.log('✅ Chambre trouvée:', room.numero);

    // Récupérer un usager
    const { data: usager, error: usagerError } = await supabase
      .from('usagers')
      .select('*')
      .limit(1)
      .single();
    
    if (usagerError) throw usagerError;
    console.log('✅ Usager trouvé:', `${usager.nom} ${usager.prenom}`);

    // 2. Préparer les données de réservation avec des dates uniques
    const today = new Date();
    const randomDays = Math.floor(Math.random() * 60) + 10; // Entre 10 et 70 jours dans le futur
    const checkIn = new Date(today);
    checkIn.setDate(checkIn.getDate() + randomDays);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 5) + 1); // 1 à 5 nuits

    const reservationData = {
      hotel_id: hotels.id,
      chambre_id: room.id,
      usager_id: usager.id,
      date_arrivee: checkIn.toISOString().split('T')[0],
      date_depart: checkOut.toISOString().split('T')[0],
      adults_count: 1,
      children_count: 0,
      room_rate: room.prix || 50,
      total_amount: (room.prix || 50) * Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)),
      prix: room.prix || 50,
      duree: Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)),
      statut: 'confirmed',
      prescripteur: 'Test Prescripteur Dynamique',
      special_requests: `Test créé le ${new Date().toLocaleString('fr-FR')}`
    };

    console.log('\n📝 Données de la nouvelle réservation:');
    console.log(JSON.stringify(reservationData, null, 2));

    // 3. Créer la réservation
    console.log('\n🚀 Création de la réservation...');
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select('*')
      .single();

    if (reservationError) {
      console.error('❌ Erreur lors de la création:', reservationError);
      throw reservationError;
    }

    console.log('\n✅ SUCCÈS! Nouvelle réservation créée');
    console.log('📋 Détails:');
    console.log('- ID:', reservation.id);
    console.log('- Numéro:', reservation.reservation_number);
    console.log('- Dates:', `${reservation.date_arrivee} au ${reservation.date_depart}`);
    console.log('- Statut:', reservation.statut);

    // 4. Vérifier le nombre total de réservations
    const { data: allReservations, error: countError } = await supabase
      .from('reservations')
      .select('id', { count: 'exact' });

    if (!countError) {
      console.log(`\n📊 Nombre total de réservations dans la base: ${allReservations.length}`);
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Réservation de test ajoutée avec succès !');
    console.log('➡️  Rafraîchissez la page pour voir la nouvelle réservation');
    console.log('=' .repeat(50));

    return reservation;

  } catch (error) {
    console.error('\n❌ ERREUR PENDANT LE TEST:');
    console.error('Message:', error.message);
    if (error.details) {
      console.error('Détails:', error.details);
    }
    if (error.hint) {
      console.error('Hint:', error.hint);
    }
    process.exit(1);
  }
}

// Exécuter le test
addTestReservation()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });