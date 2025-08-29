/**
 * Test pas-à-pas pour comprendre le parsing JSON
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function stepByStepDebug() {
  console.log('🔍 Debug pas-à-pas de upsert_convention_tarifaire');
  
  const CLIENT_ID = 11; // Entreprise
  
  // Test avec JSON object et vérification immédiate
  console.log('\n1. Test avec objet JSON et vérification immédiate...');
  
  const jsonData = {
    janvier: 90,
    juillet: 130
  };
  
  console.log('Données JSON à envoyer:', JSON.stringify(jsonData));
  
  const { data: result, error } = await supabase.rpc('upsert_convention_tarifaire', {
    p_client_id: CLIENT_ID,
    p_category_id: 1,
    p_hotel_id: 1,
    p_date_debut: '2024-01-01',
    p_date_fin: '2024-12-31',
    p_prix_defaut: 100,
    p_prix_mensuel: jsonData, // Objet JavaScript direct
    p_reduction_pourcentage: null,
    p_forfait_mensuel: null,
    p_conditions: 'Debug step by step',
    p_active: true,
    p_id: null
  });

  if (error) {
    console.log(`❌ Erreur RPC: ${error.message}`);
    return;
  }

  if (!result || !result[0] || !result[0].success) {
    console.log(`❌ Échec RPC: ${result?.[0]?.message || 'Erreur inconnue'}`);
    return;
  }

  const conventionId = result[0].convention_id;
  console.log(`✅ RPC réussie: Convention ID ${conventionId}`);

  // Immédiatement après création, vérifier les données
  console.log('\n2. Vérification immédiate des données stockées...');
  
  const { data: rawData, error: rawError } = await supabase
    .from('conventions_tarifaires')
    .select('*')
    .eq('id', conventionId)
    .single();

  if (rawError) {
    console.log(`❌ Erreur lecture raw: ${rawError.message}`);
  } else {
    console.log('Données brutes:', JSON.stringify({
      id: rawData.id,
      prix_defaut: rawData.prix_defaut,
      prix_janvier: rawData.prix_janvier,
      prix_juillet: rawData.prix_juillet,
      prix_mensuel: rawData.prix_mensuel
    }, null, 2));
  }

  // Test via la table avec relations
  console.log('\n3. Vérification via la table avec relations...');
  
  const { data: viewData, error: viewError } = await supabase
    .from('conventions_tarifaires')
    .select('*, clients(raison_sociale), room_categories(name, capacity), hotels(nom)')
    .eq('id', conventionId)
    .single();

  if (viewError) {
    console.log(`❌ Erreur table: ${viewError.message}`);
  } else {
    console.log('Données table:', JSON.stringify({
      id: viewData.id,
      prix_defaut: viewData.prix_defaut,
      prix_janvier: viewData.prix_janvier,
      prix_juillet: viewData.prix_juillet
    }, null, 2));
  }

  // Test calcul prix
  console.log('\n4. Test calcul prix...');
  
  const { data: priceJan, error: priceJanErr } = await supabase.rpc('get_convention_price', {
    p_client_id: CLIENT_ID,
    p_category_id: 1,
    p_date: '2024-01-15',
    p_month: null
  });

  const { data: priceJul, error: priceJulErr } = await supabase.rpc('get_convention_price', {
    p_client_id: CLIENT_ID,
    p_category_id: 1,
    p_date: '2024-07-15',
    p_month: null
  });

  if (priceJanErr || priceJulErr) {
    console.log(`❌ Erreurs calcul: Jan=${priceJanErr?.message}, Jul=${priceJulErr?.message}`);
  } else {
    console.log(`Prix calculés: Janvier=${priceJan}, Juillet=${priceJul}`);
    console.log(`Attendus: Janvier=90, Juillet=130`);
  }

  // Test 2: Comparaison avec mise à jour manuelle
  console.log('\n5. Mise à jour manuelle des prix...');
  
  const { error: updateError } = await supabase
    .from('conventions_tarifaires')
    .update({
      prix_janvier: 90,
      prix_juillet: 130
    })
    .eq('id', conventionId);

  if (updateError) {
    console.log(`❌ Erreur mise à jour: ${updateError.message}`);
  } else {
    console.log('✅ Mise à jour manuelle réussie');
    
    // Re-test calcul prix
    const { data: newPriceJan } = await supabase.rpc('get_convention_price', {
      p_client_id: CLIENT_ID,
      p_category_id: 1,
      p_date: '2024-01-15',
      p_month: null
    });

    const { data: newPriceJul } = await supabase.rpc('get_convention_price', {
      p_client_id: CLIENT_ID,
      p_category_id: 1,
      p_date: '2024-07-15',
      p_month: null
    });

    console.log(`Nouveaux prix calculés: Janvier=${newPriceJan}, Juillet=${newPriceJul}`);
  }

  // Nettoyage
  console.log('\n6. Nettoyage...');
  await supabase.from('conventions_tarifaires').delete().eq('id', conventionId);
  console.log('✅ Nettoyage terminé');

  // Conclusion
  console.log('\n=== CONCLUSION ===');
  console.log('1. La fonction RPC crée bien la convention');
  console.log('2. Les prix mensuels individuels ne sont PAS extraits du JSON');
  console.log('3. La fonction get_convention_price utilise les colonnes individuelles');
  console.log('4. Problème: Le parsing JSON dans la fonction SQL');
}

stepByStepDebug().catch(console.error);