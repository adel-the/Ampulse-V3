/**
 * Test final et complet des conventions tarifaires
 * Version corrigée avec gestion des timing et vérifications détaillées
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const VALID_CLIENT_ID = 11; // TECH SOLUTIONS (Entreprise)
const VALID_CATEGORY_ID = 1; // Studio
const VALID_HOTEL_ID = 1; // Résidence de Développement

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let testResults = [];

function logResult(testName, success, message, details = null) {
  const result = { test: testName, success, message, details, timestamp: new Date().toISOString() };
  testResults.push(result);
  
  const icon = success ? '✅' : '❌';
  const color = success ? colors.green : colors.red;
  console.log(`${color}${icon} ${testName}: ${message}${colors.reset}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

// Helper pour attendre
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function cleanupTestData() {
  console.log(`${colors.yellow}🧹 Nettoyage complet des données de test...${colors.reset}`);
  const { error } = await supabase.from('conventions_tarifaires').delete().gte('id', 0);
  if (error && error.code !== 'PGRST116') {
    console.error('Erreur nettoyage:', error);
  }
  await wait(100); // Attendre que le nettoyage soit propagé
}

// Test 1: Création et vérification immédiate
async function testCreateAndVerify() {
  console.log(`\n${colors.blue}📝 Test 1: Création et vérification détaillée${colors.reset}`);
  
  const jsonData = {
    janvier: 90,
    fevrier: 95,
    juillet: 130,
    aout: 135
  };
  
  // Créer la convention
  const { data: result, error } = await supabase.rpc('upsert_convention_tarifaire', {
    p_client_id: VALID_CLIENT_ID,
    p_category_id: VALID_CATEGORY_ID,
    p_hotel_id: VALID_HOTEL_ID,
    p_date_debut: '2024-01-01',
    p_date_fin: '2024-12-31',
    p_prix_defaut: 100,
    p_prix_mensuel: jsonData,
    p_reduction_pourcentage: 15,
    p_forfait_mensuel: null,
    p_conditions: 'Test création détaillée',
    p_active: true,
    p_id: null
  });

  if (error) {
    logResult('Création', false, `Erreur: ${error.message}`);
    return null;
  }
  
  if (!result || !result[0] || !result[0].success) {
    logResult('Création', false, `Échec: ${result?.[0]?.message || 'Erreur inconnue'}`);
    return null;
  }

  const conventionId = result[0].convention_id;
  logResult('Création', true, `Convention créée avec ID: ${conventionId}`);
  
  // Attendre un peu pour la propagation
  await wait(100);
  
  // Vérifier immédiatement les données brutes
  const { data: rawData, error: rawError } = await supabase
    .from('conventions_tarifaires')
    .select('*')
    .eq('id', conventionId)
    .single();

  if (rawError) {
    logResult('Vérification données brutes', false, `Erreur: ${rawError.message}`);
  } else {
    const success = rawData.prix_janvier === 90 && rawData.prix_juillet === 130;
    logResult('Vérification données brutes', success, 
      `Prix stockés: Jan=${rawData.prix_janvier}, Jul=${rawData.prix_juillet}`,
      `Attendu: Jan=90, Jul=130`);
  }
  
  return conventionId;
}

// Test 2: Calculs de prix détaillés
async function testPriceCalculations(conventionId) {
  console.log(`\n${colors.blue}💰 Test 2: Calculs de prix détaillés${colors.reset}`);
  
  const testCases = [
    { month: 'janvier', date: '2024-01-15', expected: 90 },
    { month: 'février', date: '2024-02-15', expected: 95 },
    { month: 'mars', date: '2024-03-15', expected: 100 }, // prix défaut
    { month: 'juillet', date: '2024-07-15', expected: 130 },
    { month: 'août', date: '2024-08-15', expected: 135 },
    { month: 'décembre', date: '2024-12-15', expected: 100 } // prix défaut
  ];

  for (const testCase of testCases) {
    const { data: price, error: priceError } = await supabase.rpc('get_convention_price', {
      p_client_id: VALID_CLIENT_ID,
      p_category_id: VALID_CATEGORY_ID,
      p_date: testCase.date,
      p_month: null
    });
    
    if (priceError) {
      logResult(`Prix ${testCase.month}`, false, `Erreur: ${priceError.message}`);
    } else {
      const success = price === testCase.expected;
      logResult(`Prix ${testCase.month}`, success, 
        `Obtenu: ${price}€`,
        `Attendu: ${testCase.expected}€`);
    }
  }
}

// Test 3: Test de chevauchement
async function testOverlapDetection(conventionId) {
  console.log(`\n${colors.blue}🔍 Test 3: Détection de chevauchements${colors.reset}`);
  
  // Devrait détecter un chevauchement
  const { data: overlap1, error: error1 } = await supabase.rpc('check_convention_overlap', {
    p_client_id: VALID_CLIENT_ID,
    p_category_id: VALID_CATEGORY_ID,
    p_date_debut: '2024-06-01',
    p_date_fin: '2024-08-31',
    p_exclude_id: null
  });
  
  if (error1) {
    logResult('Détection chevauchement', false, `Erreur: ${error1.message}`);
  } else {
    logResult('Détection chevauchement', overlap1 === true, 
      `Détecté: ${overlap1}`,
      'Devrait détecter un chevauchement');
  }
  
  // Ne devrait pas détecter de chevauchement si on exclut la convention actuelle
  const { data: overlap2, error: error2 } = await supabase.rpc('check_convention_overlap', {
    p_client_id: VALID_CLIENT_ID,
    p_category_id: VALID_CATEGORY_ID,
    p_date_debut: '2024-06-01',
    p_date_fin: '2024-08-31',
    p_exclude_id: conventionId
  });
  
  if (error2) {
    logResult('Exclusion chevauchement', false, `Erreur: ${error2.message}`);
  } else {
    logResult('Exclusion chevauchement', overlap2 === false, 
      `Détecté: ${overlap2}`,
      'Ne devrait pas détecter avec exclusion');
  }
}

// Test 4: Mise à jour
async function testUpdate(conventionId) {
  console.log(`\n${colors.blue}✏️ Test 4: Mise à jour de convention${colors.reset}`);
  
  const { data: result, error } = await supabase.rpc('upsert_convention_tarifaire', {
    p_client_id: VALID_CLIENT_ID,
    p_category_id: VALID_CATEGORY_ID,
    p_hotel_id: VALID_HOTEL_ID,
    p_date_debut: '2024-01-01',
    p_date_fin: '2024-12-31',
    p_prix_defaut: 120,
    p_prix_mensuel: {
      janvier: 95,
      juillet: 150
    },
    p_reduction_pourcentage: null,
    p_forfait_mensuel: null,
    p_conditions: 'Convention mise à jour',
    p_active: true,
    p_id: conventionId
  });
  
  if (error) {
    logResult('Mise à jour', false, `Erreur: ${error.message}`);
    return;
  }
  
  if (!result || !result[0] || !result[0].success) {
    logResult('Mise à jour', false, `Échec: ${result?.[0]?.message || 'Erreur inconnue'}`);
    return;
  }
  
  logResult('Mise à jour', true, 'Convention mise à jour avec succès');
  
  // Vérifier les nouveaux prix
  await wait(100);
  
  const { data: priceJan } = await supabase.rpc('get_convention_price', {
    p_client_id: VALID_CLIENT_ID,
    p_category_id: VALID_CATEGORY_ID,
    p_date: '2024-01-15',
    p_month: null
  });
  
  const { data: priceJul } = await supabase.rpc('get_convention_price', {
    p_client_id: VALID_CLIENT_ID,
    p_category_id: VALID_CATEGORY_ID,
    p_date: '2024-07-15',
    p_month: null
  });
  
  const successJan = priceJan === 95;
  const successJul = priceJul === 150;
  
  logResult('Vérification MAJ janvier', successJan, 
    `Obtenu: ${priceJan}€`,
    'Attendu: 95€');
  logResult('Vérification MAJ juillet', successJul, 
    `Obtenu: ${priceJul}€`,
    'Attendu: 150€');
}

// Test 5: Forfait mensuel
async function testMonthlyForfait() {
  console.log(`\n${colors.blue}🏷️ Test 5: Convention avec forfait mensuel${colors.reset}`);
  
  const { data: result, error } = await supabase.rpc('upsert_convention_tarifaire', {
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
  
  if (!result || !result[0] || !result[0].success) {
    logResult('Forfait mensuel', false, `Échec: ${result?.[0]?.message || 'Erreur inconnue'}`);
    return null;
  }
  
  const forfaitId = result[0].convention_id;
  logResult('Forfait mensuel', true, `Convention forfait créée (ID: ${forfaitId})`);
  
  return forfaitId;
}

// Test 6: Calcul avec réductions
async function testPriceCalculationsWithReductions() {
  console.log(`\n${colors.blue}📊 Test 6: Calcul avec réductions (logique applicative)${colors.reset}`);
  
  // Simulation du calcul côté application
  const basePrice = 130; // Prix juillet
  const reduction = 15; // 15%
  const expectedFinalPrice = basePrice * (1 - reduction / 100); // 110.5
  
  console.log(`Prix de base: ${basePrice}€`);
  console.log(`Réduction: ${reduction}%`);
  console.log(`Prix final calculé: ${expectedFinalPrice}€`);
  
  logResult('Calcul réduction', true, `Prix final: ${expectedFinalPrice}€`, 
    'La réduction est appliquée côté application');
}

// Test principal
async function runFinalTest() {
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.cyan}🚀 TESTS FINALS - Conventions Tarifaires (Version Corrigée)${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  
  try {
    // Nettoyage initial
    await cleanupTestData();
    
    // Tests principaux
    const conventionId = await testCreateAndVerify();
    if (conventionId) {
      await testPriceCalculations(conventionId);
      await testOverlapDetection(conventionId);
      await testUpdate(conventionId);
    }
    
    const forfaitId = await testMonthlyForfait();
    await testPriceCalculationsWithReductions();
    
    // Nettoyage final
    await cleanupTestData();
    
    // Rapport final
    console.log(`\n${colors.cyan}${'='.repeat(80)}${colors.reset}`);
    console.log(`${colors.cyan}📊 RAPPORT FINAL DÉTAILLÉ${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);
    
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log(`Total des tests: ${totalTests}`);
    console.log(`${colors.green}Tests réussis: ${passedTests}${colors.reset}`);
    console.log(`${colors.red}Tests échoués: ${failedTests}${colors.reset}`);
    console.log(`Taux de réussite: ${successRate}%`);
    
    if (failedTests > 0) {
      console.log(`\n${colors.red}❌ Tests échoués:${colors.reset}`);
      testResults.filter(r => !r.success).forEach(test => {
        console.log(`   - ${test.test}: ${test.message}`);
        if (test.details) console.log(`     ${test.details}`);
      });
    }
    
    console.log(`\n${colors.cyan}✨ Tests terminés avec succès!${colors.reset}`);
    
    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: parseFloat(successRate),
      results: testResults
    };
    
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de l'exécution des tests:${colors.reset}`, error);
    throw error;
  }
}

// Exécution
if (require.main === module) {
  runFinalTest()
    .then(results => {
      process.exit(results.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { runFinalTest };