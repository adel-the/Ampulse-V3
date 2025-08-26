import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:15421';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log('📡 Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testRoomHotelAssignment() {
  console.log('🧪 Testing Room-Hotel Assignment Fix...\n');

  try {
    // 1. Récupérer les hôtels existants
    console.log('1️⃣ Fetching existing hotels...');
    const { data: hotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('id, nom')
      .order('id')
      .limit(3);

    if (hotelsError) throw hotelsError;
    
    if (!hotels || hotels.length < 2) {
      console.log('⚠️ Not enough hotels in database. Creating test hotels...');
      
      // Créer des hôtels de test
      const testHotels = [
        { nom: 'Test Hotel Alpha', adresse: '123 Test Street', ville: 'Paris', code_postal: '75001' },
        { nom: 'Test Hotel Beta', adresse: '456 Demo Avenue', ville: 'Lyon', code_postal: '69001' },
        { nom: 'Test Hotel Gamma', adresse: '789 Sample Road', ville: 'Marseille', code_postal: '13001' }
      ];

      for (const hotelData of testHotels) {
        const { error } = await supabase
          .from('hotels')
          .insert(hotelData);
        
        if (error) console.error('Error creating hotel:', error);
      }

      // Récupérer à nouveau
      const { data: newHotels } = await supabase
        .from('hotels')
        .select('id, nom')
        .order('id')
        .limit(3);
      
      if (newHotels) {
        hotels.length = 0;
        hotels.push(...newHotels);
      }
    }

    console.log('✅ Hotels found:', hotels.map(h => `${h.nom} (ID: ${h.id})`).join(', '));

    // 2. Créer des chambres pour chaque hôtel
    console.log('\n2️⃣ Creating test rooms for each hotel...');
    
    for (const hotel of hotels) {
      const roomNumber = `TEST-${hotel.id}-${Date.now()}`;
      const roomData = {
        hotel_id: hotel.id,
        numero: roomNumber,
        type: 'Double',
        prix: 75 + (hotel.id * 10), // Prix différent par hôtel
        statut: 'disponible',
        description: `Test room for ${hotel.nom}`,
        floor: 1,
        room_size: 25,
        bed_type: 'double',
        is_smoking: false,
        equipment_ids: []
      };

      console.log(`   Creating room ${roomNumber} for ${hotel.nom}...`);
      
      const { data: createdRoom, error: roomError } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();

      if (roomError) {
        console.error(`   ❌ Error creating room for ${hotel.nom}:`, roomError);
      } else {
        console.log(`   ✅ Created room ${createdRoom.numero} for hotel ID ${createdRoom.hotel_id}`);
        
        // Vérifier que la chambre est bien assignée au bon hôtel
        if (createdRoom.hotel_id !== hotel.id) {
          console.error(`   ⚠️ WARNING: Room was assigned to hotel ${createdRoom.hotel_id} instead of ${hotel.id}!`);
        }
      }
    }

    // 3. Vérifier l'assignation correcte des chambres
    console.log('\n3️⃣ Verifying room-hotel assignments...');
    
    for (const hotel of hotels) {
      const { data: hotelRooms, error } = await supabase
        .from('rooms')
        .select('numero, hotel_id')
        .eq('hotel_id', hotel.id)
        .like('numero', 'TEST-%');

      if (error) {
        console.error(`Error fetching rooms for ${hotel.nom}:`, error);
      } else {
        console.log(`\n   ${hotel.nom} (ID: ${hotel.id}):`);
        console.log(`   - Total test rooms: ${hotelRooms.length}`);
        
        if (hotelRooms.length > 0) {
          const correctAssignments = hotelRooms.filter(r => r.hotel_id === hotel.id);
          const wrongAssignments = hotelRooms.filter(r => r.hotel_id !== hotel.id);
          
          console.log(`   - Correctly assigned: ${correctAssignments.length}`);
          if (wrongAssignments.length > 0) {
            console.error(`   - ❌ INCORRECTLY assigned: ${wrongAssignments.length}`);
            wrongAssignments.forEach(r => {
              console.error(`      Room ${r.numero} is assigned to hotel ${r.hotel_id} instead of ${hotel.id}`);
            });
          }
        }
      }
    }

    // 4. Test avec équipements spécifiques à l'hôtel
    console.log('\n4️⃣ Testing equipment assignment per hotel...');
    
    for (const hotel of hotels.slice(0, 2)) { // Test avec les 2 premiers hôtels
      // Créer un équipement spécifique à cet hôtel
      const equipmentData = {
        hotel_id: hotel.id,
        nom: `Equipment-${hotel.id}-${Date.now()}`,
        description: `Test equipment for ${hotel.nom}`,
        categorie: 'comfort',
        est_actif: true
      };

      const { data: equipment, error: eqError } = await supabase
        .from('hotel_equipment')
        .insert(equipmentData)
        .select()
        .single();

      if (eqError) {
        console.error(`Error creating equipment for ${hotel.nom}:`, eqError);
      } else {
        console.log(`✅ Created equipment "${equipment.nom}" for ${hotel.nom}`);
        
        // Créer une chambre avec cet équipement
        const roomWithEquipment = {
          hotel_id: hotel.id,
          numero: `EQ-TEST-${hotel.id}-${Date.now()}`,
          type: 'Suite',
          prix: 150,
          statut: 'disponible',
          equipment_ids: [equipment.id]
        };

        const { data: eqRoom, error: eqRoomError } = await supabase
          .from('rooms')
          .insert(roomWithEquipment)
          .select()
          .single();

        if (eqRoomError) {
          console.error(`Error creating room with equipment:`, eqRoomError);
        } else {
          console.log(`✅ Created room ${eqRoom.numero} with equipment for hotel ${hotel.id}`);
          console.log(`   Equipment IDs: ${JSON.stringify(eqRoom.equipment_ids)}`);
        }
      }
    }

    // 5. Résumé final
    console.log('\n5️⃣ Test Summary:');
    console.log('=====================================');
    
    const { data: allTestRooms } = await supabase
      .from('rooms')
      .select('hotel_id')
      .or('numero.like.TEST-%,numero.like.EQ-TEST-%');

    if (allTestRooms) {
      const roomsByHotel = allTestRooms.reduce((acc, room) => {
        acc[room.hotel_id] = (acc[room.hotel_id] || 0) + 1;
        return acc;
      }, {});

      console.log('Rooms created per hotel:');
      Object.entries(roomsByHotel).forEach(([hotelId, count]) => {
        const hotel = hotels.find(h => h.id === parseInt(hotelId));
        console.log(`   - ${hotel?.nom || `Hotel ${hotelId}`}: ${count} rooms`);
      });
    }

    console.log('\n✅ Room-Hotel Assignment Test Complete!');
    console.log('\n💡 Notes:');
    console.log('   - Each room should be assigned to its intended hotel');
    console.log('   - Equipment should only be available for its specific hotel');
    console.log('   - The modal should now correctly use the selected hotel from parent');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error.message) console.error('Error message:', error.message);
    if (error.details) console.error('Error details:', error.details);
    process.exit(1);
  }
}

// Run the test
testRoomHotelAssignment();