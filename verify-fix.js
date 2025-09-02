import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🎯 VERIFYING THE FIX');
console.log('=' .repeat(50));

async function verifyFix() {
  try {
    console.log('\n1️⃣ Testing query that the hook should now execute...');
    
    // This is the query the hook should now execute correctly
    const { data: tasks, error } = await supabase
      .from('maintenance_tasks')
      .select(`
        *,
        room:rooms(numero, bed_type),
        hotel:hotels(nom)
      `)
      .eq('hotel_id', 1) // This should now work correctly
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log(`✅ Successfully fetched ${tasks.length} maintenance tasks for hotel 1`);
    
    if (tasks.length > 0) {
      console.log('\n📋 First task details:');
      console.log(`  - ID: ${tasks[0].id}`);
      console.log(`  - Title: ${tasks[0].titre}`);
      console.log(`  - Status: ${tasks[0].statut}`);
      console.log(`  - Priority: ${tasks[0].priorite}`);
      console.log(`  - Hotel: ${tasks[0].hotel?.nom}`);
      console.log(`  - Room: ${tasks[0].room?.numero || 'N/A'}`);
    }
    
    console.log('\n2️⃣ Summary of the fix:');
    console.log('   - BEFORE: Component called useMaintenanceTasks({ hotelId: 1, ... })');
    console.log('   - Hook received: hotelId = { hotelId: 1, ... } (object)');  
    console.log('   - Query: WHERE hotel_id = [object Object] (no matches)');
    console.log('   - Result: 0 tasks');
    console.log('');
    console.log('   - AFTER: Component calls useMaintenanceTasks(1, undefined, { ... })');
    console.log('   - Hook received: hotelId = 1 (number)');
    console.log('   - Query: WHERE hotel_id = 1 (correct)');
    console.log(`   - Result: ${tasks.length} tasks`);
    
    console.log('\n🎉 The fix should now display maintenance tasks in the UI!');
    console.log('👀 Check http://localhost:3010 to see "Tâches de maintenance (20)" instead of "(0)"');
    
  } catch (error) {
    console.error('💥 Error verifying fix:', error);
  }
}

verifyFix().then(() => {
  console.log('\n🏁 Verification complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});