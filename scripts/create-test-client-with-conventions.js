const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createTestClientWithConventions() {
  console.log('🔧 Création d\'un client test avec conventions tarifaires\n');
  
  // 1. Créer un client entreprise
  console.log('1. Création du client entreprise...');
  const { data: client, error: clientError } = await supabaseAdmin
    .from('clients')
    .insert({
      client_type: 'Entreprise',
      nom: 'Test Display',
      raison_sociale: 'Test Convention Display SAS',
      email: 'test.display@example.com',
      telephone: '0123456789',
      adresse: '123 rue du Test',
      ville: 'Paris',
      code_postal: '75001',
      statut: 'actif'
    })
    .select()
    .single();
  
  if (clientError) {
    console.error('❌ Erreur création client:', clientError);
    return;
  }
  
  console.log('✅ Client créé avec ID:', client.id);
  
  // 2. Récupérer les catégories de chambres
  console.log('\n2. Récupération des catégories de chambres...');
  const { data: categories, error: catError } = await supabaseAdmin
    .from('room_categories')
    .select('id, name')
    .limit(3);
  
  if (catError || !categories || categories.length === 0) {
    console.error('❌ Erreur ou aucune catégorie trouvée:', catError);
    return;
  }
  
  console.log(`✅ ${categories.length} catégories trouvées`);
  
  // 3. Créer des conventions pour chaque catégorie
  console.log('\n3. Création des conventions tarifaires...');
  
  for (const category of categories) {
    // Prix différents pour chaque catégorie
    const basePrice = 50 + (category.id * 10);
    
    const conventionData = {
      client_id: client.id,
      category_id: category.id,
      hotel_id: 1,
      date_debut: '2024-01-01',
      date_fin: '2024-12-31',
      prix_defaut: basePrice,
      // Prix mensuels avec variations saisonnières
      prix_janvier: basePrice - 10,
      prix_fevrier: basePrice - 10,
      prix_mars: basePrice,
      prix_avril: basePrice,
      prix_mai: basePrice + 5,
      prix_juin: basePrice + 10,
      prix_juillet: basePrice + 30, // Prix été
      prix_aout: basePrice + 35,     // Prix été
      prix_septembre: basePrice + 5,
      prix_octobre: basePrice,
      prix_novembre: basePrice - 5,
      prix_decembre: basePrice + 15, // Prix fêtes
      conditions: `Convention test pour ${category.name}`,
      active: true
    };
    
    const { error: convError } = await supabaseAdmin
      .from('conventions_tarifaires')
      .insert(conventionData);
    
    if (convError) {
      console.error(`❌ Erreur création convention pour ${category.name}:`, convError);
    } else {
      console.log(`✅ Convention créée pour ${category.name}:`);
      console.log(`   - Prix défaut: ${basePrice}€`);
      console.log(`   - Prix juillet: ${basePrice + 30}€`);
      console.log(`   - Prix août: ${basePrice + 35}€`);
    }
  }
  
  console.log('\n🎉 Client test créé avec succès!');
  console.log('\n📋 Pour tester:');
  console.log(`1. Allez sur http://localhost:3001`);
  console.log(`2. Naviguez vers la gestion des clients`);
  console.log(`3. Recherchez et éditez le client "Test Display" (ID: ${client.id})`);
  console.log(`4. Allez dans l'onglet "Conventions tarifaires"`);
  console.log(`5. Les prix devraient s'afficher avec les variations mensuelles`);
  console.log('\n💡 Conseil: Ouvrez la console (F12) pour voir les logs de débogage');
  
  return client.id;
}

createTestClientWithConventions().catch(console.error);