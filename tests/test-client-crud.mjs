import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log('📡 Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testClientCRUD() {
  console.log('🧪 Testing Client CRUD Operations...\n');

  try {
    // 1. Test creating a Particulier (type_id = 1)
    console.log('1️⃣ Creating a Particulier client...');
    const particulier = {
      type_id: 1,
      nom: 'Dupont',
      prenom: 'Marie',
      email: 'marie.dupont@example.com',
      telephone: '0612345678',
      adresse: '10 rue de la Paix',
      ville: 'Paris',
      code_postal: '75001',
      nombre_enfants: 2,
      statut: 'actif',
      mode_paiement: 'carte',
      notes: 'Client test particulier'
    };

    const { data: createdParticulier, error: error1 } = await supabase
      .from('clients')
      .insert(particulier)
      .select()
      .single();

    if (error1) {
      console.error('Error creating Particulier:', error1);
      throw error1;
    }
    console.log('✅ Particulier created:', createdParticulier.numero_client);

    // 2. Test creating an Entreprise (type_id = 2) with referent
    console.log('\n2️⃣ Creating an Entreprise client...');
    const entreprise = {
      type_id: 2,
      nom: 'TechCorp',
      raison_sociale: 'TechCorp SAS',
      email: 'contact@techcorp.com',
      telephone: '0145678901',
      adresse: '100 avenue des Champs',
      ville: 'Paris',
      code_postal: '75008',
      siret: '12345678901234',
      secteur_activite: 'Technologies',
      nombre_employes: 50,
      statut: 'actif',
      mode_paiement: 'virement',
      delai_paiement: 30,
      taux_tva: 20,
      conditions_paiement: 'Paiement à 30 jours',
      notes: 'Client entreprise important'
    };

    const { data: createdEntreprise, error: error2 } = await supabase
      .from('clients')
      .insert(entreprise)
      .select()
      .single();

    if (error2) {
      console.error('Error creating Entreprise:', error2);
      throw error2;
    }
    console.log('✅ Entreprise created:', createdEntreprise.numero_client);

    // Add referent for the entreprise
    console.log('   Adding referent for entreprise...');
    const referent = {
      client_id: createdEntreprise.id,
      nom: 'Martin',
      prenom: 'Pierre',
      fonction: 'Directeur des achats',
      telephone: '0612345679',
      email: 'pierre.martin@techcorp.com'
    };

    const { error: error3 } = await supabase
      .from('referents')
      .insert(referent);

    if (error3) {
      console.error('Error creating referent:', error3);
      throw error3;
    }
    console.log('   ✅ Referent added');

    // Add convention for the entreprise
    console.log('   Adding convention tarifaire...');
    const convention = {
      client_id: createdEntreprise.id,
      date_debut: new Date().toISOString(),
      date_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      reduction_pourcentage: 10,
      forfait_mensuel: 5000,
      conditions: 'Réduction de 10% sur tous les tarifs',
      active: true
    };

    const { error: error4 } = await supabase
      .from('conventions_tarifaires')
      .insert(convention);

    if (error4) {
      console.error('Error creating convention:', error4);
      throw error4;
    }
    console.log('   ✅ Convention added');

    // 3. Test creating an Association (type_id = 3)
    console.log('\n3️⃣ Creating an Association client...');
    const association = {
      type_id: 3,
      nom: 'Association Solidarité',
      raison_sociale: 'Association Solidarité pour Tous',
      email: 'contact@solidarite.org',
      telephone: '0156789012',
      adresse: '50 rue de la Bienfaisance',
      ville: 'Lyon',
      code_postal: '69002',
      numero_agrement: 'AGR-2024-001',
      nombre_adherents: 200,
      statut: 'actif',
      mode_paiement: 'cheque',
      notes: 'Association partenaire'
    };

    const { data: createdAssociation, error: error5 } = await supabase
      .from('clients')
      .insert(association)
      .select()
      .single();

    if (error5) {
      console.error('Error creating Association:', error5);
      throw error5;
    }
    console.log('✅ Association created:', createdAssociation.numero_client);

    // 4. Test updating a client
    console.log('\n4️⃣ Testing update operation...');
    const update = {
      telephone: '0600000000',
      statut: 'inactif',
      notes: 'Client mis à jour pour test'
    };

    const { error: error6 } = await supabase
      .from('clients')
      .update(update)
      .eq('id', createdParticulier.id);

    if (error6) {
      console.error('Error updating client:', error6);
      throw error6;
    }
    console.log('✅ Client updated successfully');

    // 5. Test search functionality
    console.log('\n5️⃣ Testing search functionality...');
    
    // Search by name
    const { data: searchResults1, error: error7 } = await supabase
      .from('clients')
      .select('*')
      .ilike('nom', '%Dupont%');

    if (error7) {
      console.error('Error searching by name:', error7);
      throw error7;
    }
    console.log('✅ Search by name found:', searchResults1.length, 'result(s)');

    // Search by type
    const { data: searchResults2, error: error8 } = await supabase
      .from('clients')
      .select('*')
      .eq('type_id', 2);

    if (error8) {
      console.error('Error searching by type:', error8);
      throw error8;
    }
    console.log('✅ Search by type (Entreprise) found:', searchResults2.length, 'result(s)');

    // Search by status
    const { data: searchResults3, error: error9 } = await supabase
      .from('clients')
      .select('*')
      .eq('statut', 'actif');

    if (error9) {
      console.error('Error searching by status:', error9);
      throw error9;
    }
    console.log('✅ Search by status (actif) found:', searchResults3.length, 'result(s)');

    // 6. Test loading client with relations
    console.log('\n6️⃣ Testing loading client with relations...');
    const { data: clientWithRelations, error: error10 } = await supabase
      .from('clients')
      .select(`
        *,
        referents(*),
        conventions:conventions_tarifaires(*)
      `)
      .eq('id', createdEntreprise.id)
      .single();

    if (error10) {
      console.error('Error loading client with relations:', error10);
      throw error10;
    }
    console.log('✅ Loaded client with relations:');
    console.log('   - Client:', clientWithRelations.numero_client);
    console.log('   - Referents:', clientWithRelations.referents?.length || 0);
    console.log('   - Conventions:', clientWithRelations.conventions?.length || 0);

    // 7. Test statistics
    console.log('\n7️⃣ Testing client statistics...');
    const { data: allClients, error: error11 } = await supabase
      .from('clients')
      .select('*');

    if (error11) {
      console.error('Error loading all clients:', error11);
      throw error11;
    }

    const stats = {
      total: allClients.length,
      actifs: allClients.filter(c => c.statut === 'actif').length,
      inactifs: allClients.filter(c => c.statut === 'inactif').length,
      particuliers: allClients.filter(c => c.type_id === 1).length,
      entreprises: allClients.filter(c => c.type_id === 2).length,
      associations: allClients.filter(c => c.type_id === 3).length
    };

    console.log('✅ Client statistics:');
    console.log(`   - Total: ${stats.total}`);
    console.log(`   - Actifs: ${stats.actifs}`);
    console.log(`   - Inactifs: ${stats.inactifs}`);
    console.log(`   - Particuliers: ${stats.particuliers}`);
    console.log(`   - Entreprises: ${stats.entreprises}`);
    console.log(`   - Associations: ${stats.associations}`);

    console.log('\n✅ All CRUD tests passed successfully!');
    console.log('\n📝 Test Summary:');
    console.log('   ✓ Created 3 clients (Particulier, Entreprise, Association)');
    console.log('   ✓ Added referent for Entreprise');
    console.log('   ✓ Added convention tarifaire for Entreprise');
    console.log('   ✓ Updated client data');
    console.log('   ✓ Tested search functionality');
    console.log('   ✓ Loaded client with relations');
    console.log('   ✓ Generated statistics');

    console.log('\n💡 Note: Test data has been created in the database.');
    console.log('   You can now test the frontend UI with this data.');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
    if (error.hint) {
      console.error('Hint:', error.hint);
    }
    process.exit(1);
  }
}

// Run the tests
testClientCRUD();