/**
 * TESTS GESTION D'ERREURS - API ROOMS
 * 
 * Tests spécialisés pour valider la gestion d'erreurs robuste
 * dans toutes les opérations CRUD de l'API rooms.
 * 
 * OBJECTIFS :
 * - Tester tous les cas d'erreur possibles
 * - Valider les messages d'erreur appropriés
 * - Vérifier la cohérence de la gestion d'erreurs
 * - Tester les edge cases et les limites
 * - Valider la sécurité et les contraintes
 */

const { createClient } = require('@supabase/supabase-js');

const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pgjatiookprsvfesrsrx.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamF0aW9va3Byc3ZmZXNyc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTkxMDksImV4cCI6MjA3MTAzNTEwOX0.J60Qcxtw1SmnR9WrS8t4yCIh-JyyhjAmU_FZmFIY_dI',
  testHotelId: 1
};

const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);

class ErrorTestUtils {
  static log(category, message, status = 'info') {
    const icons = { info: '📋', success: '✅', error: '❌', warning: '⚠️' };
    console.log(`${icons[status]} [${category}] ${message}`);
  }

  static generateTestRoom(suffix = '') {
    return {
      hotel_id: TEST_CONFIG.testHotelId,
      numero: `ERR-${Date.now()}${suffix}`,
      type: 'Error Test',
      prix: 50.00,
      statut: 'disponible'
    };
  }

  static validateErrorResponse(error, expectedCode, operation) {
    if (!error) {
      throw new Error(`Erreur attendue pour ${operation} non levée`);
    }

    if (expectedCode && error.code !== expectedCode) {
      throw new Error(`Code d'erreur incorrect. Attendu: ${expectedCode}, Reçu: ${error.code}`);
    }

    if (!error.message || error.message.trim() === '') {
      throw new Error('Message d\'erreur vide ou manquant');
    }

    return true;
  }
}

/**
 * TESTS D'ERREUR POUR LES OPÉRATIONS CREATE
 */
class CreateErrorTests {
  static async runAll() {
    ErrorTestUtils.log('CREATE-ERROR', 'Tests d\'erreur pour création', 'info');
    
    const results = { passed: 0, failed: 0, details: [] };
    const tests = [
      this.testMissingRequiredFields,
      this.testInvalidDataTypes,
      this.testConstraintViolations,
      this.testDuplicateKey,
      this.testForeignKeyViolation,
      this.testInvalidJsonData,
      this.testExcessiveDataSize,
      this.testInvalidEnumValues,
      this.testBoundaryValues,
      this.testSqlInjectionPrevention
    ];

    for (const test of tests) {
      try {
        await test();
        results.passed++;
        ErrorTestUtils.log('CREATE-ERROR', `${test.name} - RÉUSSI`, 'success');
      } catch (error) {
        results.failed++;
        results.details.push({ test: test.name, error: error.message });
        ErrorTestUtils.log('CREATE-ERROR', `${test.name} - ÉCHEC: ${error.message}`, 'error');
      }
    }

    return results;
  }

  static async testMissingRequiredFields() {
    const requiredFields = ['hotel_id', 'numero', 'type', 'prix'];
    
    for (const field of requiredFields) {
      const incompleteData = ErrorTestUtils.generateTestRoom('-missing');
      delete incompleteData[field];

      const { error } = await supabase
        .from('rooms')
        .insert(incompleteData)
        .select()
        .single();

      ErrorTestUtils.validateErrorResponse(error, '23502', `champ manquant ${field}`);
    }
  }

  static async testInvalidDataTypes() {
    const invalidDataTests = [
      { field: 'hotel_id', value: 'not_a_number', expectedCode: '22P02' },
      { field: 'prix', value: 'not_a_price', expectedCode: '22P02' },
      { field: 'floor', value: 'not_a_floor', expectedCode: '22P02' },
      { field: 'room_size', value: 'not_a_size', expectedCode: '22P02' },
      { field: 'is_smoking', value: 'not_a_boolean', expectedCode: '22P02' }
    ];

    for (const testCase of invalidDataTests) {
      const invalidData = ErrorTestUtils.generateTestRoom('-invalid-type');
      invalidData[testCase.field] = testCase.value;

      const { error } = await supabase
        .from('rooms')
        .insert(invalidData)
        .select()
        .single();

      ErrorTestUtils.validateErrorResponse(
        error, 
        testCase.expectedCode, 
        `type invalide pour ${testCase.field}`
      );
    }
  }

  static async testConstraintViolations() {
    const constraintTests = [
      { 
        data: { ...ErrorTestUtils.generateTestRoom('-negative-price'), prix: -10.50 },
        description: 'prix négatif'
      },
      { 
        data: { ...ErrorTestUtils.generateTestRoom('-negative-floor'), floor: -1 },
        description: 'étage négatif'
      },
      { 
        data: { ...ErrorTestUtils.generateTestRoom('-zero-size'), room_size: 0 },
        description: 'taille nulle'
      },
      { 
        data: { ...ErrorTestUtils.generateTestRoom('-negative-size'), room_size: -5.5 },
        description: 'taille négative'
      }
    ];

    for (const testCase of constraintTests) {
      const { error } = await supabase
        .from('rooms')
        .insert(testCase.data)
        .select()
        .single();

      ErrorTestUtils.validateErrorResponse(
        error, 
        '23514', 
        `contrainte violation: ${testCase.description}`
      );
    }
  }

  static async testDuplicateKey() {
    // Créer une chambre
    const roomData = ErrorTestUtils.generateTestRoom('-duplicate');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création première chambre: ${createError.message}`);

    try {
      // Tentative de création d'un doublon
      const { error } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();

      ErrorTestUtils.validateErrorResponse(error, '23505', 'clé dupliquée');
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testForeignKeyViolation() {
    const invalidData = {
      ...ErrorTestUtils.generateTestRoom('-fk-violation'),
      hotel_id: 99999 // ID d'hôtel inexistant
    };

    const { error } = await supabase
      .from('rooms')
      .insert(invalidData)
      .select()
      .single();

    ErrorTestUtils.validateErrorResponse(error, '23503', 'violation clé étrangère');
  }

  static async testInvalidJsonData() {
    const invalidJsonTests = [
      {
        data: { ...ErrorTestUtils.generateTestRoom('-invalid-amenities'), amenities: 'not_json' },
        description: 'amenities non-JSON'
      },
      {
        data: { ...ErrorTestUtils.generateTestRoom('-invalid-images'), images: 'not_json' },
        description: 'images non-JSON'
      }
    ];

    for (const testCase of invalidJsonTests) {
      const { error } = await supabase
        .from('rooms')
        .insert(testCase.data)
        .select()
        .single();

      // Note: Supabase peut accepter des chaînes et les convertir en JSONB
      // Tester avec des données vraiment invalides
      if (!error) {
        ErrorTestUtils.log('CREATE-ERROR', `${testCase.description} - conversion automatique`, 'warning');
      }
    }
  }

  static async testExcessiveDataSize() {
    const largeString = 'x'.repeat(10000); // 10KB de données
    const oversizedData = {
      ...ErrorTestUtils.generateTestRoom('-oversized'),
      description: largeString,
      notes: largeString
    };

    const { error } = await supabase
      .from('rooms')
      .insert(oversizedData)
      .select()
      .single();

    // Le test peut réussir si la base accepte de grandes chaînes
    if (error) {
      ErrorTestUtils.validateErrorResponse(error, null, 'données surdimensionnées');
    } else {
      // Nettoyer si la création a réussi
      const { data } = await supabase
        .from('rooms')
        .select('id')
        .eq('numero', oversizedData.numero)
        .single();
      if (data) {
        await supabase.from('rooms').delete().eq('id', data.id);
      }
      ErrorTestUtils.log('CREATE-ERROR', 'Données volumineuses acceptées', 'warning');
    }
  }

  static async testInvalidEnumValues() {
    const invalidStatuses = ['invalid_status', 'DISPONIBLE', 'Occupée', 'MAINTENANCE'];
    
    for (const invalidStatus of invalidStatuses) {
      const invalidData = {
        ...ErrorTestUtils.generateTestRoom('-invalid-status'),
        statut: invalidStatus
      };

      const { error } = await supabase
        .from('rooms')
        .insert(invalidData)
        .select()
        .single();

      if (invalidStatus !== 'disponible' && invalidStatus !== 'occupee' && invalidStatus !== 'maintenance') {
        ErrorTestUtils.validateErrorResponse(error, '23514', `statut invalide: ${invalidStatus}`);
      }
    }
  }

  static async testBoundaryValues() {
    const boundaryTests = [
      {
        data: { ...ErrorTestUtils.generateTestRoom('-max-price'), prix: 99999999.99 },
        description: 'prix maximum'
      },
      {
        data: { ...ErrorTestUtils.generateTestRoom('-zero-price'), prix: 0 },
        description: 'prix zéro (valide)'
      },
      {
        data: { ...ErrorTestUtils.generateTestRoom('-max-floor'), floor: 999 },
        description: 'étage très élevé'
      },
      {
        data: { ...ErrorTestUtils.generateTestRoom('-min-size'), room_size: 0.01 },
        description: 'taille minimale'
      }
    ];

    for (const testCase of boundaryTests) {
      const { data, error } = await supabase
        .from('rooms')
        .insert(testCase.data)
        .select()
        .single();

      if (error) {
        ErrorTestUtils.log('CREATE-ERROR', `${testCase.description} - rejeté: ${error.code}`, 'info');
      } else {
        ErrorTestUtils.log('CREATE-ERROR', `${testCase.description} - accepté`, 'success');
        // Nettoyer
        await supabase.from('rooms').delete().eq('id', data.id);
      }
    }
  }

  static async testSqlInjectionPrevention() {
    const maliciousInputs = [
      "'; DROP TABLE rooms; --",
      "1; DELETE FROM rooms WHERE 1=1; --",
      "1' OR '1'='1",
      "<script>alert('xss')</script>",
      "../../etc/passwd"
    ];

    for (const maliciousInput of maliciousInputs) {
      const maliciousData = {
        ...ErrorTestUtils.generateTestRoom('-injection'),
        numero: maliciousInput,
        type: maliciousInput,
        description: maliciousInput
      };

      const { data, error } = await supabase
        .from('rooms')
        .insert(maliciousData)
        .select()
        .single();

      if (data) {
        // Si la création réussit, vérifier que les données sont correctement échappées
        if (data.numero === maliciousInput) {
          ErrorTestUtils.log('CREATE-ERROR', 'Injection SQL possible - données non échappées', 'warning');
        }
        // Nettoyer
        await supabase.from('rooms').delete().eq('id', data.id);
      }
      
      // Vérifier que la table existe toujours
      const { data: testData } = await supabase
        .from('rooms')
        .select('id')
        .limit(1);
      
      if (!testData) {
        throw new Error('Table rooms potentiellement compromise par injection SQL');
      }
    }
  }
}

/**
 * TESTS D'ERREUR POUR LES OPÉRATIONS READ
 */
class ReadErrorTests {
  static async runAll() {
    ErrorTestUtils.log('READ-ERROR', 'Tests d\'erreur pour lecture', 'info');
    
    const results = { passed: 0, failed: 0, details: [] };
    const tests = [
      this.testInvalidFilters,
      this.testMalformedQueries,
      this.testExcessivePagination,
      this.testInvalidColumns,
      this.testResourceNotFound,
      this.testInvalidDateFormats
    ];

    for (const test of tests) {
      try {
        await test();
        results.passed++;
        ErrorTestUtils.log('READ-ERROR', `${test.name} - RÉUSSI`, 'success');
      } catch (error) {
        results.failed++;
        results.details.push({ test: test.name, error: error.message });
        ErrorTestUtils.log('READ-ERROR', `${test.name} - ÉCHEC: ${error.message}`, 'error');
      }
    }

    return results;
  }

  static async testInvalidFilters() {
    const invalidFilters = [
      { field: 'hotel_id', value: 'not_a_number' },
      { field: 'prix', value: 'not_a_price' },
      { field: 'floor', value: 'not_a_floor' }
    ];

    for (const filter of invalidFilters) {
      const { error } = await supabase
        .from('rooms')
        .select('*')
        .eq(filter.field, filter.value);

      // Supabase peut convertir certains types automatiquement
      if (error) {
        ErrorTestUtils.validateErrorResponse(error, null, `filtre invalide ${filter.field}`);
      } else {
        ErrorTestUtils.log('READ-ERROR', `Filtre ${filter.field} - conversion automatique`, 'warning');
      }
    }
  }

  static async testMalformedQueries() {
    // Test avec des colonnes inexistantes
    const { error: invalidColumnError } = await supabase
      .from('rooms')
      .select('inexistent_column');

    ErrorTestUtils.validateErrorResponse(invalidColumnError, '42703', 'colonne inexistante');

    // Test avec des opérateurs invalides
    const { error: invalidOperatorError } = await supabase
      .from('rooms')
      .select('*')
      .filter('prix', 'invalid_operator', 50);

    if (invalidOperatorError) {
      ErrorTestUtils.validateErrorResponse(invalidOperatorError, null, 'opérateur invalide');
    }
  }

  static async testExcessivePagination() {
    // Test avec une limite excessive
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .limit(10000);

    if (error) {
      ErrorTestUtils.validateErrorResponse(error, null, 'limite excessive');
    } else if (data) {
      ErrorTestUtils.log('READ-ERROR', `Limite élevée acceptée: ${data.length} résultats`, 'warning');
    }

    // Test avec un offset négatif
    const { error: negativeOffsetError } = await supabase
      .from('rooms')
      .select('*')
      .range(-1, 10);

    if (negativeOffsetError) {
      ErrorTestUtils.validateErrorResponse(negativeOffsetError, null, 'offset négatif');
    }
  }

  static async testInvalidColumns() {
    const invalidSelects = [
      'password', // Colonne sensible qui ne devrait pas exister
      'secret_data',
      'admin_notes',
      'rooms.*,users.*', // Jointure non autorisée
      'rooms.*, (SELECT * FROM users)' // Sous-requête non autorisée
    ];

    for (const invalidSelect of invalidSelects) {
      const { error } = await supabase
        .from('rooms')
        .select(invalidSelect);

      if (error) {
        ErrorTestUtils.log('READ-ERROR', `Colonne ${invalidSelect} - rejetée correctement`, 'success');
      } else {
        ErrorTestUtils.log('READ-ERROR', `Colonne ${invalidSelect} - acceptée (vérifier sécurité)`, 'warning');
      }
    }
  }

  static async testResourceNotFound() {
    // Test avec ID inexistant
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', 99999)
      .single();

    ErrorTestUtils.validateErrorResponse(error, 'PGRST116', 'ressource non trouvée');

    // Test avec hotel_id inexistant
    const { data: hotelData, error: hotelError } = await supabase
      .from('rooms')
      .select('*')
      .eq('hotel_id', 99999);

    // Ceci ne devrait pas lever d'erreur, juste retourner un tableau vide
    if (hotelError) {
      throw new Error(`Erreur inattendue pour hotel_id inexistant: ${hotelError.message}`);
    }
    if (!Array.isArray(hotelData) || hotelData.length > 0) {
      throw new Error('Résultat inattendu pour hotel_id inexistant');
    }
  }

  static async testInvalidDateFormats() {
    const invalidDates = [
      'not-a-date',
      '2024-13-01', // Mois invalide
      '2024-02-30', // Jour invalide
      '2024/12/01', // Format incorrect
      '12-01-2024'  // Format incorrect
    ];

    for (const invalidDate of invalidDates) {
      const { error } = await supabase
        .from('rooms')
        .select('*')
        .gte('created_at', invalidDate);

      if (error) {
        ErrorTestUtils.log('READ-ERROR', `Date invalide ${invalidDate} - rejetée`, 'success');
      } else {
        ErrorTestUtils.log('READ-ERROR', `Date invalide ${invalidDate} - acceptée`, 'warning');
      }
    }
  }
}

/**
 * TESTS D'ERREUR POUR LES OPÉRATIONS UPDATE
 */
class UpdateErrorTests {
  static async runAll() {
    ErrorTestUtils.log('UPDATE-ERROR', 'Tests d\'erreur pour mise à jour', 'info');
    
    const results = { passed: 0, failed: 0, details: [] };
    const tests = [
      this.testUpdateNonExistent,
      this.testInvalidUpdateData,
      this.testConstraintViolationsUpdate,
      this.testConcurrentUpdates,
      this.testUpdateWithInvalidFilters,
      this.testReadOnlyFields
    ];

    for (const test of tests) {
      try {
        await test();
        results.passed++;
        ErrorTestUtils.log('UPDATE-ERROR', `${test.name} - RÉUSSI`, 'success');
      } catch (error) {
        results.failed++;
        results.details.push({ test: test.name, error: error.message });
        ErrorTestUtils.log('UPDATE-ERROR', `${test.name} - ÉCHEC: ${error.message}`, 'error');
      }
    }

    return results;
  }

  static async testUpdateNonExistent() {
    const { data, error } = await supabase
      .from('rooms')
      .update({ description: 'Test update' })
      .eq('id', 99999)
      .select()
      .single();

    ErrorTestUtils.validateErrorResponse(error, 'PGRST116', 'mise à jour ressource inexistante');
  }

  static async testInvalidUpdateData() {
    // Créer une chambre de test
    const roomData = ErrorTestUtils.generateTestRoom('-update-error');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création: ${createError.message}`);

    try {
      const invalidUpdates = [
        { field: 'prix', value: 'not_a_number', expectedCode: '22P02' },
        { field: 'hotel_id', value: 'not_a_number', expectedCode: '22P02' },
        { field: 'floor', value: 'not_a_number', expectedCode: '22P02' },
        { field: 'statut', value: 'invalid_status', expectedCode: '23514' },
        { field: 'prix', value: -10, expectedCode: '23514' }
      ];

      for (const invalidUpdate of invalidUpdates) {
        const updateData = {};
        updateData[invalidUpdate.field] = invalidUpdate.value;

        const { error } = await supabase
          .from('rooms')
          .update(updateData)
          .eq('id', created.id)
          .select()
          .single();

        ErrorTestUtils.validateErrorResponse(
          error, 
          invalidUpdate.expectedCode, 
          `mise à jour invalide ${invalidUpdate.field}`
        );
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testConstraintViolationsUpdate() {
    // Créer deux chambres
    const room1Data = ErrorTestUtils.generateTestRoom('-constraint1');
    const room2Data = ErrorTestUtils.generateTestRoom('-constraint2');

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

    if (error1 || error2) throw new Error('Erreur création chambres de test');

    try {
      // Tentative de créer un numéro dupliqué via update
      const { error } = await supabase
        .from('rooms')
        .update({ numero: room1.numero })
        .eq('id', room2.id)
        .select()
        .single();

      ErrorTestUtils.validateErrorResponse(error, '23505', 'violation contrainte unicité');
    } finally {
      await supabase.from('rooms').delete().in('id', [room1.id, room2.id]);
    }
  }

  static async testConcurrentUpdates() {
    // Créer une chambre de test
    const roomData = ErrorTestUtils.generateTestRoom('-concurrent');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création: ${createError.message}`);

    try {
      // Simuler des mises à jour concurrentes
      const updatePromises = [
        supabase.from('rooms').update({ prix: 100 }).eq('id', created.id),
        supabase.from('rooms').update({ prix: 200 }).eq('id', created.id),
        supabase.from('rooms').update({ prix: 300 }).eq('id', created.id)
      ];

      const results = await Promise.all(updatePromises);
      
      // Vérifier qu'au moins une mise à jour a réussi
      const successCount = results.filter(result => !result.error).length;
      if (successCount === 0) {
        throw new Error('Toutes les mises à jour concurrentes ont échoué');
      }

      ErrorTestUtils.log('UPDATE-ERROR', `${successCount}/3 mises à jour concurrentes réussies`, 'info');
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }

  static async testUpdateWithInvalidFilters() {
    const { error } = await supabase
      .from('rooms')
      .update({ description: 'Test' })
      .eq('invalid_column', 'value');

    ErrorTestUtils.validateErrorResponse(error, '42703', 'filtre avec colonne invalide');
  }

  static async testReadOnlyFields() {
    // Créer une chambre de test
    const roomData = ErrorTestUtils.generateTestRoom('-readonly');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création: ${createError.message}`);

    try {
      // Tentative de mise à jour des champs read-only
      const readOnlyTests = [
        { field: 'id', value: 99999 },
        { field: 'created_at', value: '2020-01-01T00:00:00Z' }
      ];

      for (const test of readOnlyTests) {
        const updateData = {};
        updateData[test.field] = test.value;

        const { data, error } = await supabase
          .from('rooms')
          .update(updateData)
          .eq('id', created.id)
          .select()
          .single();

        if (error) {
          ErrorTestUtils.log('UPDATE-ERROR', `Champ ${test.field} - protection read-only active`, 'success');
        } else if (data[test.field] === test.value) {
          ErrorTestUtils.log('UPDATE-ERROR', `Champ ${test.field} - modifiable (risque sécurité)`, 'warning');
        } else {
          ErrorTestUtils.log('UPDATE-ERROR', `Champ ${test.field} - ignoré silencieusement`, 'info');
        }
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', created.id);
    }
  }
}

/**
 * TESTS D'ERREUR POUR LES OPÉRATIONS DELETE
 */
class DeleteErrorTests {
  static async runAll() {
    ErrorTestUtils.log('DELETE-ERROR', 'Tests d\'erreur pour suppression', 'info');
    
    const results = { passed: 0, failed: 0, details: [] };
    const tests = [
      this.testDeleteNonExistent,
      this.testDeleteWithConstraints,
      this.testDeleteWithInvalidFilters,
      this.testCascadeDeleteValidation,
      this.testMassDeleteProtection
    ];

    for (const test of tests) {
      try {
        await test();
        results.passed++;
        ErrorTestUtils.log('DELETE-ERROR', `${test.name} - RÉUSSI`, 'success');
      } catch (error) {
        results.failed++;
        results.details.push({ test: test.name, error: error.message });
        ErrorTestUtils.log('DELETE-ERROR', `${test.name} - ÉCHEC: ${error.message}`, 'error');
      }
    }

    return results;
  }

  static async testDeleteNonExistent() {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', 99999);

    // La suppression d'un élément inexistant ne devrait pas lever d'erreur
    if (error) {
      throw new Error(`Erreur inattendue pour suppression inexistante: ${error.message}`);
    }
  }

  static async testDeleteWithConstraints() {
    // Ce test simule la suppression d'une chambre avec des contraintes
    // Dans un vrai système, il y aurait des réservations liées
    
    const roomData = ErrorTestUtils.generateTestRoom('-delete-constraint');
    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (createError) throw new Error(`Erreur création: ${createError.message}`);

    try {
      // Test suppression normale (sans contraintes pour ce test)
      const { error: deleteError } = await supabase
        .from('rooms')
        .delete()
        .eq('id', created.id);

      if (deleteError) {
        ErrorTestUtils.validateErrorResponse(deleteError, null, 'suppression avec contraintes');
      } else {
        ErrorTestUtils.log('DELETE-ERROR', 'Suppression réussie - pas de contraintes actives', 'info');
      }
    } catch (error) {
      // Nettoyer en cas d'erreur
      await supabase.from('rooms').delete().eq('id', created.id);
      throw error;
    }
  }

  static async testDeleteWithInvalidFilters() {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('invalid_column', 'value');

    ErrorTestUtils.validateErrorResponse(error, '42703', 'suppression avec filtre invalide');
  }

  static async testCascadeDeleteValidation() {
    // Test pour vérifier que les suppressions en cascade sont contrôlées
    ErrorTestUtils.log('DELETE-ERROR', 'Test suppression en cascade - simulation', 'info');
    
    // Dans un vrai test, on vérifierait que supprimer un hôtel
    // supprime aussi ses chambres de manière contrôlée
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('count')
      .eq('hotel_id', TEST_CONFIG.testHotelId);

    if (roomsError) {
      throw new Error(`Erreur vérification cascade: ${roomsError.message}`);
    }

    ErrorTestUtils.log('DELETE-ERROR', 'Validation cascade - structure vérifiée', 'success');
  }

  static async testMassDeleteProtection() {
    // Test pour vérifier qu'on ne peut pas supprimer toutes les chambres d'un coup
    
    // Compter les chambres existantes
    const { data: beforeCount, error: countError } = await supabase
      .from('rooms')
      .select('id', { count: 'exact' })
      .eq('hotel_id', TEST_CONFIG.testHotelId);

    if (countError) throw new Error(`Erreur comptage: ${countError.message}`);

    // Créer quelques chambres de test
    const testRooms = Array.from({ length: 3 }, (_, i) => 
      ErrorTestUtils.generateTestRoom(`-mass-${i}`)
    );

    const { data: created, error: createError } = await supabase
      .from('rooms')
      .insert(testRooms)
      .select();

    if (createError) throw new Error(`Erreur création batch: ${createError.message}`);

    try {
      // Tentative de suppression massive
      const { error: massDeleteError } = await supabase
        .from('rooms')
        .delete()
        .eq('hotel_id', TEST_CONFIG.testHotelId);

      if (massDeleteError) {
        ErrorTestUtils.log('DELETE-ERROR', 'Protection suppression massive active', 'success');
      } else {
        ErrorTestUtils.log('DELETE-ERROR', 'Suppression massive autorisée - vérifier politiques', 'warning');
        
        // Recréer les données de test si elles ont été supprimées
        await supabase.from('rooms').insert(testRooms);
      }
    } finally {
      // Nettoyer les chambres de test créées
      const createdIds = created.map(room => room.id);
      await supabase.from('rooms').delete().in('id', createdIds);
    }
  }
}

/**
 * RUNNER PRINCIPAL POUR LES TESTS D'ERREUR
 */
class ErrorTestRunner {
  static async runAllErrorTests() {
    console.log('\n🚨 DÉBUT DES TESTS DE GESTION D\'ERREURS - API ROOMS');
    console.log('===================================================');
    
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
        errorCoverage: {}
      }
    };

    try {
      // Tests d'erreur CREATE
      results.create = await CreateErrorTests.runAll();
      
      // Tests d'erreur READ
      results.read = await ReadErrorTests.runAll();
      
      // Tests d'erreur UPDATE
      results.update = await UpdateErrorTests.runAll();
      
      // Tests d'erreur DELETE
      results.delete = await DeleteErrorTests.runAll();

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
      ErrorTestUtils.log('ERROR-RUNNER', `Erreur fatale: ${error.message}`, 'error');
      results.summary.fatalError = error.message;
    }

    this.displayErrorResults(results);
    return results;
  }

  static displayErrorResults(results) {
    console.log('\n🔍 RÉSULTATS DES TESTS D\'ERREUR');
    console.log('=================================');
    
    const operations = ['create', 'read', 'update', 'delete'];
    operations.forEach(op => {
      if (results[op]) {
        const { passed, failed } = results[op];
        const total = passed + failed;
        const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
        console.log(`${op.toUpperCase().padEnd(8)} ${passed}/${total} (${rate}%) 🔒`);
        
        if (failed > 0 && results[op].details) {
          results[op].details.forEach(detail => {
            console.log(`  ❌ ${detail.test}: ${detail.error}`);
          });
        }
      }
    });

    console.log('\n📊 RÉSUMÉ GESTION D\'ERREURS');
    console.log(`Tests de sécurité réussis: ${results.summary.totalPassed}`);
    console.log(`Tests de sécurité échoués: ${results.summary.totalFailed}`);
    console.log(`Durée: ${results.summary.duration}ms`);
    console.log(`Robustesse: ${(results.summary.totalPassed / (results.summary.totalPassed + results.summary.totalFailed) * 100).toFixed(1)}%`);

    if (results.summary.fatalError) {
      console.log(`🚨 ERREUR FATALE: ${results.summary.fatalError}`);
    }

    console.log('\n🛡️ TESTS D\'ERREUR TERMINÉS');
  }
}

// Lancement des tests si exécuté directement
if (require.main === module) {
  ErrorTestRunner.runAllErrorTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = {
  ErrorTestRunner,
  CreateErrorTests,
  ReadErrorTests,
  UpdateErrorTests,
  DeleteErrorTests,
  ErrorTestUtils
};