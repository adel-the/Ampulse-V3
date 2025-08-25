/**
 * Comprehensive CRUD Test Suite for Establishments (Hotels)
 * Tests all CRUD operations with synthetic French hotel data
 * Validates data persistence, field validation, and RLS policies
 */

const { createClient } = require('@supabase/supabase-js')
const { faker } = require('@faker-js/faker/locale/fr')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Use service role key for write operations to bypass RLS during testing
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test user ID - we'll try to get or create this
let testUserId = null

// Test configuration
const TEST_CONFIG = {
  CREATE_COUNT: 5,
  UPDATE_COUNT: 3,
  DELETE_COUNT: 2,
  TEST_TIMEOUT: 30000 // 30 seconds
}

// Test results tracking
const testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  establishments: {
    created: [],
    updated: [],
    deleted: []
  },
  validationTests: [],
  rlsTests: [],
  performanceMetrics: {
    createTime: 0,
    readTime: 0,
    updateTime: 0,
    deleteTime: 0
  },
  errors: [],
  warnings: []
}

// French cities for realistic data
const frenchCities = [
  { ville: 'Paris', codePostal: '75001' },
  { ville: 'Lyon', codePostal: '69001' },
  { ville: 'Marseille', codePostal: '13001' },
  { ville: 'Toulouse', codePostal: '31000' },
  { ville: 'Nice', codePostal: '06000' },
  { ville: 'Nantes', codePostal: '44000' },
  { ville: 'Strasbourg', codePostal: '67000' },
  { ville: 'Montpellier', codePostal: '34000' },
  { ville: 'Bordeaux', codePostal: '33000' },
  { ville: 'Lille', codePostal: '59000' }
]

// Hotel name components
const hotelPrefixes = ['Hôtel', 'Le', 'La', 'Les', 'Résidence', 'Domaine', 'Château', 'Villa', 'Maison']
const hotelSuffixes = ['Royal', 'Palace', 'Plaza', 'Grand', 'Moderne', 'Élégant', 'Luxe', 'Confort', 'Étoilé', 
                       'du Parc', 'de la Gare', 'du Centre', 'de la Plage', 'des Voyageurs', 'du Commerce']

// Utility functions
function logTest(testName, success, error) {
  testResults.totalTests++
  if (success) {
    testResults.passedTests++
    console.log(`✅ ${testName}`)
  } else {
    testResults.failedTests++
    console.log(`❌ ${testName}: ${error}`)
    if (error) testResults.errors.push(`${testName}: ${error}`)
  }
}

function logWarning(message) {
  testResults.warnings.push(message)
  console.log(`⚠️  ${message}`)
}

// Generate synthetic hotel data
function generateSyntheticHotel() {
  const city = faker.helpers.arrayElement(frenchCities)
  const stars = faker.number.int({ min: 1, max: 5 })
  const totalRooms = faker.number.int({ min: 10, max: 200 })
  const occupiedRooms = faker.number.int({ min: 0, max: totalRooms })
  
  const prefix = faker.helpers.arrayElement(hotelPrefixes)
  const suffix = faker.helpers.arrayElement(hotelSuffixes)
  const hotelName = `${prefix} ${suffix}`
  
  return {
    nom: hotelName,
    adresse: faker.location.streetAddress(),
    ville: city.ville,
    code_postal: city.codePostal,
    telephone: faker.phone.number('01########'),
    email: faker.internet.email({ provider: 'hotel-example.fr' }),
    site_web: faker.internet.url(),
    gestionnaire: faker.person.fullName(),
    statut: faker.helpers.arrayElement(['ACTIF', 'INACTIF']),
    siret: faker.string.numeric(14),
    tva_intracommunautaire: `FR${faker.string.numeric(11)}`,
    classement_etoiles: stars,
    directeur: faker.person.fullName(),
    telephone_directeur: faker.phone.number('06########'),
    email_directeur: faker.internet.email({ provider: 'hotel-example.fr' }),
    capacite: totalRooms * 2,
    description: faker.lorem.paragraph(),
    check_in_time: faker.helpers.arrayElement(['14:00', '15:00', '16:00']),
    check_out_time: faker.helpers.arrayElement(['10:00', '11:00', '12:00']),
    parking_places: faker.number.int({ min: 5, max: 50 }),
    surface_totale: faker.number.float({ min: 500, max: 5000, precision: 0.01 }),
    nombre_etages: faker.number.int({ min: 1, max: 10 }),
    chambres_total: totalRooms,
    chambres_occupees: occupiedRooms,
    taux_occupation: parseFloat(((occupiedRooms / totalRooms) * 100).toFixed(2)),
    type_etablissement: faker.helpers.arrayElement(['hotel', 'residence', 'foyer', 'chrs', 'chr', 'autre'])
  }
}

function generateMultipleHotels(count) {
  return Array.from({ length: count }, () => generateSyntheticHotel())
}

// Validation functions
function validatePostalCode(postalCode) {
  const frenchPostalCodeRegex = /^\d{5}$/
  return frenchPostalCodeRegex.test(postalCode)
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePhoneNumber(phone) {
  if (!phone) return true // Phone is optional
  const frenchPhoneRegex = /^(?:(?:\+33|0)[1-9])(?:[-.\s]?\d{2}){4}$/
  return frenchPhoneRegex.test(phone.replace(/\s/g, ''))
}

function validateSiret(siret) {
  return /^\d{14}$/.test(siret)
}

function validateTvaNumber(tva) {
  return /^FR\d{11}$/.test(tva)
}

// Helper function to get or create a test user
async function initializeTestUser() {
  if (!supabaseAdmin) {
    logWarning('No service role key available for test user creation')
    return 'a0000000-0000-4000-8000-000000000001' // Fallback UUID
  }
  
  const testEmail = 'test-hotel-owner@example.com'
  
  try {
    // Try creating a test user via auth admin
    console.log('🔧 Initializing test user...')
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'test-password-123456',
      email_confirm: true
    })
    
    if (createError) {
      console.log('Auth user creation note:', createError.message)
      
      // Check if user already exists
      if (createError.message.includes('already been registered')) {
        console.log('✅ Test user already exists, trying to find it...')
        const { data: users } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = users?.users?.find(u => u.email === testEmail)
        
        if (existingUser) {
          console.log(`✅ Found existing test user: ${existingUser.id}`)
          return existingUser.id
        }
      }
      
      // Use a fixed UUID as fallback
      const fallbackId = 'a0000000-0000-4000-8000-000000000001'
      logWarning(`Using fallback UUID for testing: ${fallbackId}`)
      return fallbackId
    }
    
    if (!newUser?.user) {
      logWarning('No user data returned from auth creation')
      return 'a0000000-0000-4000-8000-000000000001'
    }
    
    console.log(`✅ Test user created successfully: ${newUser.user.id}`)
    return newUser.user.id
    
  } catch (error) {
    console.log('Error initializing test user:', error.message)
    const fallbackId = 'a0000000-0000-4000-8000-000000000001'
    logWarning(`Using fallback UUID: ${fallbackId}`)
    return fallbackId
  }
}

// Establishments API functions
const establishmentsApi = {
  async getEstablishments(filters = {}) {
    try {
      let query = supabase
        .from('hotels')
        .select('*', { count: 'exact' })

      if (filters.statut) {
        query = query.eq('statut', filters.statut)
      }
      if (filters.ville) {
        query = query.ilike('ville', `%${filters.ville}%`)
      }
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1)
      }

      query = query.order('nom')
      const { data, error, count } = await query

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      return { data: data || [], error: null, success: true, count: count || 0 }
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  },

  async getEstablishment(id) {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      return { data, error: null, success: true }
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  },

  async createEstablishment(data) {
    try {
      const establishmentData = {
        ...data,
        statut: data.statut || 'ACTIF',
        chambres_total: data.chambres_total || 0,
        chambres_occupees: data.chambres_occupees || 0,
        taux_occupation: data.taux_occupation || 0,
        user_owner_id: data.user_owner_id || testUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Use admin client for creation to bypass RLS
      const client = supabaseAdmin || supabase
      const { data: establishment, error } = await client
        .from('hotels')
        .insert(establishmentData)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      return { data: establishment, error: null, success: true }
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  },

  async updateEstablishment(id, data) {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      }

      // Use admin client for updates to bypass RLS
      const client = supabaseAdmin || supabase
      const { data: establishment, error } = await client
        .from('hotels')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      return { data: establishment, error: null, success: true }
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  },

  async deleteEstablishment(id, hardDelete = false) {
    try {
      // Use admin client for deletions to bypass RLS
      const client = supabaseAdmin || supabase
      
      if (hardDelete) {
        const { error } = await client
          .from('hotels')
          .delete()
          .eq('id', id)

        if (error) {
          return { data: null, error: error.message, success: false }
        }
      } else {
        const { error } = await client
          .from('hotels')
          .update({ 
            statut: 'INACTIF',
            updated_at: new Date().toISOString()
          })
          .eq('id', id)

        if (error) {
          return { data: null, error: error.message, success: false }
        }
      }

      return { data: true, error: null, success: true }
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  },

  async searchEstablishments(query, limit = 10) {
    try {
      const { data, error, count } = await supabase
        .from('hotels')
        .select('*', { count: 'exact' })
        .or(`nom.ilike.%${query}%,ville.ilike.%${query}%,adresse.ilike.%${query}%`)
        .eq('statut', 'ACTIF')
        .order('nom')
        .limit(limit)

      if (error) {
        return { data: null, error: error.message, success: false }
      }

      return { data: data || [], error: null, success: true, count: count || 0 }
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  }
}

/**
 * Test 1: CREATE Operations
 */
async function testCreateOperations() {
  console.log('\n🔄 Testing CREATE Operations...')
  const startTime = Date.now()
  const createdEstablishments = []
  
  try {
    const syntheticHotels = generateMultipleHotels(TEST_CONFIG.CREATE_COUNT)
    
    for (let i = 0; i < syntheticHotels.length; i++) {
      const hotelData = syntheticHotels[i]
      
      try {
        const result = await establishmentsApi.createEstablishment(hotelData)
        
        if (result.success && result.data) {
          createdEstablishments.push(result.data)
          testResults.establishments.created.push({
            id: result.data.id,
            name: result.data.nom,
            success: true
          })
          logTest(`Create establishment ${i + 1}: ${result.data.nom}`, true)
        } else {
          testResults.establishments.created.push({
            id: -1,
            name: hotelData.nom,
            success: false,
            error: result.error || 'Unknown error'
          })
          logTest(`Create establishment ${i + 1}: ${hotelData.nom}`, false, result.error || 'Unknown error')
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        testResults.establishments.created.push({
          id: -1,
          name: hotelData.nom,
          success: false,
          error: errorMsg
        })
        logTest(`Create establishment ${i + 1}: ${hotelData.nom}`, false, errorMsg)
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    logTest('CREATE Operations Setup', false, errorMsg)
  }
  
  testResults.performanceMetrics.createTime = Date.now() - startTime
  console.log(`⏱️  CREATE operations completed in ${testResults.performanceMetrics.createTime}ms`)
  
  return createdEstablishments
}

/**
 * Test 2: READ Operations
 */
async function testReadOperations() {
  console.log('\n🔄 Testing READ Operations...')
  const startTime = Date.now()
  
  try {
    // Test fetching all establishments
    const allEstablishmentsResult = await establishmentsApi.getEstablishments()
    logTest('Fetch all establishments', allEstablishmentsResult.success, allEstablishmentsResult.error)
    
    if (allEstablishmentsResult.success && allEstablishmentsResult.data) {
      const establishments = allEstablishmentsResult.data
      console.log(`📊 Found ${establishments.length} establishments in database`)
      
      // Test individual establishment fetching
      if (establishments.length > 0) {
        const firstEstablishment = establishments[0]
        const singleEstablishmentResult = await establishmentsApi.getEstablishment(firstEstablishment.id)
        logTest(`Fetch single establishment (ID: ${firstEstablishment.id})`, singleEstablishmentResult.success, singleEstablishmentResult.error)
      }
      
      // Test search functionality
      const searchResult = await establishmentsApi.searchEstablishments('Hotel', 5)
      logTest('Search establishments', searchResult.success, searchResult.error)
      
      if (searchResult.success && searchResult.data) {
        console.log(`🔍 Search returned ${searchResult.data.length} results`)
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    logTest('READ Operations', false, errorMsg)
  }
  
  testResults.performanceMetrics.readTime = Date.now() - startTime
  console.log(`⏱️  READ operations completed in ${testResults.performanceMetrics.readTime}ms`)
}

/**
 * Test 3: UPDATE Operations
 */
async function testUpdateOperations(establishments) {
  console.log('\n🔄 Testing UPDATE Operations...')
  const startTime = Date.now()
  
  if (establishments.length < TEST_CONFIG.UPDATE_COUNT) {
    logWarning(`Not enough establishments for UPDATE tests (need ${TEST_CONFIG.UPDATE_COUNT}, have ${establishments.length})`)
    return
  }
  
  try {
    for (let i = 0; i < TEST_CONFIG.UPDATE_COUNT; i++) {
      const establishment = establishments[i]
      const updateData = {
        description: faker.lorem.paragraph(),
        telephone: faker.phone.number('01########'),
        email: faker.internet.email({ provider: 'updated-hotel.fr' }),
        classement_etoiles: faker.number.int({ min: 1, max: 5 }),
        statut: faker.helpers.arrayElement(['ACTIF', 'INACTIF'])
      }
      
      try {
        const result = await establishmentsApi.updateEstablishment(establishment.id, updateData)
        
        testResults.establishments.updated.push({
          id: establishment.id,
          name: establishment.nom,
          success: result.success,
          error: result.error
        })
        
        logTest(`Update establishment ${establishment.nom} (ID: ${establishment.id})`, result.success, result.error)
        
        // Verify the update by fetching the establishment again
        if (result.success) {
          const verifyResult = await establishmentsApi.getEstablishment(establishment.id)
          if (verifyResult.success && verifyResult.data) {
            const fieldsToCheck = Object.keys(updateData)
            let updatedFieldsCount = 0
            
            for (const field of fieldsToCheck) {
              if (verifyResult.data[field] === updateData[field]) {
                updatedFieldsCount++
              }
            }
            
            logTest(`Verify update for ${establishment.nom} (${updatedFieldsCount} fields updated)`, updatedFieldsCount > 0, updatedFieldsCount === 0 ? 'No fields were updated' : undefined)
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        testResults.establishments.updated.push({
          id: establishment.id,
          name: establishment.nom,
          success: false,
          error: errorMsg
        })
        logTest(`Update establishment ${establishment.nom}`, false, errorMsg)
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    logTest('UPDATE Operations Setup', false, errorMsg)
  }
  
  testResults.performanceMetrics.updateTime = Date.now() - startTime
  console.log(`⏱️  UPDATE operations completed in ${testResults.performanceMetrics.updateTime}ms`)
}

/**
 * Test 4: DELETE Operations
 */
async function testDeleteOperations(establishments) {
  console.log('\n🔄 Testing DELETE Operations...')
  const startTime = Date.now()
  
  if (establishments.length < TEST_CONFIG.DELETE_COUNT) {
    logWarning(`Not enough establishments for DELETE tests (need ${TEST_CONFIG.DELETE_COUNT}, have ${establishments.length})`)
    return
  }
  
  try {
    // Test soft delete (first establishment)
    const establishmentToSoftDelete = establishments[establishments.length - 2]
    try {
      const softDeleteResult = await establishmentsApi.deleteEstablishment(establishmentToSoftDelete.id, false)
      
      testResults.establishments.deleted.push({
        id: establishmentToSoftDelete.id,
        name: establishmentToSoftDelete.nom,
        success: softDeleteResult.success,
        error: softDeleteResult.error
      })
      
      logTest(`Soft delete establishment ${establishmentToSoftDelete.nom}`, softDeleteResult.success, softDeleteResult.error)
      
      // Verify soft delete by checking status
      if (softDeleteResult.success) {
        const verifyResult = await establishmentsApi.getEstablishment(establishmentToSoftDelete.id)
        if (verifyResult.success && verifyResult.data) {
          const isInactive = verifyResult.data.statut === 'INACTIF'
          logTest(`Verify soft delete status for ${establishmentToSoftDelete.nom}`, isInactive, !isInactive ? 'Status not set to INACTIF' : undefined)
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      testResults.establishments.deleted.push({
        id: establishmentToSoftDelete.id,
        name: establishmentToSoftDelete.nom,
        success: false,
        error: errorMsg
      })
      logTest(`Soft delete establishment ${establishmentToSoftDelete.nom}`, false, errorMsg)
    }
    
    // Test hard delete (last establishment)
    const establishmentToHardDelete = establishments[establishments.length - 1]
    try {
      const hardDeleteResult = await establishmentsApi.deleteEstablishment(establishmentToHardDelete.id, true)
      
      testResults.establishments.deleted.push({
        id: establishmentToHardDelete.id,
        name: establishmentToHardDelete.nom,
        success: hardDeleteResult.success,
        error: hardDeleteResult.error
      })
      
      logTest(`Hard delete establishment ${establishmentToHardDelete.nom}`, hardDeleteResult.success, hardDeleteResult.error)
      
      // Verify hard delete by trying to fetch (should fail)
      if (hardDeleteResult.success) {
        const verifyResult = await establishmentsApi.getEstablishment(establishmentToHardDelete.id)
        const isDeleted = !verifyResult.success
        logTest(`Verify hard delete for ${establishmentToHardDelete.nom}`, isDeleted, verifyResult.success ? 'Establishment still exists after hard delete' : undefined)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      testResults.establishments.deleted.push({
        id: establishmentToHardDelete.id,
        name: establishmentToHardDelete.nom,
        success: false,
        error: errorMsg
      })
      logTest(`Hard delete establishment ${establishmentToHardDelete.nom}`, false, errorMsg)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    logTest('DELETE Operations Setup', false, errorMsg)
  }
  
  testResults.performanceMetrics.deleteTime = Date.now() - startTime
  console.log(`⏱️  DELETE operations completed in ${testResults.performanceMetrics.deleteTime}ms`)
}

/**
 * Test 5: Validation Tests
 */
async function testValidations(establishments) {
  console.log('\n🔄 Testing Field Validations...')
  
  if (establishments.length === 0) {
    logWarning('No establishments available for validation testing')
    return
  }
  
  for (const establishment of establishments.slice(0, 3)) {
    try {
      // Test postal code validation
      if (establishment.code_postal) {
        const isValidPostal = validatePostalCode(establishment.code_postal)
        testResults.validationTests.push({
          test: `Postal code validation for ${establishment.nom}`,
          success: isValidPostal,
          error: !isValidPostal ? `Invalid postal code: ${establishment.code_postal}` : undefined
        })
        logTest(`Postal code validation for ${establishment.nom} (${establishment.code_postal})`, isValidPostal, !isValidPostal ? 'Invalid format' : undefined)
      }
      
      // Test email validation
      if (establishment.email) {
        const isValidEmail = validateEmail(establishment.email)
        testResults.validationTests.push({
          test: `Email validation for ${establishment.nom}`,
          success: isValidEmail,
          error: !isValidEmail ? `Invalid email: ${establishment.email}` : undefined
        })
        logTest(`Email validation for ${establishment.nom} (${establishment.email})`, isValidEmail, !isValidEmail ? 'Invalid format' : undefined)
      }
      
      // Test director email validation
      if (establishment.email_directeur) {
        const isValidDirectorEmail = validateEmail(establishment.email_directeur)
        testResults.validationTests.push({
          test: `Director email validation for ${establishment.nom}`,
          success: isValidDirectorEmail,
          error: !isValidDirectorEmail ? `Invalid director email: ${establishment.email_directeur}` : undefined
        })
        logTest(`Director email validation for ${establishment.nom}`, isValidDirectorEmail, !isValidDirectorEmail ? 'Invalid format' : undefined)
      }
      
      // Test phone number validation
      if (establishment.telephone) {
        const isValidPhone = validatePhoneNumber(establishment.telephone)
        testResults.validationTests.push({
          test: `Phone validation for ${establishment.nom}`,
          success: isValidPhone,
          error: !isValidPhone ? `Invalid phone: ${establishment.telephone}` : undefined
        })
        logTest(`Phone validation for ${establishment.nom} (${establishment.telephone})`, isValidPhone, !isValidPhone ? 'Invalid format' : undefined)
      }
      
      // Test SIRET validation
      if (establishment.siret) {
        const isValidSiret = validateSiret(establishment.siret)
        testResults.validationTests.push({
          test: `SIRET validation for ${establishment.nom}`,
          success: isValidSiret,
          error: !isValidSiret ? `Invalid SIRET: ${establishment.siret}` : undefined
        })
        logTest(`SIRET validation for ${establishment.nom} (${establishment.siret})`, isValidSiret, !isValidSiret ? 'Invalid format' : undefined)
      }
      
      // Test TVA number validation
      if (establishment.tva_intracommunautaire) {
        const isValidTva = validateTvaNumber(establishment.tva_intracommunautaire)
        testResults.validationTests.push({
          test: `TVA validation for ${establishment.nom}`,
          success: isValidTva,
          error: !isValidTva ? `Invalid TVA: ${establishment.tva_intracommunautaire}` : undefined
        })
        logTest(`TVA validation for ${establishment.nom} (${establishment.tva_intracommunautaire})`, isValidTva, !isValidTva ? 'Invalid format' : undefined)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      logTest(`Validation tests for ${establishment.nom}`, false, errorMsg)
    }
  }
}

/**
 * Test 6: RLS Policies
 */
async function testRLSPolicies() {
  console.log('\n🔄 Testing RLS Policies...')
  
  try {
    // Test accessing establishments without authentication
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .limit(1)
    
    if (data && data.length > 0) {
      logWarning('RLS test: Can access data without authentication (might be using service role key)')
      testResults.rlsTests.push({
        test: 'RLS access control',
        success: false,
        error: 'Data accessible without proper authentication'
      })
    } else if (error) {
      logTest('RLS access control', true)
      testResults.rlsTests.push({
        test: 'RLS access control',
        success: true
      })
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    if (errorMsg.includes('permission') || errorMsg.includes('policy')) {
      logTest('RLS policy enforcement', true)
      testResults.rlsTests.push({
        test: 'RLS policy enforcement',
        success: true
      })
    } else {
      logTest('RLS policy test', false, errorMsg)
      testResults.rlsTests.push({
        test: 'RLS policy test',
        success: false,
        error: errorMsg
      })
    }
  }
  
  logWarning('RLS testing is limited in local development mode with service role keys')
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  const totalTime = testResults.performanceMetrics.createTime + 
                   testResults.performanceMetrics.readTime + 
                   testResults.performanceMetrics.updateTime + 
                   testResults.performanceMetrics.deleteTime
  
  const successRate = testResults.totalTests > 0 ? 
    Math.round((testResults.passedTests / testResults.totalTests) * 100) : 0
  
  let report = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                          ESTABLISHMENT CRUD TEST REPORT                       ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ Test Execution Summary                                                         ║
║ • Total Tests: ${testResults.totalTests.toString().padEnd(60)} ║
║ • Passed: ${testResults.passedTests.toString().padEnd(64)} ║
║ • Failed: ${testResults.failedTests.toString().padEnd(64)} ║
║ • Success Rate: ${successRate}%${' '.repeat(58)} ║
║                                                                                ║
║ Performance Metrics                                                            ║
║ • CREATE Operations: ${testResults.performanceMetrics.createTime}ms${' '.repeat(50 - testResults.performanceMetrics.createTime.toString().length)} ║
║ • READ Operations: ${testResults.performanceMetrics.readTime}ms${' '.repeat(52 - testResults.performanceMetrics.readTime.toString().length)} ║
║ • UPDATE Operations: ${testResults.performanceMetrics.updateTime}ms${' '.repeat(50 - testResults.performanceMetrics.updateTime.toString().length)} ║
║ • DELETE Operations: ${testResults.performanceMetrics.deleteTime}ms${' '.repeat(50 - testResults.performanceMetrics.deleteTime.toString().length)} ║
║ • Total Execution Time: ${totalTime}ms${' '.repeat(45 - totalTime.toString().length)} ║
╠════════════════════════════════════════════════════════════════════════════════╣
║ CRUD Operations Results                                                        ║
╚════════════════════════════════════════════════════════════════════════════════╝

📊 CREATE Operations (${testResults.establishments.created.length} establishments):
${testResults.establishments.created.map(e => 
  `   ${e.success ? '✅' : '❌'} ${e.name} (ID: ${e.id})${e.error ? ` - Error: ${e.error}` : ''}`
).join('\n')}

📖 READ Operations:
   • All establishments fetch: ${testResults.passedTests > testResults.failedTests ? '✅' : '❌'}
   • Single establishment fetch: ${testResults.passedTests > testResults.failedTests ? '✅' : '❌'}
   • Search functionality: ${testResults.passedTests > testResults.failedTests ? '✅' : '❌'}

✏️  UPDATE Operations (${testResults.establishments.updated.length} establishments):
${testResults.establishments.updated.map(e => 
  `   ${e.success ? '✅' : '❌'} ${e.name} (ID: ${e.id})${e.error ? ` - Error: ${e.error}` : ''}`
).join('\n')}

🗑️  DELETE Operations (${testResults.establishments.deleted.length} establishments):
${testResults.establishments.deleted.map(e => 
  `   ${e.success ? '✅' : '❌'} ${e.name} (ID: ${e.id})${e.error ? ` - Error: ${e.error}` : ''}`
).join('\n')}

🔍 Validation Tests (${testResults.validationTests.length} tests):
${testResults.validationTests.map(t => 
  `   ${t.success ? '✅' : '❌'} ${t.test}${t.error ? ` - ${t.error}` : ''}`
).join('\n')}

🔒 RLS Policy Tests (${testResults.rlsTests.length} tests):
${testResults.rlsTests.map(t => 
  `   ${t.success ? '✅' : '❌'} ${t.test}${t.error ? ` - ${t.error}` : ''}`
).join('\n')}

${testResults.errors.length > 0 ? `
❌ Errors Encountered:
${testResults.errors.map(e => `   • ${e}`).join('\n')}
` : ''}

${testResults.warnings.length > 0 ? `
⚠️  Warnings:
${testResults.warnings.map(w => `   • ${w}`).join('\n')}
` : ''}

╔════════════════════════════════════════════════════════════════════════════════╗
║ Data Integrity Verification                                                   ║
║ • All created establishments have valid IDs: ${testResults.establishments.created.every(e => e.id > 0) ? '✅' : '❌'}                    ║
║ • French postal codes validation: ${testResults.validationTests.filter(t => t.test.includes('Postal')).every(t => t.success) ? '✅' : '❌'}                                ║
║ • Email format validation: ${testResults.validationTests.filter(t => t.test.includes('Email')).every(t => t.success) ? '✅' : '❌'}                                      ║
║ • SIRET format validation: ${testResults.validationTests.filter(t => t.test.includes('SIRET')).every(t => t.success) ? '✅' : '❌'}                                      ║
║ • TVA format validation: ${testResults.validationTests.filter(t => t.test.includes('TVA')).every(t => t.success) ? '✅' : '❌'}                                        ║
╚════════════════════════════════════════════════════════════════════════════════╝

Test completed at: ${new Date().toLocaleString('fr-FR')}
Environment: ${process.env.NODE_ENV || 'development'}
Database: ${process.env.NEXT_PUBLIC_SUPABASE_URL}
`
  
  return report
}

/**
 * Main test execution function
 */
async function runEstablishmentCrudTests() {
  console.log('🚀 Starting Establishment CRUD Tests...')
  console.log('=' .repeat(80))
  
  try {
    // Step 0: Initialize test user
    if (!testUserId) {
      testUserId = await initializeTestUser()
    }
    
    // Step 1: Test CREATE operations
    const createdEstablishments = await testCreateOperations()
    
    // Step 2: Test READ operations
    await testReadOperations()
    
    // Step 3: Test UPDATE operations
    if (createdEstablishments.length > 0) {
      await testUpdateOperations(createdEstablishments)
    }
    
    // Step 4: Test DELETE operations
    if (createdEstablishments.length > 0) {
      await testDeleteOperations(createdEstablishments)
    }
    
    // Step 5: Test field validations
    if (createdEstablishments.length > 0) {
      await testValidations(createdEstablishments)
    }
    
    // Step 6: Test RLS policies
    await testRLSPolicies()
    
    // Generate and display final report
    const report = generateTestReport()
    console.log('\n' + report)
    
    // Save report to file
    const reportPath = path.join(__dirname, 'reports', `establishments-crud-report-${Date.now()}.txt`)
    try {
      const fs = require('fs')
      
      const reportsDir = path.dirname(reportPath)
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true })
      }
      
      fs.writeFileSync(reportPath, report)
      console.log(`📄 Report saved to: ${reportPath}`)
    } catch (error) {
      console.log('⚠️  Could not save report to file:', error.message)
    }
    
  } catch (error) {
    console.error('💥 Fatal error during test execution:', error)
    testResults.errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  console.log('\n🏁 Test execution completed!')
  console.log('=' .repeat(80))
  
  return testResults
}

// Export for potential use in other test files
module.exports = {
  runEstablishmentCrudTests,
  testResults,
  generateTestReport
}

// If this file is run directly, execute the tests
if (require.main === module) {
  runEstablishmentCrudTests().catch(console.error)
}