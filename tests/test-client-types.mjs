import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:15421';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log('🔍 Testing Client Types Table...\n');
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testClientTypes() {
  try {
    // Check if client_types table exists and has data
    console.log('1️⃣ Checking client_types table...');
    const { data, error } = await supabase
      .from('client_types')
      .select('*')
      .order('id');

    if (error) {
      console.error('❌ Error accessing client_types table:', error);
      console.log('📝 This table might not exist. Creating with basic data...');
      
      // Try to create the table with basic types
      const basicTypes = [
        { id: 1, nom: 'Particulier', description: 'Client individuel', icone: 'user', couleur: '#3B82F6', ordre: 1 },
        { id: 2, nom: 'Entreprise', description: 'Société commerciale', icone: 'building', couleur: '#10B981', ordre: 2 },
        { id: 3, nom: 'Association', description: 'Organisation à but non lucratif', icone: 'users', couleur: '#F59E0B', ordre: 3 }
      ];

      console.log('Trying to create client_types table...');
      for (const type of basicTypes) {
        try {
          const { error: insertError } = await supabase
            .from('client_types')
            .insert(type);
          
          if (insertError) {
            console.error('Insert error for type:', type.nom, insertError);
          } else {
            console.log('✅ Created type:', type.nom);
          }
        } catch (err) {
          console.error('Failed to insert type:', type.nom, err);
        }
      }
    } else {
      console.log('✅ Client types found:', data.length);
      data.forEach(type => {
        console.log(`   - ${type.nom} (ID: ${type.id}): ${type.description}`);
      });
    }

    // Test RPC functions that ClientManagement uses
    console.log('\n2️⃣ Testing RPC functions...');
    
    try {
      console.log('Testing get_simple_client_statistics...');
      const { data: stats, error: statsError } = await supabase
        .rpc('get_simple_client_statistics');
      
      if (statsError) {
        console.error('❌ get_simple_client_statistics error:', statsError);
      } else {
        console.log('✅ Statistics function works:', stats);
      }
    } catch (err) {
      console.error('❌ Statistics function failed:', err);
    }

    try {
      console.log('Testing search_simple_clients...');
      const { data: searchResults, error: searchError } = await supabase
        .rpc('search_simple_clients', {
          p_search_term: '',
          p_type_id: null,
          p_statut: null,
          p_limit: 10
        });
      
      if (searchError) {
        console.error('❌ search_simple_clients error:', searchError);
      } else {
        console.log('✅ Search function works, found:', searchResults?.length || 0, 'clients');
      }
    } catch (err) {
      console.error('❌ Search function failed:', err);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testClientTypes();
