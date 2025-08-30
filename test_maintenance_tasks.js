// Test script for maintenance tasks system
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:15421';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMaintenanceTasks() {
  console.log('🧪 Testing Maintenance Tasks System...\n');

  try {
    // 0. First, get or create a test user
    console.log('0. Getting existing user...');
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    let testUserId = null;
    
    if (existingUser?.users?.length > 0) {
      testUserId = existingUser.users[0].id;
      console.log(`✅ Found existing user: ${testUserId}`);
    } else {
      // Create a test user
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email: 'test@maintenance.com',
        password: 'testpassword123',
        email_confirm: true
      });
      
      if (userError) {
        console.log('⚠️ Could not create user, using null for testing');
        // For testing purposes, let's disable the FK constraint temporarily
        testUserId = null;
      } else {
        testUserId = newUser.user.id;
        console.log(`✅ Created test user: ${testUserId}`);
      }
    }

    // 1. Get existing hotels and rooms
    console.log('1. Fetching hotels and rooms...');
    const { data: hotels } = await supabase
      .from('hotels')
      .select('id, nom')
      .limit(1);
    
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id, numero, hotel_id')
      .limit(3);

    if (!hotels?.length || !rooms?.length) {
      console.log('❌ No hotels or rooms found. Creating test data first...');
      
      // Create a test hotel
      const { data: newHotel, error: hotelError } = await supabase
        .from('hotels')
        .insert({
          nom: 'Hôtel Test Maintenance',
          adresse: '123 Rue Test',
          ville: 'Paris',
          code_postal: '75001',
          user_owner_id: testUserId // Use actual test user ID
        })
        .select()
        .single();

      if (hotelError) {
        console.error('Error creating hotel:', hotelError);
        return;
      }

      // Create test rooms
      const { data: newRooms, error: roomsError } = await supabase
        .from('rooms')
        .insert([
          {
            numero: '101',
            type: 'Standard',
            prix: 50.00,
            statut: 'maintenance',
            hotel_id: newHotel.id
          },
          {
            numero: '102',
            type: 'Standard',
            prix: 50.00,
            statut: 'disponible',
            hotel_id: newHotel.id
          }
        ])
        .select();

      if (roomsError) {
        console.error('Error creating rooms:', roomsError);
        return;
      }

      hotels.push(newHotel);
      rooms.push(...newRooms);
    }

    console.log(`✅ Found ${hotels.length} hotel(s) and ${rooms.length} room(s)`);
    console.log(`📋 Using hotel: ${hotels[0].nom} (ID: ${hotels[0].id})`);
    console.log(`🏨 Using rooms: ${rooms.map(r => r.numero).join(', ')}\n`);

    // 2. Create test maintenance tasks
    console.log('2. Creating test maintenance tasks...');
    
    const testTasks = [
      {
        titre: 'Réparer climatisation chambre 101',
        description: 'La climatisation ne fonctionne plus, température non régulée',
        priorite: 'haute',
        responsable: 'Jean Dupont',
        date_echeance: '2024-12-15',
        notes: 'Prévoir remplacement du compresseur',
        statut: 'en_attente',
        room_id: rooms[0].id,
        hotel_id: hotels[0].id,
        user_owner_id: testUserId
      },
      {
        titre: 'Changer ampoules couloir',
        description: 'Plusieurs ampoules grillées dans le couloir du 1er étage',
        priorite: 'moyenne',
        responsable: 'Marie Martin',
        date_echeance: '2024-12-10',
        notes: 'Prévoir ampoules LED économiques',
        statut: 'en_cours',
        room_id: rooms[1]?.id || rooms[0].id,
        hotel_id: hotels[0].id,
        user_owner_id: testUserId
      },
      {
        titre: 'Maintenance plomberie salle de bain',
        description: 'Fuite détectée sous le lavabo',
        priorite: 'urgente',
        responsable: 'Pierre Bernard',
        date_echeance: '2024-12-08',
        notes: 'Intervention urgente requise',
        statut: 'en_attente',
        room_id: rooms[0].id,
        hotel_id: hotels[0].id,
        user_owner_id: testUserId
      }
    ];

    const { data: createdTasks, error: createError } = await supabase
      .from('maintenance_tasks')
      .insert(testTasks)
      .select(`
        id,
        titre,
        description,
        priorite,
        statut,
        responsable,
        date_echeance,
        created_at,
        room:rooms(numero),
        hotel:hotels(nom)
      `);

    if (createError) {
      console.error('❌ Error creating tasks:', createError);
      return;
    }

    console.log(`✅ Created ${createdTasks.length} test tasks:\n`);
    createdTasks.forEach((task, i) => {
      console.log(`   ${i + 1}. ${task.titre}`);
      console.log(`      📍 Chambre ${task.room.numero} - ${task.hotel.nom}`);
      console.log(`      🎯 Priorité: ${task.priorite} | Statut: ${task.statut}`);
      console.log(`      👤 Responsable: ${task.responsable}`);
      console.log(`      📅 Échéance: ${task.date_echeance}`);
      console.log(`      🕐 Créé: ${new Date(task.created_at).toLocaleString('fr-FR')}\n`);
    });

    // 3. Test reading tasks
    console.log('3. Testing task retrieval...');
    const { data: allTasks, error: fetchError } = await supabase
      .from('maintenance_tasks')
      .select(`
        id,
        titre,
        priorite,
        statut,
        room:rooms(numero),
        hotel:hotels(nom)
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching tasks:', fetchError);
      return;
    }

    console.log(`✅ Retrieved ${allTasks.length} tasks from database\n`);

    // 4. Test updating a task
    console.log('4. Testing task update...');
    if (createdTasks.length > 0) {
      const taskToUpdate = createdTasks[0];
      const { data: updatedTask, error: updateError } = await supabase
        .from('maintenance_tasks')
        .update({ 
          statut: 'en_cours',
          notes: 'Technicien assigné, intervention prévue demain'
        })
        .eq('id', taskToUpdate.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating task:', updateError);
        return;
      }

      console.log(`✅ Updated task "${taskToUpdate.titre}" to status "en_cours"\n`);
    }

    // 5. Test statistics
    console.log('5. Testing task statistics...');
    const { data: stats } = await supabase
      .from('maintenance_tasks')
      .select('statut, priorite');

    const statCounts = stats.reduce((acc, task) => {
      acc.byStatus[task.statut] = (acc.byStatus[task.statut] || 0) + 1;
      acc.byPriority[task.priorite] = (acc.byPriority[task.priorite] || 0) + 1;
      return acc;
    }, { byStatus: {}, byPriority: {} });

    console.log('📊 Task Statistics:');
    console.log('   Par statut:', JSON.stringify(statCounts.byStatus, null, 2));
    console.log('   Par priorité:', JSON.stringify(statCounts.byPriority, null, 2));

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n🌐 You can now test the UI at: http://localhost:3002');
    console.log('📊 Database Studio: http://127.0.0.1:15433/project/default/editor');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMaintenanceTasks().catch(console.error);