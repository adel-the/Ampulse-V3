/**
 * Test pour déboguer la fonction upsert_convention_tarifaire
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function debugUpsertFunction() {
  console.log('🔍 Debug de la fonction upsert_convention_tarifaire');
  
  // Test avec différents types de clients
  const testCases = [
    { clientId: 1, clientType: 'Particulier', nom: 'Dubois' },
    { clientId: 11, clientType: 'Entreprise', nom: 'TECH SOLUTIONS' },
    { clientId: 12, clientType: 'Association', nom: 'SOLIDARITE PLUS' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n--- Test avec ${testCase.nom} (${testCase.clientType}) ---`);
    
    // Test 1: Appel direct de la fonction RPC
    const { data: result, error } = await supabase.rpc('upsert_convention_tarifaire', {
      p_client_id: testCase.clientId,
      p_category_id: 1,
      p_hotel_id: 1,
      p_date_debut: '2024-01-01',
      p_date_fin: '2024-12-31',
      p_prix_defaut: 100,
      p_prix_mensuel: JSON.stringify({
        janvier: 90,
        juillet: 130
      }),
      p_reduction_pourcentage: 10,
      p_forfait_mensuel: null,
      p_conditions: `Test ${testCase.clientType}`,
      p_active: true,
      p_id: null
    });

    if (error) {
      console.log(`❌ Erreur pour ${testCase.clientType}: ${error.message}`);
    } else if (result && result[0]) {
      const res = result[0];
      if (res.success) {
        console.log(`✅ Succès pour ${testCase.clientType}: Convention ID ${res.convention_id}`);
        
        // Vérifier les données stockées
        const { data: storedData, error: storeError } = await supabase
          .from('conventions_tarifaires')
          .select('*')
          .eq('id', res.convention_id);
        
        if (storeError) {
          console.log(`❌ Erreur lecture: ${storeError.message}`);
        } else if (storedData.length > 0) {
          console.log(`   Prix janvier stocké: ${storedData[0].prix_janvier}`);
          console.log(`   Prix juillet stocké: ${storedData[0].prix_juillet}`);
          console.log(`   Prix mensuel JSON: ${storedData[0].prix_mensuel}`);
        }
        
        // Tester le calcul de prix
        const { data: priceJan, error: priceJanErr } = await supabase.rpc('get_convention_price', {
          p_client_id: testCase.clientId,
          p_category_id: 1,
          p_date: '2024-01-15',
          p_month: null
        });
        
        const { data: priceJul, error: priceJulErr } = await supabase.rpc('get_convention_price', {
          p_client_id: testCase.clientId,
          p_category_id: 1,
          p_date: '2024-07-15',
          p_month: null
        });
        
        if (!priceJanErr && !priceJulErr) {
          console.log(`   Prix calculé janvier: ${priceJan}`);
          console.log(`   Prix calculé juillet: ${priceJul}`);
        }
        
        // Nettoyage
        await supabase.from('conventions_tarifaires').delete().eq('id', res.convention_id);
        console.log(`   ✅ Nettoyage effectué`);
      } else {
        console.log(`❌ Échec pour ${testCase.clientType}: ${res.message}`);
      }
    }
  }

  // Test avec JSON invalide
  console.log('\n--- Test avec JSON invalide ---');
  const { data: invalidResult, error: invalidError } = await supabase.rpc('upsert_convention_tarifaire', {
    p_client_id: 11,
    p_category_id: 1,
    p_hotel_id: 1,
    p_date_debut: '2024-01-01',
    p_date_fin: '2024-12-31',
    p_prix_defaut: 100,
    p_prix_mensuel: 'invalid_json',
    p_reduction_pourcentage: 10,
    p_forfait_mensuel: null,
    p_conditions: 'Test JSON invalide',
    p_active: true,
    p_id: null
  });

  if (invalidError) {
    console.log(`❌ Erreur JSON invalide: ${invalidError.message}`);
  } else {
    console.log(`✅ JSON invalide géré: ${JSON.stringify(invalidResult)}`);
  }

  // Test avec JSONB null
  console.log('\n--- Test avec JSONB null ---');
  const { data: nullResult, error: nullError } = await supabase.rpc('upsert_convention_tarifaire', {
    p_client_id: 11,
    p_category_id: 1,
    p_hotel_id: 1,
    p_date_debut: '2024-01-01',
    p_date_fin: '2024-12-31',
    p_prix_defaut: 100,
    p_prix_mensuel: null,
    p_reduction_pourcentage: 10,
    p_forfait_mensuel: null,
    p_conditions: 'Test JSONB null',
    p_active: true,
    p_id: null
  });

  if (nullError) {
    console.log(`❌ Erreur JSONB null: ${nullError.message}`);
  } else if (nullResult && nullResult[0] && nullResult[0].success) {
    console.log(`✅ JSONB null géré: Convention ID ${nullResult[0].convention_id}`);
    // Nettoyage
    await supabase.from('conventions_tarifaires').delete().eq('id', nullResult[0].convention_id);
  }
}

debugUpsertFunction().catch(console.error);