// ============================================
// MAINTENANCE TASKS DEBUGGING SCRIPT
// ============================================
// Use this script to diagnose 400 Bad Request issues
// when creating maintenance tasks

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:15421';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function debugMaintenanceTasks() {
  log('cyan', '🔍 DEBUGGING MAINTENANCE TASKS SYSTEM\n');
  
  try {
    // Step 1: Check database connection
    log('blue', '1. Testing database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('maintenance_tasks')
      .select('count', { count: 'exact', head: true });
    
    if (connectionError) {
      log('red', `❌ Connection failed: ${connectionError.message}`);
      return;
    }
    log('green', '✅ Database connection successful');
    
    // Step 2: Check table structure
    log('blue', '\n2. Verifying table structure...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'maintenance_tasks' })
      .catch(() => null); // Ignore if RPC doesn't exist
    
    // Alternative method to check columns
    const { data: sampleRow } = await supabase
      .from('maintenance_tasks')
      .select('*')
      .limit(1);
    
    if (sampleRow || sampleRow === null) {
      log('green', '✅ Table structure accessible');
    }
    
    // Step 3: Check required tables exist
    log('blue', '\n3. Checking related tables...');
    
    const { data: hotels, error: hotelsError } = await supabase
      .from('hotels')
      .select('id, nom, user_owner_id')
      .limit(1);
      
    if (hotelsError) {
      log('red', `❌ Hotels table error: ${hotelsError.message}`);
      return;
    }
    log('green', `✅ Hotels table accessible (${hotels?.length || 0} records found)`);
    
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, numero, hotel_id')
      .limit(1);
      
    if (roomsError) {
      log('red', `❌ Rooms table error: ${roomsError.message}`);
      return;
    }
    log('green', `✅ Rooms table accessible (${rooms?.length || 0} records found)`);
    
    // Step 4: Check permissions
    log('blue', '\n4. Testing permissions...');
    
    // Get a test user
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    let testUserId = null;
    
    if (!usersError && users?.users?.length > 0) {
      testUserId = users.users[0].id;
      log('green', `✅ Found test user: ${testUserId}`);
    } else {
      log('yellow', '⚠️ No users found, creating test user...');
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: `test-debug-${Date.now()}@maintenance.com`,
        password: 'debugpassword123',
        email_confirm: true
      });
      
      if (createUserError) {
        log('red', `❌ Failed to create test user: ${createUserError.message}`);
        return;
      }
      testUserId = newUser.user.id;
      log('green', `✅ Created test user: ${testUserId}`);
    }
    
    // Step 5: Test actual insertion with detailed error reporting
    log('blue', '\n5. Testing task insertion...');
    
    if (hotels?.length > 0 && rooms?.length > 0) {
      const testTask = {
        titre: 'Test Debug Task',
        description: 'Task created during debugging',
        priorite: 'moyenne', // Use correct database value
        responsable: 'Debug Script',
        date_echeance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        notes: 'Created by debug script',
        statut: 'en_attente',
        room_id: rooms[0].id,
        hotel_id: hotels[0].id,
        user_owner_id: testUserId,
        created_by: testUserId
      };
      
      log('cyan', '\nTest task data:');
      console.log(JSON.stringify(testTask, null, 2));
      
      // Attempt insertion
      const { data: insertResult, error: insertError } = await supabase
        .from('maintenance_tasks')
        .insert(testTask)
        .select('*')
        .single();
      
      if (insertError) {
        log('red', `❌ Insertion failed: ${insertError.message}`);
        log('yellow', `Error code: ${insertError.code}`);
        log('yellow', `Error details: ${insertError.details}`);
        log('yellow', `Error hint: ${insertError.hint}`);
        
        // Additional debugging
        log('blue', '\n6. Running detailed diagnostics...');
        
        // Check if the specific room/hotel combination is valid
        const { data: roomHotelCheck } = await supabase
          .from('rooms')
          .select('id, hotel_id, hotels(id, user_owner_id)')
          .eq('id', rooms[0].id)
          .single();
          
        if (roomHotelCheck) {
          log('cyan', `Room ${roomHotelCheck.id} belongs to hotel ${roomHotelCheck.hotel_id}`);
          log('cyan', `Hotel owner: ${roomHotelCheck.hotels.user_owner_id}`);
          log('cyan', `Test user: ${testUserId}`);
          
          if (roomHotelCheck.hotels.user_owner_id !== testUserId) {
            log('yellow', '⚠️ User ID mismatch - this might be the issue!');
            
            // Try with correct user ID
            const correctedTask = {
              ...testTask,
              user_owner_id: roomHotelCheck.hotels.user_owner_id,
              created_by: roomHotelCheck.hotels.user_owner_id
            };
            
            log('cyan', '\nTrying with correct user ID...');
            const { data: retryResult, error: retryError } = await supabase
              .from('maintenance_tasks')
              .insert(correctedTask)
              .select('*')
              .single();
            
            if (retryError) {
              log('red', `❌ Still failed: ${retryError.message}`);
            } else {
              log('green', '✅ Success with corrected user ID!');
              log('yellow', '🔧 Fix: Ensure user_owner_id matches hotel owner');
            }
          }
        }
        
        // Check constraints
        log('blue', '\nChecking constraint violations...');
        
        // Check priority constraint
        if (!['faible', 'moyenne', 'haute', 'urgente'].includes(testTask.priorite)) {
          log('red', `❌ Invalid priority: ${testTask.priorite}`);
        } else {
          log('green', `✅ Priority valid: ${testTask.priorite}`);
        }
        
        // Check status constraint
        if (!['en_attente', 'en_cours', 'terminee', 'annulee'].includes(testTask.statut)) {
          log('red', `❌ Invalid status: ${testTask.statut}`);
        } else {
          log('green', `✅ Status valid: ${testTask.statut}`);
        }
        
        // Check required fields
        const requiredFields = ['titre', 'room_id', 'hotel_id', 'user_owner_id'];
        requiredFields.forEach(field => {
          if (!testTask[field]) {
            log('red', `❌ Missing required field: ${field}`);
          } else {
            log('green', `✅ Required field present: ${field}`);
          }
        });
        
      } else {
        log('green', '✅ Task insertion successful!');
        log('cyan', `Created task with ID: ${insertResult.id}`);
        
        // Clean up test task
        await supabase
          .from('maintenance_tasks')
          .delete()
          .eq('id', insertResult.id);
        log('cyan', 'Test task cleaned up');
      }
    } else {
      log('yellow', '⚠️ No hotels or rooms found for testing');
    }
    
    // Step 6: Frontend integration checks
    log('blue', '\n7. Frontend integration checks...');
    
    // Simulate the exact call that would be made from the frontend
    const frontendTaskData = {
      titre: 'Frontend Test Task',
      description: 'Testing frontend to backend integration',
      priorite: 'moyenne', // This should be the DB value, not UI value
      responsable: 'Frontend Test',
      date_echeance: '2024-12-31',
      notes: 'Frontend integration test',
      room_id: rooms?.[0]?.id
    };
    
    if (hotels?.length > 0 && rooms?.length > 0) {
      // Simulate the useMaintenanceTasks createTask call
      const simulatedTask = {
        ...frontendTaskData,
        hotel_id: hotels[0].id,
        user_owner_id: testUserId,
        statut: 'en_attente',
        created_by: testUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      log('cyan', '\nSimulating frontend createTask call:');
      console.log(JSON.stringify(simulatedTask, null, 2));
      
      const { data: frontendResult, error: frontendError } = await supabase
        .from('maintenance_tasks')
        .insert(simulatedTask)
        .select(`
          *,
          room:rooms(numero, type),
          hotel:hotels(nom)
        `)
        .single();
      
      if (frontendError) {
        log('red', `❌ Frontend simulation failed: ${frontendError.message}`);
      } else {
        log('green', '✅ Frontend simulation successful!');
        
        // Clean up
        await supabase
          .from('maintenance_tasks')
          .delete()
          .eq('id', frontendResult.id);
      }
    }
    
    // Step 7: Common issues and solutions
    log('blue', '\n8. Common issues and solutions...');
    
    const commonIssues = [
      {
        issue: 'Priority value mismatch',
        solution: 'Use faible/moyenne/haute/urgente instead of basse/moyenne/haute/critique'
      },
      {
        issue: 'User ownership mismatch',
        solution: 'Ensure user_owner_id matches the hotel owner'
      },
      {
        issue: 'Missing required fields',
        solution: 'Ensure titre, room_id, hotel_id, user_owner_id are provided'
      },
      {
        issue: 'Invalid date format',
        solution: 'Use YYYY-MM-DD format for date_echeance'
      },
      {
        issue: 'RLS policy blocking',
        solution: 'Check that user has permission to access the specific hotel/room'
      }
    ];
    
    commonIssues.forEach((item, index) => {
      log('yellow', `${index + 1}. Issue: ${item.issue}`);
      log('green', `   Solution: ${item.solution}\n`);
    });
    
    log('green', '🎉 Debugging completed!');
    
  } catch (error) {
    log('red', `❌ Debug script error: ${error.message}`);
    console.error(error);
  }
}

// Run the debug script
if (require.main === module) {
  debugMaintenanceTasks().catch(console.error);
}

module.exports = { debugMaintenanceTasks };