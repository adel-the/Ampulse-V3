import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:15421';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log('🔍 Testing functions ClientManagement expects...\n');
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testMissingFunctions() {
  try {
    // Test get_client_statistics (expected by ClientManagement)
    console.log('1️⃣ Testing get_client_statistics...');
    try {
      const { data: stats1, error: error1 } = await supabase
        .rpc('get_client_statistics');
      
      if (error1) {
        console.error('❌ get_client_statistics error:', error1.message);
      } else {
        console.log('✅ get_client_statistics works:', stats1);
      }
    } catch (err) {
      console.error('❌ get_client_statistics failed:', err.message);
    }

    // Test search_clients (expected by ClientManagement)
    console.log('\n2️⃣ Testing search_clients...');
    try {
      const { data: search1, error: error2 } = await supabase
        .rpc('search_clients', {
          p_search_term: '',
          p_type_id: null,
          p_statut: null,
          p_limit: 5
        });
      
      if (error2) {
        console.error('❌ search_clients error:', error2.message);
      } else {
        console.log('✅ search_clients works, found:', search1?.length || 0);
      }
    } catch (err) {
      console.error('❌ search_clients failed:', err.message);
    }

    // Test working alternatives
    console.log('\n3️⃣ Working alternatives:');
    
    const { data: stats2, error: error3 } = await supabase
      .rpc('get_simple_client_statistics');
    
    if (!error3) {
      console.log('✅ get_simple_client_statistics works:', stats2);
    }

    const { data: search2, error: error4 } = await supabase
      .rpc('search_simple_clients', {
        p_search_term: '',
        p_type_id: null,
        p_statut: null,
        p_limit: 5
      });
    
    if (!error4) {
      console.log('✅ search_simple_clients works, found:', search2?.length || 0);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMissingFunctions();
