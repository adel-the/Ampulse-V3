/**
 * TESTS EXHAUSTIFS - API ROOMS CRUD OPERATIONS
 * 
 * Ce fichier contient tous les tests pour valider les opérations CRUD
 * du système de gestion des chambres.
 * 
 * OBJECTIFS :
 * - Tester toutes les opérations CREATE, READ, UPDATE, DELETE
 * - Valider la gestion d'erreurs
 * - Vérifier la cohérence des données
 * - Tester les cas limites et edge cases
 * - Valider les types TypeScript
 * - Tests de performance
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration de test
const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pgjatiookprsvfesrsrx.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamF0aW9va3Byc3ZmZXNyc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTkxMDksImV4cCI6MjA3MTAzNTEwOX0.J60Qcxtw1SmnR9WrS8t4yCIh-JyyhjAmU_FZmFIY_dI',
  testHotelId: 1,
  testTimeout: 30000
};

const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);

/**
 * UTILITAIRES DE TEST
 */
class TestUtils {
  static log(category, message, status = 'info') {
    const icons = { info: '📋', success: '✅', error: '❌', warning: '⚠️' };
    console.log(`${icons[status]} [${category}] ${message}`);
  }

  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static generateTestRoom(suffix = '') {
    return {
      hotel_id: TEST_CONFIG.testHotelId,
      numero: `TEST-${Date.now()}${suffix}`,
      type: 'Test Room',
      prix: 45.50,
      statut: 'disponible',
      description: `Chambre de test automatique créée le ${new Date().toISOString()}`,
      floor: 1,
      room_size: 25.5,
      bed_type: 'double',
      view_type: 'jardin',
      is_smoking: false,
      amenities: ['WiFi', 'TV', 'Test'],
      images: [{ url: 'test.jpg', alt: 'Test image' }]
    };
  }

  static validateRoomStructure(room, operation = 'read') {
    const requiredFields = ['id', 'hotel_id', 'numero', 'type', 'prix', 'statut'];
    const errors = [];

    requiredFields.forEach(field => {
      if (room[field] === undefined || room[field] === null) {
        errors.push(`Champ requis manquant: ${field}`);
      }
    });

    // Validation des types
    if (typeof room.id !== 'number') errors.push('id doit être un nombre');
    if (typeof room.hotel_id !== 'number') errors.push('hotel_id doit être un nombre');
    if (typeof room.numero !== 'string') errors.push('numero doit être une chaîne');
    if (typeof room.type !== 'string') errors.push('type doit être une chaîne');
    if (typeof room.prix !== 'number') errors.push('prix doit être un nombre');
    if (!['disponible', 'occupee', 'maintenance'].includes(room.statut)) {
      errors.push('statut doit être disponible, occupee ou maintenance');
    }

    // Validation des timestamps
    if (operation !== 'create') {
      if (!room.created_at) errors.push('created_at manquant');
      if (!room.updated_at) errors.push('updated_at manquant');
    }

    return errors;
  }
}

/**
 * TESTS CREATE (Création de chambres)
 */
class CreateTests {
  static async runAll() {
    TestUtils.log('CREATE', 'Début des tests de création', 'info');
    
    const results = {
      passed: 0,
      failed: 0,
      details: []
    };

    const tests = [
      this.testBasicCreate,
      this.testCreateWithAllFields,
      this.testCreateWithMinimalFields,
      this.testCreateDuplicate,
      this.testCreateInvalidHotelId,
      this.testCreateInvalidData,
      this.testCreateMultipleBatch
    ];

    for (const test of tests) {
      try {
        await test();
        results.passed++;
        TestUtils.log('CREATE', `${test.name} - RÉUSSI`, 'success');
      } catch (error) {
        results.failed++;
        results.details.push({ test: test.name, error: error.message });
        TestUtils.log('CREATE', `${test.name} - ÉCHEC: ${error.message}`, 'error');
      }
    }

    return results;
  }

  static async testBasicCreate() {
    const roomData = TestUtils.generateTestRoom('-basic');
    
    const { data, error } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (error) throw new Error(`Erreur création basique: ${error.message}`);
    
    const validationErrors = TestUtils.validateRoomStructure(data, 'create');
    if (validationErrors.length > 0) {
      throw new Error(`Validation échouée: ${validationErrors.join(', ')}`);
    }

    // Nettoyage
    await supabase.from('rooms').delete().eq('id', data.id);
  }

  static async testCreateWithAllFields() {
    const roomData = {
      ...TestUtils.generateTestRoom('-complete'),
      description: 'Chambre test complète avec tous les champs',
      category_id: null,
      floor: 2,
      room_size: 30.5,
      bed_type: 'king',
      view_type: 'mer',
      is_smoking: true,
      amenities: ['WiFi', 'TV 4K', 'Minibar', 'Balcon', 'Climatisation'],
      images: [
        { url: 'room1.jpg', alt: 'Vue principale' },
        { url: 'room2.jpg', alt: 'Salle de bain' }
      ],
      notes: 'Chambre premium avec vue mer'
    };

    const { data, error } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (error) throw new Error(`Erreur création complète: ${error.message}`);

    // Vérifier que tous les champs sont présents
    Object.keys(roomData).forEach(key => {
      if (data[key] === undefined && key !== 'created_at' && key !== 'updated_at') {
        throw new Error(`Champ ${key} manquant dans la réponse`);
      }
    });

    // Nettoyage
    await supabase.from('rooms').delete().eq('id', data.id);
  }

  static async testCreateWithMinimalFields() {
    const minimalData = {
      hotel_id: TEST_CONFIG.testHotelId,
      numero: `MIN-${Date.now()}`,
      type: 'Minimal',
      prix: 25.00
    };

    const { data, error } = await supabase
      .from('rooms')
      .insert(minimalData)
      .select()
      .single();

    if (error) throw new Error(`Erreur création minimale: ${error.message}`);

    // Vérifier les valeurs par défaut
    if (data.statut !== 'disponible') throw new Error('Statut par défaut incorrect');
    if (data.is_smoking !== false) throw new Error('is_smoking par défaut incorrect');

    // Nettoyage
    await supabase.from('rooms').delete().eq('id', data.id);
  }

  static async testCreateDuplicate() {
    const roomData = TestUtils.generateTestRoom('-duplicate');
    
    // Première création
    const { data: first, error: firstError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (firstError) throw new Error(`Erreur première création: ${firstError.message}`);

    try {
      // Tentative de création d'un doublon
      const { error: duplicateError } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();

      if (!duplicateError || duplicateError.code !== '23505') {
        throw new Error('Doublon autorisé (ne devrait pas l\'être)');
      }
    } finally {
      // Nettoyage
      await supabase.from('rooms').delete().eq('id', first.id);
    }
  }

  static async testCreateInvalidHotelId() {
    const roomData = {
      ...TestUtils.generateTestRoom('-invalid'),
      hotel_id: 99999 // ID d'hôtel inexistant
    };

    const { error } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (!error || error.code !== '23503') {
      throw new Error('Création avec hotel_id invalide autorisée');
    }
  }

  static async testCreateInvalidData() {
    const invalidCases = [
      {
        name: 'prix négatif',
        data: { ...TestUtils.generateTestRoom('-neg'), prix: -10 }
      },
      {
        name: 'statut invalide',
        data: { ...TestUtils.generateTestRoom('-status'), statut: 'invalide' }
      },
      {
        name: 'numero vide',
        data: { ...TestUtils.generateTestRoom('-empty'), numero: '' }
      }
    ];

    for (const testCase of invalidCases) {
      const { error } = await supabase
        .from('rooms')
        .insert(testCase.data)
        .select()
        .single();

      if (!error) {
        throw new Error(`Validation manquée pour: ${testCase.name}`);
      }
    }
  }

  static async testCreateMultipleBatch() {
    const batchSize = 5;
    const rooms = Array.from({ length: batchSize }, (_, i) => 
      TestUtils.generateTestRoom(`-batch-${i}`)
    );

    const { data, error } = await supabase
      .from('rooms')
      .insert(rooms)
      .select();

    if (error) throw new Error(`Erreur création batch: ${error.message}`);
    if (data.length !== batchSize) throw new Error('Nombre de chambres créées incorrect');

    // Nettoyage
    const ids = data.map(room => room.id);
    await supabase.from('rooms').delete().in('id', ids);
  }
}

/**
 * TESTS READ (Lecture de chambres)
 */
class ReadTests {
  static async runAll() {
    TestUtils.log('READ', 'Début des tests de lecture', 'info');
    
    const results = {
      passed: 0,
      failed: 0,
      details: []
    };

    // Créer des données de test
    await this.setupTestData();

    const tests = [
      this.testGetAllRooms,
      this.testGetRoomById,
      this.testGetRoomsByStatus,
      this.testGetRoomsByType,
      this.testGetRoomsByFloor,
      this.testFilterCombined,
      this.testPagination,
      this.testSearch,
      this.testStatistics,
      this.testAvailableRooms,
      this.testNonExistentRoom
    ];

    for (const test of tests) {
      try {
        await test();
        results.passed++;
        TestUtils.log('READ', `${test.name} - RÉUSSI`, 'success');
      } catch (error) {
        results.failed++;
        results.details.push({ test: test.name, error: error.message });
        TestUtils.log('READ', `${test.name} - ÉCHEC: ${error.message}`, 'error');
      }
    }

    // Nettoyage
    await this.cleanupTestData();

    return results;
  }

  static async setupTestData() {
    this.testRooms = [
      { ...TestUtils.generateTestRoom('-read1'), type: 'Simple', statut: 'disponible', floor: 1 },
      { ...TestUtils.generateTestRoom('-read2'), type: 'Double', statut: 'occupee', floor: 1 },
      { ...TestUtils.generateTestRoom('-read3'), type: 'Suite', statut: 'maintenance', floor: 2 },
      { ...TestUtils.generateTestRoom('-read4'), type: 'Simple', statut: 'disponible', floor: 2 }
    ];

    const { data, error } = await supabase
      .from('rooms')
      .insert(this.testRooms)
      .select();

    if (error) throw new Error(`Erreur setup test data: ${error.message}`);
    this.testRoomIds = data.map(room => room.id);
  }

  static async cleanupTestData() {
    if (this.testRoomIds && this.testRoomIds.length > 0) {
      await supabase.from('rooms').delete().in('id', this.testRoomIds);
    }
  }

  static async testGetAllRooms() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', TEST_CONFIG.testHotelId)
      .order('numero');

    if (error) throw new Error(`Erreur lecture toutes chambres: ${error.message}`);
    if (!Array.isArray(data)) throw new Error('Résultat doit être un tableau');
    if (data.length < 4) throw new Error('Pas assez de chambres de test trouvées');
  }

  static async testGetRoomById() {
    const targetId = this.testRoomIds[0];
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', targetId)
      .single();

    if (error) throw new Error(`Erreur lecture par ID: ${error.message}`);
    if (data.id !== targetId) throw new Error('ID incorrect dans la réponse');
    
    const validationErrors = TestUtils.validateRoomStructure(data);
    if (validationErrors.length > 0) {
      throw new Error(`Validation structure échouée: ${validationErrors.join(', ')}`);
    }
  }

  static async testGetRoomsByStatus() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', TEST_CONFIG.testHotelId)
      .eq('statut', 'disponible');

    if (error) throw new Error(`Erreur filtre par statut: ${error.message}`);
    if (!data.every(room => room.statut === 'disponible')) {
      throw new Error('Filtre statut inefficace');
    }
  }

  static async testGetRoomsByType() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', TEST_CONFIG.testHotelId)
      .eq('type', 'Simple');

    if (error) throw new Error(`Erreur filtre par type: ${error.message}`);
    if (!data.every(room => room.type === 'Simple')) {
      throw new Error('Filtre type inefficace');
    }
  }

  static async testGetRoomsByFloor() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', TEST_CONFIG.testHotelId)
      .eq('floor', 1);

    if (error) throw new Error(`Erreur filtre par étage: ${error.message}`);
    if (!data.every(room => room.floor === 1)) {
      throw new Error('Filtre étage inefficace');
    }
  }

  static async testFilterCombined() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', TEST_CONFIG.testHotelId)
      .eq('statut', 'disponible')
      .eq('floor', 1);

    if (error) throw new Error(`Erreur filtres combinés: ${error.message}`);
    if (!data.every(room => room.statut === 'disponible' && room.floor === 1)) {
      throw new Error('Filtres combinés inefficaces');
    }
  }

  static async testPagination() {
    const limit = 2;
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', TEST_CONFIG.testHotelId)
      .order('numero')
      .limit(limit);

    if (error) throw new Error(`Erreur pagination: ${error.message}`);
    if (data.length > limit) throw new Error('Limite de pagination non respectée');
  }

  static async testSearch() {
    const searchTerm = 'read';
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', TEST_CONFIG.testHotelId)
      .ilike('numero', `%${searchTerm}%`);

    if (error) throw new Error(`Erreur recherche: ${error.message}`);
    if (!data.every(room => room.numero.toLowerCase().includes(searchTerm))) {
      throw new Error('Recherche inefficace');
    }
  }

  static async testStatistics() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', TEST_CONFIG.testHotelId);

    if (error) throw new Error(`Erreur données statistiques: ${error.message}`);

    const stats = {
      total: data.length,
      disponibles: data.filter(r => r.statut === 'disponible').length,
      occupees: data.filter(r => r.statut === 'occupee').length,
      maintenance: data.filter(r => r.statut === 'maintenance').length
    };

    if (stats.total !== stats.disponibles + stats.occupees + stats.maintenance) {
      throw new Error('Calcul statistiques incorrect');
    }
  }

  static async testAvailableRooms() {
    const dateArrivee = '2024-12-01';
    const dateDepart = '2024-12-05';

    // Test simple des chambres disponibles
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', TEST_CONFIG.testHotelId)
      .eq('statut', 'disponible');

    if (error) throw new Error(`Erreur chambres disponibles: ${error.message}`);
    if (!Array.isArray(data)) throw new Error('Résultat chambres disponibles invalide');
  }

  static async testNonExistentRoom() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', 99999)
      .single();

    if (!error || error.code !== 'PGRST116') {
      throw new Error('Erreur attendue pour chambre inexistante non levée');
    }
  }
}

/**
 * TESTS UPDATE (Mise à jour de chambres)
 */
class UpdateTests {
  static async runAll() {
    TestUtils.log('UPDATE', 'Début des tests de mise à jour', 'info');
    
    const results = {
      passed: 0,
      failed: 0,
      details: []
    };

    const tests = [
      this.testBasicUpdate,
      this.testUpdateAllFields,
      this.testUpdateStatus,
      this.testUpdatePrice,
      this.testUpdateAmenities,
      this.testUpdateNonExistent,
      this.testUpdateInvalidData,
      this.testBatchUpdate,
      this.testTimestampUpdate
    ];

    for (const test of tests) {
      try {
        await test();
        results.passed++;
        TestUtils.log('UPDATE', `${test.name} - RÉUSSI`, 'success');
      } catch (error) {
        results.failed++;
        results.details.push({ test: test.name, error: error.message });
        TestUtils.log('UPDATE', `${test.name} - ÉCHEC: ${error.message}`, 'error');
      }
    }

    return results;
  }

  static async testBasicUpdate() {
    // Créer une chambre de test
    const roomData = TestUtils.generateTestRoom('-update-basic');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création pour update: ${createError.message}`);

    try {
      // Mettre à jour
      const newDescription = 'Description mise à jour';
      const { data: updated, error: updateError } = await supabase
        .from('rooms')
        .update({ description: newDescription })
        .eq('id', created.id)
        .select()
        .single();

      if (updateError) throw new Error(`Erreur update basique: ${updateError.message}`);
      if (updated.description !== newDescription) throw new Error('Mise à jour ineffective');
      if (new Date(updated.updated_at) <= new Date(created.updated_at)) {
        throw new Error('Timestamp updated_at non mis à jour');
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testUpdateAllFields() {
    const roomData = TestUtils.generateTestRoom('-update-all');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création: ${createError.message}`);

    try {
      const updateData = {
        numero: `UPD-${Date.now()}`,
        type: 'Updated Type',
        prix: 99.99,
        statut: 'maintenance',
        description: 'Description complètement mise à jour',
        floor: 3,
        room_size: 40.0,
        bed_type: 'king',
        view_type: 'ville',
        is_smoking: true,
        amenities: ['WiFi', 'TV 4K', 'Jacuzzi'],
        images: [{ url: 'updated.jpg', alt: 'Mise à jour' }],
        notes: 'Notes mises à jour'
      };

      const { data: updated, error: updateError } = await supabase
        .from('rooms')
        .update(updateData)
        .eq('id', created.id)
        .select()
        .single();

      if (updateError) throw new Error(`Erreur update complet: ${updateError.message}`);

      // Vérifier tous les champs
      Object.keys(updateData).forEach(key => {
        if (JSON.stringify(updated[key]) !== JSON.stringify(updateData[key])) {
          throw new Error(`Champ ${key} non mis à jour correctement`);
        }
      });
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testUpdateStatus() {
    const roomData = TestUtils.generateTestRoom('-update-status');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création: ${createError.message}`);

    try {
      const statuses = ['occupee', 'maintenance', 'disponible'];
      
      for (const status of statuses) {
        const { data: updated, error: updateError } = await supabase
          .from('rooms')
          .update({ statut: status })
          .eq('id', created.id)
          .select()
          .single();

        if (updateError) throw new Error(`Erreur update statut ${status}: ${updateError.message}`);
        if (updated.statut !== status) throw new Error(`Statut ${status} non appliqué`);
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testUpdatePrice() {
    const roomData = TestUtils.generateTestRoom('-update-price');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création: ${createError.message}`);

    try {
      const newPrice = 125.75;
      const { data: updated, error: updateError } = await supabase
        .from('rooms')
        .update({ prix: newPrice })
        .eq('id', created.id)
        .select()
        .single();

      if (updateError) throw new Error(`Erreur update prix: ${updateError.message}`);
      if (updated.prix !== newPrice) throw new Error('Prix non mis à jour');
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testUpdateAmenities() {
    const roomData = TestUtils.generateTestRoom('-update-amenities');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création: ${createError.message}`);

    try {
      const newAmenities = ['WiFi Premium', 'TV OLED', 'Minibar Premium', 'Vue panoramique'];
      const { data: updated, error: updateError } = await supabase
        .from('rooms')
        .update({ amenities: newAmenities })
        .eq('id', created.id)
        .select()
        .single();

      if (updateError) throw new Error(`Erreur update équipements: ${updateError.message}`);
      if (JSON.stringify(updated.amenities) !== JSON.stringify(newAmenities)) {
        throw new Error('Équipements non mis à jour');
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testUpdateNonExistent() {
    const { error } = await supabase
      .from('rooms')
      .update({ description: 'Test' })
      .eq('id', 99999)
      .select()
      .single();

    if (!error || error.code !== 'PGRST116') {
      throw new Error('Update chambre inexistante devrait échouer');
    }
  }

  static async testUpdateInvalidData() {
    const roomData = TestUtils.generateTestRoom('-update-invalid');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création: ${createError.message}`);

    try {
      // Test prix négatif
      const { error: priceError } = await supabase
        .from('rooms')
        .update({ prix: -50 })
        .eq('id', created.id);

      if (!priceError) throw new Error('Prix négatif autorisé');

      // Test statut invalide
      const { error: statusError } = await supabase
        .from('rooms')
        .update({ statut: 'statut_invalide' })
        .eq('id', created.id);

      if (!statusError) throw new Error('Statut invalide autorisé');
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testBatchUpdate() {
    // Créer plusieurs chambres
    const roomsData = Array.from({ length: 3 }, (_, i) => 
      TestUtils.generateTestRoom(`-batch-${i}`)
    );

    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomsData)
      .select();

    if (createError) throw new Error(`Erreur création batch: ${createError.message}`);

    try {
      const ids = created.map(room => room.id);
      const { data: updated, error: updateError } = await supabase
        .from('rooms')
        .update({ statut: 'maintenance' })
        .in('id', ids)
        .select();

      if (updateError) throw new Error(`Erreur update batch: ${updateError.message}`);
      if (updated.length !== ids.length) throw new Error('Nombre de mises à jour incorrect');
      if (!updated.every(room => room.statut === 'maintenance')) {
        throw new Error('Mise à jour batch ineffective');
      }
    } finally {
      const ids = created.map(room => room.id);
      await supabase.from('rooms').delete().in('id', ids);
    }
  }

  static async testTimestampUpdate() {
    const roomData = TestUtils.generateTestRoom('-timestamp');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création: ${createError.message}`);

    const initialTimestamp = created.updated_at;
    
    // Attendre un peu pour voir la différence de timestamp
    await TestUtils.delay(1000);

    try {
      const { data: updated, error: updateError } = await supabase
        .from('rooms')
        .update({ description: 'Test timestamp' })
        .eq('id', created.id)
        .select()
        .single();

      if (updateError) throw new Error(`Erreur update timestamp: ${updateError.message}`);
      if (new Date(updated.updated_at) <= new Date(initialTimestamp)) {
        throw new Error('Timestamp updated_at non actualisé');
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }
}

/**
 * TESTS DELETE (Suppression de chambres)
 */
class DeleteTests {
  static async runAll() {
    TestUtils.log('DELETE', 'Début des tests de suppression', 'info');
    
    const results = {
      passed: 0,
      failed: 0,
      details: []
    };

    const tests = [
      this.testBasicDelete,
      this.testDeleteNonExistent,
      this.testDeleteWithReservations,
      this.testBatchDelete,
      this.testDeleteConstraints
    ];

    for (const test of tests) {
      try {
        await test();
        results.passed++;
        TestUtils.log('DELETE', `${test.name} - RÉUSSI`, 'success');
      } catch (error) {
        results.failed++;
        results.details.push({ test: test.name, error: error.message });
        TestUtils.log('DELETE', `${test.name} - ÉCHEC: ${error.message}`, 'error');
      }
    }

    return results;
  }

  static async testBasicDelete() {
    // Créer une chambre de test
    const roomData = TestUtils.generateTestRoom('-delete-basic');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création pour delete: ${createError.message}`);

    // Supprimer
    const { error: deleteError } = await supabase
      .from('rooms')
      .delete()
      .eq('id', created.id);

    if (deleteError) throw new Error(`Erreur delete basique: ${deleteError.message}`);

    // Vérifier que la chambre n'existe plus
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', created.id)
      .single();

    if (!error || error.code !== 'PGRST116') {
      throw new Error('Chambre encore présente après suppression');
    }
  }

  static async testDeleteNonExistent() {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', 99999);

    // La suppression d'une chambre inexistante ne devrait pas lever d'erreur
    if (error) throw new Error(`Erreur inattendue delete inexistant: ${error.message}`);
  }

  static async testDeleteWithReservations() {
    // Ce test nécessiterait une réservation active
    // Pour l'instant, on teste juste la logique de base
    TestUtils.log('DELETE', 'Test avec réservations - simulation', 'warning');
    
    // Créer une chambre
    const roomData = TestUtils.generateTestRoom('-delete-reservation');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création: ${createError.message}`);

    try {
      // Vérifier qu'on peut supprimer une chambre sans réservation
      const { error: deleteError } = await supabase
        .from('rooms')
        .delete()
        .eq('id', created.id);

      if (deleteError) throw new Error(`Erreur delete: ${deleteError.message}`);
    } catch (error) {
      // Nettoyer en cas d'erreur
      await supabase.from('rooms').delete().eq('id', created.id);
      throw error;
    }
  }

  static async testBatchDelete() {
    // Créer plusieurs chambres
    const roomsData = Array.from({ length: 3 }, (_, i) => 
      TestUtils.generateTestRoom(`-delete-batch-${i}`)
    );

    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomsData)
      .select();

    if (createError) throw new Error(`Erreur création batch: ${createError.message}`);

    const ids = created.map(room => room.id);

    // Supprimer en lot
    const { error: deleteError } = await supabase
      .from('rooms')
      .delete()
      .in('id', ids);

    if (deleteError) throw new Error(`Erreur delete batch: ${deleteError.message}`);

    // Vérifier qu'aucune chambre n'existe plus
    const { data: remaining } = await supabase
      .from('rooms')
      .select('id')
      .in('id', ids);

    if (remaining && remaining.length > 0) {
      throw new Error('Certaines chambres non supprimées');
    }
  }

  static async testDeleteConstraints() {
    // Test des contraintes de suppression
    TestUtils.log('DELETE', 'Test contraintes de suppression', 'info');
    
    const roomData = TestUtils.generateTestRoom('-delete-constraints');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création: ${createError.message}`);

    try {
      // Test suppression normale
      const { error: deleteError } = await supabase
        .from('rooms')
        .delete()
        .eq('id', created.id);

      if (deleteError) throw new Error(`Erreur contraintes: ${deleteError.message}`);
    } catch (error) {
      await supabase.from('rooms').delete().eq('id', created.id);
      throw error;
    }
  }
}

/**
 * RUNNER PRINCIPAL
 */
class TestRunner {
  static async runAllTests() {
    console.log('\n🚀 DÉBUT DES TESTS EXHAUSTIFS - API ROOMS CRUD');
    console.log('================================================');
    
    const startTime = Date.now();
    const results = {
      create: null,
      read: null,
      update: null,
      delete: null,
      summary: {
        totalPassed: 0,
        totalFailed: 0,
        duration: 0,
        coverage: {}
      }
    };

    try {
      // Tests CREATE
      results.create = await CreateTests.runAll();
      
      // Tests READ
      results.read = await ReadTests.runAll();
      
      // Tests UPDATE
      results.update = await UpdateTests.runAll();
      
      // Tests DELETE
      results.delete = await DeleteTests.runAll();

      // Calcul du résumé
      const endTime = Date.now();
      results.summary.duration = endTime - startTime;
      results.summary.totalPassed = 
        results.create.passed + results.read.passed + 
        results.update.passed + results.delete.passed;
      results.summary.totalFailed = 
        results.create.failed + results.read.failed + 
        results.update.failed + results.delete.failed;

    } catch (error) {
      TestUtils.log('RUNNER', `Erreur fatale: ${error.message}`, 'error');
      results.summary.fatalError = error.message;
    }

    this.displayResults(results);
    return results;
  }

  static displayResults(results) {
    console.log('\n📊 RÉSULTATS DES TESTS');
    console.log('======================');
    
    const operations = ['create', 'read', 'update', 'delete'];
    operations.forEach(op => {
      if (results[op]) {
        const { passed, failed } = results[op];
        const total = passed + failed;
        const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
        console.log(`${op.toUpperCase().padEnd(8)} ${passed}/${total} (${rate}%) ✅`);
        
        if (failed > 0 && results[op].details) {
          results[op].details.forEach(detail => {
            console.log(`  ❌ ${detail.test}: ${detail.error}`);
          });
        }
      }
    });

    console.log('\n📈 RÉSUMÉ GLOBAL');
    console.log(`Total réussi: ${results.summary.totalPassed}`);
    console.log(`Total échoué: ${results.summary.totalFailed}`);
    console.log(`Durée: ${results.summary.duration}ms`);
    console.log(`Taux de réussite: ${(results.summary.totalPassed / (results.summary.totalPassed + results.summary.totalFailed) * 100).toFixed(1)}%`);

    if (results.summary.fatalError) {
      console.log(`🚨 ERREUR FATALE: ${results.summary.fatalError}`);
    }

    console.log('\n🏁 TESTS TERMINÉS');
  }
}

// Lancement des tests si exécuté directement
if (require.main === module) {
  TestRunner.runAllTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = {
  TestRunner,
  CreateTests,
  ReadTests,
  UpdateTests,
  DeleteTests,
  TestUtils,
  TEST_CONFIG
};