/**
 * COMPREHENSIVE DATABASE RELATIONSHIPS & DATA INTEGRITY TEST SUITE
 * ==================================================================
 * 
 * This test suite validates all database relationships and data integrity
 * for the SoliReserve Enhanced Hotel Management System.
 * 
 * Coverage:
 * - Hotel -> Rooms relationship (1-N)  
 * - Hotel -> Equipment relationship (N-N)
 * - Room -> Equipment relationship (N-N)
 * - Cascade operations
 * - Foreign key constraints
 * - Data consistency across updates
 * - Complex queries and aggregations
 * - Orphan record prevention
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuration
const TEST_CONFIG = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    testUserId: '3a160e48-007a-4571-88a9-cbf3c6a63e35', // Valid user UUID from existing data
    performanceThresholds: {
        simpleQuery: 500,     // ms
        complexQuery: 2000,   // ms
        cascade: 3000,        // ms
        aggregation: 1500     // ms
    }
};

if (!TEST_CONFIG.supabaseUrl || !TEST_CONFIG.supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);

class DatabaseIntegrityTester {
    constructor() {
        this.testResults = {
            relationships: { passed: 0, failed: 0, details: [] },
            cascades: { passed: 0, failed: 0, details: [] },
            constraints: { passed: 0, failed: 0, details: [] },
            complexQueries: { passed: 0, failed: 0, details: [] },
            dataConsistency: { passed: 0, failed: 0, details: [] },
            performance: { passed: 0, failed: 0, details: [] }
        };
        this.testData = {
            hotels: [],
            rooms: [],
            equipments: [],
            hotelEquipments: [],
            roomEquipments: [],
            reservations: []
        };
    }

    async runAllTests() {
        console.log('🧪 STARTING DATABASE RELATIONSHIPS & INTEGRITY TEST SUITE');
        console.log('============================================================\n');

        try {
            await this.setupTestData();
            await this.testRelationshipIntegrity();
            await this.testCascadeOperations();
            await this.testForeignKeyConstraints();
            await this.testComplexQueries();
            await this.testDataConsistency();
            await this.testPerformance();
            
            return this.generateReport();
        } catch (error) {
            console.error('💥 Fatal error during testing:', error);
            return { success: false, error: error.message };
        } finally {
            await this.cleanup();
        }
    }

    async setupTestData() {
        console.log('📋 Setting up test data...\n');

        try {
            // Create test hotels
            const hotelsData = [
                {
                    nom: 'Test Hotel Alpha',
                    adresse: '123 Test Street',
                    ville: 'TestCity',
                    code_postal: '75001',
                    type_etablissement: 'hotel',
                    user_owner_id: TEST_CONFIG.testUserId,
                    chambres_total: 0,
                    statut: 'ACTIF'
                },
                {
                    nom: 'Test Hotel Beta',
                    adresse: '456 Test Avenue',
                    ville: 'TestTown',
                    code_postal: '75002',
                    type_etablissement: 'residence',
                    user_owner_id: TEST_CONFIG.testUserId,
                    chambres_total: 0,
                    statut: 'ACTIF'
                }
            ];

            // Insert hotels
            for (const hotelData of hotelsData) {
                const { data, error } = await supabase
                    .from('hotels')
                    .insert(hotelData)
                    .select()
                    .single();

                if (error) throw new Error(`Failed to create hotel: ${error.message}`);
                this.testData.hotels.push(data);
                console.log(`✅ Created test hotel: ${data.nom} (ID: ${data.id})`);
            }

            // Create test equipments
            const equipmentsData = [
                {
                    nom: 'Test WiFi',
                    nom_en: 'Test WiFi',
                    categorie: 'connectivity',
                    est_actif: true,
                    ordre_affichage: 1
                },
                {
                    nom: 'Test TV',
                    nom_en: 'Test Television',
                    categorie: 'services',
                    est_actif: true,
                    ordre_affichage: 2
                },
                {
                    nom: 'Test Mini-Bar',
                    nom_en: 'Test Mini Bar',
                    categorie: 'services',
                    est_premium: true,
                    est_actif: true,
                    ordre_affichage: 3
                }
            ];

            for (const equipmentData of equipmentsData) {
                const { data, error } = await supabase
                    .from('equipments')
                    .insert(equipmentData)
                    .select()
                    .single();

                if (error) throw new Error(`Failed to create equipment: ${error.message}`);
                this.testData.equipments.push(data);
                console.log(`✅ Created test equipment: ${data.nom} (ID: ${data.id})`);
            }

            // Create test rooms
            const roomsData = [
                {
                    hotel_id: this.testData.hotels[0].id,
                    numero: '101',
                    type: 'Single',
                    prix: 75.00,
                    statut: 'disponible',
                    floor: 1
                },
                {
                    hotel_id: this.testData.hotels[0].id,
                    numero: '102',
                    type: 'Double',
                    prix: 95.00,
                    statut: 'disponible',
                    floor: 1
                },
                {
                    hotel_id: this.testData.hotels[1].id,
                    numero: '201',
                    type: 'Suite',
                    prix: 150.00,
                    statut: 'disponible',
                    floor: 2
                }
            ];

            for (const roomData of roomsData) {
                const { data, error } = await supabase
                    .from('rooms')
                    .insert(roomData)
                    .select()
                    .single();

                if (error) throw new Error(`Failed to create room: ${error.message}`);
                this.testData.rooms.push(data);
                console.log(`✅ Created test room: ${data.numero} (ID: ${data.id})`);
            }

            // Create hotel-equipment relationships
            const hotelEquipmentData = [
                {
                    hotel_id: this.testData.hotels[0].id,
                    equipment_id: this.testData.equipments[0].id,
                    est_disponible: true,
                    est_gratuit: true
                },
                {
                    hotel_id: this.testData.hotels[0].id,
                    equipment_id: this.testData.equipments[1].id,
                    est_disponible: true,
                    est_gratuit: true
                },
                {
                    hotel_id: this.testData.hotels[1].id,
                    equipment_id: this.testData.equipments[2].id,
                    est_disponible: true,
                    est_gratuit: false,
                    prix_supplement: 15.00
                }
            ];

            for (const heData of hotelEquipmentData) {
                const { data, error } = await supabase
                    .from('hotel_equipments')
                    .insert(heData)
                    .select()
                    .single();

                if (error) throw new Error(`Failed to create hotel equipment: ${error.message}`);
                this.testData.hotelEquipments.push(data);
                console.log(`✅ Created hotel-equipment link: Hotel ${data.hotel_id} -> Equipment ${data.equipment_id}`);
            }

            // Create room-equipment relationships
            const roomEquipmentData = [
                {
                    room_id: this.testData.rooms[0].id,
                    equipment_id: this.testData.equipments[0].id,
                    est_disponible: true,
                    est_fonctionnel: true
                },
                {
                    room_id: this.testData.rooms[0].id,
                    equipment_id: this.testData.equipments[1].id,
                    est_disponible: true,
                    est_fonctionnel: true
                },
                {
                    room_id: this.testData.rooms[2].id,
                    equipment_id: this.testData.equipments[2].id,
                    est_disponible: true,
                    est_fonctionnel: true
                }
            ];

            for (const reData of roomEquipmentData) {
                const { data, error } = await supabase
                    .from('room_equipments')
                    .insert(reData)
                    .select()
                    .single();

                if (error) throw new Error(`Failed to create room equipment: ${error.message}`);
                this.testData.roomEquipments.push(data);
                console.log(`✅ Created room-equipment link: Room ${data.room_id} -> Equipment ${data.equipment_id}`);
            }

            console.log('\n✅ Test data setup complete!');

        } catch (error) {
            throw new Error(`Setup failed: ${error.message}`);
        }
    }

    async testRelationshipIntegrity() {
        console.log('\n🔗 TESTING RELATIONSHIP INTEGRITY');
        console.log('=====================================\n');

        const tests = [
            {
                name: 'Hotel → Rooms (1-N) Relationship',
                test: async () => {
                    const { data, error } = await supabase
                        .from('hotels')
                        .select(`
                            id, nom,
                            rooms (id, numero, type, prix, statut)
                        `)
                        .eq('id', this.testData.hotels[0].id)
                        .single();

                    if (error) throw error;
                    
                    const expectedRooms = this.testData.rooms.filter(r => r.hotel_id === this.testData.hotels[0].id);
                    
                    if (data.rooms.length !== expectedRooms.length) {
                        throw new Error(`Expected ${expectedRooms.length} rooms, got ${data.rooms.length}`);
                    }

                    return { data, expectedCount: expectedRooms.length, actualCount: data.rooms.length };
                }
            },
            {
                name: 'Hotel ← → Equipment (N-N) Relationship',
                test: async () => {
                    const { data, error } = await supabase
                        .from('hotels')
                        .select(`
                            id, nom,
                            hotel_equipments (
                                id, est_disponible, est_gratuit, prix_supplement,
                                equipments (id, nom, categorie)
                            )
                        `)
                        .eq('id', this.testData.hotels[0].id)
                        .single();

                    if (error) throw error;

                    const expectedEquipments = this.testData.hotelEquipments.filter(he => he.hotel_id === this.testData.hotels[0].id);
                    
                    if (data.hotel_equipments.length !== expectedEquipments.length) {
                        throw new Error(`Expected ${expectedEquipments.length} equipment links, got ${data.hotel_equipments.length}`);
                    }

                    return { data, expectedCount: expectedEquipments.length, actualCount: data.hotel_equipments.length };
                }
            },
            {
                name: 'Room ← → Equipment (N-N) Relationship',
                test: async () => {
                    const { data, error } = await supabase
                        .from('rooms')
                        .select(`
                            id, numero,
                            room_equipments (
                                id, est_disponible, est_fonctionnel,
                                equipments (id, nom, categorie)
                            )
                        `)
                        .eq('id', this.testData.rooms[0].id)
                        .single();

                    if (error) throw error;

                    const expectedEquipments = this.testData.roomEquipments.filter(re => re.room_id === this.testData.rooms[0].id);
                    
                    if (data.room_equipments.length !== expectedEquipments.length) {
                        throw new Error(`Expected ${expectedEquipments.length} room equipment links, got ${data.room_equipments.length}`);
                    }

                    return { data, expectedCount: expectedEquipments.length, actualCount: data.room_equipments.length };
                }
            },
            {
                name: 'Bidirectional Relationship Consistency',
                test: async () => {
                    // Test from hotel to equipment
                    const { data: hotelData, error: hotelError } = await supabase
                        .from('hotel_equipments')
                        .select(`
                            hotel_id,
                            hotels (nom),
                            equipment_id,
                            equipments (nom)
                        `)
                        .eq('hotel_id', this.testData.hotels[0].id);

                    if (hotelError) throw hotelError;

                    // Test from equipment to hotel
                    const { data: equipmentData, error: equipmentError } = await supabase
                        .from('hotel_equipments')
                        .select(`
                            equipment_id,
                            equipments (nom),
                            hotel_id,
                            hotels (nom)
                        `)
                        .in('equipment_id', this.testData.equipments.map(e => e.id));

                    if (equipmentError) throw equipmentError;

                    // Verify consistency
                    const hotelLinks = hotelData.length;
                    const equipmentLinks = equipmentData.filter(ed => 
                        this.testData.hotelEquipments.some(he => 
                            he.hotel_id === ed.hotel_id && he.equipment_id === ed.equipment_id
                        )
                    ).length;

                    if (hotelLinks === 0 && equipmentLinks === 0) {
                        throw new Error('No bidirectional links found');
                    }

                    return { hotelLinks, equipmentLinks, consistent: true };
                }
            }
        ];

        for (const test of tests) {
            try {
                console.log(`🧪 ${test.name}...`);
                const result = await test.test();
                
                this.testResults.relationships.passed++;
                this.testResults.relationships.details.push({
                    name: test.name,
                    status: 'PASSED',
                    result
                });
                
                console.log(`   ✅ PASSED - ${JSON.stringify(result, null, 2).replace(/\n/g, '\n   ')}`);
                
            } catch (error) {
                this.testResults.relationships.failed++;
                this.testResults.relationships.details.push({
                    name: test.name,
                    status: 'FAILED',
                    error: error.message
                });
                
                console.log(`   ❌ FAILED - ${error.message}`);
            }
        }
    }

    async testCascadeOperations() {
        console.log('\n🌊 TESTING CASCADE OPERATIONS');
        console.log('==============================\n');

        const tests = [
            {
                name: 'Hotel Deletion Cascades to Rooms',
                test: async () => {
                    const startTime = Date.now();

                    // Create temporary hotel and room for cascade test
                    const { data: tempHotel, error: hotelError } = await supabase
                        .from('hotels')
                        .insert({
                            nom: 'Temp Cascade Hotel',
                            adresse: '999 Cascade St',
                            ville: 'CascadeCity',
                            code_postal: '99999',
                            user_owner_id: TEST_CONFIG.testUserId,
                            statut: 'ACTIF'
                        })
                        .select()
                        .single();

                    if (hotelError) throw hotelError;

                    const { data: tempRoom, error: roomError } = await supabase
                        .from('rooms')
                        .insert({
                            hotel_id: tempHotel.id,
                            numero: 'CASCADE001',
                            type: 'Test',
                            prix: 50.00,
                            statut: 'disponible'
                        })
                        .select()
                        .single();

                    if (roomError) throw roomError;

                    // Delete hotel and verify room is also deleted
                    const { error: deleteError } = await supabase
                        .from('hotels')
                        .delete()
                        .eq('id', tempHotel.id);

                    if (deleteError) throw deleteError;

                    // Verify room was cascaded
                    const { data: remainingRooms, error: checkError } = await supabase
                        .from('rooms')
                        .select('id')
                        .eq('id', tempRoom.id);

                    if (checkError) throw checkError;

                    const duration = Date.now() - startTime;

                    if (remainingRooms.length > 0) {
                        throw new Error('Room was not cascaded when hotel was deleted');
                    }

                    return { cascaded: true, duration, deletedHotelId: tempHotel.id, deletedRoomId: tempRoom.id };
                }
            },
            {
                name: 'Equipment Deletion Cascades to Associations',
                test: async () => {
                    const startTime = Date.now();

                    // Create temporary equipment
                    const { data: tempEquipment, error: equipmentError } = await supabase
                        .from('equipments')
                        .insert({
                            nom: 'Temp Cascade Equipment',
                            nom_en: 'Temp Cascade Equipment',
                            categorie: 'general',
                            est_actif: true
                        })
                        .select()
                        .single();

                    if (equipmentError) throw equipmentError;

                    // Create associations
                    const { data: tempHotelEquipment, error: heError } = await supabase
                        .from('hotel_equipments')
                        .insert({
                            hotel_id: this.testData.hotels[0].id,
                            equipment_id: tempEquipment.id,
                            est_disponible: true,
                            est_gratuit: true
                        })
                        .select()
                        .single();

                    if (heError) throw heError;

                    const { data: tempRoomEquipment, error: reError } = await supabase
                        .from('room_equipments')
                        .insert({
                            room_id: this.testData.rooms[0].id,
                            equipment_id: tempEquipment.id,
                            est_disponible: true,
                            est_fonctionnel: true
                        })
                        .select()
                        .single();

                    if (reError) throw reError;

                    // Delete equipment
                    const { error: deleteError } = await supabase
                        .from('equipments')
                        .delete()
                        .eq('id', tempEquipment.id);

                    if (deleteError) throw deleteError;

                    // Verify associations were cascaded
                    const { data: remainingHE, error: heCheckError } = await supabase
                        .from('hotel_equipments')
                        .select('id')
                        .eq('id', tempHotelEquipment.id);

                    if (heCheckError) throw heCheckError;

                    const { data: remainingRE, error: reCheckError } = await supabase
                        .from('room_equipments')
                        .select('id')
                        .eq('id', tempRoomEquipment.id);

                    if (reCheckError) throw reCheckError;

                    const duration = Date.now() - startTime;

                    if (remainingHE.length > 0 || remainingRE.length > 0) {
                        throw new Error('Equipment associations were not properly cascaded');
                    }

                    return { 
                        cascaded: true, 
                        duration, 
                        deletedEquipmentId: tempEquipment.id,
                        cascadedHotelEquipments: 1,
                        cascadedRoomEquipments: 1
                    };
                }
            }
        ];

        for (const test of tests) {
            try {
                console.log(`🧪 ${test.name}...`);
                const result = await test.test();
                
                this.testResults.cascades.passed++;
                this.testResults.cascades.details.push({
                    name: test.name,
                    status: 'PASSED',
                    result
                });
                
                console.log(`   ✅ PASSED - ${JSON.stringify(result, null, 2).replace(/\n/g, '\n   ')}`);
                
            } catch (error) {
                this.testResults.cascades.failed++;
                this.testResults.cascades.details.push({
                    name: test.name,
                    status: 'FAILED',
                    error: error.message
                });
                
                console.log(`   ❌ FAILED - ${error.message}`);
            }
        }
    }

    async testForeignKeyConstraints() {
        console.log('\n🔒 TESTING FOREIGN KEY CONSTRAINTS');
        console.log('===================================\n');

        const tests = [
            {
                name: 'Room Creation with Invalid Hotel ID',
                test: async () => {
                    const invalidHotelId = 999999;
                    
                    const { data, error } = await supabase
                        .from('rooms')
                        .insert({
                            hotel_id: invalidHotelId,
                            numero: 'INVALID001',
                            type: 'Test',
                            prix: 50.00
                        })
                        .select()
                        .single();

                    if (!error) {
                        throw new Error('Expected foreign key constraint violation, but insert succeeded');
                    }

                    return { constraintEnforced: true, errorCode: error.code, errorMessage: error.message };
                }
            },
            {
                name: 'Hotel Equipment with Invalid Equipment ID',
                test: async () => {
                    const invalidEquipmentId = 999999;
                    
                    const { data, error } = await supabase
                        .from('hotel_equipments')
                        .insert({
                            hotel_id: this.testData.hotels[0].id,
                            equipment_id: invalidEquipmentId,
                            est_disponible: true,
                            est_gratuit: true
                        })
                        .select()
                        .single();

                    if (!error) {
                        throw new Error('Expected foreign key constraint violation, but insert succeeded');
                    }

                    return { constraintEnforced: true, errorCode: error.code, errorMessage: error.message };
                }
            },
            {
                name: 'Room Equipment with Invalid Room ID',
                test: async () => {
                    const invalidRoomId = 999999;
                    
                    const { data, error } = await supabase
                        .from('room_equipments')
                        .insert({
                            room_id: invalidRoomId,
                            equipment_id: this.testData.equipments[0].id,
                            est_disponible: true,
                            est_fonctionnel: true
                        })
                        .select()
                        .single();

                    if (!error) {
                        throw new Error('Expected foreign key constraint violation, but insert succeeded');
                    }

                    return { constraintEnforced: true, errorCode: error.code, errorMessage: error.message };
                }
            },
            {
                name: 'Unique Constraint: Duplicate Room Number in Same Hotel',
                test: async () => {
                    const { data, error } = await supabase
                        .from('rooms')
                        .insert({
                            hotel_id: this.testData.hotels[0].id,
                            numero: this.testData.rooms[0].numero, // Duplicate number
                            type: 'Test Duplicate',
                            prix: 75.00
                        })
                        .select()
                        .single();

                    if (!error) {
                        throw new Error('Expected unique constraint violation, but insert succeeded');
                    }

                    return { constraintEnforced: true, errorCode: error.code, errorMessage: error.message };
                }
            }
        ];

        for (const test of tests) {
            try {
                console.log(`🧪 ${test.name}...`);
                const result = await test.test();
                
                this.testResults.constraints.passed++;
                this.testResults.constraints.details.push({
                    name: test.name,
                    status: 'PASSED',
                    result
                });
                
                console.log(`   ✅ PASSED - Constraint properly enforced`);
                
            } catch (error) {
                this.testResults.constraints.failed++;
                this.testResults.constraints.details.push({
                    name: test.name,
                    status: 'FAILED',
                    error: error.message
                });
                
                console.log(`   ❌ FAILED - ${error.message}`);
            }
        }
    }

    async testComplexQueries() {
        console.log('\n🔍 TESTING COMPLEX QUERIES');
        console.log('===========================\n');

        const tests = [
            {
                name: 'Get Hotel with All Rooms and Equipment',
                test: async () => {
                    const startTime = Date.now();

                    const { data, error } = await supabase
                        .from('hotels')
                        .select(`
                            id, nom, adresse, ville, statut,
                            rooms (
                                id, numero, type, prix, statut, floor,
                                room_equipments (
                                    id, est_disponible, est_fonctionnel,
                                    equipments (id, nom, categorie, est_premium)
                                )
                            ),
                            hotel_equipments (
                                id, est_disponible, est_gratuit, prix_supplement,
                                equipments (id, nom, categorie, est_premium)
                            )
                        `)
                        .eq('id', this.testData.hotels[0].id)
                        .single();

                    const duration = Date.now() - startTime;

                    if (error) throw error;

                    const roomCount = data.rooms.length;
                    const hotelEquipmentCount = data.hotel_equipments.length;
                    const roomEquipmentCount = data.rooms.reduce((total, room) => 
                        total + room.room_equipments.length, 0);

                    return { 
                        hotel: data.nom,
                        roomCount, 
                        hotelEquipmentCount, 
                        roomEquipmentCount,
                        duration,
                        performanceOk: duration < TEST_CONFIG.performanceThresholds.complexQuery
                    };
                }
            },
            {
                name: 'Get Room with All Equipment (Room + Hotel Level)',
                test: async () => {
                    const startTime = Date.now();

                    const { data, error } = await supabase
                        .from('rooms')
                        .select(`
                            id, numero, type, statut,
                            hotels (
                                id, nom,
                                hotel_equipments (
                                    id, est_disponible, est_gratuit, prix_supplement,
                                    equipments (id, nom, categorie, est_premium)
                                )
                            ),
                            room_equipments (
                                id, est_disponible, est_fonctionnel,
                                equipments (id, nom, categorie, est_premium)
                            )
                        `)
                        .eq('id', this.testData.rooms[0].id)
                        .single();

                    const duration = Date.now() - startTime;

                    if (error) throw error;

                    const roomEquipmentCount = data.room_equipments.length;
                    const hotelEquipmentCount = data.hotels.hotel_equipments.length;
                    const totalEquipment = roomEquipmentCount + hotelEquipmentCount;

                    return { 
                        room: data.numero,
                        hotel: data.hotels.nom,
                        roomEquipmentCount, 
                        hotelEquipmentCount,
                        totalEquipment,
                        duration,
                        performanceOk: duration < TEST_CONFIG.performanceThresholds.complexQuery
                    };
                }
            },
            {
                name: 'Count Rooms by Status per Hotel',
                test: async () => {
                    const startTime = Date.now();

                    const { data, error } = await supabase
                        .from('hotels')
                        .select(`
                            id, nom,
                            rooms (statut)
                        `);

                    const duration = Date.now() - startTime;

                    if (error) throw error;

                    const roomStats = data.map(hotel => {
                        const statuses = hotel.rooms.reduce((acc, room) => {
                            acc[room.statut] = (acc[room.statut] || 0) + 1;
                            return acc;
                        }, {});

                        return {
                            hotelId: hotel.id,
                            hotelName: hotel.nom,
                            disponible: statuses.disponible || 0,
                            occupee: statuses.occupee || 0,
                            maintenance: statuses.maintenance || 0,
                            total: hotel.rooms.length
                        };
                    });

                    return { 
                        roomStats,
                        totalHotels: data.length,
                        duration,
                        performanceOk: duration < TEST_CONFIG.performanceThresholds.aggregation
                    };
                }
            },
            {
                name: 'Calculate Occupancy Rates',
                test: async () => {
                    const startTime = Date.now();

                    const { data, error } = await supabase
                        .from('hotels')
                        .select(`
                            id, nom,
                            rooms (id, statut)
                        `);

                    const duration = Date.now() - startTime;

                    if (error) throw error;

                    const occupancyData = data.map(hotel => {
                        const totalRooms = hotel.rooms.length;
                        const occupiedRooms = hotel.rooms.filter(r => r.statut === 'occupee').length;
                        const availableRooms = hotel.rooms.filter(r => r.statut === 'disponible').length;
                        const maintenanceRooms = hotel.rooms.filter(r => r.statut === 'maintenance').length;
                        
                        const occupancyRate = totalRooms > 0 ? 
                            Math.round((occupiedRooms / totalRooms) * 10000) / 100 : 0;

                        return {
                            hotelId: hotel.id,
                            hotelName: hotel.nom,
                            totalRooms,
                            occupiedRooms,
                            availableRooms,
                            maintenanceRooms,
                            occupancyRate
                        };
                    });

                    const overallStats = {
                        totalRooms: occupancyData.reduce((sum, h) => sum + h.totalRooms, 0),
                        totalOccupied: occupancyData.reduce((sum, h) => sum + h.occupiedRooms, 0),
                        averageOccupancyRate: occupancyData.length > 0 ? 
                            Math.round(occupancyData.reduce((sum, h) => sum + h.occupancyRate, 0) / occupancyData.length * 100) / 100 : 0
                    };

                    return { 
                        hotelOccupancy: occupancyData,
                        overallStats,
                        duration,
                        performanceOk: duration < TEST_CONFIG.performanceThresholds.aggregation
                    };
                }
            },
            {
                name: 'Aggregate Equipment by Category',
                test: async () => {
                    const startTime = Date.now();

                    const { data, error } = await supabase
                        .from('equipments')
                        .select(`
                            id, nom, categorie, est_premium,
                            hotel_equipments (hotel_id, est_disponible),
                            room_equipments (room_id, est_disponible)
                        `);

                    const duration = Date.now() - startTime;

                    if (error) throw error;

                    const equipmentStats = data.reduce((acc, equipment) => {
                        const category = equipment.categorie;
                        
                        if (!acc[category]) {
                            acc[category] = {
                                totalEquipment: 0,
                                premiumEquipment: 0,
                                hotelInstallations: 0,
                                roomInstallations: 0,
                                availableInHotels: 0,
                                availableInRooms: 0
                            };
                        }

                        acc[category].totalEquipment += 1;
                        if (equipment.est_premium) acc[category].premiumEquipment += 1;
                        
                        acc[category].hotelInstallations += equipment.hotel_equipments.length;
                        acc[category].roomInstallations += equipment.room_equipments.length;
                        
                        acc[category].availableInHotels += equipment.hotel_equipments
                            .filter(he => he.est_disponible).length;
                        acc[category].availableInRooms += equipment.room_equipments
                            .filter(re => re.est_disponible).length;

                        return acc;
                    }, {});

                    return { 
                        equipmentStats,
                        totalCategories: Object.keys(equipmentStats).length,
                        duration,
                        performanceOk: duration < TEST_CONFIG.performanceThresholds.aggregation
                    };
                }
            }
        ];

        for (const test of tests) {
            try {
                console.log(`🧪 ${test.name}...`);
                const result = await test.test();
                
                this.testResults.complexQueries.passed++;
                this.testResults.complexQueries.details.push({
                    name: test.name,
                    status: 'PASSED',
                    result
                });
                
                console.log(`   ✅ PASSED - Duration: ${result.duration}ms, Performance: ${result.performanceOk ? 'OK' : 'SLOW'}`);
                
            } catch (error) {
                this.testResults.complexQueries.failed++;
                this.testResults.complexQueries.details.push({
                    name: test.name,
                    status: 'FAILED',
                    error: error.message
                });
                
                console.log(`   ❌ FAILED - ${error.message}`);
            }
        }
    }

    async testDataConsistency() {
        console.log('\n🎯 TESTING DATA CONSISTENCY');
        console.log('============================\n');

        const tests = [
            {
                name: 'Equipment Shared Between Multiple Rooms',
                test: async () => {
                    // Add same equipment to multiple rooms
                    const sharedEquipmentId = this.testData.equipments[0].id;
                    
                    const { data: room2Equipment, error: re2Error } = await supabase
                        .from('room_equipments')
                        .insert({
                            room_id: this.testData.rooms[1].id,
                            equipment_id: sharedEquipmentId,
                            est_disponible: true,
                            est_fonctionnel: true
                        })
                        .select()
                        .single();

                    if (re2Error) throw re2Error;

                    // Verify equipment is linked to multiple rooms
                    const { data: equipmentRooms, error: checkError } = await supabase
                        .from('room_equipments')
                        .select(`
                            room_id,
                            rooms (numero, hotel_id),
                            equipment_id,
                            equipments (nom)
                        `)
                        .eq('equipment_id', sharedEquipmentId);

                    if (checkError) throw checkError;

                    if (equipmentRooms.length < 2) {
                        throw new Error('Equipment should be shared between multiple rooms');
                    }

                    // Clean up
                    await supabase
                        .from('room_equipments')
                        .delete()
                        .eq('id', room2Equipment.id);

                    return { 
                        sharedEquipment: this.testData.equipments[0].nom,
                        roomCount: equipmentRooms.length,
                        rooms: equipmentRooms.map(er => er.rooms.numero)
                    };
                }
            },
            {
                name: 'Data Consistency After Room Updates',
                test: async () => {
                    const roomId = this.testData.rooms[0].id;
                    const originalStatus = this.testData.rooms[0].statut;

                    // Update room status
                    const { data: updatedRoom, error: updateError } = await supabase
                        .from('rooms')
                        .update({ 
                            statut: 'maintenance',
                            notes: 'Test maintenance update' 
                        })
                        .eq('id', roomId)
                        .select()
                        .single();

                    if (updateError) throw updateError;

                    // Verify update consistency
                    const { data: fetchedRoom, error: fetchError } = await supabase
                        .from('rooms')
                        .select('*')
                        .eq('id', roomId)
                        .single();

                    if (fetchError) throw fetchError;

                    if (fetchedRoom.statut !== 'maintenance' || 
                        fetchedRoom.notes !== 'Test maintenance update') {
                        throw new Error('Room update was not consistent');
                    }

                    // Restore original status
                    await supabase
                        .from('rooms')
                        .update({ 
                            statut: originalStatus,
                            notes: null
                        })
                        .eq('id', roomId);

                    return { 
                        roomId,
                        originalStatus,
                        updatedStatus: updatedRoom.statut,
                        consistent: true
                    };
                }
            },
            {
                name: 'Orphan Record Prevention',
                test: async () => {
                    // Try to create records that would be orphaned
                    const nonExistentHotelId = 999999;
                    const nonExistentEquipmentId = 999999;

                    let orphansPrevented = 0;

                    // Try to create room with non-existent hotel
                    try {
                        await supabase
                            .from('rooms')
                            .insert({
                                hotel_id: nonExistentHotelId,
                                numero: 'ORPHAN001',
                                type: 'Test',
                                prix: 50.00
                            });
                    } catch (error) {
                        orphansPrevented++;
                    }

                    // Try to create hotel equipment with non-existent equipment
                    try {
                        await supabase
                            .from('hotel_equipments')
                            .insert({
                                hotel_id: this.testData.hotels[0].id,
                                equipment_id: nonExistentEquipmentId,
                                est_disponible: true
                            });
                    } catch (error) {
                        orphansPrevented++;
                    }

                    if (orphansPrevented < 2) {
                        throw new Error('Orphan records were not properly prevented');
                    }

                    return { orphansPrevented, expectedOrphans: 2 };
                }
            },
            {
                name: 'Timestamp Consistency',
                test: async () => {
                    const beforeUpdate = new Date();
                    
                    // Update a room
                    const { data: updatedRoom, error: updateError } = await supabase
                        .from('rooms')
                        .update({ description: 'Timestamp test update' })
                        .eq('id', this.testData.rooms[0].id)
                        .select()
                        .single();

                    if (updateError) throw updateError;

                    const afterUpdate = new Date();
                    const updatedAt = new Date(updatedRoom.updated_at);

                    if (updatedAt < beforeUpdate || updatedAt > afterUpdate) {
                        throw new Error('Timestamp update is inconsistent');
                    }

                    // Clean up
                    await supabase
                        .from('rooms')
                        .update({ description: null })
                        .eq('id', this.testData.rooms[0].id);

                    return { 
                        timestampConsistent: true,
                        beforeUpdate: beforeUpdate.toISOString(),
                        updatedAt: updatedRoom.updated_at,
                        afterUpdate: afterUpdate.toISOString()
                    };
                }
            }
        ];

        for (const test of tests) {
            try {
                console.log(`🧪 ${test.name}...`);
                const result = await test.test();
                
                this.testResults.dataConsistency.passed++;
                this.testResults.dataConsistency.details.push({
                    name: test.name,
                    status: 'PASSED',
                    result
                });
                
                console.log(`   ✅ PASSED`);
                
            } catch (error) {
                this.testResults.dataConsistency.failed++;
                this.testResults.dataConsistency.details.push({
                    name: test.name,
                    status: 'FAILED',
                    error: error.message
                });
                
                console.log(`   ❌ FAILED - ${error.message}`);
            }
        }
    }

    async testPerformance() {
        console.log('\n⚡ TESTING PERFORMANCE');
        console.log('======================\n');

        const tests = [
            {
                name: 'Simple Hotel Query Performance',
                threshold: TEST_CONFIG.performanceThresholds.simpleQuery,
                test: async () => {
                    const startTime = Date.now();

                    const { data, error } = await supabase
                        .from('hotels')
                        .select('*')
                        .limit(10);

                    const duration = Date.now() - startTime;

                    if (error) throw error;

                    return { duration, threshold: TEST_CONFIG.performanceThresholds.simpleQuery, count: data.length };
                }
            },
            {
                name: 'Complex Join Query Performance',
                threshold: TEST_CONFIG.performanceThresholds.complexQuery,
                test: async () => {
                    const startTime = Date.now();

                    const { data, error } = await supabase
                        .from('hotels')
                        .select(`
                            *,
                            rooms (
                                *,
                                room_equipments (
                                    *,
                                    equipments (*)
                                )
                            ),
                            hotel_equipments (
                                *,
                                equipments (*)
                            )
                        `);

                    const duration = Date.now() - startTime;

                    if (error) throw error;

                    return { duration, threshold: TEST_CONFIG.performanceThresholds.complexQuery, count: data.length };
                }
            },
            {
                name: 'Aggregation Query Performance',
                threshold: TEST_CONFIG.performanceThresholds.aggregation,
                test: async () => {
                    const startTime = Date.now();

                    const { data, error } = await supabase
                        .from('equipments')
                        .select(`
                            categorie,
                            hotel_equipments (hotel_id),
                            room_equipments (room_id)
                        `);

                    // Simulate aggregation processing
                    const aggregated = data.reduce((acc, item) => {
                        const category = item.categorie;
                        if (!acc[category]) {
                            acc[category] = { hotelCount: 0, roomCount: 0 };
                        }
                        acc[category].hotelCount += item.hotel_equipments.length;
                        acc[category].roomCount += item.room_equipments.length;
                        return acc;
                    }, {});

                    const duration = Date.now() - startTime;

                    if (error) throw error;

                    return { 
                        duration, 
                        threshold: TEST_CONFIG.performanceThresholds.aggregation, 
                        categories: Object.keys(aggregated).length,
                        aggregated
                    };
                }
            }
        ];

        for (const test of tests) {
            try {
                console.log(`🧪 ${test.name}...`);
                const result = await test.test();
                const performanceOk = result.duration <= test.threshold;
                
                if (performanceOk) {
                    this.testResults.performance.passed++;
                    console.log(`   ✅ PASSED - ${result.duration}ms (threshold: ${test.threshold}ms)`);
                } else {
                    this.testResults.performance.failed++;
                    console.log(`   ⚠️  SLOW - ${result.duration}ms (threshold: ${test.threshold}ms)`);
                }
                
                this.testResults.performance.details.push({
                    name: test.name,
                    status: performanceOk ? 'PASSED' : 'SLOW',
                    result
                });
                
            } catch (error) {
                this.testResults.performance.failed++;
                this.testResults.performance.details.push({
                    name: test.name,
                    status: 'FAILED',
                    error: error.message
                });
                
                console.log(`   ❌ FAILED - ${error.message}`);
            }
        }
    }

    async cleanup() {
        console.log('\n🧹 Cleaning up test data...');

        try {
            // Delete test room equipments
            for (const re of this.testData.roomEquipments) {
                await supabase.from('room_equipments').delete().eq('id', re.id);
            }

            // Delete test hotel equipments
            for (const he of this.testData.hotelEquipments) {
                await supabase.from('hotel_equipments').delete().eq('id', he.id);
            }

            // Delete test rooms
            for (const room of this.testData.rooms) {
                await supabase.from('rooms').delete().eq('id', room.id);
            }

            // Delete test equipments
            for (const equipment of this.testData.equipments) {
                await supabase.from('equipments').delete().eq('id', equipment.id);
            }

            // Delete test hotels
            for (const hotel of this.testData.hotels) {
                await supabase.from('hotels').delete().eq('id', hotel.id);
            }

            console.log('✅ Test data cleanup complete');

        } catch (error) {
            console.log(`⚠️  Cleanup warning: ${error.message}`);
        }
    }

    generateReport() {
        console.log('\n📊 GENERATING COMPREHENSIVE REPORT');
        console.log('=====================================\n');

        const totalTests = Object.values(this.testResults).reduce(
            (acc, category) => acc + category.passed + category.failed, 0
        );
        const totalPassed = Object.values(this.testResults).reduce(
            (acc, category) => acc + category.passed, 0
        );
        const totalFailed = Object.values(this.testResults).reduce(
            (acc, category) => acc + category.failed, 0
        );

        const overallSuccessRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

        const report = {
            summary: {
                totalTests,
                totalPassed,
                totalFailed,
                successRate: Math.round(overallSuccessRate * 100) / 100,
                timestamp: new Date().toISOString()
            },
            categories: {},
            qualityScore: 0,
            recommendations: []
        };

        // Process each category
        Object.entries(this.testResults).forEach(([category, results]) => {
            const categoryTotal = results.passed + results.failed;
            const categorySuccessRate = categoryTotal > 0 ? (results.passed / categoryTotal) * 100 : 0;

            report.categories[category] = {
                passed: results.passed,
                failed: results.failed,
                total: categoryTotal,
                successRate: Math.round(categorySuccessRate * 100) / 100,
                details: results.details
            };

            console.log(`${category.toUpperCase()}:`);
            console.log(`  Passed: ${results.passed}`);
            console.log(`  Failed: ${results.failed}`);
            console.log(`  Success Rate: ${Math.round(categorySuccessRate * 100) / 100}%`);
            console.log('');
        });

        // Calculate quality score
        const weights = {
            relationships: 0.25,
            cascades: 0.20,
            constraints: 0.15,
            complexQueries: 0.20,
            dataConsistency: 0.20
        };

        report.qualityScore = Object.entries(report.categories).reduce((score, [category, results]) => {
            if (weights[category]) {
                return score + (weights[category] * results.successRate);
            }
            return score;
        }, 0);

        // Generate recommendations
        if (report.categories.relationships.successRate < 100) {
            report.recommendations.push('CRITICAL: Relationship integrity issues detected. Review foreign key configurations.');
        }
        if (report.categories.cascades.successRate < 100) {
            report.recommendations.push('CRITICAL: Cascade operation issues detected. Verify DELETE CASCADE configurations.');
        }
        if (report.categories.constraints.successRate < 100) {
            report.recommendations.push('HIGH: Constraint enforcement issues detected. Review database constraints.');
        }
        if (report.categories.complexQueries.successRate < 90) {
            report.recommendations.push('MEDIUM: Complex query reliability issues. Review join configurations.');
        }
        if (report.categories.dataConsistency.successRate < 95) {
            report.recommendations.push('HIGH: Data consistency issues detected. Review update triggers.');
        }
        if (report.categories.performance && report.categories.performance.successRate < 80) {
            report.recommendations.push('MEDIUM: Performance issues detected. Consider adding indexes or optimizing queries.');
        }

        // Quality level assessment
        let qualityLevel = 'INSUFFICIENT';
        if (report.qualityScore >= 95) qualityLevel = 'EXCELLENT';
        else if (report.qualityScore >= 90) qualityLevel = 'VERY GOOD';
        else if (report.qualityScore >= 85) qualityLevel = 'GOOD';
        else if (report.qualityScore >= 75) qualityLevel = 'ACCEPTABLE';

        console.log('FINAL ASSESSMENT:');
        console.log('=================');
        console.log(`Overall Success Rate: ${report.summary.successRate}%`);
        console.log(`Quality Score: ${Math.round(report.qualityScore * 100) / 100}/100`);
        console.log(`Quality Level: ${qualityLevel}`);
        console.log('');

        if (report.recommendations.length > 0) {
            console.log('RECOMMENDATIONS:');
            console.log('================');
            report.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
            console.log('');
        }

        // Critical findings
        const criticalIssues = Object.entries(report.categories)
            .filter(([_, results]) => results.failed > 0)
            .map(([category, results]) => {
                const failures = results.details.filter(d => d.status === 'FAILED');
                return { category, failures };
            });

        if (criticalIssues.length > 0) {
            console.log('CRITICAL ISSUES DETECTED:');
            console.log('==========================');
            criticalIssues.forEach(({ category, failures }) => {
                console.log(`${category.toUpperCase()}:`);
                failures.forEach(failure => {
                    console.log(`  - ${failure.name}: ${failure.error}`);
                });
                console.log('');
            });
        }

        return {
            success: report.summary.successRate === 100,
            report,
            qualityLevel,
            criticalIssues: criticalIssues.length
        };
    }
}

// Main execution
async function runDatabaseIntegrityTests() {
    const tester = new DatabaseIntegrityTester();
    const result = await tester.runAllTests();

    // Save detailed report to file
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = `D:/Dev/Ampulse v3/tests/database-integrity-report-${timestamp}.json`;
        
        await fs.writeFile(reportPath, JSON.stringify(result.report, null, 2), 'utf8');
        console.log(`📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
        console.log(`⚠️  Could not save report file: ${error.message}`);
    }

    console.log('\n🏁 DATABASE INTEGRITY TESTING COMPLETE');
    console.log('========================================');

    return result;
}

// Export for use in other test runners or CI/CD
if (require.main === module) {
    runDatabaseIntegrityTests()
        .then(result => {
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { DatabaseIntegrityTester, runDatabaseIntegrityTests };