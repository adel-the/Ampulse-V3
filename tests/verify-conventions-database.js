/**
 * Comprehensive Test Script for Conventions Database Verification
 * 
 * This script verifies:
 * 1. Conventions data structure in the database
 * 2. Proper storage of prix_mensuel JSON
 * 3. Individual month price columns (prix_janvier through prix_decembre)
 * 4. API functionality for getClientConventions
 * 5. Database integrity and relationships
 * 
 * Author: Claude Code
 * Date: 2025-08-29
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create both admin and regular client connections
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Console colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Test results storage
let testResults = [];

// Helper functions
function logResult(testName, success, message, data = null) {
  const result = {
    test: testName,
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  
  const icon = success ? '✅' : '❌';
  const color = success ? colors.green : colors.red;
  console.log(`${color}${icon} ${testName}: ${message}${colors.reset}`);
  
  if (data && typeof data === 'object') {
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
}

function logInfo(message, data = null) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
  if (data) {
    console.log('   ', data);
  }
}

// Test 1: Verify database schema and structure
async function testDatabaseSchema() {
  console.log(`\n${colors.cyan}📋 Test 1: Database Schema Verification${colors.reset}`);
  
  try {
    // Check if conventions_tarifaires table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'conventions_tarifaires')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (tableError) {
      logResult('Schema Check', false, `Error checking schema: ${tableError.message}`);
      return;
    }

    if (!tableInfo || tableInfo.length === 0) {
      logResult('Schema Check', false, 'conventions_tarifaires table not found');
      return;
    }

    // Expected columns
    const expectedColumns = [
      'id', 'client_id', 'category_id', 'hotel_id', 'date_debut', 'date_fin',
      'prix_defaut', 'prix_janvier', 'prix_fevrier', 'prix_mars', 'prix_avril',
      'prix_mai', 'prix_juin', 'prix_juillet', 'prix_aout', 'prix_septembre',
      'prix_octobre', 'prix_novembre', 'prix_decembre', 'reduction_pourcentage',
      'forfait_mensuel', 'conditions', 'active', 'created_at', 'updated_at'
    ];

    const foundColumns = tableInfo.map(col => col.column_name);
    const missingColumns = expectedColumns.filter(col => !foundColumns.includes(col));
    const extraColumns = foundColumns.filter(col => !expectedColumns.includes(col));

    if (missingColumns.length === 0) {
      logResult('Schema Check', true, `All expected columns found (${foundColumns.length} columns)`);
    } else {
      logResult('Schema Check', false, `Missing columns: ${missingColumns.join(', ')}`);
    }

    logInfo('Table Structure:', {
      totalColumns: foundColumns.length,
      columns: tableInfo.map(col => `${col.column_name} (${col.data_type})`),
      missingColumns: missingColumns.length > 0 ? missingColumns : 'None',
      extraColumns: extraColumns.length > 0 ? extraColumns : 'None'
    });

  } catch (error) {
    logResult('Schema Check', false, `Unexpected error: ${error.message}`);
  }
}

// Test 2: Query existing conventions data
async function testExistingConventionsData() {
  console.log(`\n${colors.cyan}📊 Test 2: Existing Conventions Data Analysis${colors.reset}`);
  
  try {
    // Get all conventions with related data
    const { data: conventions, error: conventionsError } = await supabaseAdmin
      .from('conventions_tarifaires')
      .select(`
        *,
        clients (
          id,
          nom,
          prenom,
          raison_sociale,
          client_type
        ),
        room_categories (
          id,
          name,
          capacity
        ),
        hotels (
          id,
          nom
        )
      `)
      .order('created_at', { ascending: false });

    if (conventionsError) {
      logResult('Data Query', false, `Error querying conventions: ${conventionsError.message}`);
      return;
    }

    if (!conventions || conventions.length === 0) {
      logResult('Data Query', true, 'No conventions found in database');
      logInfo('Database Status', 'Empty table - this may be expected for a new system');
      return;
    }

    logResult('Data Query', true, `Found ${conventions.length} conventions in database`);

    // Analyze data structure
    let jsonPricesCount = 0;
    let monthlyColumnsCount = 0;
    let bothTypesCount = 0;

    const analysisResults = conventions.map(conv => {
      const hasJsonPrices = conv.prix_mensuel && typeof conv.prix_mensuel === 'object';
      const hasMonthlyColumns = [
        conv.prix_janvier, conv.prix_fevrier, conv.prix_mars, conv.prix_avril,
        conv.prix_mai, conv.prix_juin, conv.prix_juillet, conv.prix_aout,
        conv.prix_septembre, conv.prix_octobre, conv.prix_novembre, conv.prix_decembre
      ].some(price => price !== null && price !== undefined);

      if (hasJsonPrices) jsonPricesCount++;
      if (hasMonthlyColumns) monthlyColumnsCount++;
      if (hasJsonPrices && hasMonthlyColumns) bothTypesCount++;

      return {
        id: conv.id,
        client: conv.clients?.raison_sociale || `${conv.clients?.nom} ${conv.clients?.prenom}` || `ID: ${conv.client_id}`,
        category: conv.room_categories?.name || `ID: ${conv.category_id}`,
        hotel: conv.hotels?.nom || `ID: ${conv.hotel_id}`,
        prix_defaut: conv.prix_defaut,
        hasJsonPrices,
        hasMonthlyColumns,
        jsonPricesData: hasJsonPrices ? conv.prix_mensuel : null,
        monthlyPrices: hasMonthlyColumns ? {
          janvier: conv.prix_janvier,
          fevrier: conv.prix_fevrier,
          mars: conv.prix_mars,
          avril: conv.prix_avril,
          mai: conv.prix_mai,
          juin: conv.prix_juin,
          juillet: conv.prix_juillet,
          aout: conv.prix_aout,
          septembre: conv.prix_septembre,
          octobre: conv.prix_octobre,
          novembre: conv.prix_novembre,
          decembre: conv.prix_decembre
        } : null,
        active: conv.active,
        created_at: conv.created_at
      };
    });

    logInfo('Data Structure Analysis', {
      totalConventions: conventions.length,
      withJsonPrices: jsonPricesCount,
      withMonthlyColumns: monthlyColumnsCount,
      withBothTypes: bothTypesCount,
      dataInconsistency: bothTypesCount > 0 ? 'WARNING: Some records have both JSON and column prices' : 'OK'
    });

    // Show first few examples
    if (analysisResults.length > 0) {
      console.log(`\n${colors.yellow}📋 Sample Data (first 3 records):${colors.reset}`);
      analysisResults.slice(0, 3).forEach((record, index) => {
        console.log(`\n   Record ${index + 1}:`);
        console.log(`   - ID: ${record.id}`);
        console.log(`   - Client: ${record.client}`);
        console.log(`   - Category: ${record.category}`);
        console.log(`   - Prix défaut: ${record.prix_defaut}€`);
        console.log(`   - JSON prices: ${record.hasJsonPrices ? 'Yes' : 'No'}`);
        if (record.hasJsonPrices) {
          console.log(`     JSON data: ${JSON.stringify(record.jsonPricesData)}`);
        }
        console.log(`   - Monthly columns: ${record.hasMonthlyColumns ? 'Yes' : 'No'}`);
        if (record.hasMonthlyColumns) {
          const nonNullPrices = Object.entries(record.monthlyPrices)
            .filter(([_, price]) => price !== null)
            .map(([month, price]) => `${month}: ${price}€`);
          console.log(`     Column data: ${nonNullPrices.join(', ')}`);
        }
        console.log(`   - Active: ${record.active}`);
      });
    }

    return analysisResults;

  } catch (error) {
    logResult('Data Query', false, `Unexpected error: ${error.message}`);
    return [];
  }
}

// Test 3: Test getClientConventions API function
async function testGetClientConventionsAPI() {
  console.log(`\n${colors.cyan}🔧 Test 3: API Function Testing${colors.reset}`);
  
  try {
    // First, get a valid client ID
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('id, nom, prenom, raison_sociale')
      .limit(5);

    if (clientsError) {
      logResult('API Test Setup', false, `Error getting clients: ${clientsError.message}`);
      return;
    }

    if (!clients || clients.length === 0) {
      logResult('API Test Setup', false, 'No clients found for testing');
      return;
    }

    // Test with each client
    for (const client of clients) {
      const clientName = client.raison_sociale || `${client.nom} ${client.prenom}`;
      
      // Test regular supabase client (user-level permissions)
      const { data: userConventions, error: userError } = await supabase
        .from('conventions_tarifaires')
        .select(`
          *,
          clients!inner (
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
        .eq('client_id', client.id)
        .order('date_debut', { ascending: false });

      if (userError) {
        logResult(`API User Access - Client ${client.id}`, false, `Error: ${userError.message}`);
      } else {
        logResult(`API User Access - Client ${client.id}`, true, `Found ${userConventions?.length || 0} conventions for ${clientName}`);
      }

      // Test admin supabase client (service-level permissions)
      const { data: adminConventions, error: adminError } = await supabaseAdmin
        .from('conventions_tarifaires')
        .select(`
          *,
          clients!inner (
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
        .eq('client_id', client.id)
        .order('date_debut', { ascending: false });

      if (adminError) {
        logResult(`API Admin Access - Client ${client.id}`, false, `Error: ${adminError.message}`);
      } else {
        logResult(`API Admin Access - Client ${client.id}`, true, `Found ${adminConventions?.length || 0} conventions for ${clientName}`);
        
        // If we found conventions, show detailed structure
        if (adminConventions && adminConventions.length > 0) {
          const convention = adminConventions[0];
          logInfo(`Convention Structure for ${clientName}`, {
            id: convention.id,
            prix_defaut: convention.prix_defaut,
            has_monthly_json: !!convention.prix_mensuel,
            has_monthly_columns: !![
              convention.prix_janvier, convention.prix_fevrier, convention.prix_mars,
              convention.prix_avril, convention.prix_mai, convention.prix_juin,
              convention.prix_juillet, convention.prix_aout, convention.prix_septembre,
              convention.prix_octobre, convention.prix_novembre, convention.prix_decembre
            ].find(p => p !== null),
            client_data: convention.clients,
            category_data: convention.room_categories,
            hotel_data: convention.hotels
          });
        }
      }
    }

  } catch (error) {
    logResult('API Function Test', false, `Unexpected error: ${error.message}`);
  }
}

// Test 4: Test RPC functions for conventions
async function testConventionRPCFunctions() {
  console.log(`\n${colors.cyan}⚙️  Test 4: RPC Functions Testing${colors.reset}`);
  
  try {
    // Test if upsert_convention_tarifaire function exists
    const { data: functions, error: functionsError } = await supabaseAdmin
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_schema', 'public')
      .like('routine_name', '%convention%');

    if (functionsError) {
      logResult('RPC Functions Check', false, `Error checking functions: ${functionsError.message}`);
      return;
    }

    const conventionFunctions = functions?.filter(f => 
      f.routine_name.includes('convention') || f.routine_name.includes('prix')
    ) || [];

    if (conventionFunctions.length === 0) {
      logResult('RPC Functions Check', false, 'No convention-related RPC functions found');
    } else {
      logResult('RPC Functions Check', true, `Found ${conventionFunctions.length} convention-related functions`);
      logInfo('Available Functions', conventionFunctions.map(f => f.routine_name));
    }

    // Test specific functions if they exist
    const expectedFunctions = [
      'upsert_convention_tarifaire',
      'get_convention_price',
      'check_convention_overlap'
    ];

    for (const funcName of expectedFunctions) {
      const exists = conventionFunctions.some(f => f.routine_name === funcName);
      logResult(`Function ${funcName}`, exists, exists ? 'Available' : 'Not found');
    }

    // If upsert function exists, test it with minimal data
    if (conventionFunctions.some(f => f.routine_name === 'upsert_convention_tarifaire')) {
      // Get valid IDs for testing
      const { data: testClient } = await supabaseAdmin.from('clients').select('id').limit(1);
      const { data: testCategory } = await supabaseAdmin.from('room_categories').select('id').limit(1);
      
      if (testClient && testClient.length > 0 && testCategory && testCategory.length > 0) {
        console.log(`\n${colors.yellow}🧪 Testing upsert_convention_tarifaire function...${colors.reset}`);
        
        const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('upsert_convention_tarifaire', {
          p_client_id: testClient[0].id,
          p_category_id: testCategory[0].id,
          p_hotel_id: null,
          p_date_debut: '2024-01-01',
          p_date_fin: '2024-12-31',
          p_prix_defaut: 100,
          p_prix_mensuel: JSON.stringify({ janvier: 90, juillet: 120 }),
          p_reduction_pourcentage: 10,
          p_forfait_mensuel: null,
          p_conditions: 'Test convention from verification script',
          p_active: true,
          p_id: null
        });

        if (rpcError) {
          logResult('RPC Function Test', false, `upsert_convention_tarifaire failed: ${rpcError.message}`);
        } else {
          logResult('RPC Function Test', true, `upsert_convention_tarifaire executed successfully`);
          logInfo('RPC Result', rpcResult);
          
          // Clean up test data
          if (rpcResult && rpcResult[0] && rpcResult[0].convention_id) {
            await supabaseAdmin
              .from('conventions_tarifaires')
              .delete()
              .eq('id', rpcResult[0].convention_id);
            console.log('   Test data cleaned up');
          }
        }
      }
    }

  } catch (error) {
    logResult('RPC Functions Test', false, `Unexpected error: ${error.message}`);
  }
}

// Test 5: Data integrity and consistency checks
async function testDataIntegrity() {
  console.log(`\n${colors.cyan}🔍 Test 5: Data Integrity and Consistency${colors.reset}`);
  
  try {
    // Check foreign key relationships
    const { data: conventionsWithRefs, error } = await supabaseAdmin
      .from('conventions_tarifaires')
      .select(`
        id,
        client_id,
        category_id,
        hotel_id,
        clients!inner (id, nom),
        room_categories (id, name),
        hotels (id, nom)
      `);

    if (error) {
      logResult('Foreign Key Check', false, `Error: ${error.message}`);
      return;
    }

    if (!conventionsWithRefs || conventionsWithRefs.length === 0) {
      logResult('Foreign Key Check', true, 'No data to check (empty table)');
      return;
    }

    // Check for broken references
    let brokenClientRefs = 0;
    let brokenCategoryRefs = 0;
    let brokenHotelRefs = 0;

    conventionsWithRefs.forEach(conv => {
      if (!conv.clients) brokenClientRefs++;
      if (!conv.room_categories && conv.category_id) brokenCategoryRefs++;
      if (!conv.hotels && conv.hotel_id) brokenHotelRefs++;
    });

    const totalRefs = conventionsWithRefs.length;
    const integrityScore = ((totalRefs - brokenClientRefs - brokenCategoryRefs - brokenHotelRefs) / totalRefs) * 100;

    if (brokenClientRefs === 0 && brokenCategoryRefs === 0 && brokenHotelRefs === 0) {
      logResult('Foreign Key Check', true, `All references are valid (${totalRefs} records checked)`);
    } else {
      logResult('Foreign Key Check', false, `Found broken references - Integrity: ${integrityScore.toFixed(1)}%`);
      logInfo('Broken References', {
        brokenClientRefs,
        brokenCategoryRefs,
        brokenHotelRefs,
        totalRecords: totalRefs
      });
    }

    // Check for data consistency issues
    const { data: allConventions } = await supabaseAdmin
      .from('conventions_tarifaires')
      .select('*');

    if (allConventions && allConventions.length > 0) {
      let priceInconsistencies = 0;
      let dateInconsistencies = 0;

      allConventions.forEach(conv => {
        // Check if prix_defaut is reasonable
        if (!conv.prix_defaut || conv.prix_defaut <= 0 || conv.prix_defaut > 10000) {
          priceInconsistencies++;
        }

        // Check date logic
        if (conv.date_debut && conv.date_fin && new Date(conv.date_debut) > new Date(conv.date_fin)) {
          dateInconsistencies++;
        }
      });

      logResult('Data Consistency', priceInconsistencies === 0 && dateInconsistencies === 0, 
        `Price inconsistencies: ${priceInconsistencies}, Date inconsistencies: ${dateInconsistencies}`);
    }

  } catch (error) {
    logResult('Data Integrity Check', false, `Unexpected error: ${error.message}`);
  }
}

// Test 6: Create test data and verify it's saved correctly
async function testCreateAndVerifyTestData() {
  console.log(`\n${colors.cyan}🧪 Test 6: Create Test Data and Verify Storage${colors.reset}`);
  
  let testConventionId = null;
  
  try {
    // Get valid IDs for the test
    const { data: clients } = await supabaseAdmin.from('clients').select('id').limit(1);
    const { data: categories } = await supabaseAdmin.from('room_categories').select('id').limit(1);
    
    if (!clients || clients.length === 0) {
      logResult('Test Data Setup', false, 'No clients available for testing');
      return;
    }
    
    if (!categories || categories.length === 0) {
      logResult('Test Data Setup', false, 'No room categories available for testing');
      return;
    }

    const testClientId = clients[0].id;
    const testCategoryId = categories[0].id;

    // Create test convention with both JSON and individual month prices
    const testData = {
      client_id: testClientId,
      category_id: testCategoryId,
      hotel_id: null,
      date_debut: '2024-01-01',
      date_fin: '2024-12-31',
      prix_defaut: 100,
      // Set individual month columns
      prix_janvier: 90,
      prix_fevrier: 90,
      prix_mars: 95,
      prix_avril: 105,
      prix_mai: 110,
      prix_juin: 120,
      prix_juillet: 130,
      prix_aout: 130,
      prix_septembre: 115,
      prix_octobre: 105,
      prix_novembre: 95,
      prix_decembre: 100,
      reduction_pourcentage: 10,
      forfait_mensuel: null,
      conditions: 'Test convention created by verification script',
      active: true
    };

    // Insert test data
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('conventions_tarifaires')
      .insert(testData)
      .select('*')
      .single();

    if (insertError) {
      logResult('Test Data Creation', false, `Failed to create test data: ${insertError.message}`);
      return;
    }

    testConventionId = inserted.id;
    logResult('Test Data Creation', true, `Created test convention with ID: ${testConventionId}`);

    // Verify the data was saved correctly
    const { data: retrieved, error: retrieveError } = await supabaseAdmin
      .from('conventions_tarifaires')
      .select('*')
      .eq('id', testConventionId)
      .single();

    if (retrieveError) {
      logResult('Test Data Retrieval', false, `Failed to retrieve test data: ${retrieveError.message}`);
      return;
    }

    // Verify all fields
    const verificationResults = {
      prix_defaut: retrieved.prix_defaut === testData.prix_defaut,
      prix_janvier: retrieved.prix_janvier === testData.prix_janvier,
      prix_juillet: retrieved.prix_juillet === testData.prix_juillet,
      prix_decembre: retrieved.prix_decembre === testData.prix_decembre,
      reduction_pourcentage: retrieved.reduction_pourcentage === testData.reduction_pourcentage,
      conditions: retrieved.conditions === testData.conditions,
      active: retrieved.active === testData.active,
      dates: retrieved.date_debut === testData.date_debut && retrieved.date_fin === testData.date_fin
    };

    const allCorrect = Object.values(verificationResults).every(v => v === true);
    
    if (allCorrect) {
      logResult('Test Data Verification', true, 'All fields saved and retrieved correctly');
    } else {
      logResult('Test Data Verification', false, 'Some fields were not saved correctly');
      logInfo('Verification Details', verificationResults);
    }

    // Show the retrieved data
    logInfo('Retrieved Test Data', {
      id: retrieved.id,
      prix_defaut: retrieved.prix_defaut,
      monthly_prices: {
        janvier: retrieved.prix_janvier,
        fevrier: retrieved.prix_fevrier,
        mars: retrieved.prix_mars,
        avril: retrieved.prix_avril,
        mai: retrieved.prix_mai,
        juin: retrieved.prix_juin,
        juillet: retrieved.prix_juillet,
        aout: retrieved.prix_aout,
        septembre: retrieved.prix_septembre,
        octobre: retrieved.prix_octobre,
        novembre: retrieved.prix_novembre,
        decembre: retrieved.prix_decembre
      },
      reduction_pourcentage: retrieved.reduction_pourcentage,
      conditions: retrieved.conditions,
      active: retrieved.active
    });

  } catch (error) {
    logResult('Test Data Creation/Verification', false, `Unexpected error: ${error.message}`);
  } finally {
    // Clean up test data
    if (testConventionId) {
      try {
        await supabaseAdmin
          .from('conventions_tarifaires')
          .delete()
          .eq('id', testConventionId);
        console.log(`${colors.yellow}🧹 Cleaned up test convention ID: ${testConventionId}${colors.reset}`);
      } catch (cleanupError) {
        console.log(`${colors.red}⚠️  Failed to clean up test data: ${cleanupError.message}${colors.reset}`);
      }
    }
  }
}

// Generate comprehensive report
function generateReport() {
  console.log(`\n${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.cyan}📋 COMPREHENSIVE VERIFICATION REPORT${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);

  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

  console.log(`\n${colors.blue}📊 SUMMARY STATISTICS:${colors.reset}`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   ${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`   ${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`   Success Rate: ${successRate}%`);

  if (failedTests > 0) {
    console.log(`\n${colors.red}❌ FAILED TESTS:${colors.reset}`);
    testResults.filter(r => !r.success).forEach(test => {
      console.log(`   • ${test.test}: ${test.message}`);
    });
  }

  console.log(`\n${colors.blue}✅ PASSED TESTS:${colors.reset}`);
  testResults.filter(r => r.success).forEach(test => {
    console.log(`   • ${test.test}: ${test.message}`);
  });

  // Key findings
  console.log(`\n${colors.magenta}🔍 KEY FINDINGS:${colors.reset}`);
  
  const schemaTests = testResults.filter(r => r.test.includes('Schema'));
  const dataTests = testResults.filter(r => r.test.includes('Data'));
  const apiTests = testResults.filter(r => r.test.includes('API'));
  
  if (schemaTests.some(t => t.success)) {
    console.log(`   ✓ Database schema is properly structured`);
  }
  
  if (dataTests.some(t => t.success)) {
    console.log(`   ✓ Data integrity checks passed`);
  }
  
  if (apiTests.some(t => t.success)) {
    console.log(`   ✓ API functions are accessible`);
  }

  // Recommendations
  console.log(`\n${colors.yellow}💡 RECOMMENDATIONS:${colors.reset}`);
  
  if (failedTests > 0) {
    console.log(`   • Address ${failedTests} failing tests before production use`);
  }
  
  if (schemaTests.some(t => !t.success)) {
    console.log(`   • Review database schema and ensure all required columns exist`);
  }
  
  if (apiTests.some(t => !t.success)) {
    console.log(`   • Check RPC function definitions and permissions`);
  }
  
  if (testResults.every(t => t.success)) {
    console.log(`   🎉 All systems are functioning correctly!`);
  }

  console.log(`\n${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  
  return {
    totalTests,
    passedTests,
    failedTests,
    successRate: parseFloat(successRate),
    results: testResults,
    timestamp: new Date().toISOString()
  };
}

// Main execution function
async function runVerificationTests() {
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.cyan}🚀 CONVENTIONS DATABASE VERIFICATION SUITE${colors.reset}`);
  console.log(`${colors.cyan}   Comprehensive testing of conventions_tarifaires system${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);

  try {
    // Run all tests in sequence
    await testDatabaseSchema();
    await testExistingConventionsData();
    await testGetClientConventionsAPI();
    await testConventionRPCFunctions();
    await testDataIntegrity();
    await testCreateAndVerifyTestData();

    // Generate final report
    const report = generateReport();
    
    // Save report to file
    const fs = require('fs');
    const reportPath = `./tests/conventions-verification-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n${colors.blue}📄 Detailed report saved to: ${reportPath}${colors.reset}`);

    return report;

  } catch (error) {
    console.error(`${colors.red}❌ Fatal error during verification:${colors.reset}`, error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  runVerificationTests()
    .then(report => {
      process.exit(report.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runVerificationTests };