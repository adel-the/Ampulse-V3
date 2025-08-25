/**
 * TESTS DE COHÉRENCE DES DONNÉES - API ROOMS
 * 
 * Tests spécialisés pour valider la cohérence et l'intégrité
 * des données après chaque opération CRUD.
 * 
 * OBJECTIFS :
 * - Vérifier l'intégrité des données après chaque opération
 * - Valider la cohérence des relations entre entités
 * - Tester les contraintes d'intégrité référentielle
 * - Valider les triggers et les règles métier
 * - Vérifier la synchronisation des données
 */

const { createClient } = require('@supabase/supabase-js');

const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pgjatiookprsvfesrsrx.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamF0aW9va3Byc3ZmZXNyc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTkxMDksImV4cCI6MjA3MTAzNTEwOX0.J60Qcxtw1SmnR9WrS8t4yCIh-JyyhjAmU_FZmFIY_dI',
  testHotelId: 1
};

const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);

class DataConsistencyTestUtils {
  static log(category, message, status = 'info') {
    const icons = { info: '📋', success: '✅', error: '❌', warning: '⚠️', consistency: '🔗' };
    console.log(`${icons[status]} [${category}] ${message}`);
  }

  static generateTestRoom(suffix = '') {
    return {
      hotel_id: TEST_CONFIG.testHotelId,
      numero: `CONS-${Date.now()}-${Math.random().toString(36).substr(2, 5)}${suffix}`,
      type: 'Consistency Test',
      prix: 75.00,
      statut: 'disponible',
      description: 'Chambre de test de cohérence des données',
      floor: 2,
      room_size: 25.0,
      bed_type: 'double',
      view_type: 'jardin',
      is_smoking: false,
      amenities: ['WiFi', 'TV', 'Climatisation'],
      images: [{ url: 'test.jpg', alt: 'Test image' }],
      notes: 'Test de cohérence'
    };
  }

  /**
   * Vérifie l'intégrité d'une chambre
   */
  static async validateRoomIntegrity(roomId, expectedData = {}) {
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) {
      throw new Error(`Impossible de récupérer la chambre ${roomId}: ${error.message}`);
    }

    const issues = [];

    // Vérifications de base
    if (!room.numero || room.numero.trim() === '') {
      issues.push('Numéro de chambre vide');
    }

    if (!room.type || room.type.trim() === '') {
      issues.push('Type de chambre vide');
    }

    if (typeof room.prix !== 'number' || room.prix < 0) {
      issues.push('Prix invalide');
    }

    if (!['disponible', 'occupee', 'maintenance'].includes(room.statut)) {
      issues.push('Statut invalide');
    }

    // Vérifications des timestamps
    if (!room.created_at || isNaN(new Date(room.created_at).getTime())) {
      issues.push('created_at invalide');
    }

    if (!room.updated_at || isNaN(new Date(room.updated_at).getTime())) {
      issues.push('updated_at invalide');
    }

    if (new Date(room.updated_at) < new Date(room.created_at)) {
      issues.push('updated_at antérieur à created_at');
    }

    // Vérifications des données JSON
    if (room.amenities !== null && !Array.isArray(room.amenities)) {
      issues.push('amenities doit être un array ou null');
    }

    if (room.images !== null && !Array.isArray(room.images)) {
      issues.push('images doit être un array ou null');
    }

    // Vérifications des contraintes numériques
    if (room.floor !== null && (typeof room.floor !== 'number' || room.floor < 0)) {
      issues.push('Floor invalide');
    }

    if (room.room_size !== null && (typeof room.room_size !== 'number' || room.room_size <= 0)) {
      issues.push('room_size invalide');
    }

    // Comparaison avec les données attendues
    for (const [key, expectedValue] of Object.entries(expectedData)) {
      if (room[key] !== expectedValue) {
        issues.push(`${key}: attendu ${expectedValue}, trouvé ${room[key]}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues: issues,
      room: room
    };
  }

  /**
   * Vérifie la cohérence de l'hôtel et de ses chambres
   */
  static async validateHotelRoomsConsistency(hotelId) {
    // Vérifier que l'hôtel existe
    const { data: hotel, error: hotelError } = await supabase
      .from('hotels')
      .select('id, nom')
      .eq('id', hotelId)
      .single();

    if (hotelError) {
      throw new Error(`Hôtel ${hotelId} introuvable: ${hotelError.message}`);
    }

    // Récupérer toutes les chambres de l'hôtel
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', hotelId);

    if (roomsError) {
      throw new Error(`Erreur récupération chambres: ${roomsError.message}`);
    }

    const issues = [];

    // Vérifier l'unicité des numéros de chambre
    const roomNumbers = rooms.map(r => r.numero);
    const duplicateNumbers = roomNumbers.filter((num, index) => roomNumbers.indexOf(num) !== index);
    if (duplicateNumbers.length > 0) {
      issues.push(`Numéros de chambre dupliqués: ${[...new Set(duplicateNumbers)].join(', ')}`);
    }

    // Vérifier que toutes les chambres appartiennent bien à l'hôtel
    const incorrectHotelRooms = rooms.filter(r => r.hotel_id !== hotelId);
    if (incorrectHotelRooms.length > 0) {
      issues.push(`Chambres avec hotel_id incorrect: ${incorrectHotelRooms.map(r => r.numero).join(', ')}`);
    }

    // Vérifier la cohérence des données de chaque chambre
    for (const room of rooms) {
      const roomValidation = await this.validateRoomIntegrity(room.id);
      if (!roomValidation.valid) {
        issues.push(`Chambre ${room.numero}: ${roomValidation.issues.join(', ')}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues: issues,
      hotel: hotel,
      roomCount: rooms.length
    };
  }

  /**
   * Vérifie l'état de la base de données avant et après une opération
   */
  static async captureDbState(description = '') {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', TEST_CONFIG.testHotelId)
      .order('id');

    if (error) {
      throw new Error(`Erreur capture état DB: ${error.message}`);
    }

    const state = {
      timestamp: Date.now(),
      description: description,
      roomCount: rooms.length,
      rooms: rooms,
      roomsByStatus: {
        disponible: rooms.filter(r => r.statut === 'disponible').length,
        occupee: rooms.filter(r => r.statut === 'occupee').length,
        maintenance: rooms.filter(r => r.statut === 'maintenance').length
      },
      totalValue: rooms.reduce((sum, r) => sum + (r.prix || 0), 0),
      roomNumbers: rooms.map(r => r.numero).sort()
    };

    return state;
  }

  /**
   * Compare deux états de base de données
   */
  static compareDbStates(stateBefore, stateAfter, expectedChanges = {}) {
    const issues = [];

    // Comparaison du nombre de chambres
    const roomCountDiff = stateAfter.roomCount - stateBefore.roomCount;
    if (expectedChanges.roomCountChange !== undefined && roomCountDiff !== expectedChanges.roomCountChange) {
      issues.push(`Changement de nombre de chambres incorrect: attendu ${expectedChanges.roomCountChange}, trouvé ${roomCountDiff}`);
    }

    // Comparaison des numéros de chambre
    const newRooms = stateAfter.roomNumbers.filter(num => !stateBefore.roomNumbers.includes(num));
    const deletedRooms = stateBefore.roomNumbers.filter(num => !stateAfter.roomNumbers.includes(num));

    if (expectedChanges.newRooms !== undefined && newRooms.length !== expectedChanges.newRooms) {
      issues.push(`Nouvelles chambres: attendu ${expectedChanges.newRooms}, trouvé ${newRooms.length}`);
    }

    if (expectedChanges.deletedRooms !== undefined && deletedRooms.length !== expectedChanges.deletedRooms) {
      issues.push(`Chambres supprimées: attendu ${expectedChanges.deletedRooms}, trouvé ${deletedRooms.length}`);
    }

    // Comparaison des statuts
    for (const status of ['disponible', 'occupee', 'maintenance']) {
      const statusDiff = stateAfter.roomsByStatus[status] - stateBefore.roomsByStatus[status];
      if (expectedChanges[`${status}Change`] !== undefined && statusDiff !== expectedChanges[`${status}Change`]) {
        issues.push(`Changement statut ${status}: attendu ${expectedChanges[`${status}Change`]}, trouvé ${statusDiff}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues: issues,
      changes: {
        roomCount: roomCountDiff,
        newRooms: newRooms,
        deletedRooms: deletedRooms,
        statusChanges: {
          disponible: stateAfter.roomsByStatus.disponible - stateBefore.roomsByStatus.disponible,
          occupee: stateAfter.roomsByStatus.occupee - stateBefore.roomsByStatus.occupee,
          maintenance: stateAfter.roomsByStatus.maintenance - stateBefore.roomsByStatus.maintenance
        }
      }
    };
  }

  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * TESTS DE COHÉRENCE POUR LES OPÉRATIONS CREATE
 */
class CreateConsistencyTests {
  static async runAll() {
    DataConsistencyTestUtils.log('CONS-CREATE', 'Tests de cohérence CREATE', 'consistency');
    
    const results = { passed: 0, failed: 0, details: [] };
    const tests = [
      this.testCreateIntegrity,
      this.testCreateUniqueConstraints,
      this.testCreateTimestamps,
      this.testCreateDefaultValues,
      this.testCreateRelationalIntegrity,
      this.testCreateDataConsistency,
      this.testCreateBatchConsistency,
      this.testCreateRollbackConsistency
    ];

    for (const test of tests) {
      try {
        await test();
        results.passed++;
        DataConsistencyTestUtils.log('CONS-CREATE', `${test.name} - RÉUSSI`, 'success');
      } catch (error) {
        results.failed++;
        results.details.push({ test: test.name, error: error.message });
        DataConsistencyTestUtils.log('CONS-CREATE', `${test.name} - ÉCHEC: ${error.message}`, 'error');
      }
    }

    return results;
  }

  static async testCreateIntegrity() {
    const stateBefore = await DataConsistencyTestUtils.captureDbState('Avant création');
    
    const roomData = DataConsistencyTestUtils.generateTestRoom('-integrity');
    
    const { data: created, error } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (error) throw new Error(`Erreur création: ${error.message}`);

    try {
      // Vérifier l'intégrité de la chambre créée
      const integrity = await DataConsistencyTestUtils.validateRoomIntegrity(created.id, {
        numero: roomData.numero,
        type: roomData.type,
        prix: roomData.prix,
        hotel_id: roomData.hotel_id
      });

      if (!integrity.valid) {
        throw new Error(`Intégrité échouée: ${integrity.issues.join(', ')}`);
      }

      // Vérifier l'état de la base de données
      const stateAfter = await DataConsistencyTestUtils.captureDbState('Après création');
      const comparison = DataConsistencyTestUtils.compareDbStates(stateBefore, stateAfter, {
        roomCountChange: 1,
        newRooms: 1,
        disponibleChange: 1
      });

      if (!comparison.valid) {
        throw new Error(`État DB incohérent: ${comparison.issues.join(', ')}`);
      }

      // Vérifier la cohérence globale de l'hôtel
      const hotelConsistency = await DataConsistencyTestUtils.validateHotelRoomsConsistency(TEST_CONFIG.testHotelId);
      if (!hotelConsistency.valid) {
        throw new Error(`Cohérence hôtel échouée: ${hotelConsistency.issues.join(', ')}`);
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testCreateUniqueConstraints() {
    const roomData = DataConsistencyTestUtils.generateTestRoom('-unique');
    
    // Première création
    const { data: first, error: firstError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (firstError) throw new Error(`Erreur première création: ${firstError.message}`);

    try {
      // Tentative de création avec le même numéro
      const { error: duplicateError } = await supabase
        .from('rooms')
        .insert(roomData);

      if (!duplicateError) {
        throw new Error('Contrainte d\'unicité non respectée');
      }

      // Vérifier que la première chambre existe toujours
      const integrity = await DataConsistencyTestUtils.validateRoomIntegrity(first.id);
      if (!integrity.valid) {
        throw new Error('Première chambre corrompue après tentative de doublon');
      }

      // Vérifier qu'il n'y a qu'une seule chambre avec ce numéro
      const { data: duplicates, error: checkError } = await supabase
        .from('rooms')
        .select('id')
        .eq('hotel_id', TEST_CONFIG.testHotelId)
        .eq('numero', roomData.numero);

      if (checkError) throw new Error(`Erreur vérification doublons: ${checkError.message}`);
      if (duplicates.length !== 1) {
        throw new Error(`Nombre incorrect de chambres avec le numéro ${roomData.numero}: ${duplicates.length}`);
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', first.id);
    }
  }

  static async testCreateTimestamps() {
    const beforeCreate = new Date();
    await DataConsistencyTestUtils.delay(100); // Assurer une différence de timestamp
    
    const roomData = DataConsistencyTestUtils.generateTestRoom('-timestamps');
    
    const { data: created, error } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (error) throw new Error(`Erreur création: ${error.message}`);

    try {
      const afterCreate = new Date();
      const createdAt = new Date(created.created_at);
      const updatedAt = new Date(created.updated_at);

      // Vérifier que created_at est dans la bonne plage
      if (createdAt < beforeCreate || createdAt > afterCreate) {
        throw new Error(`created_at hors plage: ${created.created_at}`);
      }

      // Vérifier que updated_at est cohérent avec created_at
      if (Math.abs(updatedAt.getTime() - createdAt.getTime()) > 1000) {
        throw new Error('updated_at trop différent de created_at à la création');
      }

      // Vérifier le format ISO
      if (!created.created_at.includes('T') || !created.updated_at.includes('T')) {
        throw new Error('Timestamps pas au format ISO');
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testCreateDefaultValues() {
    // Test avec données minimales
    const minimalData = {
      hotel_id: TEST_CONFIG.testHotelId,
      numero: `DEF-${Date.now()}`,
      type: 'Default Test',
      prix: 50.00
    };

    const { data: created, error } = await supabase
      .from('rooms')
      .insert(minimalData)
      .select()
      .single();

    if (error) throw new Error(`Erreur création minimale: ${error.message}`);

    try {
      // Vérifier les valeurs par défaut
      if (created.statut !== 'disponible') {
        throw new Error(`Statut par défaut incorrect: ${created.statut}`);
      }

      if (created.is_smoking !== false) {
        throw new Error(`is_smoking par défaut incorrect: ${created.is_smoking}`);
      }

      if (!Array.isArray(created.amenities) || created.amenities.length !== 0) {
        if (created.amenities !== null) {
          throw new Error(`amenities par défaut incorrect: ${created.amenities}`);
        }
      }

      if (!Array.isArray(created.images) || created.images.length !== 0) {
        if (created.images !== null) {
          throw new Error(`images par défaut incorrect: ${created.images}`);
        }
      }

      // Vérifier l'intégrité globale
      const integrity = await DataConsistencyTestUtils.validateRoomIntegrity(created.id);
      if (!integrity.valid) {
        throw new Error(`Intégrité valeurs par défaut échouée: ${integrity.issues.join(', ')}`);
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testCreateRelationalIntegrity() {
    // Vérifier que la création avec un hotel_id invalide échoue
    const invalidRoomData = {
      ...DataConsistencyTestUtils.generateTestRoom('-invalid-hotel'),
      hotel_id: 99999
    };

    const { error: invalidError } = await supabase
      .from('rooms')
      .insert(invalidRoomData);

    if (!invalidError) {
      throw new Error('Création avec hotel_id invalide autorisée');
    }

    // Vérifier que la création avec un hotel_id valide réussit
    const validRoomData = DataConsistencyTestUtils.generateTestRoom('-valid-hotel');
    
    const { data: created, error: validError } = await supabase
      .from('rooms')
      .insert(validRoomData)
      .select()
      .single();

    if (validError) throw new Error(`Erreur création valide: ${validError.message}`);

    try {
      // Vérifier la relation
      const { data: hotelCheck, error: hotelError } = await supabase
        .from('hotels')
        .select('id')
        .eq('id', created.hotel_id)
        .single();

      if (hotelError || !hotelCheck) {
        throw new Error('Relation hotel inexistante après création chambre');
      }

      // Vérifier que la chambre est bien liée à l'hôtel
      if (created.hotel_id !== validRoomData.hotel_id) {
        throw new Error('hotel_id modifié lors de la création');
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testCreateDataConsistency() {
    const complexData = {
      ...DataConsistencyTestUtils.generateTestRoom('-complex'),
      amenities: ['WiFi', { type: 'TV', model: '4K' }, 'Climatisation'],
      images: [
        { url: 'room1.jpg', alt: 'Vue principale', metadata: { size: 1024, format: 'jpeg' } },
        { url: 'room2.jpg', alt: 'Salle de bain' }
      ],
      prix: 123.456789, // Test précision
      room_size: 25.555555
    };

    const { data: created, error } = await supabase
      .from('rooms')
      .insert(complexData)
      .select()
      .single();

    if (error) throw new Error(`Erreur création complexe: ${error.message}`);

    try {
      // Vérifier la préservation des données complexes
      if (!Array.isArray(created.amenities) || created.amenities.length !== complexData.amenities.length) {
        throw new Error('Amenities complexes non préservées');
      }

      if (!Array.isArray(created.images) || created.images.length !== complexData.images.length) {
        throw new Error('Images complexes non préservées');
      }

      // Vérifier la structure des objets complexes
      const tvAmenity = created.amenities.find(a => typeof a === 'object' && a.type === 'TV');
      if (!tvAmenity || tvAmenity.model !== '4K') {
        throw new Error('Objet complexe dans amenities corrompu');
      }

      const imageWithMetadata = created.images.find(img => img.metadata);
      if (!imageWithMetadata || imageWithMetadata.metadata.size !== 1024) {
        throw new Error('Métadonnées d\'image corrompues');
      }

      // Vérifier la précision numérique
      const priceDiff = Math.abs(created.prix - complexData.prix);
      if (priceDiff > 0.01) {
        DataConsistencyTestUtils.log('CONS-CREATE', 
          `Précision prix modifiée: ${complexData.prix} → ${created.prix}`, 
          'warning'
        );
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testCreateBatchConsistency() {
    const batchSize = 5;
    const roomsData = Array.from({ length: batchSize }, (_, i) => 
      DataConsistencyTestUtils.generateTestRoom(`-batch-${i}`)
    );

    const stateBefore = await DataConsistencyTestUtils.captureDbState('Avant batch create');

    const { data: created, error } = await supabase
      .from('rooms')
      .insert(roomsData)
      .select();

    if (error) throw new Error(`Erreur batch create: ${error.message}`);

    try {
      // Vérifier que toutes les chambres ont été créées
      if (created.length !== batchSize) {
        throw new Error(`Nombre incorrect de chambres créées: ${created.length}/${batchSize}`);
      }

      // Vérifier l'intégrité de chaque chambre
      for (let i = 0; i < created.length; i++) {
        const room = created[i];
        const originalData = roomsData[i];
        
        const integrity = await DataConsistencyTestUtils.validateRoomIntegrity(room.id, {
          numero: originalData.numero,
          type: originalData.type,
          prix: originalData.prix
        });

        if (!integrity.valid) {
          throw new Error(`Intégrité chambre ${i} échouée: ${integrity.issues.join(', ')}`);
        }
      }

      // Vérifier l'état global
      const stateAfter = await DataConsistencyTestUtils.captureDbState('Après batch create');
      const comparison = DataConsistencyTestUtils.compareDbStates(stateBefore, stateAfter, {
        roomCountChange: batchSize,
        newRooms: batchSize,
        disponibleChange: batchSize
      });

      if (!comparison.valid) {
        throw new Error(`État batch incohérent: ${comparison.issues.join(', ')}`);
      }

      // Vérifier l'unicité des numéros dans le batch
      const batchNumbers = created.map(r => r.numero);
      const uniqueNumbers = [...new Set(batchNumbers)];
      if (uniqueNumbers.length !== batchNumbers.length) {
        throw new Error('Numéros dupliqués dans le batch');
      }
    } finally {
      const ids = created.map(room => room.id);
      await supabase.from('rooms').delete().in('id', ids);
    }
  }

  static async testCreateRollbackConsistency() {
    const stateBefore = await DataConsistencyTestUtils.captureDbState('Avant rollback test');

    // Tentative de création avec des données qui devraient échouer
    const invalidData = [
      DataConsistencyTestUtils.generateTestRoom('-rollback-1'),
      {
        ...DataConsistencyTestUtils.generateTestRoom('-rollback-2'),
        prix: -100 // Prix invalide qui devrait faire échouer la transaction
      }
    ];

    const { error } = await supabase
      .from('rooms')
      .insert(invalidData);

    // L'opération devrait échouer
    if (!error) {
      // Si elle n'échoue pas, nettoyer manuellement
      const { data: toClean } = await supabase
        .from('rooms')
        .select('id')
        .in('numero', invalidData.map(r => r.numero));
      
      if (toClean && toClean.length > 0) {
        await supabase.from('rooms').delete().in('id', toClean.map(r => r.id));
      }
      
      throw new Error('Transaction invalide non rejetée');
    }

    // Vérifier que l'état n'a pas changé
    const stateAfter = await DataConsistencyTestUtils.captureDbState('Après rollback test');
    const comparison = DataConsistencyTestUtils.compareDbStates(stateBefore, stateAfter, {
      roomCountChange: 0,
      newRooms: 0
    });

    if (!comparison.valid) {
      throw new Error(`État après rollback incohérent: ${comparison.issues.join(', ')}`);
    }

    // Vérifier qu'aucune des chambres n'existe
    const { data: orphanedRooms } = await supabase
      .from('rooms')
      .select('numero')
      .in('numero', invalidData.map(r => r.numero));

    if (orphanedRooms && orphanedRooms.length > 0) {
      throw new Error(`Chambres orphelines après rollback: ${orphanedRooms.map(r => r.numero).join(', ')}`);
    }
  }
}

/**
 * TESTS DE COHÉRENCE POUR LES OPÉRATIONS UPDATE
 */
class UpdateConsistencyTests {
  static async runAll() {
    DataConsistencyTestUtils.log('CONS-UPDATE', 'Tests de cohérence UPDATE', 'consistency');
    
    const results = { passed: 0, failed: 0, details: [] };
    const tests = [
      this.testUpdateIntegrity,
      this.testUpdateTimestampConsistency,
      this.testUpdateConstraintConsistency,
      this.testUpdateDataConsistency,
      this.testUpdateConcurrencyConsistency,
      this.testUpdatePartialConsistency
    ];

    for (const test of tests) {
      try {
        await test();
        results.passed++;
        DataConsistencyTestUtils.log('CONS-UPDATE', `${test.name} - RÉUSSI`, 'success');
      } catch (error) {
        results.failed++;
        results.details.push({ test: test.name, error: error.message });
        DataConsistencyTestUtils.log('CONS-UPDATE', `${test.name} - ÉCHEC: ${error.message}`, 'error');
      }
    }

    return results;
  }

  static async testUpdateIntegrity() {
    // Créer une chambre de test
    const roomData = DataConsistencyTestUtils.generateTestRoom('-update-integrity');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création: ${createError.message}`);

    try {
      const updateData = {
        prix: 150.00,
        statut: 'maintenance',
        description: 'Chambre mise à jour',
        amenities: ['WiFi Premium', 'TV 4K', 'Spa']
      };

      const { data: updated, error: updateError } = await supabase
        .from('rooms')
        .update(updateData)
        .eq('id', created.id)
        .select()
        .single();

      if (updateError) throw new Error(`Erreur update: ${updateError.message}`);

      // Vérifier l'intégrité après mise à jour
      const integrity = await DataConsistencyTestUtils.validateRoomIntegrity(updated.id, {
        id: created.id,
        numero: created.numero, // Ne doit pas changer
        hotel_id: created.hotel_id, // Ne doit pas changer
        prix: updateData.prix,
        statut: updateData.statut,
        description: updateData.description
      });

      if (!integrity.valid) {
        throw new Error(`Intégrité update échouée: ${integrity.issues.join(', ')}`);
      }

      // Vérifier que created_at n'a pas changé
      if (updated.created_at !== created.created_at) {
        throw new Error('created_at modifié lors de l\'update');
      }

      // Vérifier que updated_at a été mis à jour
      if (new Date(updated.updated_at) <= new Date(created.updated_at)) {
        throw new Error('updated_at non mis à jour');
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testUpdateTimestampConsistency() {
    const roomData = DataConsistencyTestUtils.generateTestRoom('-timestamp-consistency');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création: ${createError.message}`);

    try {
      const originalCreatedAt = created.created_at;
      const originalUpdatedAt = created.updated_at;

      // Attendre un peu pour assurer une différence de timestamp
      await DataConsistencyTestUtils.delay(1000);

      const { data: updated, error: updateError } = await supabase
        .from('rooms')
        .update({ description: 'Timestamp test' })
        .eq('id', created.id)
        .select()
        .single();

      if (updateError) throw new Error(`Erreur update: ${updateError.message}`);

      // Vérifications des timestamps
      if (updated.created_at !== originalCreatedAt) {
        throw new Error('created_at ne doit pas changer lors d\'un update');
      }

      if (new Date(updated.updated_at) <= new Date(originalUpdatedAt)) {
        throw new Error('updated_at non actualisé');
      }

      const timeDiff = new Date(updated.updated_at) - new Date(originalUpdatedAt);
      if (timeDiff < 900) { // Au moins 900ms de différence
        throw new Error(`Différence de timestamp insuffisante: ${timeDiff}ms`);
      }

      // Nouvelle mise à jour pour tester la cohérence continue
      await DataConsistencyTestUtils.delay(500);

      const { data: updated2, error: updateError2 } = await supabase
        .from('rooms')
        .update({ notes: 'Second update' })
        .eq('id', created.id)
        .select()
        .single();

      if (updateError2) throw new Error(`Erreur second update: ${updateError2.message}`);

      if (new Date(updated2.updated_at) <= new Date(updated.updated_at)) {
        throw new Error('updated_at non actualisé au second update');
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testUpdateConstraintConsistency() {
    // Créer deux chambres pour tester les contraintes
    const room1Data = DataConsistencyTestUtils.generateTestRoom('-constraint1');
    const room2Data = DataConsistencyTestUtils.generateTestRoom('-constraint2');

    const { data: room1, error: error1 } = await supabase
      .from('rooms')
      .insert(room1Data)
      .select()
      .single();

    const { data: room2, error: error2 } = await supabase
      .from('rooms')
      .insert(room2Data)
      .select()
      .single();

    if (error1 || error2) throw new Error('Erreur création chambres test');

    try {
      // Tentative de violer la contrainte d'unicité
      const { error: constraintError } = await supabase
        .from('rooms')
        .update({ numero: room1.numero })
        .eq('id', room2.id);

      if (!constraintError) {
        throw new Error('Violation contrainte unicité non détectée');
      }

      // Vérifier que les deux chambres sont intactes
      const integrity1 = await DataConsistencyTestUtils.validateRoomIntegrity(room1.id);
      const integrity2 = await DataConsistencyTestUtils.validateRoomIntegrity(room2.id);

      if (!integrity1.valid) {
        throw new Error(`Room1 corrompue: ${integrity1.issues.join(', ')}`);
      }

      if (!integrity2.valid) {
        throw new Error(`Room2 corrompue: ${integrity2.issues.join(', ')}`);
      }

      // Vérifier que room2 n'a pas été modifiée
      if (integrity2.room.numero === room1.numero) {
        throw new Error('Contrainte unicité violée');
      }
    } finally {
      await supabase.from('rooms').delete().in('id', [room1.id, room2.id]);
    }
  }

  static async testUpdateDataConsistency() {
    const roomData = DataConsistencyTestUtils.generateTestRoom('-data-consistency');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création: ${createError.message}`);

    try {
      // Update avec données complexes
      const complexUpdate = {
        amenities: [
          'WiFi Ultra',
          { type: 'TV', model: 'OLED 65"', features: ['4K', 'HDR', 'Smart'] },
          { type: 'Spa', equipment: ['Jacuzzi', 'Sauna'] }
        ],
        images: [
          { 
            url: 'updated1.jpg', 
            alt: 'Vue mise à jour',
            metadata: { 
              lastModified: new Date().toISOString(),
              editor: 'auto-update-test' 
            }
          }
        ],
        prix: 199.99
      };

      const { data: updated, error: updateError } = await supabase
        .from('rooms')
        .update(complexUpdate)
        .eq('id', created.id)
        .select()
        .single();

      if (updateError) throw new Error(`Erreur update complexe: ${updateError.message}`);

      // Vérifier la préservation des données complexes
      if (!Array.isArray(updated.amenities) || updated.amenities.length !== 3) {
        throw new Error('Amenities complexes non préservées');
      }

      const tvAmenity = updated.amenities.find(a => typeof a === 'object' && a.type === 'TV');
      if (!tvAmenity || !tvAmenity.features || tvAmenity.features.length !== 3) {
        throw new Error('Objet TV complexe corrompu');
      }

      if (!Array.isArray(updated.images) || updated.images.length !== 1) {
        throw new Error('Images non préservées');
      }

      const image = updated.images[0];
      if (!image.metadata || !image.metadata.lastModified) {
        throw new Error('Métadonnées image non préservées');
      }

      // Test de sérialisation/désérialisation
      const serialized = JSON.stringify(updated);
      const deserialized = JSON.parse(serialized);
      
      if (deserialized.amenities[1].features.length !== 3) {
        throw new Error('Sérialisation/désérialisation corrompue');
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testUpdateConcurrencyConsistency() {
    const roomData = DataConsistencyTestUtils.generateTestRoom('-concurrency');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création: ${createError.message}`);

    try {
      // Simuler des updates concurrents
      const updates = [
        { prix: 100, description: 'Update 1' },
        { prix: 150, description: 'Update 2' },
        { prix: 200, description: 'Update 3' }
      ];

      const updatePromises = updates.map(updateData => 
        supabase
          .from('rooms')
          .update(updateData)
          .eq('id', created.id)
          .select()
          .single()
      );

      const results = await Promise.all(updatePromises);

      // Vérifier qu'au moins un update a réussi
      const successfulUpdates = results.filter(result => !result.error);
      if (successfulUpdates.length === 0) {
        throw new Error('Tous les updates concurrents ont échoué');
      }

      // Vérifier l'état final
      const { data: finalState, error: finalError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', created.id)
        .single();

      if (finalError) throw new Error(`Erreur lecture état final: ${finalError.message}`);

      // Vérifier l'intégrité finale
      const integrity = await DataConsistencyTestUtils.validateRoomIntegrity(finalState.id);
      if (!integrity.valid) {
        throw new Error(`Intégrité finale échouée: ${integrity.issues.join(', ')}`);
      }

      // Vérifier que l'état final correspond à un des updates
      const finalPrice = finalState.prix;
      const validPrices = updates.map(u => u.prix);
      if (!validPrices.includes(finalPrice)) {
        throw new Error(`Prix final incohérent: ${finalPrice}`);
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testUpdatePartialConsistency() {
    const roomData = DataConsistencyTestUtils.generateTestRoom('-partial');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création: ${createError.message}`);

    try {
      // Update partiel - seulement quelques champs
      const partialUpdate = {
        prix: 175.50,
        notes: 'Mise à jour partielle'
      };

      const { data: updated, error: updateError } = await supabase
        .from('rooms')
        .update(partialUpdate)
        .eq('id', created.id)
        .select()
        .single();

      if (updateError) throw new Error(`Erreur update partiel: ${updateError.message}`);

      // Vérifier que seuls les champs spécifiés ont changé
      if (updated.prix !== partialUpdate.prix) {
        throw new Error('Prix non mis à jour');
      }

      if (updated.notes !== partialUpdate.notes) {
        throw new Error('Notes non mises à jour');
      }

      // Vérifier que les autres champs sont préservés
      if (updated.numero !== created.numero) {
        throw new Error('Numero modifié lors d\'update partiel');
      }

      if (updated.type !== created.type) {
        throw new Error('Type modifié lors d\'update partiel');
      }

      if (updated.statut !== created.statut) {
        throw new Error('Statut modifié lors d\'update partiel');
      }

      // Vérifier que les données complexes sont préservées
      if (JSON.stringify(updated.amenities) !== JSON.stringify(created.amenities)) {
        throw new Error('Amenities modifiées lors d\'update partiel');
      }

      if (JSON.stringify(updated.images) !== JSON.stringify(created.images)) {
        throw new Error('Images modifiées lors d\'update partiel');
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }
}

/**
 * RUNNER PRINCIPAL POUR LES TESTS DE COHÉRENCE
 */
class DataConsistencyTestRunner {
  static async runAllConsistencyTests() {
    console.log('\n🔗 DÉBUT DES TESTS DE COHÉRENCE DES DONNÉES - API ROOMS');
    console.log('======================================================');
    
    const startTime = Date.now();
    const results = {
      create: null,
      update: null,
      summary: {
        totalPassed: 0,
        totalFailed: 0,
        duration: 0,
        consistencyMetrics: {}
      }
    };

    try {
      // Tests de cohérence CREATE
      results.create = await CreateConsistencyTests.runAll();
      
      // Tests de cohérence UPDATE
      results.update = await UpdateConsistencyTests.runAll();

      // Calcul du résumé
      const endTime = Date.now();
      results.summary.duration = endTime - startTime;
      results.summary.totalPassed = results.create.passed + results.update.passed;
      results.summary.totalFailed = results.create.failed + results.update.failed;

      // Validation finale de la cohérence globale
      results.summary.consistencyMetrics = await this.validateGlobalConsistency();

    } catch (error) {
      DataConsistencyTestUtils.log('CONS-RUNNER', `Erreur fatale: ${error.message}`, 'error');
      results.summary.fatalError = error.message;
    }

    this.displayConsistencyResults(results);
    return results;
  }

  static async validateGlobalConsistency() {
    try {
      const hotelConsistency = await DataConsistencyTestUtils.validateHotelRoomsConsistency(TEST_CONFIG.testHotelId);
      
      return {
        hotelConsistency: hotelConsistency.valid,
        hotelIssues: hotelConsistency.issues,
        roomCount: hotelConsistency.roomCount
      };
    } catch (error) {
      return {
        hotelConsistency: false,
        error: error.message
      };
    }
  }

  static displayConsistencyResults(results) {
    console.log('\n📊 RÉSULTATS DES TESTS DE COHÉRENCE');
    console.log('====================================');
    
    const operations = ['create', 'update'];
    const operationNames = ['CREATE-CONS', 'UPDATE-CONS'];
    
    operations.forEach((op, index) => {
      if (results[op]) {
        const { passed, failed } = results[op];
        const total = passed + failed;
        const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
        console.log(`${operationNames[index].padEnd(12)} ${passed}/${total} (${rate}%) 🔗`);
        
        if (failed > 0 && results[op].details) {
          results[op].details.forEach(detail => {
            console.log(`  ❌ ${detail.test}: ${detail.error}`);
          });
        }
      }
    });

    console.log('\n📈 MÉTRIQUES DE COHÉRENCE GLOBALES');
    const metrics = results.summary.consistencyMetrics;
    if (metrics) {
      console.log(`Cohérence hôtel: ${metrics.hotelConsistency ? '✅' : '❌'}`);
      if (metrics.roomCount !== undefined) {
        console.log(`Nombre de chambres: ${metrics.roomCount}`);
      }
      if (metrics.hotelIssues && metrics.hotelIssues.length > 0) {
        console.log(`Problèmes détectés: ${metrics.hotelIssues.join(', ')}`);
      }
      if (metrics.error) {
        console.log(`Erreur validation globale: ${metrics.error}`);
      }
    }

    console.log(`\nDurée totale des tests: ${results.summary.duration}ms`);
    console.log(`Tests réussis: ${results.summary.totalPassed}`);
    console.log(`Tests échoués: ${results.summary.totalFailed}`);
    console.log(`Taux de cohérence: ${(results.summary.totalPassed / (results.summary.totalPassed + results.summary.totalFailed) * 100).toFixed(1)}%`);

    if (results.summary.fatalError) {
      console.log(`🚨 ERREUR FATALE: ${results.summary.fatalError}`);
    }

    console.log('\n🔗 TESTS DE COHÉRENCE TERMINÉS');
  }
}

// Lancement des tests si exécuté directement
if (require.main === module) {
  DataConsistencyTestRunner.runAllConsistencyTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = {
  DataConsistencyTestRunner,
  CreateConsistencyTests,
  UpdateConsistencyTests,
  DataConsistencyTestUtils
};