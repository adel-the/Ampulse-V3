/**
 * Test de débogage pour les prix mensuels
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const VALID_CLIENT_ID = 11; // TECH SOLUTIONS (Entreprise)
const VALID_CATEGORY_ID = 1; // Studio
const VALID_HOTEL_ID = 1; // Résidence de Développement

async function debugPricing() {
  console.log('🔍 Debug des prix mensuels');
  
  // 1. Créer une convention avec prix mensuels
  console.log('\n1. Création d\'une convention avec prix mensuels...');
  const { data: createResult, error: createError } = await supabase.rpc('upsert_convention_tarifaire', {
    p_client_id: VALID_CLIENT_ID,
    p_category_id: VALID_CATEGORY_ID,
    p_hotel_id: VALID_HOTEL_ID,
    p_date_debut: '2024-01-01',
    p_date_fin: '2024-12-31',
    p_prix_defaut: 100,
    p_prix_mensuel: JSON.stringify({
      janvier: 90,
      fevrier: 95,
      juillet: 130,
      aout: 135
    }),
    p_reduction_pourcentage: 10,
    p_forfait_mensuel: null,
    p_conditions: 'Debug prix mensuels',
    p_active: true,
    p_id: null
  });

  if (createError) {
    console.error('Erreur création:', createError);
    return;
  }
  
  const conventionId = createResult?.[0]?.convention_id;
  console.log('✅ Convention créée avec ID:', conventionId);

  // 2. Vérifier les données stockées
  console.log('\n2. Vérification des données stockées...');
  const { data: storedData, error: storedError } = await supabase
    .from('conventions_tarifaires')
    .select('*, clients(raison_sociale), room_categories(name, capacity), hotels(nom)')
    .eq('id', conventionId);
  
  if (storedError) {
    console.error('Erreur lecture:', storedError);
  } else if (storedData.length > 0) {
    console.log('Données stockées:', JSON.stringify(storedData[0], null, 2));
  }

  // 3. Tester la fonction get_convention_price pour différents mois
  console.log('\n3. Test des prix par mois...');
  const testMonths = [
    { month: 'janvier', date: '2024-01-15', expected: 90 },
    { month: 'février', date: '2024-02-15', expected: 95 },
    { month: 'mars', date: '2024-03-15', expected: 100 }, // prix défaut
    { month: 'juillet', date: '2024-07-15', expected: 130 },
    { month: 'août', date: '2024-08-15', expected: 135 }
  ];

  for (const test of testMonths) {
    const { data: priceData, error: priceError } = await supabase.rpc('get_convention_price', {
      p_client_id: VALID_CLIENT_ID,
      p_category_id: VALID_CATEGORY_ID,
      p_date: test.date,
      p_month: null
    });
    
    if (priceError) {
      console.error(`❌ Erreur ${test.month}:`, priceError);
    } else {
      const status = priceData === test.expected ? '✅' : '❌';
      console.log(`${status} ${test.month}: ${priceData}€ (attendu: ${test.expected}€)`);
    }
  }

  // 4. Vérifier le contenu raw de la table
  console.log('\n4. Contenu raw de la table...');
  const { data: rawData, error: rawError } = await supabase
    .from('conventions_tarifaires')
    .select('*')
    .eq('id', conventionId);
  
  if (rawError) {
    console.error('Erreur raw:', rawError);
  } else if (rawData.length > 0) {
    console.log('Prix mensuel JSON:', rawData[0].prix_mensuel);
  }

  // 5. Tester avec des numéros de mois explicites
  console.log('\n5. Test avec numéros de mois explicites...');
  for (let month = 1; month <= 12; month++) {
    const { data: monthPrice, error: monthError } = await supabase.rpc('get_convention_price', {
      p_client_id: VALID_CLIENT_ID,
      p_category_id: VALID_CATEGORY_ID,
      p_date: '2024-01-01',
      p_month: month
    });
    
    if (!monthError) {
      console.log(`Mois ${month}: ${monthPrice}€`);
    }
  }

  // Nettoyage
  console.log('\n6. Nettoyage...');
  await supabase.from('conventions_tarifaires').delete().eq('id', conventionId);
  console.log('✅ Nettoyage terminé');
}

debugPricing().catch(console.error);