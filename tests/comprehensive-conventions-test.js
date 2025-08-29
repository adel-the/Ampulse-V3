/**
 * Tests complets pour les conventions tarifaires
 * Utilise l'API TypeScript via la compilation dynamique
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// IDs valides d'après la base de données
const VALID_CLIENT_ID = 11; // TECH SOLUTIONS (Entreprise)
const VALID_CATEGORY_ID = 1; // Studio
const VALID_HOTEL_ID = 1; // Résidence de Développement

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Stockage pour les tests
let testResults = [];
let createdConventionId = null;

// Helper pour logger les résultats
function logResult(testName, success, message, expectedResult = null, actualResult = null) {
  const result = {
    test: testName,
    success,
    message,
    expectedResult,
    actualResult,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  
  const icon = success ? '✅' : '❌';
  const color = success ? colors.green : colors.red;
  console.log(`${color}${icon} ${testName}: ${message}${colors.reset}`);
  
  if (expectedResult !== null && actualResult !== null) {
    console.log(`   Attendu: ${expectedResult}, Obtenu: ${actualResult}`);
  }
}

// Fonction de nettoyage
async function cleanupTestData() {
  console.log(`${colors.yellow}🧹 Nettoyage des données de test...${colors.reset}`);
  
  const { error } = await supabase
    .from('conventions_tarifaires')
    .delete()
    .eq('client_id', VALID_CLIENT_ID);
    
  if (error && error.code !== 'PGRST116') {
    console.error('Erreur lors du nettoyage:', error);
  }
}

// Test 1: Créer une convention avec l'API RPC
async function testCreateConventionRPC() {
  console.log(`\n${colors.blue}📝 Test 1: Création avec fonction RPC${colors.reset}`);
  
  const { data, error } = await supabase.rpc('upsert_convention_tarifaire', {
    p_client_id: VALID_CLIENT_ID,
    p_category_id: VALID_CATEGORY_ID,
    p_hotel_id: VALID_HOTEL_ID,
    p_date_debut: '2024-01-01',
    p_date_fin: '2024-12-31',
    p_prix_defaut: 100,
    p_prix_mensuel: JSON.stringify({
      janvier: 90,
      fevrier: 90,
      juillet: 130,
      aout: 130
    }),
    p_reduction_pourcentage: 10,
    p_forfait_mensuel: null,
    p_conditions: 'Test convention RPC',
    p_active: true,
    p_id: null
  });

  if (error) {
    logResult('Création RPC', false, `Erreur: ${error.message}`);
    return null;
  }
  
  if (data && data[0] && data[0].success) {
    createdConventionId = data[0].convention_id;
    logResult('Création RPC', true, `Convention créée (ID: ${createdConventionId})`);
    return createdConventionId;
  } else {
    logResult('Création RPC', false, `Échec: ${data?.[0]?.message || 'Erreur inconnue'}`);
    return null;
  }
}

// Test 2: Récupérer les conventions via la table
async function testGetConventionsView() {
  console.log(`\n${colors.blue}📋 Test 2: Récupération via table${colors.reset}`);
  
  const { data, error } = await supabase
    .from('conventions_tarifaires')
    .select('*, clients(raison_sociale), room_categories(name, capacity), hotels(nom)')
    .eq('client_id', VALID_CLIENT_ID)
    .order('date_debut', { ascending: false });

  if (error) {
    logResult('Récupération vue', false, `Erreur: ${error.message}`);
    return;
  }
  
  const success = data.length > 0;
  logResult('Récupération table', success, `${data.length} convention(s) trouvée(s)`, 'au moins 1', data.length);
  
  if (data.length > 0) {
    const conv = data[0];
    console.log(`   - Client: ${conv.clients?.raison_sociale || 'Non trouvé'}`);
    console.log(`   - Catégorie: ${conv.room_categories?.name || 'Non trouvé'}`);
    console.log(`   - Prix défaut: ${conv.prix_defaut}€`);
    console.log(`   - Prix juillet: ${conv.prix_juillet || 'Non défini'}€`);
    console.log(`   - Active: ${conv.active ? 'Oui' : 'Non'}`);
  }
}

// Test 3: Calcul des prix pour différentes dates
async function testPriceCalculation() {
  console.log(`\n${colors.blue}💰 Test 3: Calcul des prix${colors.reset}`);
  
  // Test prix juillet (devrait être 130)
  let { data, error } = await supabase.rpc('get_convention_price', {
    p_client_id: VALID_CLIENT_ID,
    p_category_id: VALID_CATEGORY_ID,
    p_date: '2024-07-15',
    p_month: null
  });
  
  if (error) {
    logResult('Prix juillet', false, `Erreur: ${error.message}`);
  } else {
    const success = data === 130;
    logResult('Prix juillet', success, `Prix obtenu: ${data}€`, '130€', `${data}€`);
  }
  
  // Test prix mars (devrait être prix défaut 100)
  ({ data, error } = await supabase.rpc('get_convention_price', {
    p_client_id: VALID_CLIENT_ID,
    p_category_id: VALID_CATEGORY_ID,
    p_date: '2024-03-15',
    p_month: null
  }));
  
  if (error) {
    logResult('Prix mars', false, `Erreur: ${error.message}`);
  } else {
    const success = data === 100;
    logResult('Prix mars', success, `Prix obtenu: ${data}€`, '100€', `${data}€`);
  }

  // Test prix janvier avec réduction (90 - 10% = 81)
  ({ data, error } = await supabase.rpc('get_convention_price', {
    p_client_id: VALID_CLIENT_ID,
    p_category_id: VALID_CATEGORY_ID,
    p_date: '2024-01-15',
    p_month: null
  }));
  
  if (error) {
    logResult('Prix janvier', false, `Erreur: ${error.message}`);
  } else {
    const success = data === 90; // La réduction est appliquée côté application, pas dans la RPC
    logResult('Prix janvier', success, `Prix obtenu: ${data}€`, '90€', `${data}€`);
  }
}

// Test 4: Vérification des chevauchements
async function testOverlapDetection() {
  console.log(`\n${colors.blue}🔍 Test 4: Détection des chevauchements${colors.reset}`);
  
  // Devrait détecter un chevauchement avec la convention existante
  let { data, error } = await supabase.rpc('check_convention_overlap', {
    p_client_id: VALID_CLIENT_ID,
    p_category_id: VALID_CATEGORY_ID,
    p_date_debut: '2024-06-01',
    p_date_fin: '2024-08-31',
    p_exclude_id: null
  });
  
  if (error) {
    logResult('Détection chevauchement', false, `Erreur: ${error.message}`);
  } else {
    const success = data === true;
    logResult('Détection chevauchement', success, `Chevauchement détecté: ${data}`, 'true', `${data}`);
  }
  
  // Ne devrait pas détecter de chevauchement pour 2025
  ({ data, error } = await supabase.rpc('check_convention_overlap', {
    p_client_id: VALID_CLIENT_ID,
    p_category_id: VALID_CATEGORY_ID,
    p_date_debut: '2025-01-01',
    p_date_fin: '2025-12-31',
    p_exclude_id: null
  }));
  
  if (error) {
    logResult('Aucun chevauchement', false, `Erreur: ${error.message}`);
  } else {
    const success = data === false;
    logResult('Aucun chevauchement', success, `Chevauchement détecté: ${data}`, 'false', `${data}`);
  }
}

// Test 5: Modification d'une convention
async function testUpdateConvention() {
  console.log(`\n${colors.blue}✏️ Test 5: Modification de convention${colors.reset}`);
  
  if (!createdConventionId) {
    logResult('Modification', false, 'Aucune convention à modifier');
    return;
  }
  
  const { data, error } = await supabase.rpc('upsert_convention_tarifaire', {
    p_client_id: VALID_CLIENT_ID,
    p_category_id: VALID_CATEGORY_ID,
    p_hotel_id: VALID_HOTEL_ID,
    p_date_debut: '2024-01-01',
    p_date_fin: '2024-12-31',
    p_prix_defaut: 120,
    p_prix_mensuel: JSON.stringify({
      juillet: 150,
      aout: 150
    }),
    p_reduction_pourcentage: null,
    p_forfait_mensuel: null,
    p_conditions: 'Convention modifiée',
    p_active: true,
    p_id: createdConventionId
  });
  
  if (error) {
    logResult('Modification', false, `Erreur: ${error.message}`);
    return;
  }
  
  if (data && data[0] && data[0].success) {
    logResult('Modification', true, 'Convention modifiée avec succès');
    
    // Vérifier la modification
    const { data: checkData, error: checkError } = await supabase.rpc('get_convention_price', {
      p_client_id: VALID_CLIENT_ID,
      p_category_id: VALID_CATEGORY_ID,
      p_date: '2024-07-15',
      p_month: null
    });
    
    if (!checkError && checkData === 150) {
      logResult('Vérification modification', true, `Prix juillet mis à jour: ${checkData}€`, '150€', `${checkData}€`);
    } else {
      logResult('Vérification modification', false, `Prix juillet incorrect: ${checkData}€`, '150€', `${checkData}€`);
    }
  } else {
    logResult('Modification', false, `Échec: ${data?.[0]?.message || 'Erreur inconnue'}`);
  }
}

// Test 6: Test avec forfait mensuel
async function testMonthlyForfait() {
  console.log(`\n${colors.blue}🏷️ Test 6: Forfait mensuel${colors.reset}`);
  
  const { data, error } = await supabase.rpc('upsert_convention_tarifaire', {
    p_client_id: VALID_CLIENT_ID,
    p_category_id: VALID_CATEGORY_ID + 1, // Différente catégorie
    p_hotel_id: VALID_HOTEL_ID,
    p_date_debut: '2024-01-01',
    p_date_fin: '2024-12-31',
    p_prix_defaut: 80,
    p_prix_mensuel: null,
    p_reduction_pourcentage: null,
    p_forfait_mensuel: 1800,
    p_conditions: 'Forfait mensuel test',
    p_active: true,
    p_id: null
  });

  if (error) {
    logResult('Forfait mensuel', false, `Erreur: ${error.message}`);
    return null;
  }
  
  if (data && data[0] && data[0].success) {
    logResult('Forfait mensuel', true, `Convention forfait créée (ID: ${data[0].convention_id})`);
    return data[0].convention_id;
  }
  return null;
}

// Test 7: Suppression d'une convention
async function testDeleteConvention() {
  console.log(`\n${colors.blue}🗑️ Test 7: Suppression${colors.reset}`);
  
  if (!createdConventionId) {
    logResult('Suppression', false, 'Aucune convention à supprimer');
    return;
  }
  
  const { error } = await supabase
    .from('conventions_tarifaires')
    .delete()
    .eq('id', createdConventionId);
  
  if (error) {
    logResult('Suppression', false, `Erreur: ${error.message}`);
  } else {
    logResult('Suppression', true, 'Convention supprimée avec succès');
  }
}

// Test 8: Génération de données de test via l'API
async function testGenerateTestData() {
  console.log(`\n${colors.blue}🎯 Test 8: Génération de données de test${colors.reset}`);
  
  const testData = [
    {
      client_id: VALID_CLIENT_ID,
      category_id: VALID_CATEGORY_ID,
      hotel_id: VALID_HOTEL_ID,
      date_debut: '2024-01-01',
      date_fin: '2024-12-31',
      prix_defaut: 80,
      prix_mensuel: {
        janvier: 75,
        fevrier: 75,
        juillet: 120,
        aout: 120
      },
      reduction_pourcentage: 10,
      conditions: 'Tarif préférentiel - Test',
      active: true
    }
  ];

  let successCount = 0;
  for (const data of testData) {
    const { data: result, error } = await supabase.rpc('upsert_convention_tarifaire', {
      p_client_id: data.client_id,
      p_category_id: data.category_id,
      p_hotel_id: data.hotel_id,
      p_date_debut: data.date_debut,
      p_date_fin: data.date_fin,
      p_prix_defaut: data.prix_defaut,
      p_prix_mensuel: JSON.stringify(data.prix_mensuel),
      p_reduction_pourcentage: data.reduction_pourcentage,
      p_forfait_mensuel: data.forfait_mensuel || null,
      p_conditions: data.conditions,
      p_active: data.active,
      p_id: null
    });

    if (!error && result && result[0] && result[0].success) {
      successCount++;
    }
  }
  
  const success = successCount === testData.length;
  logResult('Génération données test', success, `${successCount}/${testData.length} conventions créées`, testData.length, successCount);
}

// Fonction principale
async function runComprehensiveTests() {
  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.cyan}🚀 TESTS COMPLETS - Conventions Tarifaires${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  
  try {
    // Nettoyage initial
    await cleanupTestData();
    
    // Exécution des tests
    await testCreateConventionRPC();
    await testGetConventionsView();
    await testPriceCalculation();
    await testOverlapDetection();
    await testUpdateConvention();
    const forfaitId = await testMonthlyForfait();
    await testGenerateTestData();
    await testDeleteConvention();
    
    // Nettoyage final
    await cleanupTestData();
    
    // Rapport final
    console.log(`\n${colors.cyan}${'='.repeat(70)}${colors.reset}`);
    console.log(`${colors.cyan}📊 RAPPORT FINAL${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}`);
    
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Total des tests: ${totalTests}`);
    console.log(`${colors.green}Tests réussis: ${passedTests}${colors.reset}`);
    console.log(`${colors.red}Tests échoués: ${failedTests}${colors.reset}`);
    console.log(`Taux de réussite: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log(`\n${colors.red}❌ Tests échoués:${colors.reset}`);
      testResults.filter(r => !r.success).forEach(test => {
        console.log(`   - ${test.test}: ${test.message}`);
      });
    }
    
    console.log(`\n${colors.cyan}✨ Tests terminés!${colors.reset}`);
    
    // Retourner les résultats pour analyse
    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: (passedTests / totalTests) * 100,
      results: testResults
    };
    
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de l'exécution des tests:${colors.reset}`, error);
    throw error;
  }
}

// Lancer les tests
if (require.main === module) {
  runComprehensiveTests()
    .then(results => {
      process.exit(results.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveTests };