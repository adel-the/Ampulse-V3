import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:15421';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log('📡 Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testClientCRUD() {
  console.log('🧪 Testing Simple Client CRUD Operations...\n');

  try {
    // 1. Test creating a Particulier (client_type = 'Particulier')
    console.log('1️⃣ Creating a Particulier client...');
    const particulier = {
      client_type: 'Particulier',
      nom: 'Dupont',
      prenom: 'Marie',
      email: 'marie.dupont@example.com',
      telephone: '0612345678',
      adresse: '10 rue de la Paix',
      ville: 'Paris',
      code_postal: '75001',
      statut: 'actif'
    };

    const { data: createdParticulier, error: error1 } = await supabase
      .from('clients')
      .insert(particulier)
      .select()
      .single();

    if (error1) {
      console.error('Error creating Particulier:', error1);
      return;
    }
    console.log('✅ Particulier created:', createdParticulier.numero_client);

    // 2. Test creating an Entreprise (client_type = 'Entreprise')
    console.log('\n2️⃣ Creating an Entreprise client...');
    const entreprise = {
      client_type: 'Entreprise',
      nom: 'TechCorp',
      raison_sociale: 'TechCorp SAS',
      email: 'contact@techcorp.com',
      telephone: '0145678901',
      adresse: '100 avenue des Champs',
      ville: 'Paris',
      code_postal: '75008',
      siret: '12345678901234',
      statut: 'actif'
    };

    const { data: createdEntreprise, error: error2 } = await supabase
      .from('clients')
      .insert(entreprise)
      .select()
      .single();

    if (error2) {
      console.error('Error creating Entreprise:', error2);
      return;
    }
    console.log('✅ Entreprise created:', createdEntreprise.numero_client);

    // 3. Test updating a client
    console.log('\n3️⃣ Testing update operation...');
    const { error: error6 } = await supabase
      .from('clients')
      .update({ telephone: '0600000000' })
      .eq('id', createdParticulier.id);

    if (error6) {
      console.error('Error updating client:', error6);
    } else {
      console.log('✅ Client updated successfully');
    }

    // 4. Test search functionality
    console.log('\n4️⃣ Testing search functionality...');
    const { data: allClients, error: searchError } = await supabase
      .from('clients')
      .select('*');

    if (searchError) {
      console.error('Error loading clients:', searchError);
    } else {
      console.log('✅ Found', allClients.length, 'clients total');
      console.log('   - Particuliers:', allClients.filter(c => c.client_type === 'Particulier').length);
      console.log('   - Entreprises:', allClients.filter(c => c.client_type === 'Entreprise').length);
    }

    console.log('\n✅ Basic CRUD tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

testClientCRUD();
