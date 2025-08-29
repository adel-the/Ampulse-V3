#!/usr/bin/env node

/**
 * Create Test Convention Data Script
 * 
 * This script creates sample convention data to test the ConventionPrix component
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestConvention() {
  try {
    console.log('🔧 Creating Test Convention Data');
    console.log('================================\n');

    // Get an existing client (client ID 30)
    const clientId = 30;
    
    // Get room categories
    const { data: categories } = await supabase
      .from('room_categories')
      .select('*');

    if (!categories || categories.length === 0) {
      console.error('❌ No room categories found');
      return;
    }

    console.log(`Found ${categories.length} room categories`);

    // Create conventions for each category (separate records)
    const conventions = [];
    
    for (const [index, category] of categories.entries()) {
      const basePrice = 45 + (index * 10);
      
      const conventionData = {
        client_id: clientId,
        category_id: category.id,
        date_debut: '2024-01-01',
        date_fin: '2024-12-31',
        prix_defaut: basePrice,
        prix_janvier: basePrice + 5,
        prix_fevrier: basePrice,
        prix_mars: basePrice + 2,
        prix_avril: basePrice + 3,
        prix_mai: basePrice + 8,  // High season
        prix_juin: basePrice + 15, // Peak season
        prix_juillet: basePrice + 20, // Peak season
        prix_aout: basePrice + 20,  // Peak season
        prix_septembre: basePrice + 5,
        prix_octobre: basePrice,
        prix_novembre: basePrice - 2,
        prix_decembre: basePrice + 10, // Holiday season
        conditions: `Conditions spéciales pour ${category.name} - Tarifs préférentiels appliqués`,
        active: true,
        hotel_id: 1 // Default hotel ID
      };
      
      conventions.push(conventionData);
    }

    console.log('💰 Sample pricing structure created:');
    conventions.forEach(conv => {
      console.log(`Category ${conv.category_id}: default=${conv.prix_defaut}, jan=${conv.prix_janvier}, jul=${conv.prix_juillet}`);
    });

    // Insert all conventions
    const { data: newConventions, error } = await supabase
      .from('conventions_tarifaires')
      .insert(conventions)
      .select();

    if (error) {
      console.error('❌ Error creating convention:', error);
      return;
    }

    console.log('\n✅ Test conventions created successfully!');
    console.log(`   Conventions created: ${newConventions.length}`);
    newConventions.forEach(conv => {
      console.log(`   - Convention ID: ${conv.id}, Category: ${conv.category_id}, Active: ${conv.active}`);
    });

    console.log('\n🧪 Now run the diagnostic script to test:');
    console.log(`   npm run diagnose:convention-prix ${clientId}`);

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

createTestConvention();