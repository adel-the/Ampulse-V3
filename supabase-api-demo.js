/**
 * Supabase REST API Demonstration Script
 * Shows various ways to interact with Supabase via REST API
 */

const fetch = require('node-fetch');

const config = {
    url: 'https://pgjatiookprsvfesrsrx.supabase.co',
    anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamF0aW9va3Byc3ZmZXNyc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTkxMDksImV4cCI6MjA3MTAzNTEwOX0.J60Qcxtw1SmnR9WrS8t4yCIh-JyyhjAmU_FZmFIY_dI'
};

class SupabaseAPI {
    constructor(url, key) {
        this.baseUrl = `${url}/rest/v1`;
        this.headers = {
            'Content-Type': 'application/json',
            'apikey': key,
            'Authorization': `Bearer ${key}`
        };
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                headers: this.headers,
                ...options
            });

            const data = await response.json();
            
            return {
                success: response.ok,
                status: response.status,
                data,
                url
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                url
            };
        }
    }

    // CRUD Operations
    async create(table, data) {
        return this.request(`/${table}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async read(table, query = '') {
        return this.request(`/${table}${query ? '?' + query : ''}`);
    }

    async update(table, filter, data) {
        return this.request(`/${table}?${filter}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async delete(table, filter) {
        return this.request(`/${table}?${filter}`, {
            method: 'DELETE'
        });
    }
}

async function demonstrateAPI() {
    console.log('🚀 Supabase REST API Demonstration');
    console.log('=' .repeat(50));

    const api = new SupabaseAPI(config.url, config.anon_key);

    // 1. Simple Query
    console.log('\n📖 1. Simple Query - Get all test_connection records');
    const all = await api.read('test_connection');
    console.log(`Status: ${all.status} | Records: ${all.data?.length || 0}`);
    
    // 2. Query with Limit
    console.log('\n📖 2. Query with Limit - Get 3 records');
    const limited = await api.read('test_connection', 'limit=3');
    console.log(`Status: ${limited.status} | Records: ${limited.data?.length || 0}`);
    
    // 3. Query with Filter
    console.log('\n📖 3. Query with Filter - Active records only');
    const filtered = await api.read('test_connection', 'is_active=eq.true&limit=5');
    console.log(`Status: ${filtered.status} | Records: ${filtered.data?.length || 0}`);
    
    // 4. Query with Ordering
    console.log('\n📖 4. Query with Ordering - Latest records first');
    const ordered = await api.read('test_connection', 'order=created_at.desc&limit=3');
    console.log(`Status: ${ordered.status} | Records: ${ordered.data?.length || 0}`);
    
    // 5. Create New Record
    console.log('\n✏️ 5. Create New Record');
    const newRecord = {
        name: `API Demo ${Date.now()}`,
        description: 'Created via REST API demonstration',
        value: Math.floor(Math.random() * 1000),
        is_active: true
    };
    
    const created = await api.create('test_connection', newRecord);
    console.log(`Status: ${created.status} | Success: ${created.success}`);
    
    // 6. Query Specific Columns
    console.log('\n📖 6. Query Specific Columns - Select only name and value');
    const selected = await api.read('test_connection', 'select=name,value&limit=3');
    console.log(`Status: ${selected.status} | Sample:`, selected.data?.[0]);
    
    // 7. Count Records
    console.log('\n🔢 7. Count Records - Using Prefer header');
    const counted = await api.request('/test_connection?select=count', {
        headers: {
            ...api.headers,
            'Prefer': 'count=exact'
        }
    });
    console.log(`Status: ${counted.status} | Response:`, counted.data);
    
    // 8. Test Non-Existent Table
    console.log('\n❌ 8. Test Non-Existent Table - mcp_test_table');
    const missing = await api.read('mcp_test_table');
    console.log(`Status: ${missing.status} | Error: ${missing.data?.message}`);
    
    // 9. Hotels Table Query
    console.log('\n🏨 9. Hotels Table Query');
    const hotels = await api.read('hotels', 'limit=2&select=nom,ville,chambres_total');
    console.log(`Status: ${hotels.status} | Hotels: ${hotels.data?.length || 0}`);
    if (hotels.data?.[0]) {
        console.log('Sample hotel:', hotels.data[0]);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ API Demonstration Complete!');
}

// Run demonstration
if (require.main === module) {
    demonstrateAPI().catch(console.error);
}

module.exports = { SupabaseAPI, demonstrateAPI };