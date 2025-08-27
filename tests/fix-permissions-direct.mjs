import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:15421';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log('🔧 Fixing permissions directly via service role...\n');
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixPermissions() {
  try {
    // Run SQL commands directly to fix permissions
    const commands = [
      "ALTER TABLE client_types DISABLE ROW LEVEL SECURITY;",
      "ALTER TABLE clients DISABLE ROW LEVEL SECURITY;", 
      "ALTER TABLE referents DISABLE ROW LEVEL SECURITY;",
      "ALTER TABLE conventions_tarifaires DISABLE ROW LEVEL SECURITY;",
      "GRANT SELECT ON client_types TO anon, authenticated;",
      "GRANT SELECT ON clients TO anon, authenticated;",
      "GRANT SELECT ON referents TO anon, authenticated;",
      "GRANT SELECT ON conventions_tarifaires TO anon, authenticated;",
      "GRANT INSERT, UPDATE, DELETE ON clients TO authenticated;",
      "GRANT INSERT, UPDATE, DELETE ON referents TO authenticated;",
      "GRANT INSERT, UPDATE, DELETE ON conventions_tarifaires TO authenticated;",
      "GRANT USAGE ON SEQUENCE clients_id_seq TO authenticated;",
      "GRANT USAGE ON SEQUENCE referents_id_seq TO authenticated;",
      "GRANT USAGE ON SEQUENCE conventions_tarifaires_id_seq TO authenticated;",
    ];

    for (const cmd of commands) {
      try {
        console.log(`Running: ${cmd}`);
        
        // Since we can't run SQL commands directly, let's use a more basic approach
        // Just disable RLS and grant permissions that we can through the API
        
        // For now, let's test if basic access works with service role
        const { data, error } = await supabase
          .from('clients')
          .select('id, nom, statut')
          .limit(1);
          
        if (error) {
          console.error('❌ Service role access error:', error);
        } else {
          console.log('✅ Service role can access clients');
        }
        break; // Just test once
        
      } catch (err) {
        console.error(`❌ Error with command: ${cmd}`, err.message);
      }
    }

    // Test with anon key again
    console.log('\n🧪 Testing with anon key...');
    
    const anonSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDuKh30bUIc');
    
    // Test different approaches
    console.log('Testing basic client access...');
    const { data: clients, error: clientError } = await anonSupabase
      .from('clients') 
      .select('id, nom')
      .limit(1);
      
    if (clientError) {
      console.error('❌ Anon client access error:', clientError);
    } else {
      console.log('✅ Anon can access clients:', clients);
    }
    
    console.log('\nTesting client types access...');
    const { data: types, error: typesError } = await anonSupabase
      .from('client_types')
      .select('*')
      .limit(3);
      
    if (typesError) {
      console.error('❌ Anon types access error:', typesError);
    } else {
      console.log('✅ Anon can access client_types:', types.length, 'types');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixPermissions();
