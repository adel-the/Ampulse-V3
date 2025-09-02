// Script de debug pour tester la création de tâches de maintenance
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iqrqhzgtjhizvfyiuhao.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMaintenanceTaskCreation() {
  console.log('🔧 Test de création de tâche de maintenance...\n');

  // Test 1: Créer une tâche avec les données exactes du formulaire
  const testTaskData = {
    titre: 'Test création tâche DEBUG',
    description: 'Test de création depuis le script de debug',
    priorite: 'moyenne', // Valeur correcte pour la base de données
    responsable: 'Debug User',
    date_echeance: '2025-09-03',
    notes: 'Créé depuis script de debug',
    room_id: 1,
    hotel_id: 1,
    user_owner_id: 'c8c827c4-419f-409c-a696-e6bf0856984b',
    created_by: 'c8c827c4-419f-409c-a696-e6bf0856984b',
    statut: 'en_attente',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    console.log('📝 Données de test:', JSON.stringify(testTaskData, null, 2));
    
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .insert(testTaskData)
      .select(`
        *,
        room:rooms(numero, bed_type),
        hotel:hotels(nom)
      `)
      .single();

    if (error) {
      console.error('❌ Erreur lors de la création:', error);
      console.error('Code:', error.code);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);
      console.error('Message:', error.message);
    } else {
      console.log('✅ Tâche créée avec succès:');
      console.log('ID:', data.id);
      console.log('Titre:', data.titre);
      console.log('Statut:', data.statut);
      console.log('Priorité:', data.priorite);
    }
  } catch (err) {
    console.error('❌ Exception lors de la création:', err);
  }

  // Test 2: Vérifier les contraintes de priorité
  console.log('\n🔧 Test des contraintes de priorité...');
  
  const priorityTests = ['faible', 'moyenne', 'haute', 'urgente', 'invalide'];
  
  for (const priorite of priorityTests) {
    try {
      const testData = {
        ...testTaskData,
        titre: `Test priorité ${priorite}`,
        priorite: priorite
      };
      
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .insert(testData)
        .select('id, titre, priorite')
        .single();

      if (error) {
        console.log(`❌ Priorité '${priorite}': ${error.message}`);
      } else {
        console.log(`✅ Priorité '${priorite}': OK (ID: ${data.id})`);
      }
    } catch (err) {
      console.log(`❌ Priorité '${priorite}': Exception - ${err.message}`);
    }
  }

  // Test 3: Vérifier les contraintes de statut
  console.log('\n🔧 Test des contraintes de statut...');
  
  const statusTests = ['en_attente', 'en_cours', 'terminee', 'annulee', 'invalide'];
  
  for (const statut of statusTests) {
    try {
      const testData = {
        ...testTaskData,
        titre: `Test statut ${statut}`,
        statut: statut
      };
      
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .insert(testData)
        .select('id, titre, statut')
        .single();

      if (error) {
        console.log(`❌ Statut '${statut}': ${error.message}`);
      } else {
        console.log(`✅ Statut '${statut}': OK (ID: ${data.id})`);
      }
    } catch (err) {
      console.log(`❌ Statut '${statut}': Exception - ${err.message}`);
    }
  }

  // Test 4: Vérifier l'existence des références room_id et hotel_id
  console.log('\n🔧 Test des références foreign key...');
  
  try {
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id, numero, hotel_id')
      .limit(5);
    
    console.log('🏨 Chambres disponibles:', rooms?.map(r => `ID: ${r.id}, Numéro: ${r.numero}, Hôtel: ${r.hotel_id}`));
    
    const { data: hotels } = await supabase
      .from('hotels')
      .select('id, nom')
      .limit(5);
    
    console.log('🏨 Hôtels disponibles:', hotels?.map(h => `ID: ${h.id}, Nom: ${h.nom}`));
  } catch (err) {
    console.error('❌ Erreur lors de la vérification des références:', err);
  }

  console.log('\n✨ Tests terminés');
}

testMaintenanceTaskCreation().catch(console.error);