const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function verifyConventionFix() {
  console.log('✅ Vérification du fix des conventions tarifaires\n');
  
  // 1. Récupérer un client de test avec des conventions
  console.log('1. Recherche du client ID 31 (Bernard)...');
  const { data: client, error: clientError } = await supabaseAdmin
    .from('clients')
    .select('*, conventions:conventions_tarifaires(*)')
    .eq('id', 31)
    .single();
  
  if (clientError || !client) {
    console.error('❌ Erreur ou client non trouvé:', clientError);
    return;
  }
  
  console.log('✅ Client trouvé:', {
    id: client.id,
    nom: client.nom,
    type: client.client_type,
    conventions: client.conventions?.length || 0
  });
  
  // 2. Vérifier les conventions avec relations
  console.log('\n2. Chargement des conventions avec relations...');
  const { data: conventions, error: convError } = await supabaseAdmin
    .from('conventions_tarifaires')
    .select(`
      *,
      clients (
        raison_sociale
      ),
      room_categories (
        name,
        capacity
      ),
      hotels (
        nom
      )
    `)
    .eq('client_id', 31)
    .eq('active', true);
  
  if (convError) {
    console.error('❌ Erreur chargement conventions:', convError);
    return;
  }
  
  console.log(`✅ ${conventions.length} convention(s) trouvée(s)`);
  
  // 3. Afficher la structure des données
  console.log('\n3. Structure des données pour ConventionPrix:');
  conventions.forEach((conv, index) => {
    console.log(`\nConvention ${index + 1}:`);
    console.log('- ID:', conv.id);
    console.log('- Catégorie:', conv.room_categories?.name || 'N/A');
    console.log('- Prix défaut:', conv.prix_defaut, '€');
    console.log('- Prix janvier:', conv.prix_janvier, '€');
    console.log('- Prix juillet:', conv.prix_juillet, '€');
  });
  
  console.log('\n✅ Instructions pour tester dans l\'interface:');
  console.log('1. Allez sur http://localhost:3001');
  console.log('2. Naviguez vers la gestion des clients');
  console.log('3. Éditez le client "Bernard" (ID 31)');
  console.log('4. Allez dans l\'onglet "Conventions tarifaires"');
  console.log('5. Ouvrez la console (F12) et regardez les logs [ClientsSection]');
  console.log('\n📊 Les prix devraient maintenant s\'afficher:');
  console.log('- F1 (T2): 45€ pour tous les mois');
  console.log('- F2 (T3): 455€ pour tous les mois');
  
  console.log('\n✅ Si les prix s\'affichent, le problème est résolu!');
  console.log('❌ Si les prix montrent encore "--", vérifiez les logs de la console.');
}

verifyConventionFix().catch(console.error);