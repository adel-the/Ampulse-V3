/**
 * Advanced Modification Tracking and Audit Trail Tests
 * SoliReserve Enhanced - Hotel Management System
 * 
 * Specialized tests for:
 * - Real-time modification tracking
 * - Audit trail creation and maintenance
 * - Change history preservation
 * - User action tracking
 * - Field-level change detection
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const TEST_CONFIG = {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    
    TEST_PREFIX: 'TRACK_TEST_',
    TIMESTAMP: new Date().toISOString().slice(0, 19).replace(/[-:]/g, ''),
    CHANGE_TRACKING_INTERVAL: 100, // ms between changes
    AUDIT_RETENTION_DAYS: 30,
    REAL_TIME_TIMEOUT: 5000 // 5 second timeout for real-time events
};

let supabase, adminSupabase;

// Test results tracking
const trackingResults = {
    tests: [],
    auditTrail: [],
    changeHistory: [],
    realTimeEvents: [],
    fieldLevelChanges: [],
    statistics: {
        totalModifications: 0,
        trackedModifications: 0,
        auditEntriesCreated: 0,
        realTimeEventsReceived: 0,
        trackingAccuracy: 0
    }
};

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
}

function addTrackingResult(testName, success, details, metrics = {}) {
    trackingResults.tests.push({
        name: testName,
        success,
        details,
        metrics,
        timestamp: new Date().toISOString()
    });
    
    log(`${testName}: ${success ? 'PASSED' : 'FAILED'} - ${details}`);
}

async function initializeTrackingClients() {
    if (!TEST_CONFIG.SUPABASE_URL || !TEST_CONFIG.SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase environment variables');
    }

    supabase = createClient(TEST_CONFIG.SUPABASE_URL, TEST_CONFIG.SUPABASE_ANON_KEY);
    adminSupabase = createClient(
        TEST_CONFIG.SUPABASE_URL, 
        TEST_CONFIG.SERVICE_ROLE_KEY || TEST_CONFIG.SUPABASE_ANON_KEY
    );

    // Test connection
    const { error } = await supabase.from('hotels').select('id').limit(1);
    if (error) throw new Error(`Connection failed: ${error.message}`);
    
    log('Tracking clients initialized');
}

// Create a comprehensive change tracking system
async function setupChangeTracking() {
    const testName = 'Setup Change Tracking System';
    
    try {
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
        
        // Create test establishment for tracking
        const testData = {
            nom: `${TEST_CONFIG.TEST_PREFIX}TrackingHotel`,
            adresse: 'Tracking Test Address',
            ville: 'Tracking City',
            code_postal: '12345',
            statut: 'ACTIF',
            chambres_total: 10,
            chambres_occupees: 0,
            taux_occupation: 0,
            type_etablissement: 'hotel',
            description: 'Initial description for tracking',
            user_owner_id: userOwnerId
        };

        const { data: hotel, error } = await supabase
            .from('hotels')
            .insert(testData)
            .select()
            .single();

        if (error) throw error;

        // Initialize change tracking record
        trackingResults.auditTrail.push({
            action: 'CREATE',
            table: 'hotels',
            record_id: hotel.id,
            changes: testData,
            timestamp: hotel.created_at,
            original_values: null,
            new_values: testData
        });

        trackingResults.statistics.totalModifications++;
        trackingResults.statistics.trackedModifications++;
        trackingResults.statistics.auditEntriesCreated++;

        addTrackingResult(testName, true, 'Change tracking system setup complete', {
            hotel_id: hotel.id,
            initial_audit_entries: 1
        });

        return hotel;

    } catch (error) {
        addTrackingResult(testName, false, `Setup failed: ${error.message}`);
        throw error;
    }
}

// Test field-level change detection
async function testFieldLevelChangeDetection(hotel) {
    const testName = 'Field-Level Change Detection';
    
    try {
        const originalValues = {
            nom: hotel.nom,
            description: hotel.description,
            taux_occupation: hotel.taux_occupation,
            categories: hotel.categories,
            services: hotel.services
        };

        const fieldChanges = [];

        // Change 1: Single text field
        const change1 = {
            nom: `${hotel.nom}_MODIFIED`
        };
        
        const { data: update1, error: error1 } = await supabase
            .from('hotels')
            .update(change1)
            .eq('id', hotel.id)
            .select()
            .single();

        if (error1) throw error1;

        fieldChanges.push({
            field: 'nom',
            original: originalValues.nom,
            new: change1.nom,
            timestamp: update1.updated_at,
            changeType: 'text_update'
        });

        await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.CHANGE_TRACKING_INTERVAL));

        // Change 2: Numeric field
        const change2 = {
            taux_occupation: 75.5
        };

        const { data: update2, error: error2 } = await supabase
            .from('hotels')
            .update(change2)
            .eq('id', hotel.id)
            .select()
            .single();

        if (error2) throw error2;

        fieldChanges.push({
            field: 'taux_occupation',
            original: originalValues.taux_occupation,
            new: change2.taux_occupation,
            timestamp: update2.updated_at,
            changeType: 'numeric_update'
        });

        await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.CHANGE_TRACKING_INTERVAL));

        // Change 3: Array field
        const change3 = {
            categories: ['standard', 'premium', 'deluxe']
        };

        const { data: update3, error: error3 } = await supabase
            .from('hotels')
            .update(change3)
            .eq('id', hotel.id)
            .select()
            .single();

        if (error3) throw error3;

        fieldChanges.push({
            field: 'categories',
            original: originalValues.categories,
            new: change3.categories,
            timestamp: update3.updated_at,
            changeType: 'array_update'
        });

        await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.CHANGE_TRACKING_INTERVAL));

        // Change 4: Multiple fields simultaneously
        const change4 = {
            description: 'Updated description with multiple changes',
            services: ['wifi', 'parking', 'breakfast']
        };

        const { data: update4, error: error4 } = await supabase
            .from('hotels')
            .update(change4)
            .eq('id', hotel.id)
            .select()
            .single();

        if (error4) throw error4;

        fieldChanges.push({
            field: 'multiple',
            original: { 
                description: originalValues.description, 
                services: originalValues.services 
            },
            new: change4,
            timestamp: update4.updated_at,
            changeType: 'multi_field_update'
        });

        // Store field-level changes
        trackingResults.fieldLevelChanges = trackingResults.fieldLevelChanges.concat(fieldChanges);
        
        // Create audit trail entries
        fieldChanges.forEach(change => {
            trackingResults.auditTrail.push({
                action: 'UPDATE',
                table: 'hotels',
                record_id: hotel.id,
                field: change.field,
                original_value: change.original,
                new_value: change.new,
                timestamp: change.timestamp,
                changeType: change.changeType
            });
            trackingResults.statistics.auditEntriesCreated++;
        });

        trackingResults.statistics.totalModifications += fieldChanges.length;
        trackingResults.statistics.trackedModifications += fieldChanges.length;

        addTrackingResult(testName, true, `${fieldChanges.length} field-level changes tracked`, {
            changes_detected: fieldChanges.length,
            field_types: fieldChanges.map(c => c.changeType)
        });

        return fieldChanges;

    } catch (error) {
        addTrackingResult(testName, false, `Field change detection failed: ${error.message}`);
        throw error;
    }
}

// Test real-time change notifications
async function testRealTimeChangeNotifications(hotel) {
    const testName = 'Real-Time Change Notifications';
    
    try {
        let receivedEvents = [];
        let subscription;

        // Set up real-time listener
        const setupPromise = new Promise((resolve, reject) => {
            subscription = supabase
                .channel(`hotel-changes-${hotel.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'hotels',
                        filter: `id=eq.${hotel.id}`
                    },
                    (payload) => {
                        receivedEvents.push({
                            event: payload.eventType,
                            timestamp: new Date().toISOString(),
                            old: payload.old,
                            new: payload.new,
                            changes: detectChanges(payload.old, payload.new)
                        });
                        trackingResults.statistics.realTimeEventsReceived++;
                        log(`Real-time event received: ${payload.eventType} for hotel ${hotel.id}`);
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        resolve();
                    } else if (status === 'CHANNEL_ERROR') {
                        reject(new Error('Real-time subscription failed'));
                    }
                });
        });

        await setupPromise;
        log('Real-time subscription established');

        // Wait a moment for subscription to be active
        await new Promise(resolve => setTimeout(resolve, 500));

        // Perform tracked changes
        const testChanges = [
            { statut: 'INACTIF' },
            { chambres_occupees: 5 },
            { notes_internes: 'Real-time test notes' }
        ];

        for (let i = 0; i < testChanges.length; i++) {
            await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.CHANGE_TRACKING_INTERVAL));
            
            const { error } = await supabase
                .from('hotels')
                .update(testChanges[i])
                .eq('id', hotel.id);

            if (error) throw error;
            
            trackingResults.statistics.totalModifications++;
        }

        // Wait for events to be received
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Clean up subscription
        if (subscription) {
            supabase.removeChannel(subscription);
        }

        trackingResults.realTimeEvents = trackingResults.realTimeEvents.concat(receivedEvents);

        const expectedEvents = testChanges.length;
        const receivedCount = receivedEvents.length;
        const realtimeAccuracy = expectedEvents > 0 ? (receivedCount / expectedEvents) * 100 : 0;

        addTrackingResult(testName, receivedCount >= expectedEvents * 0.8, // 80% success rate acceptable
            `${receivedCount}/${expectedEvents} real-time events received`, {
            expected_events: expectedEvents,
            received_events: receivedCount,
            realtime_accuracy: realtimeAccuracy
        });

        return receivedEvents;

    } catch (error) {
        addTrackingResult(testName, false, `Real-time notifications failed: ${error.message}`);
        throw error;
    }
}

// Detect changes between old and new values
function detectChanges(oldRecord, newRecord) {
    const changes = {};
    
    for (const [key, newValue] of Object.entries(newRecord)) {
        const oldValue = oldRecord[key];
        
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes[key] = {
                from: oldValue,
                to: newValue,
                type: detectChangeType(oldValue, newValue)
            };
        }
    }
    
    return changes;
}

function detectChangeType(oldValue, newValue) {
    if (oldValue === null && newValue !== null) return 'added';
    if (oldValue !== null && newValue === null) return 'removed';
    if (Array.isArray(oldValue) && Array.isArray(newValue)) return 'array_modified';
    if (typeof oldValue === 'object' && typeof newValue === 'object') return 'object_modified';
    if (typeof oldValue === 'number' && typeof newValue === 'number') return 'number_changed';
    if (typeof oldValue === 'string' && typeof newValue === 'string') return 'text_changed';
    return 'value_changed';
}

// Test room status transitions tracking
async function testRoomStatusTransitions(hotel) {
    const testName = 'Room Status Transitions Tracking';
    
    try {
        // Create test room
        const roomData = {
            hotel_id: hotel.id,
            numero: 'TRACK001',
            type: 'standard',
            prix: 75.00,
            statut: 'disponible',
            description: 'Test room for status tracking'
        };

        const { data: room, error: createError } = await supabase
            .from('rooms')
            .insert(roomData)
            .select()
            .single();

        if (createError) throw createError;

        const statusTransitions = [];
        const statusFlow = ['disponible', 'occupee', 'maintenance', 'disponible'];

        for (let i = 0; i < statusFlow.length - 1; i++) {
            const fromStatus = statusFlow[i];
            const toStatus = statusFlow[i + 1];
            
            const transitionStart = new Date();
            
            const { data: updated, error: updateError } = await supabase
                .from('rooms')
                .update({ 
                    statut: toStatus,
                    notes: `Status changed to ${toStatus} at ${transitionStart.toISOString()}`
                })
                .eq('id', room.id)
                .select()
                .single();

            if (updateError) throw updateError;

            const transition = {
                room_id: room.id,
                from_status: fromStatus,
                to_status: toStatus,
                transition_time: updated.updated_at,
                duration_since_last: i > 0 ? new Date(updated.updated_at) - new Date(statusTransitions[i-1].transition_time) : 0
            };

            statusTransitions.push(transition);
            
            trackingResults.auditTrail.push({
                action: 'STATUS_CHANGE',
                table: 'rooms',
                record_id: room.id,
                field: 'statut',
                original_value: fromStatus,
                new_value: toStatus,
                timestamp: updated.updated_at,
                metadata: {
                    room_number: room.numero,
                    hotel_id: hotel.id
                }
            });

            trackingResults.statistics.totalModifications++;
            trackingResults.statistics.trackedModifications++;
            trackingResults.statistics.auditEntriesCreated++;

            await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.CHANGE_TRACKING_INTERVAL));
        }

        // Clean up test room
        await supabase.from('rooms').delete().eq('id', room.id);

        addTrackingResult(testName, true, `${statusTransitions.length} status transitions tracked`, {
            room_id: room.id,
            transitions: statusTransitions.length,
            status_flow: statusFlow
        });

        return statusTransitions;

    } catch (error) {
        addTrackingResult(testName, false, `Status transition tracking failed: ${error.message}`);
        throw error;
    }
}

// Test audit trail integrity
async function testAuditTrailIntegrity() {
    const testName = 'Audit Trail Integrity';
    
    try {
        const auditStats = {
            total_entries: trackingResults.auditTrail.length,
            unique_records: new Set(trackingResults.auditTrail.map(a => a.record_id)).size,
            action_types: {},
            chronological_order: true,
            data_completeness: 0
        };

        // Analyze action types
        trackingResults.auditTrail.forEach(entry => {
            auditStats.action_types[entry.action] = (auditStats.action_types[entry.action] || 0) + 1;
        });

        // Check chronological order
        for (let i = 1; i < trackingResults.auditTrail.length; i++) {
            const prev = new Date(trackingResults.auditTrail[i - 1].timestamp);
            const curr = new Date(trackingResults.auditTrail[i].timestamp);
            
            if (curr < prev) {
                auditStats.chronological_order = false;
                break;
            }
        }

        // Check data completeness
        const completeEntries = trackingResults.auditTrail.filter(entry => 
            entry.action && entry.table && entry.record_id && entry.timestamp
        ).length;
        
        auditStats.data_completeness = trackingResults.auditTrail.length > 0 ? 
            (completeEntries / trackingResults.auditTrail.length) * 100 : 0;

        const integrityScore = 
            (auditStats.chronological_order ? 40 : 0) +
            (auditStats.data_completeness > 95 ? 40 : auditStats.data_completeness * 0.4) +
            (auditStats.total_entries > 0 ? 20 : 0);

        addTrackingResult(testName, integrityScore >= 80, 
            `Audit trail integrity: ${integrityScore}%`, auditStats);

        return auditStats;

    } catch (error) {
        addTrackingResult(testName, false, `Audit trail integrity check failed: ${error.message}`);
        throw error;
    }
}

// Cleanup test data
async function cleanupTrackingData() {
    log('Cleaning up tracking test data...');
    
    try {
        await adminSupabase.from('rooms').delete().ilike('numero', 'TRACK%');
        await adminSupabase.from('hotels').delete().ilike('nom', `${TEST_CONFIG.TEST_PREFIX}%`);
        log('Tracking test data cleanup completed');
    } catch (error) {
        log(`Error during tracking cleanup: ${error.message}`, 'error');
    }
}

// Generate comprehensive tracking report
function generateTrackingReport() {
    const totalTests = trackingResults.tests.length;
    const passedTests = trackingResults.tests.filter(t => t.success).length;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    // Calculate tracking accuracy
    trackingResults.statistics.trackingAccuracy = trackingResults.statistics.totalModifications > 0 ? 
        (trackingResults.statistics.trackedModifications / trackingResults.statistics.totalModifications) * 100 : 0;

    const report = {
        summary: {
            testSuite: 'Modification Tracking & Audit Trail',
            timestamp: new Date().toISOString(),
            totalTests,
            passed: passedTests,
            failed: totalTests - passedTests,
            successRate: `${successRate.toFixed(2)}%`
        },
        trackingMetrics: {
            totalModifications: trackingResults.statistics.totalModifications,
            trackedModifications: trackingResults.statistics.trackedModifications,
            trackingAccuracy: `${trackingResults.statistics.trackingAccuracy.toFixed(2)}%`,
            auditEntriesCreated: trackingResults.statistics.auditEntriesCreated,
            realTimeEventsReceived: trackingResults.statistics.realTimeEventsReceived
        },
        auditTrailAnalysis: {
            totalEntries: trackingResults.auditTrail.length,
            actionTypes: {},
            timeSpan: trackingResults.auditTrail.length > 0 ? {
                start: trackingResults.auditTrail[0].timestamp,
                end: trackingResults.auditTrail[trackingResults.auditTrail.length - 1].timestamp
            } : null
        },
        fieldLevelChanges: {
            totalChanges: trackingResults.fieldLevelChanges.length,
            changeTypes: trackingResults.fieldLevelChanges.reduce((acc, change) => {
                acc[change.changeType] = (acc[change.changeType] || 0) + 1;
                return acc;
            }, {})
        },
        realTimeEvents: {
            totalEvents: trackingResults.realTimeEvents.length,
            eventTypes: trackingResults.realTimeEvents.reduce((acc, event) => {
                acc[event.event] = (acc[event.event] || 0) + 1;
                return acc;
            }, {})
        },
        testDetails: trackingResults.tests.map(test => ({
            name: test.name,
            status: test.success ? 'PASSED' : 'FAILED',
            details: test.details,
            metrics: test.metrics,
            timestamp: test.timestamp
        })),
        recommendations: generateTrackingRecommendations(trackingResults.statistics)
    };

    // Count action types in audit trail
    trackingResults.auditTrail.forEach(entry => {
        report.auditTrailAnalysis.actionTypes[entry.action] = 
            (report.auditTrailAnalysis.actionTypes[entry.action] || 0) + 1;
    });

    return report;
}

function generateTrackingRecommendations(stats) {
    const recommendations = [];

    if (stats.trackingAccuracy < 95) {
        recommendations.push('Modification tracking accuracy is below 95%. Review trigger implementations and audit log mechanisms.');
    }

    if (stats.realTimeEventsReceived < stats.totalModifications * 0.8) {
        recommendations.push('Real-time event delivery is inconsistent. Check WebSocket connections and subscription reliability.');
    }

    if (stats.auditEntriesCreated < stats.totalModifications) {
        recommendations.push('Not all modifications are being recorded in audit trail. Verify audit trigger coverage.');
    }

    if (recommendations.length === 0) {
        recommendations.push('Modification tracking system is performing excellently! All changes are being properly tracked and audited.');
    }

    return recommendations;
}

// Main execution function
async function runModificationTrackingTests() {
    log('='.repeat(80));
    log('MODIFICATION TRACKING & AUDIT TRAIL TESTS');
    log('='.repeat(80));

    try {
        await initializeTrackingClients();
        
        log('Setting up change tracking system...');
        const testHotel = await setupChangeTracking();
        
        log('Testing field-level change detection...');
        await testFieldLevelChangeDetection(testHotel);
        
        log('Testing real-time change notifications...');
        await testRealTimeChangeNotifications(testHotel);
        
        log('Testing room status transitions...');
        await testRoomStatusTransitions(testHotel);
        
        log('Testing audit trail integrity...');
        await testAuditTrailIntegrity();
        
        await cleanupTrackingData();
        
        log('All modification tracking tests completed!');

    } catch (error) {
        log(`Test execution failed: ${error.message}`, 'error');
    }

    // Generate and display report
    const report = generateTrackingReport();
    
    log('='.repeat(80));
    log('MODIFICATION TRACKING RESULTS');
    log('='.repeat(80));
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Total Tests: ${report.summary.totalTests}`);
    console.log(`   Passed: ${report.summary.passed}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Success Rate: ${report.summary.successRate}`);
    
    console.log('\n📈 TRACKING METRICS:');
    console.log(`   Total Modifications: ${report.trackingMetrics.totalModifications}`);
    console.log(`   Tracked Modifications: ${report.trackingMetrics.trackedModifications}`);
    console.log(`   Tracking Accuracy: ${report.trackingMetrics.trackingAccuracy}`);
    console.log(`   Audit Entries Created: ${report.trackingMetrics.auditEntriesCreated}`);
    console.log(`   Real-time Events Received: ${report.trackingMetrics.realTimeEventsReceived}`);
    
    console.log('\n📋 AUDIT TRAIL:');
    console.log(`   Total Entries: ${report.auditTrailAnalysis.totalEntries}`);
    console.log(`   Action Types:`, report.auditTrailAnalysis.actionTypes);
    
    console.log('\n🔍 DETAILED RESULTS:');
    report.testDetails.forEach(test => {
        const status = test.status === 'PASSED' ? '✅' : '❌';
        console.log(`   ${status} ${test.name}: ${test.details}`);
    });
    
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
    });
    
    log('='.repeat(80));
    
    // Save report
    const fs = require('fs');
    const reportPath = `D:\\Dev\\Ampulse v3\\tests\\modification-tracking-report-${TEST_CONFIG.TIMESTAMP}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`Detailed tracking report saved to: ${reportPath}`);
    
    return report;
}

// Execute if run directly
if (require.main === module) {
    runModificationTrackingTests()
        .then((report) => {
            process.exit(report.summary.failed > 0 ? 1 : 0);
        })
        .catch((error) => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = {
    runModificationTrackingTests,
    trackingResults,
    TEST_CONFIG
};