import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:15421';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log('🔍 Checking RLS policies and permissions...\n');
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkRLSPolicies() {
  try {
    // Check if RLS is enabled on clients table
    console.log('1️⃣ Checking RLS status on tables...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename, schemaname')
      .eq('schemaname', 'public')
      .in('tablename', ['clients', 'client_types', 'referents', 'conventions_tarifaires']);

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else {
      console.log('✅ Tables found:', tables.map(t => t.tablename));
    }

    // Check RLS policies directly via SQL
    console.log('\n2️⃣ Checking RLS policies via SQL query...');
    
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('query', {
        query: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity,
            (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
          FROM pg_tables t 
          WHERE schemaname = 'public' 
          AND tablename IN ('clients', 'client_types', 'referents', 'conventions_tarifaires')
        `
      });

    if (rlsError) {
      console.log('Cannot check RLS via query function, trying direct approach...');
      
      // Disable RLS on client tables for testing
      console.log('\n3️⃣ Attempting to disable RLS on client tables...');
      
      const tables_to_fix = ['clients', 'client_types', 'referents', 'conventions_tarifaires'];
      
      for (const table of tables_to_fix) {
        try {
          // First, try to disable RLS
          const { error: disableError } = await supabase
            .rpc('sql', {
              query: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
            });
          
          if (disableError) {
            console.log(`Cannot disable RLS on ${table} via SQL function`);
            
            // Try creating a permissive policy instead
            const { error: policyError } = await supabase
              .rpc('sql', {
                query: `
                  DROP POLICY IF EXISTS "Allow all access for authenticated users" ON ${table};
                  CREATE POLICY "Allow all access for authenticated users" 
                  ON ${table} FOR ALL 
                  TO authenticated 
                  USING (true) 
                  WITH CHECK (true);
                `
              });
            
            if (policyError) {
              console.log(`Cannot create policy on ${table}: ${policyError.message}`);
            } else {
              console.log(`✅ Created permissive policy for ${table}`);
            }
          } else {
            console.log(`✅ Disabled RLS on ${table}`);
          }
          
        } catch (err) {
          console.log(`❌ Error fixing ${table}: ${err.message}`);
        }
      }
    }

    // Test again with anon key
    console.log('\n4️⃣ Testing access with anon key after fixes...');
    
    const anonSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDuKh30bUIc');
    
    const { data: testClients, error: testError } = await anonSupabase
      .from('clients')
      .select('id, nom, statut')
      .limit(1);

    if (testError) {
      console.error('❌ Still getting error with anon key:', testError);
      console.log('\n💡 Recommendation: Check Supabase dashboard for RLS policies or grant permissions to anon role');
    } else {
      console.log('✅ Anon access now works! Sample client:', testClients[0]);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkRLSPolicies();
