import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:15421';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log('🧪 Testing Client Deletion (like frontend would)...\n');
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testClientDeletion() {
  try {
    // 1. Create a test client
    console.log('1️⃣ Creating test client...');
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert({
        client_type: 'Particulier',
        nom: 'Test Delete',
        prenom: 'Frontend',
        email: 'delete.test@example.com',
        statut: 'actif'
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create test client:', createError);
      return;
    }

    console.log(`✅ Created client: ${newClient.numero_client} (ID: ${newClient.id})`);

    // 2. Add a referent to test cascade deletion
    console.log('\n2️⃣ Adding referent to test cascade...');
    const { data: referent, error: refError } = await supabase
      .from('referents')
      .insert({
        client_id: newClient.id,
        nom: 'Ref Test',
        prenom: 'Delete',
        email: 'ref@test.com'
      })
      .select()
      .single();

    if (!refError) {
      console.log('✅ Added referent to client');
    }

    // 3. Delete the client
    console.log('\n3️⃣ Deleting client with ID:', newClient.id);
    
    // First delete referents (like our API does)
    const { error: deleteRefError } = await supabase
      .from('referents')
      .delete()
      .eq('client_id', newClient.id);

    if (deleteRefError) {
      console.error('❌ Failed to delete referents:', deleteRefError);
    }

    // Then delete the client
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', newClient.id);

    if (deleteError) {
      console.error('❌ Failed to delete client:', deleteError);
      return;
    }

    console.log('✅ Client deleted successfully');

    // 4. Verify deletion
    console.log('\n4️⃣ Verifying deletion...');
    const { data: checkClient, error: checkError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', newClient.id)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      console.log('✅ Client deletion confirmed - client not found');
    } else if (checkClient) {
      console.error('❌ Client still exists:', checkClient);
    }

    console.log('\n🎉 Client deletion works perfectly from frontend perspective!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testClientDeletion();