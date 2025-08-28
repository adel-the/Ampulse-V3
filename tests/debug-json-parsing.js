/**
 * Test pour déboguer le parsing JSON dans la fonction PostgreSQL
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function debugJsonParsing() {
  console.log('🔍 Debug du parsing JSON dans PostgreSQL');
  
  const CLIENT_ID = 11; // Entreprise
  
  // Test 1: Tester différents formats de JSON
  const jsonTests = [
    {
      name: 'JSON stringifié normal',
      value: JSON.stringify({janvier: 90, juillet: 130})
    },
    {
      name: 'JSON avec quotes doubles',
      value: '{"janvier": 90, "juillet": 130}'
    },
    {
      name: 'Objet JavaScript direct',
      value: {janvier: 90, juillet: 130}
    },
    {
      name: 'JSONB null',
      value: null
    }
  ];
  
  for (const test of jsonTests) {
    console.log(`\n--- ${test.name} ---`);
    console.log(`Valeur envoyée: ${typeof test.value === 'string' ? test.value : JSON.stringify(test.value)}`);
    
    const { data: result, error } = await supabase.rpc('upsert_convention_tarifaire', {
      p_client_id: CLIENT_ID,
      p_category_id: 1,
      p_hotel_id: 1,
      p_date_debut: '2024-01-01',
      p_date_fin: '2024-12-31',
      p_prix_defaut: 100,
      p_prix_mensuel: test.value,
      p_reduction_pourcentage: null,
      p_forfait_mensuel: null,
      p_conditions: `Test ${test.name}`,
      p_active: true,
      p_id: null
    });

    if (error) {
      console.log(`❌ Erreur: ${error.message}`);
    } else if (result && result[0] && result[0].success) {
      const conventionId = result[0].convention_id;
      console.log(`✅ Succès: Convention ID ${conventionId}`);
      
      // Vérifier les données stockées
      const { data: storedData, error: storeError } = await supabase
        .from('conventions_tarifaires')
        .select('prix_janvier, prix_juillet, prix_mensuel')
        .eq('id', conventionId);
      
      if (storeError) {
        console.log(`❌ Erreur lecture: ${storeError.message}`);
      } else if (storedData.length > 0) {
        const stored = storedData[0];
        console.log(`   Prix janvier: ${stored.prix_janvier}`);
        console.log(`   Prix juillet: ${stored.prix_juillet}`);
        console.log(`   Prix mensuel: ${stored.prix_mensuel}`);
      }
      
      // Nettoyage
      await supabase.from('conventions_tarifaires').delete().eq('id', conventionId);
    }
  }

  // Test 2: Tester directement avec SQL
  console.log('\n--- Test direct SQL ---');
  const directSql = `
    INSERT INTO conventions_tarifaires (
      client_id, category_id, hotel_id, date_debut, date_fin,
      prix_defaut, prix_janvier, prix_juillet, conditions, active
    ) VALUES (
      ${CLIENT_ID}, 1, 1, '2024-01-01', '2024-12-31',
      100, 90, 130, 'Test SQL direct', true
    ) RETURNING id, prix_janvier, prix_juillet;
  `;

  console.log('Requête SQL:', directSql);

  try {
    const { data: directResult, error: directError } = await supabase.rpc('exec_sql', {
      sql: directSql
    });

    if (directError) {
      console.log(`❌ Erreur SQL: ${directError.message}`);
    } else {
      console.log(`✅ SQL direct: ${JSON.stringify(directResult)}`);
    }
  } catch (e) {
    console.log('SQL direct non supporté, passons au test suivant');
  }

  // Test 3: Tester manuellement l'insertion avec des valeurs fixes
  console.log('\n--- Test insertion manuelle ---');
  const { data: manualData, error: manualError } = await supabase
    .from('conventions_tarifaires')
    .insert({
      client_id: CLIENT_ID,
      category_id: 1,
      hotel_id: 1,
      date_debut: '2024-01-01',
      date_fin: '2024-12-31',
      prix_defaut: 100,
      prix_janvier: 90,
      prix_juillet: 130,
      conditions: 'Test insertion manuelle',
      active: true
    })
    .select('id, prix_janvier, prix_juillet')
    .single();

  if (manualError) {
    console.log(`❌ Erreur insertion: ${manualError.message}`);
  } else {
    console.log(`✅ Insertion manuelle: ID ${manualData.id}`);
    console.log(`   Prix janvier: ${manualData.prix_janvier}`);
    console.log(`   Prix juillet: ${manualData.prix_juillet}`);
    
    // Test du calcul de prix
    const { data: priceJan } = await supabase.rpc('get_convention_price', {
      p_client_id: CLIENT_ID,
      p_category_id: 1,
      p_date: '2024-01-15',
      p_month: null
    });
    
    const { data: priceJul } = await supabase.rpc('get_convention_price', {
      p_client_id: CLIENT_ID,
      p_category_id: 1,
      p_date: '2024-07-15',
      p_month: null
    });
    
    console.log(`   Prix calculé janvier: ${priceJan} (attendu: 90)`);
    console.log(`   Prix calculé juillet: ${priceJul} (attendu: 130)`);
    
    // Nettoyage
    await supabase.from('conventions_tarifaires').delete().eq('id', manualData.id);
    console.log('   ✅ Nettoyage effectué');
  }
}

debugJsonParsing().catch(console.error);