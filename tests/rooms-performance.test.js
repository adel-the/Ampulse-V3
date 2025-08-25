/**
 * TESTS DE PERFORMANCE - API ROOMS
 * 
 * Tests spécialisés pour valider les performances, la charge
 * et la scalabilité de l'API rooms.
 * 
 * OBJECTIFS :
 * - Tester les performances sous charge
 * - Mesurer les temps de réponse
 * - Valider la scalabilité des opérations
 * - Tester les limites du système
 * - Identifier les goulots d'étranglement
 */

const { createClient } = require('@supabase/supabase-js');

const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pgjatiookprsvfesrsrx.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamF0aW9va3Byc3ZmZXNyc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTkxMDksImV4cCI6MjA3MTAzNTEwOX0.J60Qcxtw1SmnR9WrS8t4yCIh-JyyhjAmU_FZmFIY_dI',
  testHotelId: 1,
  performanceThresholds: {
    singleRead: 500,      // ms
    batchRead: 2000,      // ms
    singleCreate: 1000,   // ms
    batchCreate: 5000,    // ms
    singleUpdate: 800,    // ms
    batchUpdate: 3000,    // ms
    singleDelete: 600,    // ms
    batchDelete: 2000,    // ms
    search: 1500,         // ms
    statistics: 2500      // ms
  }
};

const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);

class PerformanceTestUtils {
  static log(category, message, status = 'info') {
    const icons = { info: '📋', success: '✅', error: '❌', warning: '⚠️', performance: '⚡' };
    console.log(`${icons[status]} [${category}] ${message}`);
  }

  static generateTestRoom(suffix = '') {
    return {
      hotel_id: TEST_CONFIG.testHotelId,
      numero: `PERF-${Date.now()}-${Math.random().toString(36).substr(2, 5)}${suffix}`,
      type: 'Performance Test',
      prix: Math.round((Math.random() * 200 + 50) * 100) / 100,
      statut: ['disponible', 'occupee', 'maintenance'][Math.floor(Math.random() * 3)],
      description: 'Chambre de test de performance',
      floor: Math.floor(Math.random() * 10) + 1,
      room_size: Math.round((Math.random() * 50 + 20) * 100) / 100,
      bed_type: ['simple', 'double', 'queen', 'king'][Math.floor(Math.random() * 4)],
      view_type: ['jardin', 'mer', 'ville', 'montagne'][Math.floor(Math.random() * 4)],
      is_smoking: Math.random() > 0.5,
      amenities: this.generateRandomAmenities(),
      images: this.generateRandomImages()
    };
  }

  static generateRandomAmenities() {
    const allAmenities = ['WiFi', 'TV', 'Climatisation', 'Minibar', 'Coffre-fort', 
                         'Balcon', 'Vue mer', 'Salle de bain privée', 'Douche', 'Baignoire'];
    const count = Math.floor(Math.random() * 6) + 2;
    const shuffled = allAmenities.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  static generateRandomImages() {
    const imageCount = Math.floor(Math.random() * 4) + 1;
    return Array.from({ length: imageCount }, (_, i) => ({
      url: `performance-test-${i + 1}.jpg`,
      alt: `Test image ${i + 1}`,
      size: Math.floor(Math.random() * 2048) + 512
    }));
  }

  static async measureExecutionTime(operation, description = '') {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = await operation();
      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      
      const duration = endTime - startTime;
      const memoryDelta = {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external
      };

      return {
        success: true,
        duration: duration,
        memory: memoryDelta,
        result: result,
        description: description
      };
    } catch (error) {
      const endTime = Date.now();
      return {
        success: false,
        duration: endTime - startTime,
        error: error.message,
        description: description
      };
    }
  }

  static async runConcurrentOperations(operations, maxConcurrency = 10) {
    const results = [];
    const chunks = [];
    
    // Diviser les opérations en chunks
    for (let i = 0; i < operations.length; i += maxConcurrency) {
      chunks.push(operations.slice(i, i + maxConcurrency));
    }

    const overallStart = Date.now();

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (operation, index) => {
        const result = await this.measureExecutionTime(operation, `Concurrent ${index}`);
        return result;
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    const overallDuration = Date.now() - overallStart;

    return {
      results: results,
      overallDuration: overallDuration,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      maxDuration: Math.max(...results.map(r => r.duration)),
      minDuration: Math.min(...results.map(r => r.duration))
    };
  }

  static generatePerformanceReport(testName, measurements, threshold) {
    const durations = measurements.map(m => m.duration);
    const successCount = measurements.filter(m => m.success).length;
    const failureCount = measurements.filter(m => !m.success).length;

    const stats = {
      count: measurements.length,
      successCount: successCount,
      failureCount: failureCount,
      successRate: (successCount / measurements.length) * 100,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      medianDuration: this.calculateMedian(durations),
      p95Duration: this.calculatePercentile(durations, 95),
      p99Duration: this.calculatePercentile(durations, 99),
      threshold: threshold,
      withinThreshold: durations.filter(d => d <= threshold).length,
      thresholdRate: (durations.filter(d => d <= threshold).length / durations.length) * 100
    };

    return stats;
  }

  static calculateMedian(numbers) {
    const sorted = numbers.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }

  static calculatePercentile(numbers, percentile) {
    const sorted = numbers.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * TESTS DE PERFORMANCE CREATE
 */
class CreatePerformanceTests {
  static async runAll() {
    PerformanceTestUtils.log('PERF-CREATE', 'Tests de performance CREATE', 'performance');
    
    const results = { passed: 0, failed: 0, details: [], measurements: [] };
    const tests = [
      this.testSingleCreatePerformance,
      this.testBatchCreatePerformance,
      this.testConcurrentCreatePerformance,
      this.testLargeDataCreatePerformance,
      this.testCreateThroughput
    ];

    for (const test of tests) {
      try {
        const measurement = await test();
        results.measurements.push(measurement);
        results.passed++;
        PerformanceTestUtils.log('PERF-CREATE', `${test.name} - RÉUSSI`, 'success');
      } catch (error) {
        results.failed++;
        results.details.push({ test: test.name, error: error.message });
        PerformanceTestUtils.log('PERF-CREATE', `${test.name} - ÉCHEC: ${error.message}`, 'error');
      }
    }

    return results;
  }

  static async testSingleCreatePerformance() {
    const measurements = [];
    const iterations = 20;

    for (let i = 0; i < iterations; i++) {
      const roomData = PerformanceTestUtils.generateTestRoom(`-single-${i}`);
      
      const measurement = await PerformanceTestUtils.measureExecutionTime(async () => {
        const { data, error } = await supabase
          .from('rooms')
          .insert(roomData)
          .select()
          .single();

        if (error) throw new Error(error.message);
        
        // Nettoyer immédiatement
        await supabase.from('rooms').delete().eq('id', data.id);
        
        return data;
      }, `Single create ${i + 1}`);

      measurements.push(measurement);
      
      // Petit délai entre les créations
      await PerformanceTestUtils.delay(50);
    }

    const report = PerformanceTestUtils.generatePerformanceReport(
      'Single Create', 
      measurements, 
      TEST_CONFIG.performanceThresholds.singleCreate
    );

    if (report.thresholdRate < 80) {
      throw new Error(`Performance insuffisante: ${report.thresholdRate.toFixed(1)}% sous le seuil`);
    }

    PerformanceTestUtils.log('PERF-CREATE', 
      `Single Create: ${report.averageDuration.toFixed(0)}ms avg, ${report.thresholdRate.toFixed(1)}% sous seuil`, 
      'performance'
    );

    return { testName: 'singleCreate', measurements, report };
  }

  static async testBatchCreatePerformance() {
    const batchSizes = [5, 10, 20, 50];
    const measurements = [];

    for (const batchSize of batchSizes) {
      const roomsData = Array.from({ length: batchSize }, (_, i) => 
        PerformanceTestUtils.generateTestRoom(`-batch-${batchSize}-${i}`)
      );

      const measurement = await PerformanceTestUtils.measureExecutionTime(async () => {
        const { data, error } = await supabase
          .from('rooms')
          .insert(roomsData)
          .select();

        if (error) throw new Error(error.message);
        
        // Nettoyer
        const ids = data.map(room => room.id);
        await supabase.from('rooms').delete().in('id', ids);
        
        return data;
      }, `Batch create ${batchSize} rooms`);

      measurements.push(measurement);
      
      await PerformanceTestUtils.delay(100);
    }

    const report = PerformanceTestUtils.generatePerformanceReport(
      'Batch Create', 
      measurements, 
      TEST_CONFIG.performanceThresholds.batchCreate
    );

    if (report.averageDuration > TEST_CONFIG.performanceThresholds.batchCreate) {
      throw new Error(`Performance batch insuffisante: ${report.averageDuration.toFixed(0)}ms > ${TEST_CONFIG.performanceThresholds.batchCreate}ms`);
    }

    PerformanceTestUtils.log('PERF-CREATE', 
      `Batch Create: ${report.averageDuration.toFixed(0)}ms avg pour différentes tailles`, 
      'performance'
    );

    return { testName: 'batchCreate', measurements, report };
  }

  static async testConcurrentCreatePerformance() {
    const concurrentCount = 15;
    const operations = Array.from({ length: concurrentCount }, (_, i) => {
      return async () => {
        const roomData = PerformanceTestUtils.generateTestRoom(`-concurrent-${i}`);
        
        const { data, error } = await supabase
          .from('rooms')
          .insert(roomData)
          .select()
          .single();

        if (error) throw new Error(error.message);
        
        // Nettoyer
        await supabase.from('rooms').delete().eq('id', data.id);
        
        return data;
      };
    });

    const concurrentResult = await PerformanceTestUtils.runConcurrentOperations(operations, 5);

    if (concurrentResult.failureCount > 0) {
      throw new Error(`${concurrentResult.failureCount} échecs sur ${concurrentCount} opérations concurrentes`);
    }

    if (concurrentResult.averageDuration > TEST_CONFIG.performanceThresholds.singleCreate * 1.5) {
      throw new Error(`Performance concurrente dégradée: ${concurrentResult.averageDuration.toFixed(0)}ms avg`);
    }

    PerformanceTestUtils.log('PERF-CREATE', 
      `Concurrent Create: ${concurrentResult.averageDuration.toFixed(0)}ms avg, ${concurrentResult.successCount}/${concurrentCount} réussis`, 
      'performance'
    );

    return { testName: 'concurrentCreate', concurrentResult };
  }

  static async testLargeDataCreatePerformance() {
    // Test avec des données volumineuses
    const largeDataSizes = [1, 5, 10]; // KB
    const measurements = [];

    for (const sizeKB of largeDataSizes) {
      const largeDescription = 'x'.repeat(sizeKB * 1024);
      const largeAmenities = Array.from({ length: 50 }, (_, i) => `Amenity ${i + 1} with long description`);
      
      const roomData = {
        ...PerformanceTestUtils.generateTestRoom(`-large-${sizeKB}kb`),
        description: largeDescription,
        amenities: largeAmenities,
        notes: 'Large data test with significant content volume for performance testing'
      };

      const measurement = await PerformanceTestUtils.measureExecutionTime(async () => {
        const { data, error } = await supabase
          .from('rooms')
          .insert(roomData)
          .select()
          .single();

        if (error) throw new Error(error.message);
        
        // Nettoyer
        await supabase.from('rooms').delete().eq('id', data.id);
        
        return data;
      }, `Large data create ${sizeKB}KB`);

      measurements.push(measurement);
      
      await PerformanceTestUtils.delay(200);
    }

    const report = PerformanceTestUtils.generatePerformanceReport(
      'Large Data Create', 
      measurements, 
      TEST_CONFIG.performanceThresholds.singleCreate * 2
    );

    PerformanceTestUtils.log('PERF-CREATE', 
      `Large Data Create: ${report.averageDuration.toFixed(0)}ms avg pour données volumineuses`, 
      'performance'
    );

    return { testName: 'largeDataCreate', measurements, report };
  }

  static async testCreateThroughput() {
    const duration = 10000; // 10 secondes
    const startTime = Date.now();
    let operationCount = 0;
    const createdIds = [];

    while (Date.now() - startTime < duration) {
      try {
        const roomData = PerformanceTestUtils.generateTestRoom(`-throughput-${operationCount}`);
        
        const { data, error } = await supabase
          .from('rooms')
          .insert(roomData)
          .select()
          .single();

        if (error) throw new Error(error.message);
        
        createdIds.push(data.id);
        operationCount++;
        
        // Petit délai pour éviter la surcharge
        await PerformanceTestUtils.delay(100);
      } catch (error) {
        PerformanceTestUtils.log('PERF-CREATE', `Erreur throughput: ${error.message}`, 'warning');
        break;
      }
    }

    const actualDuration = Date.now() - startTime;
    const throughput = operationCount / (actualDuration / 1000); // opérations par seconde

    // Nettoyer toutes les chambres créées
    if (createdIds.length > 0) {
      // Nettoyer par batches de 50
      for (let i = 0; i < createdIds.length; i += 50) {
        const batch = createdIds.slice(i, i + 50);
        await supabase.from('rooms').delete().in('id', batch);
      }
    }

    if (throughput < 1) {
      throw new Error(`Throughput insuffisant: ${throughput.toFixed(2)} ops/sec`);
    }

    PerformanceTestUtils.log('PERF-CREATE', 
      `Create Throughput: ${throughput.toFixed(2)} ops/sec (${operationCount} ops en ${(actualDuration/1000).toFixed(1)}s)`, 
      'performance'
    );

    return { testName: 'createThroughput', throughput, operationCount, duration: actualDuration };
  }
}

/**
 * TESTS DE PERFORMANCE READ
 */
class ReadPerformanceTests {
  static async runAll() {
    PerformanceTestUtils.log('PERF-READ', 'Tests de performance READ', 'performance');
    
    // Créer des données de test
    await this.setupPerformanceData();

    const results = { passed: 0, failed: 0, details: [], measurements: [] };
    const tests = [
      this.testSingleReadPerformance,
      this.testBatchReadPerformance,
      this.testFilteredReadPerformance,
      this.testSearchPerformance,
      this.testStatisticsPerformance,
      this.testPaginationPerformance,
      this.testConcurrentReadPerformance
    ];

    for (const test of tests) {
      try {
        const measurement = await test();
        results.measurements.push(measurement);
        results.passed++;
        PerformanceTestUtils.log('PERF-READ', `${test.name} - RÉUSSI`, 'success');
      } catch (error) {
        results.failed++;
        results.details.push({ test: test.name, error: error.message });
        PerformanceTestUtils.log('PERF-READ', `${test.name} - ÉCHEC: ${error.message}`, 'error');
      }
    }

    // Nettoyer les données de test
    await this.cleanupPerformanceData();

    return results;
  }

  static async setupPerformanceData() {
    const roomCount = 100;
    const rooms = Array.from({ length: roomCount }, (_, i) => 
      PerformanceTestUtils.generateTestRoom(`-perfdata-${i}`)
    );

    // Insérer par batches pour éviter les timeouts
    this.testRoomIds = [];
    for (let i = 0; i < rooms.length; i += 20) {
      const batch = rooms.slice(i, i + 20);
      const { data, error } = await supabase
        .from('rooms')
        .insert(batch)
        .select('id');

      if (error) throw new Error(`Erreur setup data: ${error.message}`);
      this.testRoomIds.push(...data.map(room => room.id));
    }

    PerformanceTestUtils.log('PERF-READ', `${this.testRoomIds.length} chambres de test créées`, 'info');
  }

  static async cleanupPerformanceData() {
    if (this.testRoomIds && this.testRoomIds.length > 0) {
      // Supprimer par batches
      for (let i = 0; i < this.testRoomIds.length; i += 50) {
        const batch = this.testRoomIds.slice(i, i + 50);
        await supabase.from('rooms').delete().in('id', batch);
      }
    }
  }

  static async testSingleReadPerformance() {
    const measurements = [];
    const iterations = 30;

    for (let i = 0; i < iterations; i++) {
      const randomId = this.testRoomIds[Math.floor(Math.random() * this.testRoomIds.length)];
      
      const measurement = await PerformanceTestUtils.measureExecutionTime(async () => {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', randomId)
          .single();

        if (error) throw new Error(error.message);
        return data;
      }, `Single read ${i + 1}`);

      measurements.push(measurement);
    }

    const report = PerformanceTestUtils.generatePerformanceReport(
      'Single Read', 
      measurements, 
      TEST_CONFIG.performanceThresholds.singleRead
    );

    if (report.thresholdRate < 90) {
      throw new Error(`Performance lecture insuffisante: ${report.thresholdRate.toFixed(1)}% sous le seuil`);
    }

    PerformanceTestUtils.log('PERF-READ', 
      `Single Read: ${report.averageDuration.toFixed(0)}ms avg`, 
      'performance'
    );

    return { testName: 'singleRead', measurements, report };
  }

  static async testBatchReadPerformance() {
    const batchSizes = [10, 25, 50, 100];
    const measurements = [];

    for (const batchSize of batchSizes) {
      const measurement = await PerformanceTestUtils.measureExecutionTime(async () => {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('hotel_id', TEST_CONFIG.testHotelId)
          .limit(batchSize);

        if (error) throw new Error(error.message);
        return data;
      }, `Batch read ${batchSize} rooms`);

      measurements.push(measurement);
    }

    const report = PerformanceTestUtils.generatePerformanceReport(
      'Batch Read', 
      measurements, 
      TEST_CONFIG.performanceThresholds.batchRead
    );

    PerformanceTestUtils.log('PERF-READ', 
      `Batch Read: ${report.averageDuration.toFixed(0)}ms avg`, 
      'performance'
    );

    return { testName: 'batchRead', measurements, report };
  }

  static async testFilteredReadPerformance() {
    const filters = [
      { name: 'Status filter', filter: { statut: 'disponible' } },
      { name: 'Floor filter', filter: { floor: 1 } },
      { name: 'Type filter', filter: { type: 'Performance Test' } },
      { name: 'Price range', filter: { prix: 'gte.50' } },
      { name: 'Combined filters', filter: { statut: 'disponible', floor: 1 } }
    ];

    const measurements = [];

    for (const filterTest of filters) {
      const measurement = await PerformanceTestUtils.measureExecutionTime(async () => {
        let query = supabase
          .from('rooms')
          .select('*')
          .eq('hotel_id', TEST_CONFIG.testHotelId);

        // Appliquer les filtres
        for (const [key, value] of Object.entries(filterTest.filter)) {
          if (value.startsWith && value.startsWith('gte.')) {
            query = query.gte(key, value.substring(4));
          } else {
            query = query.eq(key, value);
          }
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data;
      }, filterTest.name);

      measurements.push(measurement);
    }

    const report = PerformanceTestUtils.generatePerformanceReport(
      'Filtered Read', 
      measurements, 
      TEST_CONFIG.performanceThresholds.batchRead
    );

    PerformanceTestUtils.log('PERF-READ', 
      `Filtered Read: ${report.averageDuration.toFixed(0)}ms avg`, 
      'performance'
    );

    return { testName: 'filteredRead', measurements, report };
  }

  static async testSearchPerformance() {
    const searchTerms = ['PERF', 'Performance', 'Test', '101', 'double'];
    const measurements = [];

    for (const term of searchTerms) {
      const measurement = await PerformanceTestUtils.measureExecutionTime(async () => {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('hotel_id', TEST_CONFIG.testHotelId)
          .or(`numero.ilike.%${term}%,type.ilike.%${term}%,description.ilike.%${term}%`);

        if (error) throw new Error(error.message);
        return data;
      }, `Search "${term}"`);

      measurements.push(measurement);
    }

    const report = PerformanceTestUtils.generatePerformanceReport(
      'Search', 
      measurements, 
      TEST_CONFIG.performanceThresholds.search
    );

    if (report.averageDuration > TEST_CONFIG.performanceThresholds.search) {
      throw new Error(`Performance recherche insuffisante: ${report.averageDuration.toFixed(0)}ms`);
    }

    PerformanceTestUtils.log('PERF-READ', 
      `Search: ${report.averageDuration.toFixed(0)}ms avg`, 
      'performance'
    );

    return { testName: 'search', measurements, report };
  }

  static async testStatisticsPerformance() {
    const iterations = 10;
    const measurements = [];

    for (let i = 0; i < iterations; i++) {
      const measurement = await PerformanceTestUtils.measureExecutionTime(async () => {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('hotel_id', TEST_CONFIG.testHotelId);

        if (error) throw new Error(error.message);

        // Calculer les statistiques
        const stats = {
          total: data.length,
          disponibles: data.filter(r => r.statut === 'disponible').length,
          occupees: data.filter(r => r.statut === 'occupee').length,
          maintenance: data.filter(r => r.statut === 'maintenance').length,
          prixMoyen: data.reduce((sum, r) => sum + r.prix, 0) / data.length,
          typesUniques: [...new Set(data.map(r => r.type))].length
        };

        return stats;
      }, `Statistics calculation ${i + 1}`);

      measurements.push(measurement);
    }

    const report = PerformanceTestUtils.generatePerformanceReport(
      'Statistics', 
      measurements, 
      TEST_CONFIG.performanceThresholds.statistics
    );

    if (report.averageDuration > TEST_CONFIG.performanceThresholds.statistics) {
      throw new Error(`Performance statistiques insuffisante: ${report.averageDuration.toFixed(0)}ms`);
    }

    PerformanceTestUtils.log('PERF-READ', 
      `Statistics: ${report.averageDuration.toFixed(0)}ms avg`, 
      'performance'
    );

    return { testName: 'statistics', measurements, report };
  }

  static async testPaginationPerformance() {
    const pageSize = 10;
    const pageCount = 5;
    const measurements = [];

    for (let page = 0; page < pageCount; page++) {
      const offset = page * pageSize;
      
      const measurement = await PerformanceTestUtils.measureExecutionTime(async () => {
        const { data, error, count } = await supabase
          .from('rooms')
          .select('*', { count: 'exact' })
          .eq('hotel_id', TEST_CONFIG.testHotelId)
          .range(offset, offset + pageSize - 1);

        if (error) throw new Error(error.message);
        return { data, count };
      }, `Pagination page ${page + 1}`);

      measurements.push(measurement);
    }

    const report = PerformanceTestUtils.generatePerformanceReport(
      'Pagination', 
      measurements, 
      TEST_CONFIG.performanceThresholds.batchRead
    );

    PerformanceTestUtils.log('PERF-READ', 
      `Pagination: ${report.averageDuration.toFixed(0)}ms avg`, 
      'performance'
    );

    return { testName: 'pagination', measurements, report };
  }

  static async testConcurrentReadPerformance() {
    const concurrentCount = 20;
    const operations = Array.from({ length: concurrentCount }, (_, i) => {
      return async () => {
        const randomId = this.testRoomIds[Math.floor(Math.random() * this.testRoomIds.length)];
        
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', randomId)
          .single();

        if (error) throw new Error(error.message);
        return data;
      };
    });

    const concurrentResult = await PerformanceTestUtils.runConcurrentOperations(operations, 10);

    if (concurrentResult.failureCount > 0) {
      throw new Error(`${concurrentResult.failureCount} échecs sur ${concurrentCount} lectures concurrentes`);
    }

    PerformanceTestUtils.log('PERF-READ', 
      `Concurrent Read: ${concurrentResult.averageDuration.toFixed(0)}ms avg, ${concurrentResult.successCount}/${concurrentCount} réussis`, 
      'performance'
    );

    return { testName: 'concurrentRead', concurrentResult };
  }
}

/**
 * RUNNER PRINCIPAL POUR LES TESTS DE PERFORMANCE
 */
class PerformanceTestRunner {
  static async runAllPerformanceTests() {
    console.log('\n⚡ DÉBUT DES TESTS DE PERFORMANCE - API ROOMS');
    console.log('=============================================');
    
    const startTime = Date.now();
    const results = {
      create: null,
      read: null,
      summary: {
        totalPassed: 0,
        totalFailed: 0,
        duration: 0,
        performanceMetrics: {}
      }
    };

    try {
      // Tests de performance CREATE
      results.create = await CreatePerformanceTests.runAll();
      
      // Tests de performance READ
      results.read = await ReadPerformanceTests.runAll();

      // Calcul du résumé
      const endTime = Date.now();
      results.summary.duration = endTime - startTime;
      results.summary.totalPassed = results.create.passed + results.read.passed;
      results.summary.totalFailed = results.create.failed + results.read.failed;

      // Métriques de performance
      results.summary.performanceMetrics = this.calculateOverallMetrics(results);

    } catch (error) {
      PerformanceTestUtils.log('PERF-RUNNER', `Erreur fatale: ${error.message}`, 'error');
      results.summary.fatalError = error.message;
    }

    this.displayPerformanceResults(results);
    return results;
  }

  static calculateOverallMetrics(results) {
    const allMeasurements = [
      ...(results.create?.measurements || []),
      ...(results.read?.measurements || [])
    ];

    if (allMeasurements.length === 0) return {};

    const durations = allMeasurements
      .flatMap(m => m.measurements || [m.concurrentResult?.results || []])
      .map(m => m.duration || m.averageDuration || 0)
      .filter(d => d > 0);

    if (durations.length === 0) return {};

    return {
      totalOperations: durations.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p95Duration: PerformanceTestUtils.calculatePercentile(durations, 95),
      p99Duration: PerformanceTestUtils.calculatePercentile(durations, 99)
    };
  }

  static displayPerformanceResults(results) {
    console.log('\n📊 RÉSULTATS DES TESTS DE PERFORMANCE');
    console.log('======================================');
    
    const operations = ['create', 'read'];
    const operationNames = ['CREATE-PERF', 'READ-PERF'];
    
    operations.forEach((op, index) => {
      if (results[op]) {
        const { passed, failed } = results[op];
        const total = passed + failed;
        const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
        console.log(`${operationNames[index].padEnd(12)} ${passed}/${total} (${rate}%) ⚡`);
        
        if (failed > 0 && results[op].details) {
          results[op].details.forEach(detail => {
            console.log(`  ❌ ${detail.test}: ${detail.error}`);
          });
        }
      }
    });

    console.log('\n📈 MÉTRIQUES DE PERFORMANCE GLOBALES');
    const metrics = results.summary.performanceMetrics;
    if (metrics.totalOperations) {
      console.log(`Opérations testées: ${metrics.totalOperations}`);
      console.log(`Durée moyenne: ${metrics.averageDuration.toFixed(0)}ms`);
      console.log(`Durée min/max: ${metrics.minDuration}ms / ${metrics.maxDuration}ms`);
      console.log(`P95: ${metrics.p95Duration.toFixed(0)}ms`);
      console.log(`P99: ${metrics.p99Duration.toFixed(0)}ms`);
    }

    console.log('\n🚀 SEUILS DE PERFORMANCE');
    Object.entries(TEST_CONFIG.performanceThresholds).forEach(([operation, threshold]) => {
      console.log(`${operation.padEnd(15)}: ${threshold}ms`);
    });

    console.log(`\nDurée totale des tests: ${results.summary.duration}ms`);
    console.log(`Tests réussis: ${results.summary.totalPassed}`);
    console.log(`Tests échoués: ${results.summary.totalFailed}`);

    if (results.summary.fatalError) {
      console.log(`🚨 ERREUR FATALE: ${results.summary.fatalError}`);
    }

    console.log('\n⚡ TESTS DE PERFORMANCE TERMINÉS');
  }
}

// Lancement des tests si exécuté directement
if (require.main === module) {
  PerformanceTestRunner.runAllPerformanceTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = {
  PerformanceTestRunner,
  CreatePerformanceTests,
  ReadPerformanceTests,
  PerformanceTestUtils,
  TEST_CONFIG
};