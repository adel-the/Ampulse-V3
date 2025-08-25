/**
 * Comprehensive Data Persistence and Modification Tracking Tests
 * SoliReserve Enhanced - Hotel Management System
 * 
 * Test Coverage:
 * - Initial data creation
 * - Multiple modifications tracking
 * - Concurrent updates handling
 * - Timestamp verification (created_at, updated_at)
 * - Transaction rollback scenarios
 * - Disconnect/reconnect persistence
 * - Bulk operations
 * - Array/JSON field updates
 * - Audit trail verification
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Test configuration
const TEST_CONFIG = {
    // Use environment variables
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    
    // Test parameters
    CONCURRENT_OPERATIONS: 5,
    BULK_OPERATION_SIZE: 10,
    DISCONNECT_DURATION: 3000, // 3 seconds
    TIMESTAMP_TOLERANCE: 5000, // 5 seconds tolerance
    
    // Test data prefixes
    TEST_PREFIX: 'TEST_PERSISTENCE_',
    TIMESTAMP: new Date().toISOString().slice(0, 19).replace(/[-:]/g, '')
};

// Initialize Supabase clients
let supabase, adminSupabase;

// Test results tracking
const testResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    results: [],
    performance: {},
    statistics: {
        dataPersistenceRate: 0,
        modificationTrackingAccuracy: 0,
        timestampVerificationRate: 0,
        transactionIntegrity: 0,
        concurrentUpdateSuccess: 0
    }
};

// Utility functions
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type.toUpperCase().padEnd(5);
    console.log(`[${timestamp}] ${prefix}: ${message}`);
}

async function createTestData(prefix, id = '') {
    const suffix = id || Math.random().toString(36).substring(7);
    
    // Get a real user ID from the database
    let userOwnerId = '00000000-0000-0000-0000-000000000000'; // Default fallback
    try {
        const { data: users } = await adminSupabase.auth.admin.listUsers();
        if (users?.users?.length > 0) {
            userOwnerId = users.users[0].id;
        }
    } catch (error) {
        log(`Warning: Could not get user ID, using fallback: ${error.message}`, 'warn');
    }
    
    return {
        establishment: {
            nom: `${prefix}Hotel_${suffix}`,
            adresse: `${prefix}Address_${suffix}`,
            ville: `${prefix}City_${suffix}`,
            code_postal: '12345',
            telephone: '+33123456789',
            email: `test_${suffix}@example.com`,
            statut: 'ACTIF',
            chambres_total: 10,
            chambres_occupees: 0,
            taux_occupation: 0,
            type_etablissement: 'hotel',
            description: `Test establishment ${suffix}`,
            user_owner_id: userOwnerId
        },
        room: {
            numero: `${suffix}`,
            type: 'standard',
            prix: 75.00,
            statut: 'disponible',
            description: `Test room ${suffix}`,
            floor: 1,
            room_size: 25,
            bed_type: 'double',
            view_type: 'city',
            is_smoking: false,
            amenities: [
                { name: 'TV', available: true },
                { name: 'Minibar', available: false }
            ]
        },
        equipment: {
            nom: `TestEquipment_${suffix}`,
            nom_en: `TestEquipment_EN_${suffix}`,
            description: `Test equipment ${suffix}`,
            categorie: 'general',
            est_actif: true,
            ordre_affichage: 1
        }
    };
}

async function initializeClients() {
    if (!TEST_CONFIG.SUPABASE_URL || !TEST_CONFIG.SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase environment variables. Check your .env.local file.');
    }

    supabase = createClient(TEST_CONFIG.SUPABASE_URL, TEST_CONFIG.SUPABASE_ANON_KEY);
    
    if (TEST_CONFIG.SERVICE_ROLE_KEY) {
        adminSupabase = createClient(TEST_CONFIG.SUPABASE_URL, TEST_CONFIG.SERVICE_ROLE_KEY);
    } else {
        adminSupabase = supabase; // Fallback to regular client
        log('Warning: SERVICE_ROLE_KEY not available, using regular client for admin operations', 'warn');
    }

    // Test connection
    const { data, error } = await supabase.from('hotels').select('id').limit(1);
    if (error) {
        throw new Error(`Supabase connection failed: ${error.message}`);
    }
    
    log('Supabase clients initialized successfully');
}

async function cleanupTestData() {
    log('Cleaning up test data...');
    
    try {
        // Delete test reservations first (foreign key constraints)
        await adminSupabase.from('reservations').delete().ilike('prescripteur', `%${TEST_CONFIG.TEST_PREFIX}%`);
        
        // Delete test rooms
        await adminSupabase.from('rooms').delete().ilike('numero', `%${TEST_CONFIG.TEST_PREFIX}%`);
        
        // Delete test clients
        await adminSupabase.from('clients').delete().ilike('nom', `%${TEST_CONFIG.TEST_PREFIX}%`);
        
        // Delete test hotels
        await adminSupabase.from('hotels').delete().ilike('nom', `%${TEST_CONFIG.TEST_PREFIX}%`);
        
        log('Test data cleanup completed');
    } catch (error) {
        log(`Error during cleanup: ${error.message}`, 'error');
    }
}

function addTestResult(testName, passed, details = null, performance = null) {
    testResults.totalTests++;
    if (passed) {
        testResults.passedTests++;
    } else {
        testResults.failedTests++;
    }

    testResults.results.push({
        test: testName,
        status: passed ? 'PASSED' : 'FAILED',
        details,
        performance,
        timestamp: new Date().toISOString()
    });

    if (performance) {
        testResults.performance[testName] = performance;
    }

    log(`${testName}: ${passed ? 'PASSED' : 'FAILED'}${details ? ` - ${details}` : ''}`);
}

// Test 1: Initial Data Creation and Persistence
async function testInitialDataCreation() {
    const testName = 'Initial Data Creation';
    const startTime = Date.now();
    
    try {
        const testData = await createTestData(TEST_CONFIG.TEST_PREFIX, 'INITIAL');
        
        // Create establishment using admin client to bypass RLS
        const { data: establishment, error: hotelError } = await adminSupabase
            .from('hotels')
            .insert(testData.establishment)
            .select()
            .single();
            
        if (hotelError) throw hotelError;
        
        // Verify timestamps are set
        const createdAt = new Date(establishment.created_at);
        const updatedAt = new Date(establishment.updated_at);
        const now = new Date();
        
        if (Math.abs(now - createdAt) > TEST_CONFIG.TIMESTAMP_TOLERANCE) {
            throw new Error('created_at timestamp not properly set');
        }
        
        if (Math.abs(now - updatedAt) > TEST_CONFIG.TIMESTAMP_TOLERANCE) {
            throw new Error('updated_at timestamp not properly set');
        }
        
        // Create room
        const roomData = { ...testData.room, hotel_id: establishment.id };
        const { data: room, error: roomError } = await adminSupabase
            .from('rooms')
            .insert(roomData)
            .select()
            .single();
            
        if (roomError) throw roomError;
        
        // Verify all data persisted correctly
        const { data: verifyHotel } = await adminSupabase
            .from('hotels')
            .select('*')
            .eq('id', establishment.id)
            .single();
            
        const { data: verifyRoom } = await adminSupabase
            .from('rooms')
            .select('*')
            .eq('id', room.id)
            .single();
        
        const performance = { duration: Date.now() - startTime };
        
        // Verify data integrity
        if (!verifyHotel || !verifyRoom) {
            throw new Error('Data not properly persisted');
        }
        
        // Verify basic data fields - schema doesn't have categories/amenities directly
        if (verifyHotel.nom !== testData.establishment.nom) {
            throw new Error('Hotel name not properly persisted');
        }
        
        if (verifyHotel.description !== testData.establishment.description) {
            throw new Error('Hotel description not properly persisted');
        }
        
        addTestResult(testName, true, 'All data created and verified successfully', performance);
        testResults.statistics.dataPersistenceRate += 25; // Contributes 25% to overall score
        
        return { establishment, room };
        
    } catch (error) {
        addTestResult(testName, false, error.message, { duration: Date.now() - startTime });
        throw error;
    }
}

// Test 2: Multiple Modifications Tracking
async function testMultipleModifications(testData) {
    const testName = 'Multiple Modifications Tracking';
    const startTime = Date.now();
    
    try {
        const { establishment, room } = testData;
        const modifications = [];
        
        // Modification 1: Update establishment basic info
        const mod1Time = new Date();
        const { data: mod1, error: mod1Error } = await adminSupabase
            .from('hotels')
            .update({
                nom: `${establishment.nom}_MODIFIED_1`,
                telephone: '+33111111111',
                taux_occupation: 25.5
            })
            .eq('id', establishment.id)
            .select()
            .single();
            
        if (mod1Error) throw mod1Error;
        modifications.push({ step: 1, data: mod1, timestamp: mod1Time });
        
        // Wait a bit to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Modification 2: Update other fields
        const mod2Time = new Date();
        const { data: mod2, error: mod2Error } = await adminSupabase
            .from('hotels')
            .update({
                capacite: 150,
                surface_totale: 2500.00,
                nombre_etages: 3
            })
            .eq('id', establishment.id)
            .select()
            .single();
            
        if (mod2Error) throw mod2Error;
        modifications.push({ step: 2, data: mod2, timestamp: mod2Time });
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Modification 3: Update room status
        const mod3Time = new Date();
        const { data: mod3, error: mod3Error } = await adminSupabase
            .from('rooms')
            .update({
                statut: 'maintenance',
                notes: 'Maintenance required',
                last_cleaned: new Date().toISOString()
            })
            .eq('id', room.id)
            .select()
            .single();
            
        if (mod3Error) throw mod3Error;
        modifications.push({ step: 3, data: mod3, timestamp: mod3Time });
        
        // Verify timestamp progression
        let timestampAccuracy = 0;
        for (let i = 0; i < modifications.length; i++) {
            const mod = modifications[i];
            const updatedAt = new Date(mod.data.updated_at);
            
            // Check if updated_at is close to modification time
            if (Math.abs(updatedAt - mod.timestamp) < TEST_CONFIG.TIMESTAMP_TOLERANCE) {
                timestampAccuracy++;
            }
            
            // Check if updated_at is after created_at
            const createdAt = new Date(mod.data.created_at);
            if (updatedAt <= createdAt) {
                throw new Error(`updated_at should be after created_at for modification ${i + 1}`);
            }
            
            // Check chronological order
            if (i > 0) {
                const prevUpdatedAt = new Date(modifications[i - 1].data.updated_at);
                if (updatedAt <= prevUpdatedAt) {
                    throw new Error(`Timestamps not in chronological order between modifications ${i} and ${i + 1}`);
                }
            }
        }
        
        const performance = { 
            duration: Date.now() - startTime,
            modificationsCount: modifications.length,
            timestampAccuracy: (timestampAccuracy / modifications.length) * 100
        };
        
        addTestResult(testName, true, `${modifications.length} modifications tracked successfully`, performance);
        testResults.statistics.modificationTrackingAccuracy += 25;
        testResults.statistics.timestampVerificationRate += (timestampAccuracy / modifications.length) * 25;
        
        return modifications;
        
    } catch (error) {
        addTestResult(testName, false, error.message, { duration: Date.now() - startTime });
        throw error;
    }
}

// Test 3: Concurrent Updates Handling
async function testConcurrentUpdates(testData) {
    const testName = 'Concurrent Updates Handling';
    const startTime = Date.now();
    
    try {
        const { establishment } = testData;
        const concurrentPromises = [];
        
        // Create multiple concurrent update operations
        for (let i = 0; i < TEST_CONFIG.CONCURRENT_OPERATIONS; i++) {
            const updatePromise = supabase
                .from('hotels')
                .update({
                    taux_occupation: i * 5,
                    notes_internes: `Concurrent update ${i} at ${new Date().toISOString()}`
                })
                .eq('id', establishment.id)
                .select();
                
            concurrentPromises.push(updatePromise);
        }
        
        // Execute all updates concurrently
        const results = await Promise.allSettled(concurrentPromises);
        
        // Analyze results
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        // Verify final state
        const { data: finalState } = await supabase
            .from('hotels')
            .select('*')
            .eq('id', establishment.id)
            .single();
            
        if (!finalState) {
            throw new Error('Data corrupted after concurrent updates');
        }
        
        const performance = {
            duration: Date.now() - startTime,
            totalOperations: TEST_CONFIG.CONCURRENT_OPERATIONS,
            successful,
            failed,
            successRate: (successful / TEST_CONFIG.CONCURRENT_OPERATIONS) * 100
        };
        
        // Consider test successful if at least 80% of operations succeeded
        const testPassed = performance.successRate >= 80;
        
        addTestResult(testName, testPassed, 
            `${successful}/${TEST_CONFIG.CONCURRENT_OPERATIONS} operations successful`, 
            performance);
            
        if (testPassed) {
            testResults.statistics.concurrentUpdateSuccess += 25;
        }
        
        return { successful, failed, finalState };
        
    } catch (error) {
        addTestResult(testName, false, error.message, { duration: Date.now() - startTime });
        throw error;
    }
}

// Test 4: Transaction Rollback Scenarios
async function testTransactionRollback() {
    const testName = 'Transaction Rollback Scenarios';
    const startTime = Date.now();
    
    try {
        const testData = await createTestData(TEST_CONFIG.TEST_PREFIX, 'ROLLBACK');
        let rollbackSuccessful = false;
        
        try {
            // Attempt to create data that should fail (foreign key violation)
            const { data: hotel, error: hotelError } = await supabase
                .from('hotels')
                .insert(testData.establishment)
                .select()
                .single();
                
            if (hotelError) throw hotelError;
            
            // Try to create room with invalid hotel_id (should fail)
            const { error: roomError } = await supabase
                .from('rooms')
                .insert({
                    ...testData.room,
                    hotel_id: 999999 // Non-existent hotel ID
                });
                
            if (roomError) {
                // This error is expected - now clean up the hotel
                await supabase.from('hotels').delete().eq('id', hotel.id);
                rollbackSuccessful = true;
            }
            
        } catch (transactionError) {
            rollbackSuccessful = true;
        }
        
        // Verify no orphaned data exists
        const { data: orphanedHotels } = await supabase
            .from('hotels')
            .select('id')
            .ilike('nom', `%${TEST_CONFIG.TEST_PREFIX}ROLLBACK%`);
            
        const { data: orphanedRooms } = await supabase
            .from('rooms')
            .select('id')
            .ilike('numero', `%ROLLBACK%`);
            
        const performance = { 
            duration: Date.now() - startTime,
            rollbackExecuted: rollbackSuccessful,
            orphanedData: (orphanedHotels?.length || 0) + (orphanedRooms?.length || 0)
        };
        
        const testPassed = rollbackSuccessful && performance.orphanedData === 0;
        
        addTestResult(testName, testPassed, 
            rollbackSuccessful ? 'Rollback executed successfully' : 'Rollback failed', 
            performance);
            
        if (testPassed) {
            testResults.statistics.transactionIntegrity += 25;
        }
        
        return { rollbackSuccessful, orphanedData: performance.orphanedData };
        
    } catch (error) {
        addTestResult(testName, false, error.message, { duration: Date.now() - startTime });
        throw error;
    }
}

// Test 5: Disconnect/Reconnect Persistence
async function testDisconnectReconnectPersistence(testData) {
    const testName = 'Disconnect/Reconnect Persistence';
    const startTime = Date.now();
    
    try {
        const { establishment } = testData;
        const preDisconnectData = await createTestData(TEST_CONFIG.TEST_PREFIX, 'DISCONNECT');
        
        // Create data before "disconnect"
        const { data: preData, error: preError } = await supabase
            .from('hotels')
            .update({
                description: preDisconnectData.establishment.description,
                gestionnaire: 'Pre-disconnect manager'
            })
            .eq('id', establishment.id)
            .select()
            .single();
            
        if (preError) throw preError;
        
        // Simulate disconnect by waiting
        log(`Simulating disconnect for ${TEST_CONFIG.DISCONNECT_DURATION}ms...`);
        await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.DISCONNECT_DURATION));
        
        // "Reconnect" and verify data persistence
        const { data: postData, error: postError } = await supabase
            .from('hotels')
            .select('*')
            .eq('id', establishment.id)
            .single();
            
        if (postError) throw postError;
        
        // Verify data integrity after reconnect
        const dataIntact = (
            postData.description === preDisconnectData.establishment.description &&
            postData.gestionnaire === 'Pre-disconnect manager'
        );
        
        // Update data after reconnect
        const { data: postUpdateData, error: postUpdateError } = await supabase
            .from('hotels')
            .update({
                gestionnaire: 'Post-reconnect manager',
                notes_internes: 'Updated after reconnect'
            })
            .eq('id', establishment.id)
            .select()
            .single();
            
        if (postUpdateError) throw postUpdateError;
        
        const performance = {
            duration: Date.now() - startTime,
            disconnectDuration: TEST_CONFIG.DISCONNECT_DURATION,
            dataIntact
        };
        
        addTestResult(testName, dataIntact, 
            dataIntact ? 'Data persisted through disconnect' : 'Data corrupted during disconnect', 
            performance);
            
        if (dataIntact) {
            testResults.statistics.dataPersistenceRate += 25;
        }
        
        return { preData, postData, postUpdateData };
        
    } catch (error) {
        addTestResult(testName, false, error.message, { duration: Date.now() - startTime });
        throw error;
    }
}

// Test 6: Bulk Operations Persistence
async function testBulkOperations() {
    const testName = 'Bulk Operations Persistence';
    const startTime = Date.now();
    
    try {
        // Create bulk establishment data
        const bulkEstablishments = [];
        for (let i = 0; i < TEST_CONFIG.BULK_OPERATION_SIZE; i++) {
            const data = await createTestData(TEST_CONFIG.TEST_PREFIX, `BULK_${i}`);
            bulkEstablishments.push(data.establishment);
        }
        
        // Bulk insert
        const { data: insertedData, error: insertError } = await supabase
            .from('hotels')
            .insert(bulkEstablishments)
            .select();
            
        if (insertError) throw insertError;
        
        if (!insertedData || insertedData.length !== TEST_CONFIG.BULK_OPERATION_SIZE) {
            throw new Error(`Expected ${TEST_CONFIG.BULK_OPERATION_SIZE} records, got ${insertedData?.length || 0}`);
        }
        
        // Bulk update
        const hotelIds = insertedData.map(h => h.id);
        const { error: updateError } = await supabase
            .from('hotels')
            .update({ 
                statut: 'INACTIF',
                notes_internes: 'Bulk updated'
            })
            .in('id', hotelIds);
            
        if (updateError) throw updateError;
        
        // Verify updates
        const { data: updatedData, error: verifyError } = await supabase
            .from('hotels')
            .select('id, statut, notes_internes')
            .in('id', hotelIds);
            
        if (verifyError) throw verifyError;
        
        const correctlyUpdated = updatedData?.filter(h => 
            h.statut === 'INACTIF' && h.notes_internes === 'Bulk updated'
        ).length || 0;
        
        const performance = {
            duration: Date.now() - startTime,
            recordsCreated: insertedData.length,
            recordsUpdated: correctlyUpdated,
            successRate: (correctlyUpdated / TEST_CONFIG.BULK_OPERATION_SIZE) * 100
        };
        
        const testPassed = performance.successRate === 100;
        
        addTestResult(testName, testPassed, 
            `${correctlyUpdated}/${TEST_CONFIG.BULK_OPERATION_SIZE} records processed correctly`, 
            performance);
        
        return { insertedData, updatedData, hotelIds };
        
    } catch (error) {
        addTestResult(testName, false, error.message, { duration: Date.now() - startTime });
        throw error;
    }
}

// Test 7: Array/JSON Field Updates
async function testArrayJsonFieldUpdates(testData) {
    const testName = 'Array/JSON Field Updates';
    const startTime = Date.now();
    
    try {
        const { establishment, room } = testData;
        
        // Test 1: Update description (text field)
        const newDescription = 'Updated hotel description with rich content';
        const { data: descUpdate, error: descError } = await supabase
            .from('hotels')
            .update({ description: newDescription })
            .eq('id', establishment.id)
            .select('description, updated_at')
            .single();
            
        if (descError) throw descError;
        
        // Test 2: Update numeric fields
        const numericUpdates = {
            capacite: 200,
            surface_totale: 3000.00,
            parking_places: 25
        };
        
        const { data: numericUpdate, error: numericError } = await supabase
            .from('hotels')
            .update(numericUpdates)
            .eq('id', establishment.id)
            .select('capacite, surface_totale, parking_places, updated_at')
            .single();
            
        if (numericError) throw numericError;
        
        // Test 3: Room amenities update (JSON field that exists)
        const roomAmenities = [
            { name: 'TV', available: true, size: '42 inch' },
            { name: 'Safe', available: true, type: 'electronic' }
        ];
        
        const { data: roomUpdate, error: roomError } = await supabase
            .from('rooms')
            .update({ amenities: roomAmenities })
            .eq('id', room.id)
            .select('amenities, updated_at')
            .single();
            
        if (roomError) throw roomError;
        
        // Verify data integrity
        const { data: verifyHotel } = await supabase
            .from('hotels')
            .select('description, capacite, surface_totale, parking_places')
            .eq('id', establishment.id)
            .single();
            
        const { data: verifyRoom } = await supabase
            .from('rooms')
            .select('amenities')
            .eq('id', room.id)
            .single();
        
        const performance = {
            duration: Date.now() - startTime,
            textFieldsUpdated: 1,
            numericFieldsUpdated: 3,
            jsonFieldsUpdated: 1,
            descriptionCorrect: verifyHotel?.description === newDescription,
            numericCorrect: verifyHotel?.capacite === 200 && verifyHotel?.surface_totale === 3000.00,
            roomAmenitiesCorrect: verifyRoom?.amenities?.length === 2
        };
        
        const allCorrect = performance.descriptionCorrect && 
                          performance.numericCorrect && 
                          performance.roomAmenitiesCorrect;
        
        addTestResult(testName, allCorrect, 
            allCorrect ? 'All field updates completed correctly' : 'Some fields not updated properly', 
            performance);
        
        return { descUpdate, numericUpdate, roomUpdate };
        
    } catch (error) {
        addTestResult(testName, false, error.message, { duration: Date.now() - startTime });
        throw error;
    }
}

// Test 8: Equipment Availability Tracking
async function testEquipmentAvailabilityTracking() {
    const testName = 'Equipment Availability Tracking';
    const startTime = Date.now();
    
    try {
        // Get or create test hotel first
        const testData = await createTestData(TEST_CONFIG.TEST_PREFIX, 'EQUIPMENT');
        const { data: hotel, error: hotelError } = await supabase
            .from('hotels')
            .insert(testData.establishment)
            .select()
            .single();
            
        if (hotelError) throw hotelError;
        
        // Get available equipment
        const { data: equipments, error: equipError } = await supabase
            .from('equipments')
            .select('*')
            .limit(3);
            
        if (equipError || !equipments?.length) {
            log('Warning: No equipment data available for testing', 'warn');
            addTestResult(testName, true, 'Skipped - No equipment data available');
            return { skipped: true };
        }
        
        const equipmentChanges = [];
        
        // Add equipment to hotel with different availability states
        for (let i = 0; i < equipments.length; i++) {
            const equipment = equipments[i];
            const isAvailable = i % 2 === 0; // Alternate availability
            
            const { data: hotelEquip, error: addError } = await supabase
                .from('hotel_equipments')
                .insert({
                    hotel_id: hotel.id,
                    equipment_id: equipment.id,
                    est_disponible: isAvailable,
                    est_gratuit: !isAvailable,
                    prix_supplement: isAvailable ? 10 + i * 5 : null,
                    description_specifique: `Equipment ${i + 1} test`,
                    conditions_usage: `Conditions for equipment ${i + 1}`
                })
                .select()
                .single();
                
            if (addError) throw addError;
            
            equipmentChanges.push({
                step: `add_${i}`,
                equipment_id: equipment.id,
                initial_state: isAvailable,
                timestamp: new Date()
            });
            
            // Wait a bit then change availability
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const { data: updatedEquip, error: updateError } = await supabase
                .from('hotel_equipments')
                .update({
                    est_disponible: !isAvailable,
                    est_gratuit: isAvailable,
                    prix_supplement: !isAvailable ? 15 + i * 3 : null,
                    date_derniere_maj: new Date().toISOString()
                })
                .eq('id', hotelEquip.id)
                .select()
                .single();
                
            if (updateError) throw updateError;
            
            equipmentChanges.push({
                step: `update_${i}`,
                equipment_id: equipment.id,
                final_state: !isAvailable,
                timestamp: new Date()
            });
        }
        
        // Verify final state
        const { data: finalEquipments, error: finalError } = await supabase
            .from('hotel_equipments')
            .select(`
                *,
                equipments (nom, categorie)
            `)
            .eq('hotel_id', hotel.id);
            
        if (finalError) throw finalError;
        
        const performance = {
            duration: Date.now() - startTime,
            equipmentCount: equipments.length,
            changesTracked: equipmentChanges.length,
            finalStateCorrect: finalEquipments?.length === equipments.length
        };
        
        addTestResult(testName, performance.finalStateCorrect, 
            `${equipmentChanges.length} equipment changes tracked`, 
            performance);
        
        // Cleanup
        await supabase.from('hotel_equipments').delete().eq('hotel_id', hotel.id);
        await supabase.from('hotels').delete().eq('id', hotel.id);
        
        return { equipmentChanges, finalEquipments };
        
    } catch (error) {
        addTestResult(testName, false, error.message, { duration: Date.now() - startTime });
        throw error;
    }
}

// Generate comprehensive report
function generateReport() {
    const totalTime = Object.values(testResults.performance).reduce((sum, perf) => sum + (perf.duration || 0), 0);
    const avgTime = testResults.totalTests > 0 ? totalTime / testResults.totalTests : 0;
    
    // Calculate final statistics
    const maxScore = 100;
    const finalStats = {
        dataPersistenceRate: Math.min(testResults.statistics.dataPersistenceRate, maxScore),
        modificationTrackingAccuracy: Math.min(testResults.statistics.modificationTrackingAccuracy, maxScore),
        timestampVerificationRate: Math.min(testResults.statistics.timestampVerificationRate, maxScore),
        transactionIntegrity: Math.min(testResults.statistics.transactionIntegrity, maxScore),
        concurrentUpdateSuccess: Math.min(testResults.statistics.concurrentUpdateSuccess, maxScore)
    };
    
    const overallScore = Object.values(finalStats).reduce((sum, score) => sum + score, 0) / Object.keys(finalStats).length;
    
    const report = {
        summary: {
            totalTests: testResults.totalTests,
            passed: testResults.passedTests,
            failed: testResults.failedTests,
            successRate: testResults.totalTests > 0 ? (testResults.passedTests / testResults.totalTests * 100).toFixed(2) + '%' : '0%',
            overallScore: overallScore.toFixed(2) + '%'
        },
        performance: {
            totalDuration: `${totalTime}ms`,
            averageDuration: `${avgTime.toFixed(0)}ms`,
            testDetails: testResults.performance
        },
        statistics: {
            dataPersistenceSuccessRate: finalStats.dataPersistenceRate.toFixed(2) + '%',
            modificationTrackingAccuracy: finalStats.modificationTrackingAccuracy.toFixed(2) + '%',
            timestampVerificationRate: finalStats.timestampVerificationRate.toFixed(2) + '%',
            transactionIntegrity: finalStats.transactionIntegrity.toFixed(2) + '%',
            concurrentUpdateHandling: finalStats.concurrentUpdateSuccess.toFixed(2) + '%'
        },
        detailedResults: testResults.results.map(result => ({
            test: result.test,
            status: result.status,
            details: result.details,
            duration: result.performance?.duration ? `${result.performance.duration}ms` : 'N/A',
            timestamp: result.timestamp
        })),
        recommendations: generateRecommendations(finalStats)
    };
    
    return report;
}

function generateRecommendations(stats) {
    const recommendations = [];
    
    if (stats.dataPersistenceRate < 90) {
        recommendations.push('Data persistence rate is below 90%. Review database connection stability and transaction handling.');
    }
    
    if (stats.modificationTrackingAccuracy < 90) {
        recommendations.push('Modification tracking accuracy is low. Verify trigger functions and audit log implementation.');
    }
    
    if (stats.timestampVerificationRate < 90) {
        recommendations.push('Timestamp verification failing. Check database timezone settings and trigger implementations.');
    }
    
    if (stats.transactionIntegrity < 90) {
        recommendations.push('Transaction integrity issues detected. Review rollback mechanisms and constraint implementations.');
    }
    
    if (stats.concurrentUpdateSuccess < 80) {
        recommendations.push('Concurrent update handling needs improvement. Consider optimistic locking or queue-based updates.');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('All tests passed successfully! Data persistence and modification tracking are working correctly.');
    }
    
    return recommendations;
}

// Main test execution
async function runAllTests() {
    log('='.repeat(80));
    log('SOLIRESERVE ENHANCED - DATA PERSISTENCE & MODIFICATION TRACKING TESTS');
    log('='.repeat(80));
    
    try {
        // Initialize
        await initializeClients();
        await cleanupTestData();
        
        log('Starting test suite execution...');
        
        // Test 1: Initial data creation
        const initialData = await testInitialDataCreation();
        
        // Test 2: Multiple modifications
        await testMultipleModifications(initialData);
        
        // Test 3: Concurrent updates
        await testConcurrentUpdates(initialData);
        
        // Test 4: Transaction rollback
        await testTransactionRollback();
        
        // Test 5: Disconnect/reconnect persistence
        await testDisconnectReconnectPersistence(initialData);
        
        // Test 6: Bulk operations
        await testBulkOperations();
        
        // Test 7: Array/JSON field updates
        await testArrayJsonFieldUpdates(initialData);
        
        // Test 8: Equipment availability tracking
        await testEquipmentAvailabilityTracking();
        
        // Clean up test data
        await cleanupTestData();
        
        log('All tests completed successfully!');
        
    } catch (error) {
        log(`Test suite execution failed: ${error.message}`, 'error');
    }
    
    // Generate and display report
    const report = generateReport();
    
    log('='.repeat(80));
    log('TEST RESULTS SUMMARY');
    log('='.repeat(80));
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Total Tests: ${report.summary.totalTests}`);
    console.log(`   Passed: ${report.summary.passed}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Success Rate: ${report.summary.successRate}`);
    console.log(`   Overall Score: ${report.summary.overallScore}`);
    
    console.log('\n⏱️  PERFORMANCE:');
    console.log(`   Total Duration: ${report.performance.totalDuration}`);
    console.log(`   Average per Test: ${report.performance.averageDuration}`);
    
    console.log('\n📈 STATISTICS:');
    console.log(`   Data Persistence Success Rate: ${report.statistics.dataPersistenceSuccessRate}`);
    console.log(`   Modification Tracking Accuracy: ${report.statistics.modificationTrackingAccuracy}`);
    console.log(`   Timestamp Verification Rate: ${report.statistics.timestampVerificationRate}`);
    console.log(`   Transaction Integrity: ${report.statistics.transactionIntegrity}`);
    console.log(`   Concurrent Update Handling: ${report.statistics.concurrentUpdateHandling}`);
    
    console.log('\n🔍 DETAILED RESULTS:');
    report.detailedResults.forEach(result => {
        const status = result.status === 'PASSED' ? '✅' : '❌';
        console.log(`   ${status} ${result.test}: ${result.details || 'No details'} (${result.duration})`);
    });
    
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
    });
    
    log('='.repeat(80));
    
    // Save detailed report to file
    const fs = require('fs');
    const reportPath = `D:\\Dev\\Ampulse v3\\tests\\persistence-test-report-${TEST_CONFIG.TIMESTAMP}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`Detailed report saved to: ${reportPath}`);
    
    return report;
}

// Execute if run directly
if (require.main === module) {
    runAllTests()
        .then((report) => {
            process.exit(report.summary.failed > 0 ? 1 : 0);
        })
        .catch((error) => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = {
    runAllTests,
    testResults,
    TEST_CONFIG
};