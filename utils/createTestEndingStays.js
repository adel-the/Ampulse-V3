const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase (utilise les variables d'environnement ou les valeurs par défaut)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestEndingStays() {
  console.log('🏨 Création de données de test pour les fins de séjour...\n');

  try {
    // 1. Créer un hôtel de test
    console.log('📋 Création de l\'hôtel de test...');
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .insert({
        nom: 'Hôtel Test Fin de Séjour',
        adresse: '123 Rue de la Test',
        ville: 'Paris',
        code_postal: '75001',
        telephone: '01 23 45 67 89',
        email: 'test@hotel.com',
        gestionnaire: 'Jean Test',
        statut: 'ACTIF',
        chambres_total: 10,
        chambres_occupees: 3,
        taux_occupation: 30
      })
      .select()
      .single();

    if (hotelError) {
      console.error('❌ Erreur lors de la création de l\'hôtel:', hotelError);
      return;
    }

    console.log('✅ Hôtel créé:', hotel.nom);

    // 2. Créer des chambres de test
    console.log('🛏️ Création des chambres de test...');
    const rooms = [
      { numero: '101', type: 'Simple', prix: 80 },
      { numero: '102', type: 'Double', prix: 120 },
      { numero: '103', type: 'Simple', prix: 85 }
    ];

    const createdRooms = [];
    for (const room of rooms) {
      const { data: createdRoom, error: roomError } = await supabase
        .from('rooms')
        .insert({
          hotel_id: hotel.id,
          numero: room.numero,
          type: room.type,
          prix: room.prix,
          statut: 'occupee'
        })
        .select()
        .single();

      if (roomError) {
        console.error('❌ Erreur lors de la création de la chambre:', roomError);
        continue;
      }

      createdRooms.push(createdRoom);
      console.log('✅ Chambre créée:', createdRoom.numero);
    }

    // 3. Créer des usagers de test
    console.log('👥 Création des usagers de test...');
    const usagers = [
      { nom: 'Dupont', prenom: 'Marie', telephone: '06 12 34 56 78' },
      { nom: 'Martin', prenom: 'Pierre', telephone: '06 98 76 54 32' },
      { nom: 'Bernard', prenom: 'Sophie', telephone: '06 11 22 33 44' }
    ];

    const createdUsagers = [];
    for (const usager of usagers) {
      const { data: createdUsager, error: usagerError } = await supabase
        .from('usagers')
        .insert({
          nom: usager.nom,
          prenom: usager.prenom,
          telephone: usager.telephone,
          email: `${usager.prenom.toLowerCase()}.${usager.nom.toLowerCase()}@test.com`,
          adresse: 'Adresse de test',
          ville: 'Paris',
          code_postal: '75001'
        })
        .select()
        .single();

      if (usagerError) {
        console.error('❌ Erreur lors de la création de l\'usager:', usagerError);
        continue;
      }

      createdUsagers.push(createdUsager);
      console.log('✅ Usager créé:', `${createdUsager.prenom} ${createdUsager.nom}`);
    }

    // 4. Créer des réservations avec des fins de séjour variées
    console.log('📅 Création des réservations de test...');
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const reservations = [
      {
        usager_id: createdUsagers[0].id,
        chambre_id: createdRooms[0].id,
        hotel_id: hotel.id,
        date_arrivee: yesterday.toISOString().split('T')[0],
        date_depart: today.toISOString().split('T')[0], // Termine aujourd'hui
        statut: 'CONFIRMEE',
        prescripteur: 'SIAO 75',
        prix: 80,
        duree: 1,
        notes: 'Séjour qui se termine aujourd\'hui'
      },
      {
        usager_id: createdUsagers[1].id,
        chambre_id: createdRooms[1].id,
        hotel_id: hotel.id,
        date_arrivee: yesterday.toISOString().split('T')[0],
        date_depart: yesterday.toISOString().split('T')[0], // Déjà terminé
        statut: 'CONFIRMEE',
        prescripteur: 'Emmaüs',
        prix: 120,
        duree: 1,
        notes: 'Séjour déjà terminé hier'
      },
      {
        usager_id: createdUsagers[2].id,
        chambre_id: createdRooms[2].id,
        hotel_id: hotel.id,
        date_arrivee: today.toISOString().split('T')[0],
        date_depart: tomorrow.toISOString().split('T')[0], // Termine demain
        statut: 'CONFIRMEE',
        prescripteur: 'Secours Catholique',
        prix: 85,
        duree: 1,
        notes: 'Séjour qui se termine demain'
      }
    ];

    for (const reservation of reservations) {
      const { data: createdReservation, error: reservationError } = await supabase
        .from('reservations')
        .insert(reservation)
        .select()
        .single();

      if (reservationError) {
        console.error('❌ Erreur lors de la création de la réservation:', reservationError);
        continue;
      }

      console.log('✅ Réservation créée:', `Chambre ${createdRooms.find(r => r.id === reservation.chambre_id).numero} - Départ: ${reservation.date_depart}`);
    }

    console.log('\n🎉 Données de test créées avec succès !');
    console.log('\n📊 Résumé des réservations créées :');
    console.log('- 1 réservation qui se termine aujourd\'hui');
    console.log('- 1 réservation déjà terminée hier');
    console.log('- 1 réservation qui se termine demain');
    console.log('\n🔍 Vous pouvez maintenant tester l\'alerte de fin de séjour sur le tableau de bord !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
createTestEndingStays();
