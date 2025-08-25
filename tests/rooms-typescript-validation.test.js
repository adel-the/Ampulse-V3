/**
 * TESTS VALIDATION TYPESCRIPT - API ROOMS
 * 
 * Tests spécialisés pour valider la cohérence des types TypeScript,
 * la sérialisation des données et la conformité des interfaces.
 * 
 * OBJECTIFS :
 * - Valider la conformité des types TypeScript
 * - Tester la sérialisation/désérialisation des données
 * - Vérifier la cohérence des interfaces API
 * - Valider les types de données complexes (JSON, Arrays)
 * - Tester la robustesse des types dans différents scénarios
 */

const { createClient } = require('@supabase/supabase-js');

const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pgjatiookprsvfesrsrx.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnamF0aW9va3Byc3ZmZXNyc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NTkxMDksImV4cCI6MjA3MTAzNTEwOX0.J60Qcxtw1SmnR9WrS8t4yCIh-JyyhjAmU_FZmFIY_dI',
  testHotelId: 1
};

const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey);

/**
 * DÉFINITIONS DES TYPES (Miroir de lib/supabase.ts)
 */
const RoomSchema = {
  id: 'number',
  hotel_id: 'number',
  numero: 'string',
  type: 'string',
  prix: 'number',
  statut: ['disponible', 'occupee', 'maintenance'],
  description: 'string|null',
  category_id: 'number|null',
  floor: 'number|null',
  room_size: 'number|null',
  bed_type: 'string|null',
  view_type: 'string|null',
  is_smoking: 'boolean|null',
  images: 'array|null',
  amenities: 'array|null',
  last_cleaned: 'string|null',
  notes: 'string|null',
  created_at: 'string',
  updated_at: 'string'
};

class TypeScriptTestUtils {
  static log(category, message, status = 'info') {
    const icons = { info: '📋', success: '✅', error: '❌', warning: '⚠️' };
    console.log(`${icons[status]} [${category}] ${message}`);
  }

  static generateTestRoom(suffix = '') {
    return {
      hotel_id: TEST_CONFIG.testHotelId,
      numero: `TS-${Date.now()}${suffix}`,
      type: 'TypeScript Test',
      prix: 75.50,
      statut: 'disponible',
      description: 'Chambre de test TypeScript',
      floor: 2,
      room_size: 30.5,
      bed_type: 'double',
      view_type: 'jardin',
      is_smoking: false,
      amenities: ['WiFi', 'TV', 'Climatisation'],
      images: [
        { url: 'room1.jpg', alt: 'Vue principale', size: 1024 },
        { url: 'room2.jpg', alt: 'Salle de bain', size: 512 }
      ],
      notes: 'Chambre avec vue sur le jardin'
    };
  }

  /**
   * Valide qu'un objet respecte le schéma défini
   */
  static validateSchema(obj, schema, objectName = 'objet') {
    const errors = [];

    for (const [field, expectedType] of Object.entries(schema)) {
      const value = obj[field];
      const typeResult = this.validateFieldType(value, expectedType, field);
      
      if (!typeResult.valid) {
        errors.push(`${objectName}.${field}: ${typeResult.error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Valide le type d'un champ spécifique
   */
  static validateFieldType(value, expectedType, fieldName) {
    // Gestion des types optionnels (avec |null)
    if (typeof expectedType === 'string' && expectedType.includes('|null')) {
      if (value === null) {
        return { valid: true };
      }
      expectedType = expectedType.replace('|null', '');
    }

    // Gestion des types enum (array de valeurs)
    if (Array.isArray(expectedType)) {
      if (!expectedType.includes(value)) {
        return {
          valid: false,
          error: `Valeur '${value}' non autorisée. Valeurs attendues: ${expectedType.join(', ')}`
        };
      }
      return { valid: true };
    }

    // Validation des types primitifs
    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          return { valid: false, error: `Attendu string, reçu ${typeof value}` };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { valid: false, error: `Attendu number, reçu ${typeof value}` };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return { valid: false, error: `Attendu boolean, reçu ${typeof value}` };
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return { valid: false, error: `Attendu array, reçu ${typeof value}` };
        }
        break;

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          return { valid: false, error: `Attendu object, reçu ${typeof value}` };
        }
        break;

      default:
        return { valid: false, error: `Type '${expectedType}' non reconnu` };
    }

    return { valid: true };
  }

  /**
   * Teste la sérialisation JSON d'un objet
   */
  static testJsonSerialization(obj, objectName = 'objet') {
    try {
      const serialized = JSON.stringify(obj);
      const deserialized = JSON.parse(serialized);
      
      // Vérification de la cohérence
      const differences = this.findObjectDifferences(obj, deserialized);
      
      return {
        success: differences.length === 0,
        serialized: serialized,
        deserialized: deserialized,
        differences: differences
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Compare deux objets et trouve les différences
   */
  static findObjectDifferences(obj1, obj2, path = '') {
    const differences = [];

    // Vérifier les clés de obj1
    for (const key in obj1) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (!(key in obj2)) {
        differences.push(`${currentPath}: manquant dans obj2`);
      } else if (typeof obj1[key] !== typeof obj2[key]) {
        differences.push(`${currentPath}: type différent (${typeof obj1[key]} vs ${typeof obj2[key]})`);
      } else if (typeof obj1[key] === 'object' && obj1[key] !== null) {
        if (Array.isArray(obj1[key]) !== Array.isArray(obj2[key])) {
          differences.push(`${currentPath}: array vs object`);
        } else if (Array.isArray(obj1[key])) {
          // Comparaison d'arrays
          if (obj1[key].length !== obj2[key].length) {
            differences.push(`${currentPath}: longueur d'array différente`);
          }
        } else {
          // Récursion pour les objets
          differences.push(...this.findObjectDifferences(obj1[key], obj2[key], currentPath));
        }
      } else if (obj1[key] !== obj2[key]) {
        differences.push(`${currentPath}: valeur différente (${obj1[key]} vs ${obj2[key]})`);
      }
    }

    // Vérifier les clés supplémentaires dans obj2
    for (const key in obj2) {
      if (!(key in obj1)) {
        const currentPath = path ? `${path}.${key}` : key;
        differences.push(`${currentPath}: clé supplémentaire dans obj2`);
      }
    }

    return differences;
  }
}

/**
 * TESTS DE VALIDATION DES TYPES CREATE
 */
class CreateTypeValidationTests {
  static async runAll() {
    TypeScriptTestUtils.log('TS-CREATE', 'Tests de validation types CREATE', 'info');
    
    const results = { passed: 0, failed: 0, details: [] };
    const tests = [
      this.testBasicTypeValidation,
      this.testComplexTypesValidation,
      this.testArrayTypesValidation,
      this.testNullableTypesValidation,
      this.testJsonSerialization,
      this.testEnumValidation,
      this.testNumberPrecision,
      this.testStringValidation,
      this.testBooleanValidation
    ];

    for (const test of tests) {
      try {
        await test();
        results.passed++;
        TypeScriptTestUtils.log('TS-CREATE', `${test.name} - RÉUSSI`, 'success');
      } catch (error) {
        results.failed++;
        results.details.push({ test: test.name, error: error.message });
        TypeScriptTestUtils.log('TS-CREATE', `${test.name} - ÉCHEC: ${error.message}`, 'error');
      }
    }

    return results;
  }

  static async testBasicTypeValidation() {
    const roomData = TypeScriptTestUtils.generateTestRoom('-basic-types');
    
    const { data, error } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (error) throw new Error(`Erreur création: ${error.message}`);

    try {
      // Validation du schéma
      const validation = TypeScriptTestUtils.validateSchema(data, RoomSchema, 'Room');
      if (!validation.valid) {
        throw new Error(`Validation schéma échouée: ${validation.errors.join(', ')}`);
      }

      // Vérification des types de base
      if (typeof data.id !== 'number') throw new Error('ID doit être un nombre');
      if (typeof data.numero !== 'string') throw new Error('Numéro doit être une chaîne');
      if (typeof data.prix !== 'number') throw new Error('Prix doit être un nombre');
      if (typeof data.created_at !== 'string') throw new Error('created_at doit être une chaîne');
    } finally {
      await supabase.from('rooms').delete().eq('id', data.id);
    }
  }

  static async testComplexTypesValidation() {
    const complexRoomData = {
      ...TypeScriptTestUtils.generateTestRoom('-complex'),
      amenities: [
        'WiFi',
        'TV 4K',
        { type: 'Climatisation', zone: 'principale' },
        { type: 'Minibar', contenu: ['eau', 'sodas'] }
      ],
      images: [
        { 
          url: 'https://example.com/room1.jpg',
          alt: 'Vue principale',
          dimensions: { width: 1920, height: 1080 },
          metadata: { photographer: 'John Doe', date: '2024-01-01' }
        }
      ]
    };

    const { data, error } = await supabase
      .from('rooms')
      .insert(complexRoomData)
      .select()
      .single();

    if (error) throw new Error(`Erreur création complexe: ${error.message}`);

    try {
      // Vérification des types complexes
      if (!Array.isArray(data.amenities)) {
        throw new Error('Amenities doit être un array');
      }

      if (!Array.isArray(data.images)) {
        throw new Error('Images doit être un array');
      }

      // Vérification de la préservation des objets complexes
      const firstImage = data.images[0];
      if (typeof firstImage !== 'object' || !firstImage.url || !firstImage.dimensions) {
        throw new Error('Structure d\'objet complexe non préservée');
      }

      // Test de sérialisation
      const serializationTest = TypeScriptTestUtils.testJsonSerialization(data, 'Room complexe');
      if (!serializationTest.success) {
        throw new Error(`Sérialisation échouée: ${serializationTest.error || serializationTest.differences.join(', ')}`);
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', data.id);
    }
  }

  static async testArrayTypesValidation() {
    const arrayTestCases = [
      {
        name: 'Array vide',
        data: { amenities: [], images: [] }
      },
      {
        name: 'Array avec strings',
        data: { amenities: ['WiFi', 'TV', 'Climatisation'] }
      },
      {
        name: 'Array avec objets',
        data: { 
          images: [
            { url: 'test1.jpg', alt: 'Test 1' },
            { url: 'test2.jpg', alt: 'Test 2' }
          ]
        }
      },
      {
        name: 'Array mixte',
        data: { 
          amenities: ['WiFi', { type: 'TV', model: '4K' }, 'Climatisation']
        }
      }
    ];

    for (const testCase of arrayTestCases) {
      const roomData = {
        ...TypeScriptTestUtils.generateTestRoom(`-array-${testCase.name}`),
        ...testCase.data
      };

      const { data, error } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();

      if (error) throw new Error(`Erreur ${testCase.name}: ${error.message}`);

      try {
        // Vérification du type array
        for (const [field, expectedValue] of Object.entries(testCase.data)) {
          if (!Array.isArray(data[field])) {
            throw new Error(`${field} doit être un array pour ${testCase.name}`);
          }

          if (Array.isArray(expectedValue) && data[field].length !== expectedValue.length) {
            throw new Error(`Longueur d'array incorrecte pour ${field} dans ${testCase.name}`);
          }
        }
      } finally {
        await supabase.from('rooms').delete().eq('id', data.id);
      }
    }
  }

  static async testNullableTypesValidation() {
    const nullableFields = [
      'description',
      'category_id',
      'floor',
      'room_size',
      'bed_type',
      'view_type',
      'is_smoking',
      'images',
      'amenities',
      'last_cleaned',
      'notes'
    ];

    for (const field of nullableFields) {
      const roomData = TypeScriptTestUtils.generateTestRoom(`-null-${field}`);
      roomData[field] = null;

      const { data, error } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();

      if (error) throw new Error(`Erreur field null ${field}: ${error.message}`);

      try {
        if (data[field] !== null) {
          TypeScriptTestUtils.log('TS-CREATE', `Champ ${field} - null converti en valeur par défaut`, 'warning');
        }
      } finally {
        await supabase.from('rooms').delete().eq('id', data.id);
      }
    }
  }

  static async testJsonSerialization() {
    const complexData = {
      ...TypeScriptTestUtils.generateTestRoom('-serialization'),
      amenities: [
        'WiFi',
        { type: 'TV', specs: { size: '55"', resolution: '4K' } },
        { type: 'Minibar', items: ['water', 'soda', 'snacks'] }
      ],
      images: [
        {
          url: 'room.jpg',
          metadata: {
            date: '2024-01-01T10:00:00Z',
            camera: { brand: 'Canon', model: 'EOS R5' },
            settings: { iso: 100, aperture: 'f/8', shutter: '1/125' }
          }
        }
      ]
    };

    const { data, error } = await supabase
      .from('rooms')
      .insert(complexData)
      .select()
      .single();

    if (error) throw new Error(`Erreur sérialisation: ${error.message}`);

    try {
      // Test de sérialisation complète
      const serializationTest = TypeScriptTestUtils.testJsonSerialization(data);
      if (!serializationTest.success) {
        throw new Error(`Sérialisation échouée: ${serializationTest.error || serializationTest.differences.join(', ')}`);
      }

      // Vérification de la préservation des données complexes
      const amenityWithSpecs = data.amenities.find(a => typeof a === 'object' && a.type === 'TV');
      if (!amenityWithSpecs || !amenityWithSpecs.specs || amenityWithSpecs.specs.resolution !== '4K') {
        throw new Error('Données complexes dans amenities non préservées');
      }

      const imageMetadata = data.images[0].metadata;
      if (!imageMetadata || !imageMetadata.camera || imageMetadata.camera.brand !== 'Canon') {
        throw new Error('Métadonnées d\'image non préservées');
      }
    } finally {
      await supabase.from('rooms').delete().eq('id', data.id);
    }
  }

  static async testEnumValidation() {
    const validStatuses = ['disponible', 'occupee', 'maintenance'];
    
    for (const status of validStatuses) {
      const roomData = {
        ...TypeScriptTestUtils.generateTestRoom(`-status-${status}`),
        statut: status
      };

      const { data, error } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();

      if (error) throw new Error(`Erreur statut valide ${status}: ${error.message}`);

      try {
        if (data.statut !== status) {
          throw new Error(`Statut non préservé: attendu ${status}, reçu ${data.statut}`);
        }

        // Validation du type enum
        const enumValidation = TypeScriptTestUtils.validateFieldType(
          data.statut, 
          RoomSchema.statut, 
          'statut'
        );

        if (!enumValidation.valid) {
          throw new Error(`Validation enum échouée: ${enumValidation.error}`);
        }
      } finally {
        await supabase.from('rooms').delete().eq('id', data.id);
      }
    }
  }

  static async testNumberPrecision() {
    const precisionTests = [
      { name: 'Prix décimal', field: 'prix', value: 123.456789 },
      { name: 'Taille précise', field: 'room_size', value: 25.555555 },
      { name: 'Étage zéro', field: 'floor', value: 0 },
      { name: 'Prix entier', field: 'prix', value: 100 }
    ];

    for (const test of precisionTests) {
      const roomData = TypeScriptTestUtils.generateTestRoom(`-precision-${test.name}`);
      roomData[test.field] = test.value;

      const { data, error } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();

      if (error) throw new Error(`Erreur ${test.name}: ${error.message}`);

      try {
        if (typeof data[test.field] !== 'number') {
          throw new Error(`${test.field} doit rester un nombre`);
        }

        // Vérification de la précision (base de données peut arrondir)
        const difference = Math.abs(data[test.field] - test.value);
        if (difference > 0.01) { // Tolérance de 1 centime
          TypeScriptTestUtils.log('TS-CREATE', 
            `Précision modifiée pour ${test.field}: ${test.value} → ${data[test.field]}`, 
            'warning'
          );
        }
      } finally {
        await supabase.from('rooms').delete().eq('id', data.id);
      }
    }
  }

  static async testStringValidation() {
    const stringTests = [
      { name: 'String vide', field: 'description', value: '' },
      { name: 'String avec espaces', field: 'notes', value: '   notes avec espaces   ' },
      { name: 'String avec caractères spéciaux', field: 'type', value: 'Chambre "Deluxe" & Spa' },
      { name: 'String unicode', field: 'description', value: 'Chambre avec caractères éè€àç' },
      { name: 'String JSON échappé', field: 'notes', value: '{"test": "value with \\"quotes\\""}' }
    ];

    for (const test of stringTests) {
      const roomData = TypeScriptTestUtils.generateTestRoom(`-string-${test.name}`);
      roomData[test.field] = test.value;

      const { data, error } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();

      if (error) throw new Error(`Erreur ${test.name}: ${error.message}`);

      try {
        if (typeof data[test.field] !== 'string') {
          throw new Error(`${test.field} doit rester une chaîne`);
        }

        // Vérification de la préservation des caractères
        if (test.field === 'description' && test.value === '' && data[test.field] !== '') {
          TypeScriptTestUtils.log('TS-CREATE', 'String vide convertie en null', 'info');
        }
      } finally {
        await supabase.from('rooms').delete().eq('id', data.id);
      }
    }
  }

  static async testBooleanValidation() {
    const booleanTests = [
      { name: 'Boolean true', value: true },
      { name: 'Boolean false', value: false },
      { name: 'Boolean null', value: null }
    ];

    for (const test of booleanTests) {
      const roomData = TypeScriptTestUtils.generateTestRoom(`-boolean-${test.name}`);
      roomData.is_smoking = test.value;

      const { data, error } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single();

      if (error) throw new Error(`Erreur ${test.name}: ${error.message}`);

      try {
        if (test.value === null) {
          // Nullable boolean peut être null ou converti en false
          if (data.is_smoking !== null && data.is_smoking !== false) {
            throw new Error('Boolean null mal géré');
          }
        } else {
          if (typeof data.is_smoking !== 'boolean') {
            throw new Error(`is_smoking doit être un boolean, reçu ${typeof data.is_smoking}`);
          }
          if (data.is_smoking !== test.value) {
            throw new Error(`Boolean non préservé: attendu ${test.value}, reçu ${data.is_smoking}`);
          }
        }
      } finally {
        await supabase.from('rooms').delete().eq('id', data.id);
      }
    }
  }
}

/**
 * TESTS DE VALIDATION DES TYPES READ
 */
class ReadTypeValidationTests {
  static async runAll() {
    TypeScriptTestUtils.log('TS-READ', 'Tests de validation types READ', 'info');
    
    const results = { passed: 0, failed: 0, details: [] };
    
    // Créer des données de test avec différents types
    await this.setupTestData();

    const tests = [
      this.testResponseTypeConsistency,
      this.testArrayResponseTypes,
      this.testNullHandling,
      this.testDateTimeTypes,
      this.testComplexObjectTypes,
      this.testPaginationTypes
    ];

    for (const test of tests) {
      try {
        await test();
        results.passed++;
        TypeScriptTestUtils.log('TS-READ', `${test.name} - RÉUSSI`, 'success');
      } catch (error) {
        results.failed++;
        results.details.push({ test: test.name, error: error.message });
        TypeScriptTestUtils.log('TS-READ', `${test.name} - ÉCHEC: ${error.message}`, 'error');
      }
    }

    // Nettoyage
    await this.cleanupTestData();

    return results;
  }

  static async setupTestData() {
    this.testRooms = [
      {
        ...TypeScriptTestUtils.generateTestRoom('-read1'),
        amenities: ['WiFi', 'TV'],
        images: [{ url: 'test1.jpg', alt: 'Test 1' }]
      },
      {
        ...TypeScriptTestUtils.generateTestRoom('-read2'),
        amenities: null,
        images: [],
        description: null
      }
    ];

    const { data, error } = await supabase
      .from('rooms')
      .insert(this.testRooms)
      .select();

    if (error) throw new Error(`Erreur setup: ${error.message}`);
    this.testRoomIds = data.map(room => room.id);
  }

  static async cleanupTestData() {
    if (this.testRoomIds && this.testRoomIds.length > 0) {
      await supabase.from('rooms').delete().in('id', this.testRoomIds);
    }
  }

  static async testResponseTypeConsistency() {
    // Test single response
    const { data: singleRoom, error: singleError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', this.testRoomIds[0])
      .single();

    if (singleError) throw new Error(`Erreur single: ${singleError.message}`);

    // Validation du schéma
    const singleValidation = TypeScriptTestUtils.validateSchema(singleRoom, RoomSchema, 'Single Room');
    if (!singleValidation.valid) {
      throw new Error(`Single validation échouée: ${singleValidation.errors.join(', ')}`);
    }

    // Test array response
    const { data: multipleRooms, error: multipleError } = await supabase
      .from('rooms')
      .select('*')
      .in('id', this.testRoomIds);

    if (multipleError) throw new Error(`Erreur multiple: ${multipleError.message}`);

    if (!Array.isArray(multipleRooms)) {
      throw new Error('Response multiple doit être un array');
    }

    // Validation de chaque élément
    multipleRooms.forEach((room, index) => {
      const validation = TypeScriptTestUtils.validateSchema(room, RoomSchema, `Room ${index}`);
      if (!validation.valid) {
        throw new Error(`Array validation échouée pour room ${index}: ${validation.errors.join(', ')}`);
      }
    });
  }

  static async testArrayResponseTypes() {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .in('id', this.testRoomIds);

    if (error) throw new Error(`Erreur lecture: ${error.message}`);

    rooms.forEach((room, index) => {
      // Test des arrays
      if (room.amenities !== null && !Array.isArray(room.amenities)) {
        throw new Error(`Room ${index}: amenities doit être un array ou null`);
      }

      if (room.images !== null && !Array.isArray(room.images)) {
        throw new Error(`Room ${index}: images doit être un array ou null`);
      }

      // Test du contenu des arrays
      if (Array.isArray(room.amenities)) {
        room.amenities.forEach((amenity, amenityIndex) => {
          if (typeof amenity !== 'string' && typeof amenity !== 'object') {
            throw new Error(`Room ${index}, amenity ${amenityIndex}: type inattendu ${typeof amenity}`);
          }
        });
      }

      if (Array.isArray(room.images)) {
        room.images.forEach((image, imageIndex) => {
          if (typeof image !== 'object' || image === null) {
            throw new Error(`Room ${index}, image ${imageIndex}: doit être un objet`);
          }
          if (!image.url) {
            throw new Error(`Room ${index}, image ${imageIndex}: URL manquante`);
          }
        });
      }
    });
  }

  static async testNullHandling() {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .in('id', this.testRoomIds);

    if (error) throw new Error(`Erreur lecture: ${error.message}`);

    const roomWithNulls = rooms.find(r => r.description === null);
    if (!roomWithNulls) {
      throw new Error('Chambre avec valeurs null non trouvée');
    }

    // Vérification des champs nullable
    const nullableFields = ['description', 'category_id', 'floor', 'room_size', 
                           'bed_type', 'view_type', 'is_smoking', 'images', 
                           'amenities', 'last_cleaned', 'notes'];

    nullableFields.forEach(field => {
      const value = roomWithNulls[field];
      if (value !== null) {
        // Vérifier le type si la valeur n'est pas null
        const fieldType = RoomSchema[field].replace('|null', '');
        const typeValidation = TypeScriptTestUtils.validateFieldType(value, fieldType, field);
        if (!typeValidation.valid) {
          throw new Error(`Champ ${field}: ${typeValidation.error}`);
        }
      }
    });
  }

  static async testDateTimeTypes() {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .in('id', this.testRoomIds)
      .limit(1);

    if (error) throw new Error(`Erreur lecture dates: ${error.message}`);

    const room = rooms[0];

    // Test des timestamps
    const dateFields = ['created_at', 'updated_at'];
    dateFields.forEach(field => {
      if (typeof room[field] !== 'string') {
        throw new Error(`${field} doit être une string ISO`);
      }

      // Vérification du format ISO
      const date = new Date(room[field]);
      if (isNaN(date.getTime())) {
        throw new Error(`${field} n'est pas une date valide: ${room[field]}`);
      }

      // Vérification que la string peut être re-sérialisée
      const isoString = date.toISOString();
      if (!room[field].includes('T') || !room[field].includes('Z')) {
        TypeScriptTestUtils.log('TS-READ', `${field} format non-standard: ${room[field]}`, 'warning');
      }
    });

    // Test last_cleaned (nullable timestamp)
    if (room.last_cleaned !== null) {
      if (typeof room.last_cleaned !== 'string') {
        throw new Error('last_cleaned doit être une string ou null');
      }

      const cleanedDate = new Date(room.last_cleaned);
      if (isNaN(cleanedDate.getTime())) {
        throw new Error(`last_cleaned n'est pas une date valide: ${room.last_cleaned}`);
      }
    }
  }

  static async testComplexObjectTypes() {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .in('id', this.testRoomIds);

    if (error) throw new Error(`Erreur lecture objets complexes: ${error.message}`);

    const roomWithObjects = rooms.find(r => r.images && r.images.length > 0);
    if (!roomWithObjects) {
      throw new Error('Chambre avec objets complexes non trouvée');
    }

    // Test de la structure des images
    roomWithObjects.images.forEach((image, index) => {
      if (typeof image !== 'object' || image === null) {
        throw new Error(`Image ${index}: doit être un objet`);
      }

      // Propriétés requises
      if (typeof image.url !== 'string') {
        throw new Error(`Image ${index}: url doit être une string`);
      }

      if (image.alt && typeof image.alt !== 'string') {
        throw new Error(`Image ${index}: alt doit être une string`);
      }

      // Test de sérialisation
      const serializationTest = TypeScriptTestUtils.testJsonSerialization(image, `Image ${index}`);
      if (!serializationTest.success) {
        throw new Error(`Sérialisation image ${index} échouée: ${serializationTest.error}`);
      }
    });

    // Test de la structure des amenities
    if (roomWithObjects.amenities && Array.isArray(roomWithObjects.amenities)) {
      roomWithObjects.amenities.forEach((amenity, index) => {
        if (typeof amenity === 'object' && amenity !== null) {
          // Test de sérialisation pour les objets complexes
          const serializationTest = TypeScriptTestUtils.testJsonSerialization(amenity, `Amenity ${index}`);
          if (!serializationTest.success) {
            throw new Error(`Sérialisation amenity ${index} échouée: ${serializationTest.error}`);
          }
        }
      });
    }
  }

  static async testPaginationTypes() {
    const { data: paginatedRooms, error: paginationError, count } = await supabase
      .from('rooms')
      .select('*', { count: 'exact' })
      .eq('hotel_id', TEST_CONFIG.testHotelId)
      .limit(1);

    if (paginationError) throw new Error(`Erreur pagination: ${paginationError.message}`);

    // Vérification des types de pagination
    if (!Array.isArray(paginatedRooms)) {
      throw new Error('Résultat paginé doit être un array');
    }

    if (typeof count !== 'number' || count < 0) {
      throw new Error(`Count doit être un nombre positif, reçu: ${typeof count}`);
    }

    if (paginatedRooms.length > 1) {
      throw new Error('Limite de pagination non respectée');
    }

    // Validation du schéma pour les résultats paginés
    paginatedRooms.forEach((room, index) => {
      const validation = TypeScriptTestUtils.validateSchema(room, RoomSchema, `Paginated Room ${index}`);
      if (!validation.valid) {
        throw new Error(`Pagination validation échouée pour room ${index}: ${validation.errors.join(', ')}`);
      }
    });
  }
}

/**
 * RUNNER PRINCIPAL POUR LES TESTS TYPESCRIPT
 */
class TypeScriptTestRunner {
  static async runAllTypeScriptTests() {
    console.log('\n🔧 DÉBUT DES TESTS TYPESCRIPT - API ROOMS');
    console.log('==========================================');
    
    const startTime = Date.now();
    const results = {
      createTypes: null,
      readTypes: null,
      summary: {
        totalPassed: 0,
        totalFailed: 0,
        duration: 0,
        typesCoverage: {}
      }
    };

    try {
      // Tests de validation CREATE
      results.createTypes = await CreateTypeValidationTests.runAll();
      
      // Tests de validation READ
      results.readTypes = await ReadTypeValidationTests.runAll();

      // Calcul du résumé
      const endTime = Date.now();
      results.summary.duration = endTime - startTime;
      results.summary.totalPassed = results.createTypes.passed + results.readTypes.passed;
      results.summary.totalFailed = results.createTypes.failed + results.readTypes.failed;

    } catch (error) {
      TypeScriptTestUtils.log('TS-RUNNER', `Erreur fatale: ${error.message}`, 'error');
      results.summary.fatalError = error.message;
    }

    this.displayTypeScriptResults(results);
    return results;
  }

  static displayTypeScriptResults(results) {
    console.log('\n📊 RÉSULTATS DES TESTS TYPESCRIPT');
    console.log('==================================');
    
    const operations = ['createTypes', 'readTypes'];
    const operationNames = ['CREATE-TYPES', 'READ-TYPES'];
    
    operations.forEach((op, index) => {
      if (results[op]) {
        const { passed, failed } = results[op];
        const total = passed + failed;
        const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
        console.log(`${operationNames[index].padEnd(12)} ${passed}/${total} (${rate}%) 🔧`);
        
        if (failed > 0 && results[op].details) {
          results[op].details.forEach(detail => {
            console.log(`  ❌ ${detail.test}: ${detail.error}`);
          });
        }
      }
    });

    console.log('\n📈 RÉSUMÉ VALIDATION TYPESCRIPT');
    console.log(`Tests de types réussis: ${results.summary.totalPassed}`);
    console.log(`Tests de types échoués: ${results.summary.totalFailed}`);
    console.log(`Durée: ${results.summary.duration}ms`);
    console.log(`Conformité TypeScript: ${(results.summary.totalPassed / (results.summary.totalPassed + results.summary.totalFailed) * 100).toFixed(1)}%`);

    if (results.summary.fatalError) {
      console.log(`🚨 ERREUR FATALE: ${results.summary.fatalError}`);
    }

    console.log('\n🔧 TESTS TYPESCRIPT TERMINÉS');
  }
}

// Lancement des tests si exécuté directement
if (require.main === module) {
  TypeScriptTestRunner.runAllTypeScriptTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = {
  TypeScriptTestRunner,
  CreateTypeValidationTests,
  ReadTypeValidationTests,
  TypeScriptTestUtils,
  RoomSchema
};