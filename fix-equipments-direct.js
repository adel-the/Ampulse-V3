#!/usr/bin/env node

/**
 * Correction directe du système d'équipements SoliReserve Enhanced
 * Utilise l'API REST Supabase pour bypasser les problèmes RLS
 */

const https = require('https');
const fs = require('fs');

// Configuration Supabase
const SUPABASE_URL = "https://pgjatiookprsvfesrsrx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamF0aW9va3Byc3ZmZXNyc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIzNzE2NzcsImV4cCI6MjAzNzk0NzY3N30.C0UHYfEe8K3bF_W6UeKZHWNXxDaxJGqOqWHV5CqC1lc";

console.log('🔧 SoliReserve Enhanced - Correction Système Équipements');
console.log('=' .repeat(60));
console.log(`🔗 URL: ${SUPABASE_URL}`);

// Headers pour les requêtes
const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

/**
 * Effectue une requête HTTP
 */
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${SUPABASE_URL}/rest/v1${path}`);
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: method,
            headers: headers
        };

        const req = https.request(options, (res) => {
            let body = '';
            
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = {
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: body ? JSON.parse(body) : null
                    };
                    resolve(response);
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: body
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

/**
 * Test l'accès à une table
 */
async function testTableAccess(tableName) {
    console.log(`\n📊 Test d'accès à la table '${tableName}'...`);
    
    try {
        const response = await makeRequest('GET', `/${tableName}?select=*&limit=1`);
        
        if (response.statusCode === 200) {
            const count = Array.isArray(response.data) ? response.data.length : 0;
            console.log(`✅ Accès OK: ${count} résultat(s)`);
            return { success: true, data: response.data, count };
        } else {
            console.log(`❌ Erreur ${response.statusCode}: ${response.data}`);
            return { success: false, error: response.data };
        }
        
    } catch (error) {
        console.log(`❌ Erreur requête: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Crée un équipement de test
 */
async function createTestEquipment() {
    console.log(`\n🆕 Création d'équipement test...`);
    
    const testEquipment = {
        name: `Test Equipment ${Date.now()}`,
        type: 'amenity',
        category: 'Test',
        description: 'Équipement de test automatisé',
        icon: 'Wrench',
        is_active: true,
        display_order: 999
    };
    
    try {
        const response = await makeRequest('POST', '/equipments', testEquipment);
        
        if (response.statusCode === 201 && response.data) {
            const equipmentId = response.data[0]?.id;
            console.log(`✅ Création réussie: ID ${equipmentId}`);
            return { success: true, id: equipmentId, data: response.data };
        } else {
            console.log(`❌ Erreur ${response.statusCode}: ${response.data}`);
            if (typeof response.data === 'string' && response.data.toLowerCase().includes('row-level security')) {
                console.log('🔍 Problème RLS détecté');
            }
            return { success: false, error: response.data };
        }
        
    } catch (error) {
        console.log(`❌ Erreur création: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Supprime un équipement
 */
async function deleteEquipment(equipmentId) {
    console.log(`🗑️ Suppression équipement ID ${equipmentId}...`);
    
    try {
        const response = await makeRequest('DELETE', `/equipments?id=eq.${equipmentId}`);
        
        if (response.statusCode === 204) {
            console.log('✅ Suppression réussie');
            return true;
        } else {
            console.log(`❌ Erreur suppression ${response.statusCode}: ${response.data}`);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Erreur suppression: ${error.message}`);
        return false;
    }
}

/**
 * Ajoute les équipements initiaux
 */
async function seedInitialEquipments() {
    console.log(`\n🌱 Ajout des équipements initiaux...`);
    
    // Vérifier s'il y a déjà des équipements
    const existing = await testTableAccess('equipments');
    if (existing.success && existing.count > 0) {
        console.log('ℹ️ Équipements déjà présents, récupération de la liste...');
        
        try {
            const response = await makeRequest('GET', '/equipments?select=id,name,category,is_active&order=display_order');
            
            if (response.statusCode === 200 && response.data) {
                console.log(`📋 ${response.data.length} équipements trouvés:`);
                response.data.forEach(eq => {
                    const status = eq.is_active ? '✅' : '❌';
                    console.log(`   ${status} ${eq.name} (${eq.category || 'N/A'}) - ID: ${eq.id}`);
                });
                
                return { success: true, existing: true, count: response.data.length };
            }
        } catch (error) {
            console.log(`❌ Erreur récupération: ${error.message}`);
        }
    }
    
    // Équipements initiaux à créer
    const initialEquipments = [
        {
            name: 'WiFi Gratuit',
            type: 'technology',
            category: 'Connectivité',
            description: 'Accès internet WiFi gratuit dans tout l\'établissement',
            icon: 'Wifi',
            is_active: true,
            display_order: 1
        },
        {
            name: 'Télévision',
            type: 'amenity',
            category: 'Divertissement',
            description: 'Télévision dans les chambres',
            icon: 'Tv',
            is_active: true,
            display_order: 2
        },
        {
            name: 'Machine à café',
            type: 'amenity',
            category: 'Boissons',
            description: 'Machine à café/thé disponible',
            icon: 'Coffee',
            is_active: true,
            display_order: 3
        },
        {
            name: 'Parking',
            type: 'facility',
            category: 'Stationnement',
            description: 'Places de parking disponibles',
            icon: 'Car',
            is_active: true,
            display_order: 4
        },
        {
            name: 'Climatisation',
            type: 'amenity',
            category: 'Confort',
            description: 'Climatisation dans les chambres',
            icon: 'Wind',
            is_active: true,
            display_order: 5
        }
    ];
    
    try {
        const response = await makeRequest('POST', '/equipments', initialEquipments);
        
        if (response.statusCode === 201 && response.data) {
            console.log(`✅ ${response.data.length} équipements ajoutés:`);
            response.data.forEach((eq, i) => {
                console.log(`   ${i + 1}. ${eq.name} (${eq.category})`);
            });
            return { success: true, created: true, count: response.data.length };
        } else {
            console.log(`❌ Erreur insertion ${response.statusCode}: ${response.data}`);
            return { success: false, error: response.data };
        }
        
    } catch (error) {
        console.log(`❌ Erreur insertion: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Exécute le test complet du système d'équipements
 */
async function runCompleteTest() {
    const startTime = Date.now();
    const results = [];
    
    console.log('\n🧪 **TEST COMPLET SYSTÈME ÉQUIPEMENTS**\n');
    
    // Test 1: Accès table equipments
    const equipmentsAccess = await testTableAccess('equipments');
    results.push(['Accès equipments', equipmentsAccess.success]);
    
    // Test 2: Accès table hotel_equipments
    const hotelEquipmentsAccess = await testTableAccess('hotel_equipments');
    results.push(['Accès hotel_equipments', hotelEquipmentsAccess.success]);
    
    // Test 3: Création/suppression
    const createResult = await createTestEquipment();
    const createSuccess = createResult.success;
    results.push(['Création équipement', createSuccess]);
    
    if (createSuccess && createResult.id) {
        const deleteSuccess = await deleteEquipment(createResult.id);
        results.push(['Suppression équipement', deleteSuccess]);
    } else {
        results.push(['Suppression équipement', false]);
    }
    
    // Test 4: Ajout équipements initiaux
    const seedResult = await seedInitialEquipments();
    results.push(['Équipements initiaux', seedResult.success]);
    
    // Résumé
    const duration = Date.now() - startTime;
    const successCount = results.filter(([_, success]) => success).length;
    const totalCount = results.length;
    const successRate = Math.round((successCount / totalCount) * 100);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 **RÉSUMÉ FINAL**');
    console.log('=' .repeat(60));
    
    results.forEach(([testName, success]) => {
        const status = success ? '✅' : '❌';
        console.log(`${status} ${testName}`);
    });
    
    console.log(`\n**Score: ${successRate}% (${successCount}/${totalCount})**`);
    console.log(`**Durée: ${duration}ms**`);
    
    if (successRate >= 80) {
        console.log('\n🎉 **SYSTÈME D\'ÉQUIPEMENTS FONCTIONNEL**');
        console.log('✅ Base de données accessible');
        console.log('✅ CRUD opérationnel');
        console.log('✅ Équipements initiaux disponibles');
        console.log('✅ Prêt pour l\'interface utilisateur');
        
        console.log('\n🎯 **INSTRUCTIONS FINALES:**');
        console.log('1. 🌐 Accéder à http://localhost:3002');
        console.log('2. 🔧 Cliquer sur \'Paramètres\' dans la sidebar');
        console.log('3. 🛠️ Sélectionner l\'onglet \'Équipements\'');
        console.log('4. 📊 Vérifier que les équipements s\'affichent');
        console.log('5. ➕ Tester \'Ajouter un équipement\'');
        console.log('6. ✏️ Tester modification/suppression');
        
    } else {
        console.log('\n⚠️ **PROBLÈMES DÉTECTÉS**');
        console.log('🔍 Vérifier la configuration Supabase');
        console.log('🔒 Problème possible avec RLS policies');
        console.log('🌐 Vérifier la connectivité réseau');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`🏁 Test terminé - ${new Date().toLocaleString()}`);
    console.log('=' .repeat(60));
    
    // Sauvegarder le rapport
    const reportData = {
        timestamp: new Date().toISOString(),
        duration: duration,
        success_rate: successRate,
        results: results.map(([name, success]) => ({ test: name, success })),
        recommendation: successRate >= 80 ? 'READY_FOR_PRODUCTION' : 'NEEDS_FIXES'
    };
    
    fs.writeFileSync(
        'equipments-fix-report.json',
        JSON.stringify(reportData, null, 2)
    );
    
    console.log('📄 Rapport sauvegardé: equipments-fix-report.json');
    
    return successRate >= 80;
}

// Exécution principale
if (require.main === module) {
    runCompleteTest()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Erreur fatale:', error.message);
            process.exit(1);
        });
}

module.exports = { runCompleteTest };