import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

console.log('🔍 DEBUGGING MAINTENANCE TASKS - DETAILED ANALYSIS');
console.log('=' .repeat(60));

async function debugMaintenanceTasks() {
  try {
    // 1. Check if maintenance_tasks table exists and count total records
    console.log('\n1️⃣ CHECKING MAINTENANCE_TASKS TABLE:');
    const { data: allTasks, error: allTasksError, count } = await supabase
      .from('maintenance_tasks')
      .select('*', { count: 'exact' });
    
    if (allTasksError) {
      console.error('❌ Error querying maintenance_tasks:', allTasksError);
      return;
    }
    
    console.log(`✅ Total maintenance tasks in database: ${count}`);
    
    if (allTasks && allTasks.length > 0) {
      console.log('\n📋 SAMPLE TASKS (first 3):');
      allTasks.slice(0, 3).forEach((task, index) => {
        console.log(`\nTask ${index + 1}:`);
        console.log(`  - ID: ${task.id}`);
        console.log(`  - Title: ${task.title}`);
        console.log(`  - Status: ${task.status}`);
        console.log(`  - Priority: ${task.priority}`);
        console.log(`  - Hotel ID: ${task.hotel_id}`);
        console.log(`  - Room ID: ${task.room_id || 'null'}`);
        console.log(`  - Created: ${task.created_at}`);
        console.log(`  - Due: ${task.due_date || 'null'}`);
      });
    }

    // 2. Check hotels table to understand hotel_id values
    console.log('\n\n2️⃣ CHECKING HOTELS TABLE:');
    const { data: hotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('id, nom');
    
    if (hotelsError) {
      console.error('❌ Error querying hotels:', hotelsError);
    } else {
      console.log(`✅ Hotels in database: ${hotels.length}`);
      hotels.forEach(hotel => {
        console.log(`  - Hotel ${hotel.id}: ${hotel.nom}`);
      });
    }

    // 3. Check maintenance tasks by hotel_id (simplified count)
    console.log('\n\n3️⃣ TASKS BY HOTEL_ID:');
    const { data: hotel1Tasks, error: hotel1Error } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .eq('hotel_id', 1);
    
    if (hotel1Error) {
      console.error('❌ Error querying hotel 1 tasks:', hotel1Error);
    } else {
      console.log(`✅ Hotel 1 tasks: ${hotel1Tasks.length}`);
      
      // Show the full structure of first task to understand the schema
      if (hotel1Tasks.length > 0) {
        console.log('\n🔍 FULL STRUCTURE OF FIRST TASK:');
        console.log('Available columns:', Object.keys(hotel1Tasks[0]));
        console.log('Full task data:');
        console.log(JSON.stringify(hotel1Tasks[0], null, 2));
      }
    }

    // 4. Check RLS policies on maintenance_tasks
    console.log('\n\n4️⃣ CHECKING RLS POLICIES:');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'maintenance_tasks' })
      .select('*');
    
    if (policiesError) {
      console.log('ℹ️ Could not check RLS policies (this is normal if function doesn\'t exist)');
    } else {
      console.log(`✅ RLS Policies found: ${policies ? policies.length : 0}`);
    }

    // 5. Test query similar to what the frontend would use
    console.log('\n\n5️⃣ TESTING FRONTEND-LIKE QUERY:');
    
    // Get the first hotel ID to test with
    const firstHotelId = hotels && hotels.length > 0 ? hotels[0].id : null;
    
    if (firstHotelId) {
      console.log(`Testing with hotel_id: ${firstHotelId}`);
      
      const { data: frontendTest, error: frontendError } = await supabase
        .from('maintenance_tasks')
        .select(`
          *,
          room:rooms(id, numero, type),
          assigned_user:users(id, email, nom, prenom)
        `)
        .eq('hotel_id', firstHotelId)
        .order('created_at', { ascending: false });
      
      if (frontendError) {
        console.error('❌ Frontend-like query error:', frontendError);
      } else {
        console.log(`✅ Frontend query result: ${frontendTest.length} tasks`);
        if (frontendTest.length > 0) {
          console.log('First task details:');
          console.log(JSON.stringify(frontendTest[0], null, 2));
        }
      }
    }

    // 6. Check if any tasks have null hotel_id
    console.log('\n\n6️⃣ CHECKING FOR NULL HOTEL_IDs:');
    const { data: nullHotelTasks, error: nullError, count: nullCount } = await supabase
      .from('maintenance_tasks')
      .select('*', { count: 'exact' })
      .is('hotel_id', null);
    
    if (nullError) {
      console.error('❌ Error checking null hotel_ids:', nullError);
    } else {
      console.log(`ℹ️ Tasks with null hotel_id: ${nullCount}`);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugMaintenanceTasks().then(() => {
  console.log('\n🏁 Debug analysis complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});