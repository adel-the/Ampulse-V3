const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function testRPCFunction() {
  console.log('=== Testing RPC Function ===');
  
  const { data, error } = await supabaseAdmin.rpc('upsert_convention_tarifaire', {
    p_client_id: 31,
    p_category_id: 1,
    p_hotel_id: 1,
    p_date_debut: '2024-01-01',
    p_date_fin: '2024-12-31',
    p_prix_defaut: 100,
    p_prix_mensuel: JSON.stringify({ janvier: 90, juillet: 120 }),
    p_reduction_pourcentage: 10,
    p_forfait_mensuel: null,
    p_conditions: 'Test RPC call',
    p_active: true,
    p_id: null
  });
  
  if (error) {
    console.log('❌ RPC Error:', error.message);
    console.log('Error details:', error);
  } else {
    console.log('✅ RPC Success:', data);
    
    if (data && data[0] && data[0].convention_id) {
      await supabaseAdmin.from('conventions_tarifaires').delete().eq('id', data[0].convention_id);
      console.log('🧹 Cleaned up test data');
    }
  }
}

async function checkExistingData() {
  console.log('\n=== Checking Existing Data ===');
  
  const { data, error } = await supabaseAdmin
    .from('conventions_tarifaires')
    .select('*')
    .limit(3);
    
  if (error) {
    console.log('❌ Query Error:', error.message);
  } else {
    console.log('✅ Found', data.length, 'conventions');
    data.forEach((conv, i) => {
      console.log(`\nRecord ${i+1}:`);
      console.log('- ID:', conv.id);
      console.log('- Client ID:', conv.client_id);
      console.log('- Prix défaut:', conv.prix_defaut);
      console.log('- Prix janvier:', conv.prix_janvier);
      console.log('- Prix juillet:', conv.prix_juillet);
      console.log('- Active:', conv.active);
      console.log('- Conditions:', conv.conditions || 'None');
    });
  }
}

async function testGetConventionPrice() {
  console.log('\n=== Testing get_convention_price RPC ===');
  
  const { data, error } = await supabaseAdmin.rpc('get_convention_price', {
    p_client_id: 31,
    p_category_id: 1,
    p_date: '2024-07-15',
    p_month: null
  });
  
  if (error) {
    console.log('❌ get_convention_price Error:', error.message);
  } else {
    console.log('✅ get_convention_price Success:', data);
  }
}

async function main() {
  try {
    await checkExistingData();
    await testRPCFunction();
    await testGetConventionPrice();
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

main();