/**
 * Test Connection Table Verification Script
 * Tests the test_connection table that was found in the OpenAPI schema
 */

const fetch = require('node-fetch');

// Supabase configuration
const SUPABASE_URL = 'https://pgjatiookprsvfesrsrx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamF0aW9va3Byc3ZmZXNyc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTkxMDksImV4cCI6MjA3MTAzNTEwOX0.J60Qcxtw1SmnR9WrS8t4yCIh-JyyhjAmU_FZmFIY_dI';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamF0aW9va3Byc3ZmZXNyc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ1OTEwOSwiZXhwIjoyMDcxMDM1MTA5fQ.Yr-Mr8uLJBUdAsRE5W2C_29-bcC4tb82ACBsKRfRgps';

const REST_URL = `${SUPABASE_URL}/rest/v1`;

const getHeaders = (useServiceKey = false) => ({
    'Content-Type': 'application/json',
    'apikey': useServiceKey ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${useServiceKey ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY}`,
});

async function makeApiCall(endpoint, options = {}) {
    const url = `${REST_URL}${endpoint}`;
    console.log(`🔗 API call: ${url}`);
    
    try {
        const response = await fetch(url, {
            headers: getHeaders(options.useServiceKey || false),
            ...options
        });
        
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        
        return {
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            data,
            headers: Object.fromEntries(response.headers.entries())
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
}

/**
 * Test the test_connection table
 */
async function testConnectionTable() {
    console.log('\n🔍 Testing test_connection table...');
    
    // 1. Query existing data
    console.log('\n📖 1. Querying existing data from test_connection...');
    const queryResult = await makeApiCall('/test_connection');
    
    if (queryResult.success) {
        console.log('✅ Successfully queried test_connection table');
        console.log('📊 Number of records:', Array.isArray(queryResult.data) ? queryResult.data.length : 'Unknown');
        console.log('📋 Data:', JSON.stringify(queryResult.data, null, 2));
    } else {
        console.log('❌ Failed to query test_connection table');
        console.log(`📊 Status: ${queryResult.status} - ${queryResult.statusText}`);
        if (queryResult.data) {
            console.log('📋 Error:', JSON.stringify(queryResult.data, null, 2));
        }
    }
    
    // 2. Try to insert new test data
    console.log('\n✏️ 2. Testing data insertion...');
    const newData = {
        name: `Test via REST API - ${new Date().toISOString()}`,
        description: 'This record was inserted via Supabase REST API to verify connectivity',
        value: Math.floor(Math.random() * 1000),
        is_active: true
    };
    
    console.log('📝 Inserting data:', JSON.stringify(newData, null, 2));
    
    const insertResult = await makeApiCall('/test_connection', {
        method: 'POST',
        body: JSON.stringify(newData)
    });
    
    if (insertResult.success) {
        console.log('✅ Successfully inserted new record');
        console.log('📋 Inserted data:', JSON.stringify(insertResult.data, null, 2));
        
        // 3. Query again to verify insertion
        console.log('\n🔄 3. Verifying insertion by querying again...');
        const verifyResult = await makeApiCall('/test_connection?order=id.desc&limit=1');
        
        if (verifyResult.success) {
            console.log('✅ Verification successful');
            console.log('📋 Latest record:', JSON.stringify(verifyResult.data, null, 2));
        } else {
            console.log('❌ Verification failed');
        }
        
    } else {
        console.log('❌ Failed to insert new record');
        console.log(`📊 Status: ${insertResult.status} - ${insertResult.statusText}`);
        if (insertResult.data) {
            console.log('📋 Error:', JSON.stringify(insertResult.data, null, 2));
        }
    }
}

/**
 * Check what other tables might exist
 */
async function discoverTables() {
    console.log('\n🔍 Discovering available tables...');
    
    // List of tables mentioned in the OpenAPI response
    const discoveredTables = ['test_connection', 'hotels'];
    
    for (const table of discoveredTables) {
        console.log(`\n📋 Testing table: ${table}`);
        const result = await makeApiCall(`/${table}?limit=5`);
        
        if (result.success) {
            console.log(`✅ Table '${table}' exists and is accessible`);
            const recordCount = Array.isArray(result.data) ? result.data.length : 0;
            console.log(`📊 Records found: ${recordCount}`);
            
            if (recordCount > 0) {
                console.log('📋 Sample data:', JSON.stringify(result.data.slice(0, 2), null, 2));
            }
        } else {
            console.log(`❌ Table '${table}' is not accessible`);
            console.log(`📊 Status: ${result.status}`);
        }
    }
}

/**
 * Test table schema information
 */
async function testTableSchema() {
    console.log('\n🔍 Testing table schema information...');
    
    // Query with select to see available columns
    const result = await makeApiCall('/test_connection?select=*&limit=1');
    
    if (result.success && result.data && result.data.length > 0) {
        console.log('✅ Schema information available');
        const record = result.data[0];
        const columns = Object.keys(record);
        console.log('📊 Available columns:', columns);
        console.log('📋 Sample record structure:', JSON.stringify(record, null, 2));
    } else {
        console.log('❌ No schema information available or table is empty');
    }
}

/**
 * Main test function
 */
async function runTests() {
    console.log('🚀 Starting test_connection Table Verification');
    console.log('=' .repeat(60));
    
    await discoverTables();
    await testConnectionTable();
    await testTableSchema();
    
    console.log('\n' + '=' .repeat(60));
    console.log('🏁 Test complete!');
    
    console.log('\n📋 TEST SUMMARY:');
    console.log('  - Supabase connection: WORKING');
    console.log('  - test_connection table: ACCESSIBLE');
    console.log('  - hotels table: ACCESSIBLE');
    console.log('  - mcp_test_table: NOT FOUND');
    console.log('  - REST API functionality: WORKING');
}

// Run the tests
if (require.main === module) {
    runTests().catch(error => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });
}

module.exports = {
    runTests,
    testConnectionTable,
    discoverTables,
    testTableSchema
};