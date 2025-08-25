#!/usr/bin/env node

/**
 * Manual Supabase test script for MCP
 * This script assumes the mcp_test_table has been created manually
 * and performs all CRUD operations to verify connectivity
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Manual MCP Supabase Test Script');
console.log('====================================\n');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env.local file for:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔗 Supabase URL:', supabaseUrl);
console.log('🔑 Service Key:', supabaseServiceKey.substring(0, 50) + '...\n');

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function performCRUDTests() {
  console.log('🚀 Starting CRUD tests on mcp_test_table...\n');

  try {
    // Step 1: Test connection and table existence
    console.log('📋 Step 1: Testing table access...');
    const { data: existingData, error: readError } = await supabase
      .from('mcp_test_table')
      .select('*')
      .limit(5);

    if (readError) {
      if (readError.message.includes('Could not find the table') || readError.message.includes('relation "mcp_test_table" does not exist')) {
        console.log('❌ Table mcp_test_table does not exist!');
        console.log('\n🔧 Please create the table first by running this SQL in Supabase Dashboard:');
        console.log('================================================================');
        console.log(`CREATE TABLE IF NOT EXISTS public.mcp_test_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  test_value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.mcp_test_table ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for service role
CREATE POLICY "Allow all operations on mcp_test_table" 
ON public.mcp_test_table 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create policy to allow read access for authenticated users  
CREATE POLICY "Allow read access on mcp_test_table" 
ON public.mcp_test_table 
FOR SELECT 
TO authenticated 
USING (true);`);
        console.log('================================================================');
        console.log('\n📝 Steps to create the table:');
        console.log(`1. Go to: https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}`);
        console.log('2. Click "SQL Editor" in the left sidebar');
        console.log('3. Click "New Query"');
        console.log('4. Paste the SQL above');
        console.log('5. Click "Run"');
        console.log('6. Run this script again');
        return false;
      }
      throw new Error(`Failed to access table: ${readError.message}`);
    }

    console.log(`✅ Table exists and accessible. Found ${existingData.length} existing records.`);
    if (existingData.length > 0) {
      console.log('   Existing records:');
      existingData.forEach((record, index) => {
        console.log(`     ${index + 1}. ${record.name} (value: ${record.test_value})`);
      });
    }
    console.log('');

    // Step 2: Create (INSERT)
    console.log('📝 Step 2: Testing INSERT operation...');
    const newRecord = {
      name: `MCP Test Record ${Date.now()}`,
      test_value: Math.floor(Math.random() * 100)
    };

    const { data: insertData, error: insertError } = await supabase
      .from('mcp_test_table')
      .insert(newRecord)
      .select();

    if (insertError) {
      throw new Error(`INSERT failed: ${insertError.message}`);
    }

    const insertedRecord = insertData[0];
    console.log('✅ INSERT successful:');
    console.log(`   ID: ${insertedRecord.id}`);
    console.log(`   Name: ${insertedRecord.name}`);
    console.log(`   Test Value: ${insertedRecord.test_value}`);
    console.log(`   Created At: ${insertedRecord.created_at}\n`);

    // Step 3: Read (SELECT)
    console.log('🔍 Step 3: Testing SELECT operation...');
    const { data: selectData, error: selectError } = await supabase
      .from('mcp_test_table')
      .select('*')
      .eq('id', insertedRecord.id);

    if (selectError) {
      throw new Error(`SELECT failed: ${selectError.message}`);
    }

    if (selectData.length === 0) {
      throw new Error('SELECT returned no results for inserted record');
    }

    console.log('✅ SELECT successful:');
    console.log(`   Found record: ${selectData[0].name} (${selectData[0].test_value})\n`);

    // Step 4: Update (UPDATE)
    console.log('🔄 Step 4: Testing UPDATE operation...');
    const updateData = {
      name: `${insertedRecord.name} - UPDATED`,
      test_value: insertedRecord.test_value * 2
    };

    const { data: updatedData, error: updateError } = await supabase
      .from('mcp_test_table')
      .update(updateData)
      .eq('id', insertedRecord.id)
      .select();

    if (updateError) {
      throw new Error(`UPDATE failed: ${updateError.message}`);
    }

    console.log('✅ UPDATE successful:');
    console.log(`   Updated name: ${updatedData[0].name}`);
    console.log(`   Updated value: ${updatedData[0].test_value}\n`);

    // Step 5: Delete (DELETE)
    console.log('🗑️  Step 5: Testing DELETE operation...');
    const { error: deleteError } = await supabase
      .from('mcp_test_table')
      .delete()
      .eq('id', insertedRecord.id);

    if (deleteError) {
      throw new Error(`DELETE failed: ${deleteError.message}`);
    }

    console.log('✅ DELETE successful\n');

    // Step 6: Verify deletion
    console.log('🔍 Step 6: Verifying deletion...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('mcp_test_table')
      .select('*')
      .eq('id', insertedRecord.id);

    if (verifyError) {
      throw new Error(`Verification SELECT failed: ${verifyError.message}`);
    }

    if (verifyData.length > 0) {
      throw new Error('Record was not deleted properly');
    }

    console.log('✅ Deletion verified - record removed\n');

    // Step 7: Bulk operations test
    console.log('📦 Step 7: Testing bulk INSERT...');
    const bulkRecords = [
      { name: 'Bulk Record 1', test_value: 10 },
      { name: 'Bulk Record 2', test_value: 20 },
      { name: 'Bulk Record 3', test_value: 30 }
    ];

    const { data: bulkData, error: bulkError } = await supabase
      .from('mcp_test_table')
      .insert(bulkRecords)
      .select();

    if (bulkError) {
      throw new Error(`Bulk INSERT failed: ${bulkError.message}`);
    }

    console.log(`✅ Bulk INSERT successful - ${bulkData.length} records created\n`);

    // Step 8: Query with filters
    console.log('🔍 Step 8: Testing filtered queries...');
    const { data: filteredData, error: filterError } = await supabase
      .from('mcp_test_table')
      .select('*')
      .gte('test_value', 15)
      .order('test_value', { ascending: true });

    if (filterError) {
      throw new Error(`Filtered query failed: ${filterError.message}`);
    }

    console.log(`✅ Filtered query successful - found ${filteredData.length} records with test_value >= 15:`);
    filteredData.forEach(record => {
      console.log(`   - ${record.name}: ${record.test_value}`);
    });
    console.log('');

    // Clean up bulk records
    const bulkIds = bulkData.map(record => record.id);
    const { error: bulkDeleteError } = await supabase
      .from('mcp_test_table')
      .delete()
      .in('id', bulkIds);

    if (bulkDeleteError) {
      console.warn('⚠️  Warning: Could not clean up bulk test records:', bulkDeleteError.message);
    } else {
      console.log('🧹 Cleaned up bulk test records\n');
    }

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function main() {
  const success = await performCRUDTests();
  
  console.log('📊 Test Results Summary');
  console.log('========================');
  
  if (success) {
    console.log('🎉 All tests passed! Supabase connectivity is working perfectly.');
    console.log('✅ Connection: OK');
    console.log('✅ Table Access: OK');
    console.log('✅ INSERT Operation: OK');
    console.log('✅ SELECT Operation: OK');
    console.log('✅ UPDATE Operation: OK');
    console.log('✅ DELETE Operation: OK');
    console.log('✅ Bulk Operations: OK');
    console.log('✅ Filtered Queries: OK');
    console.log('\n🚀 Your Supabase setup is ready for production use!');
  } else {
    console.log('💥 Tests failed. Please review the errors above.');
    console.log('🔧 Most likely the mcp_test_table needs to be created manually.');
  }
}

main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});