#!/usr/bin/env node

/**
 * Convention Prix Diagnostic Script
 * 
 * This script helps diagnose issues with convention pricing data:
 * 1. Loads a specific client with conventions
 * 2. Shows the exact data structure returned by the API
 * 3. Simulates the transformation that should happen
 * 4. Verifies that transformed data matches what ConventionPrix expects
 * 5. Tests if the data would display correctly
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Expected ConventionPrix interface
const EXPECTED_CATEGORY_PRICING_INTERFACE = {
  categoryId: 'string',      // Room category ID
  categoryName: 'string',    // Room category name
  defaultPrice: 'number',    // Default price
  monthlyPrices: {           // Monthly prices object
    janvier: 'number?',
    fevrier: 'number?',
    mars: 'number?',
    avril: 'number?',
    mai: 'number?',
    juin: 'number?',
    juillet: 'number?',
    aout: 'number?',
    septembre: 'number?',
    octobre: 'number?',
    novembre: 'number?',
    decembre: 'number?'
  },
  conditions: 'string?'      // Optional conditions
};

const MONTHS = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'
];

async function main() {
  console.log('🔍 Convention Prix Diagnostic Script');
  console.log('=====================================\n');

  // Get client ID from command line argument or use default
  const clientId = process.argv[2] ? parseInt(process.argv[2]) : 31;
  console.log(`📋 Testing with Client ID: ${clientId}\n`);

  try {
    // Step 1: Test room categories loading
    console.log('📊 Step 1: Loading Room Categories');
    console.log('-----------------------------------');
    
    const { data: roomCategories, error: categoriesError } = await supabase
      .from('room_categories')
      .select('*')
      .order('name');

    if (categoriesError) {
      console.error('❌ Error loading room categories:', categoriesError);
      return;
    }

    if (!roomCategories || roomCategories.length === 0) {
      console.error('❌ No room categories found. ConventionPrix needs room categories to work.');
      return;
    }

    console.log(`✅ Found ${roomCategories.length} room categories:`);
    roomCategories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (ID: ${cat.id})`);
    });
    console.log();

    // Step 2: Test client loading with details
    console.log('👤 Step 2: Loading Client with Details');
    console.log('--------------------------------------');
    
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select(`
        *,
        referents(*),
        conventions:conventions_tarifaires(*)
      `)
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error('❌ Error loading client:', clientError);
      console.log('💡 Try with a different client ID: node diagnose-convention-prix.js <client_id>');
      return;
    }

    if (!clientData) {
      console.error(`❌ No client found with ID ${clientId}`);
      return;
    }

    console.log(`✅ Found client: ${clientData.nom} ${clientData.prenom || clientData.raison_sociale || ''}`);
    console.log(`   📧 Email: ${clientData.email || 'N/A'}`);
    console.log(`   📞 Phone: ${clientData.telephone || 'N/A'}`);
    console.log(`   🏷️  Type: ${clientData.client_type}`);
    console.log(`   📊 Status: ${clientData.statut}`);
    console.log(`   📅 Created: ${new Date(clientData.created_at).toLocaleDateString()}`);
    
    // Check referents
    if (clientData.referents && clientData.referents.length > 0) {
      console.log(`   👥 Referents: ${clientData.referents.length}`);
      clientData.referents.forEach((ref, index) => {
        console.log(`      ${index + 1}. ${ref.nom} ${ref.prenom} (${ref.fonction || 'N/A'})`);
      });
    } else {
      console.log('   👥 Referents: None');
    }

    // Check conventions
    if (clientData.conventions && clientData.conventions.length > 0) {
      console.log(`   📋 Conventions: ${clientData.conventions.length}`);
      clientData.conventions.forEach((conv, index) => {
        console.log(`      ${index + 1}. Active: ${conv.active}, Start: ${conv.date_debut || 'N/A'}, End: ${conv.date_fin || 'N/A'}`);
        if (conv.prix_par_categorie) {
          console.log(`         💰 Pricing data: ${Object.keys(conv.prix_par_categorie).length} categories`);
        }
      });
    } else {
      console.log('   📋 Conventions: None');
      console.log('   ⚠️  No conventions found. ConventionPrix will show default values only.');
    }
    console.log();

    // Step 3: Analyze convention data structure
    console.log('🔍 Step 3: Analyzing Convention Data Structure');
    console.log('----------------------------------------------');
    
    let conventionData = null;
    if (clientData.conventions && clientData.conventions.length > 0) {
      // Use the first active convention or the most recent one
      conventionData = clientData.conventions.find(c => c.active) || clientData.conventions[0];
      
      console.log('📋 Selected Convention:');
      console.log(`   ID: ${conventionData.id}`);
      console.log(`   Active: ${conventionData.active}`);
      console.log(`   Start Date: ${conventionData.date_debut || 'N/A'}`);
      console.log(`   End Date: ${conventionData.date_fin || 'N/A'}`);
      console.log(`   Conditions: ${conventionData.conditions || 'None'}`);
      
      console.log('   💰 Pricing Data Structure (Individual Columns):');
      console.log(`      Category ID: ${conventionData.category_id}`);
      console.log(`      Default Price: ${conventionData.prix_defaut}`);
      console.log('      Monthly Prices:');
      MONTHS.forEach(month => {
        const columnName = `prix_${month}`;
        const price = conventionData[columnName];
        console.log(`        ${month}: ${price || 'N/A'}`);
      });
    } else {
      console.log('⚠️  No conventions available for transformation testing');
    }
    console.log();

    // Step 4: Simulate data transformation
    console.log('🔄 Step 4: Simulating Data Transformation');
    console.log('-----------------------------------------');
    
    let transformedData = [];

    // This is how ConventionPrix expects to receive initial data
    if (clientData.conventions && clientData.conventions.length > 0) {
      console.log('🔄 Transforming convention data to ConventionPrix format...');
      
      // Group conventions by category since each convention is per category
      const conventionsByCategory = {};
      clientData.conventions.forEach(conv => {
        if (conv.active && conv.category_id) {
          conventionsByCategory[conv.category_id] = conv;
        }
      });
      
      // Transform each category's convention data
      Object.entries(conventionsByCategory).forEach(([categoryId, convData]) => {
        // Find the category name
        const category = roomCategories.find(cat => cat.id.toString() === categoryId);
        
        if (category) {
          const categoryPricing = {
            categoryId: categoryId,
            categoryName: category.name,
            defaultPrice: convData.prix_defaut || 0,
            monthlyPrices: {},
            conditions: convData.conditions || ''
          };

          // Transform monthly prices from individual columns
          MONTHS.forEach(month => {
            const columnName = `prix_${month}`;
            const price = convData[columnName];
            if (price && price > 0) {
              categoryPricing.monthlyPrices[month] = price;
            }
          });

          transformedData.push(categoryPricing);
        }
      });

      console.log(`✅ Transformed ${transformedData.length} category pricing entries`);
    } else {
      console.log('🔄 No convention data to transform, using default structure...');
      
      // Create default structure (what ConventionPrix does when no initialData is provided)
      transformedData = roomCategories.map(category => ({
        categoryId: category.id.toString(),
        categoryName: category.name,
        defaultPrice: 45, // Default base price
        monthlyPrices: {},
        conditions: ''
      }));

      console.log(`✅ Created default structure for ${transformedData.length} categories`);
    }
    console.log();

    // Step 5: Validate transformed data structure
    console.log('✅ Step 5: Validating Transformed Data Structure');
    console.log('------------------------------------------------');
    
    let validationPassed = true;
    
    transformedData.forEach((item, index) => {
      console.log(`📊 Category ${index + 1}: ${item.categoryName}`);
      
      // Check required fields
      const requiredFields = ['categoryId', 'categoryName', 'defaultPrice', 'monthlyPrices'];
      requiredFields.forEach(field => {
        if (item[field] === undefined) {
          console.error(`   ❌ Missing required field: ${field}`);
          validationPassed = false;
        } else {
          console.log(`   ✅ ${field}: ${typeof item[field]} = ${
            field === 'monthlyPrices' 
              ? `{${Object.keys(item[field]).join(', ')}}` 
              : item[field]
          }`);
        }
      });

      // Validate monthly prices structure
      if (item.monthlyPrices && typeof item.monthlyPrices === 'object') {
        const invalidMonths = Object.keys(item.monthlyPrices).filter(month => 
          !MONTHS.includes(month)
        );
        
        if (invalidMonths.length > 0) {
          console.error(`   ❌ Invalid month keys: ${invalidMonths.join(', ')}`);
          validationPassed = false;
        }

        const monthPriceValues = Object.values(item.monthlyPrices);
        const invalidPrices = monthPriceValues.filter(price => 
          typeof price !== 'number' || price <= 0
        );
        
        if (invalidPrices.length > 0) {
          console.error(`   ❌ Invalid price values: ${invalidPrices.join(', ')}`);
          validationPassed = false;
        }
      }

      // Show monthly pricing details if any
      const monthsWithPrices = Object.keys(item.monthlyPrices);
      if (monthsWithPrices.length > 0) {
        console.log(`   📅 Monthly prices (${monthsWithPrices.length}):`);
        monthsWithPrices.forEach(month => {
          console.log(`      ${month}: €${item.monthlyPrices[month]}`);
        });
      } else {
        console.log(`   📅 Monthly prices: None (will use default: €${item.defaultPrice})`);
      }
      
      if (item.conditions) {
        console.log(`   📝 Conditions: ${item.conditions.substring(0, 50)}${item.conditions.length > 50 ? '...' : ''}`);
      }
      
      console.log();
    });

    // Step 6: Test component compatibility
    console.log('🧪 Step 6: Testing Component Compatibility');
    console.log('------------------------------------------');
    
    if (validationPassed) {
      console.log('✅ All validation checks passed!');
      console.log('✅ Data structure is compatible with ConventionPrix component');
      
      // Simulate what the component would do
      console.log('\n📋 Component Simulation Results:');
      console.log(`   - Room categories loaded: ${roomCategories.length > 0 ? 'YES' : 'NO'}`);
      console.log(`   - Initial data provided: ${conventionData ? 'YES' : 'NO'}`);
      console.log(`   - Pricing data initialized: YES`);
      console.log(`   - Categories rendered: ${transformedData.length}`);
      console.log(`   - Validation would pass: ${transformedData.some(item => item.defaultPrice > 0) ? 'YES' : 'NO'}`);
      
      // Show what user would see
      console.log('\n👀 User Interface Preview:');
      transformedData.forEach((item, index) => {
        console.log(`\n   📊 ${item.categoryName}`);
        console.log(`      Default Price: €${item.defaultPrice}`);
        
        // Show monthly grid preview
        const monthsGrid = MONTHS.map(month => {
          const price = item.monthlyPrices[month];
          return `${month.substring(0, 3)}: ${price ? `€${price}` : `€${item.defaultPrice}`}`;
        });
        
        console.log(`      Monthly Grid:`);
        // Display in groups of 4 for readability
        for (let i = 0; i < monthsGrid.length; i += 4) {
          console.log(`        ${monthsGrid.slice(i, i + 4).join(' | ')}`);
        }
        
        if (item.conditions) {
          console.log(`      Conditions: ${item.conditions}`);
        }
      });

    } else {
      console.error('❌ Validation failed! Data structure issues detected.');
      console.error('❌ ConventionPrix component may not render correctly.');
    }

    // Step 7: Debugging recommendations
    console.log('\n🛠️  Step 7: Debugging Recommendations');
    console.log('--------------------------------------');
    
    if (!clientData.conventions || clientData.conventions.length === 0) {
      console.log('💡 No convention data found:');
      console.log('   1. Check if client has conventions in the database');
      console.log('   2. Verify conventions_tarifaires table has data for this client');
      console.log('   3. Check if convention is marked as active');
      console.log('   4. Component will show default values only');
    } else if (transformedData.length === 0) {
      console.log('💡 Conventions exist but no active pricing data:');
      console.log('   1. Check if conventions are marked as active');
      console.log('   2. Verify category_id matches existing room categories');
      console.log('   3. Component will initialize with default values');
    } else {
      console.log('💡 Convention data looks good:');
      console.log('   1. Data structure is valid');
      console.log('   2. ConventionPrix should display pricing correctly');
      console.log('   3. If component still shows defaults, check the initial data prop passing');
      console.log('   4. Verify the transformation logic in the component matches this script');
    }

    // Step 8: Quick database queries for debugging
    console.log('\n🔍 Step 8: Database Debugging Queries');
    console.log('------------------------------------');
    
    console.log('Run these SQL queries in Supabase for further debugging:\n');
    
    console.log(`-- Check client conventions
SELECT id, client_id, active, date_debut, date_fin, category_id,
       prix_defaut, prix_janvier, prix_fevrier, prix_mars
FROM conventions_tarifaires 
WHERE client_id = ${clientId};`);
    
    console.log(`\n-- Check specific pricing data  
SELECT id, client_id, active, category_id, prix_defaut,
       prix_janvier, prix_fevrier, prix_mars, prix_avril,
       prix_mai, prix_juin, prix_juillet, prix_aout,
       prix_septembre, prix_octobre, prix_novembre, prix_decembre
FROM conventions_tarifaires 
WHERE client_id = ${clientId};`);
    
    console.log(`\n-- Check room categories
SELECT id, name, description, base_price 
FROM room_categories 
ORDER BY name;`);

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    console.error('\nStack trace:', error.stack);
  }

  console.log('\n🎯 Diagnostic Complete!');
  console.log('========================\n');
}

// Run the diagnostic
main().catch(console.error);