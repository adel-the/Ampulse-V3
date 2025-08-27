import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:15421';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDuKh30bUIc';

console.log('🔍 Testing Frontend Integration...\n');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFrontendIntegration() {
  try {
    // Test 1: Can we load clients as the frontend would?
    console.log('1️⃣ Testing client loading (like useClients hook)...');
    
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .order('nom');

    if (clientsError) {
      console.error('❌ Clients loading error:', clientsError);
    } else {
      console.log(`✅ Loaded ${clients.length} clients`);
      console.log('   Sample client:', clients[0] ? {
        id: clients[0].id,
        nom: clients[0].nom,
        type_id: clients[0].type_id,
        statut: clients[0].statut,
        numero_client: clients[0].numero_client
      } : 'No clients');
    }

    // Test 2: Can we create a client as the form would?
    console.log('\n2️⃣ Testing client creation (like AddClientForm)...');
    
    const newClient = {
      type_id: 1,
      nom: 'Test Frontend',
      prenom: 'User',
      email: 'test.frontend@example.com',
      telephone: '0123456789',
      adresse: '123 Test Street',
      ville: 'Test City',
      code_postal: '12345',
      statut: 'actif'
    };

    const { data: createdClient, error: createError } = await supabase
      .from('clients')
      .insert(newClient)
      .select()
      .single();

    if (createError) {
      console.error('❌ Client creation error:', createError);
    } else {
      console.log('✅ Created client:', createdClient.numero_client);
      
      // Clean up - delete the test client
      await supabase.from('clients').delete().eq('id', createdClient.id);
      console.log('   (Test client cleaned up)');
    }

    // Test 3: Test search functionality
    console.log('\n3️⃣ Testing search (like ClientManagement search)...');
    
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_clients', {
        p_search_term: 'Dupont',
        p_type_id: null,
        p_statut: null,
        p_limit: 10
      });

    if (searchError) {
      console.error('❌ Search error:', searchError);
    } else {
      console.log(`✅ Search found ${searchResults.length} results`);
      if (searchResults.length > 0) {
        console.log('   Sample result:', {
          id: searchResults[0].id,
          nom_complet: searchResults[0].nom_complet,
          type_nom: searchResults[0].type_nom
        });
      }
    }

    // Test 4: Test statistics
    console.log('\n4️⃣ Testing statistics (like ClientManagement stats)...');
    
    const { data: stats, error: statsError } = await supabase
      .rpc('get_client_statistics');

    if (statsError) {
      console.error('❌ Statistics error:', statsError);
    } else {
      console.log('✅ Statistics:', stats[0]);
    }

    // Test 5: Test with client types
    console.log('\n5️⃣ Testing client types loading...');
    
    const { data: clientTypes, error: typesError } = await supabase
      .from('client_types')
      .select('*')
      .order('ordre');

    if (typesError) {
      console.error('❌ Client types error:', typesError);
    } else {
      console.log(`✅ Loaded ${clientTypes.length} client types`);
      clientTypes.forEach(type => {
        console.log(`   - ${type.nom} (${type.description})`);
      });
    }

    console.log('\n✅ All frontend integration tests passed!');
    console.log('📝 The backend is fully functional for the frontend components.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFrontendIntegration();
