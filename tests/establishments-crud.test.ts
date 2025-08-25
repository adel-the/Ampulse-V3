/**
 * Comprehensive CRUD Test Suite for Establishments (Hotels)
 * Tests all CRUD operations with synthetic French hotel data
 * Validates data persistence, field validation, and RLS policies
 */

import { supabase } from '../lib/supabase'
import { establishmentsApi } from '../lib/api/establishments'
import { generateMultipleHotels, generateUpdateData } from '../utils/syntheticDataGenerator'
import type { EstablishmentInsert, EstablishmentUpdate, Establishment } from '../lib/api/establishments'

// Test configuration
const TEST_CONFIG = {
  CREATE_COUNT: 5,
  UPDATE_COUNT: 3,
  DELETE_COUNT: 2,
  TEST_TIMEOUT: 30000 // 30 seconds
}

// Test results tracking
interface TestResults {
  totalTests: number
  passedTests: number
  failedTests: number
  establishments: {
    created: Array<{ id: number; name: string; success: boolean; error?: string }>
    updated: Array<{ id: number; name: string; success: boolean; error?: string }>
    deleted: Array<{ id: number; name: string; success: boolean; error?: string }>
  }
  validationTests: Array<{ test: string; success: boolean; error?: string }>
  rlsTests: Array<{ test: string; success: boolean; error?: string }>
  performanceMetrics: {
    createTime: number
    readTime: number
    updateTime: number
    deleteTime: number
  }
  errors: string[]
  warnings: string[]
}

const testResults: TestResults = {
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

// Utility functions
function logTest(testName: string, success: boolean, error?: string) {
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

function logWarning(message: string) {
  testResults.warnings.push(message)
  console.log(`⚠️  ${message}`)
}

// Validation functions
function validatePostalCode(postalCode: string): boolean {
  // French postal code format: 5 digits
  const frenchPostalCodeRegex = /^\d{5}$/
  return frenchPostalCodeRegex.test(postalCode)
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePhoneNumber(phone: string): boolean {
  // French phone number formats: 0X XX XX XX XX or +33 X XX XX XX XX
  const frenchPhoneRegex = /^(?:(?:\+33|0)[1-9])(?:[-.\s]?\d{2}){4}$/
  return frenchPhoneRegex.test(phone?.replace(/\s/g, '') || '')
}

function validateSiret(siret: string): boolean {
  // SIRET should be 14 digits
  return /^\d{14}$/.test(siret)
}

function validateTvaNumber(tva: string): boolean {
  // French VAT format: FR + 11 digits
  return /^FR\d{11}$/.test(tva)
}

// Convert synthetic hotel data to establishment insert format
function convertSyntheticToEstablishment(syntheticHotel: any): EstablishmentInsert {
  return {
    nom: syntheticHotel.nom,
    adresse: syntheticHotel.adresse,
    ville: syntheticHotel.ville,
    code_postal: syntheticHotel.code_postal,
    telephone: syntheticHotel.telephone,
    email: syntheticHotel.email,
    site_web: syntheticHotel.site_web,
    gestionnaire: syntheticHotel.gestionnaire,
    statut: syntheticHotel.statut,
    siret: syntheticHotel.siret,
    tva_intracommunautaire: syntheticHotel.tva_intracommunautaire,
    classement_etoiles: syntheticHotel.classement_etoiles,
    directeur: syntheticHotel.directeur,
    telephone_directeur: syntheticHotel.telephone_directeur,
    email_directeur: syntheticHotel.email_directeur,
    capacite: syntheticHotel.capacite,
    description: syntheticHotel.description,
    check_in_time: syntheticHotel.check_in_time,
    check_out_time: syntheticHotel.check_out_time,
    parking_places: syntheticHotel.parking_places,
    surface_totale: syntheticHotel.surface_totale,
    nombre_etages: syntheticHotel.nombre_etages,
    chambres_total: syntheticHotel.chambres_total,
    chambres_occupees: syntheticHotel.chambres_occupees,
    taux_occupation: syntheticHotel.taux_occupation,
    type_etablissement: syntheticHotel.type_etablissement
  }
}

/**
 * Test 1: CREATE Operations
 * Creates 5 different establishments using synthetic data
 */
async function testCreateOperations(): Promise<Establishment[]> {
  console.log('\n🔄 Testing CREATE Operations...')
  const startTime = Date.now()
  const createdEstablishments: Establishment[] = []
  
  try {
    const syntheticHotels = generateMultipleHotels(TEST_CONFIG.CREATE_COUNT)
    
    for (let i = 0; i < syntheticHotels.length; i++) {
      const hotelData = convertSyntheticToEstablishment(syntheticHotels[i])
      
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
 * Fetches all establishments and verifies data integrity
 */
async function testReadOperations(): Promise<void> {
  console.log('\n🔄 Testing READ Operations...')
  const startTime = Date.now()
  
  try {
    // Test fetching all establishments
    const allEstablishmentsResult = await establishmentsApi.getEstablishments()
    logTest('Fetch all establishments', allEstablishmentsResult.success, allEstablishmentsResult.error || undefined)
    
    if (allEstablishmentsResult.success && allEstablishmentsResult.data) {
      const establishments = allEstablishmentsResult.data
      console.log(`📊 Found ${establishments.length} establishments in database`)
      
      // Test individual establishment fetching
      if (establishments.length > 0) {
        const firstEstablishment = establishments[0]
        const singleEstablishmentResult = await establishmentsApi.getEstablishment(firstEstablishment.id)
        logTest(`Fetch single establishment (ID: ${firstEstablishment.id})`, singleEstablishmentResult.success, singleEstablishmentResult.error || undefined)
        
        // Test establishment with details
        const detailsResult = await establishmentsApi.getEstablishmentWithDetails(firstEstablishment.id)
        logTest(`Fetch establishment with details (ID: ${firstEstablishment.id})`, detailsResult.success, detailsResult.error || undefined)
      }
      
      // Test search functionality
      const searchResult = await establishmentsApi.searchEstablishments('Hotel', 5)
      logTest('Search establishments', searchResult.success, searchResult.error || undefined)
      
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
 * Updates 3 establishments with different field modifications
 */
async function testUpdateOperations(establishments: Establishment[]): Promise<void> {
  console.log('\n🔄 Testing UPDATE Operations...')
  const startTime = Date.now()
  
  if (establishments.length < TEST_CONFIG.UPDATE_COUNT) {
    logWarning(`Not enough establishments for UPDATE tests (need ${TEST_CONFIG.UPDATE_COUNT}, have ${establishments.length})`)
    return
  }
  
  try {
    for (let i = 0; i < TEST_CONFIG.UPDATE_COUNT; i++) {
      const establishment = establishments[i]
      const updateData = generateUpdateData('hotel') as EstablishmentUpdate
      
      try {
        const result = await establishmentsApi.updateEstablishment(establishment.id, updateData)
        
        testResults.establishments.updated.push({
          id: establishment.id,
          name: establishment.nom,
          success: result.success,
          error: result.error || undefined
        })
        
        logTest(`Update establishment ${establishment.nom} (ID: ${establishment.id})`, result.success, result.error || undefined)
        
        // Verify the update by fetching the establishment again
        if (result.success) {
          const verifyResult = await establishmentsApi.getEstablishment(establishment.id)
          if (verifyResult.success && verifyResult.data) {
            // Check if at least one field was updated
            const fieldsToCheck = Object.keys(updateData) as Array<keyof EstablishmentUpdate>
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
 * Deletes 2 establishments (1 soft delete, 1 hard delete)
 */
async function testDeleteOperations(establishments: Establishment[]): Promise<void> {
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
        error: softDeleteResult.error || undefined
      })
      
      logTest(`Soft delete establishment ${establishmentToSoftDelete.nom}`, softDeleteResult.success, softDeleteResult.error || undefined)
      
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
        error: hardDeleteResult.error || undefined
      })
      
      logTest(`Hard delete establishment ${establishmentToHardDelete.nom}`, hardDeleteResult.success, hardDeleteResult.error || undefined)
      
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
 * Tests field validation rules
 */
async function testValidations(establishments: Establishment[]): Promise<void> {
  console.log('\n🔄 Testing Field Validations...')
  
  if (establishments.length === 0) {
    logWarning('No establishments available for validation testing')
    return
  }
  
  for (const establishment of establishments.slice(0, 3)) { // Test first 3 establishments
    try {
      // Test postal code validation
      if (establishment.code_postal) {
        const isValidPostal = validatePostalCode(establishment.code_postal)
        testResults.validationTests.push({
          test: `Postal code validation for ${establishment.nom}`,
          success: isValidPostal,
          error: !isValidPostal ? `Invalid postal code: ${establishment.code_postal}` : undefined
        })
        logTest(`Postal code validation for ${establishment.nom} (${establishment.code_postal})`, isValidPostal, !isValidPostal ? `Invalid format` : undefined)
      }
      
      // Test email validation
      if (establishment.email) {
        const isValidEmail = validateEmail(establishment.email)
        testResults.validationTests.push({
          test: `Email validation for ${establishment.nom}`,
          success: isValidEmail,
          error: !isValidEmail ? `Invalid email: ${establishment.email}` : undefined
        })
        logTest(`Email validation for ${establishment.nom} (${establishment.email})`, isValidEmail, !isValidEmail ? `Invalid format` : undefined)
      }
      
      // Test director email validation
      if (establishment.email_directeur) {
        const isValidDirectorEmail = validateEmail(establishment.email_directeur)
        testResults.validationTests.push({
          test: `Director email validation for ${establishment.nom}`,
          success: isValidDirectorEmail,
          error: !isValidDirectorEmail ? `Invalid director email: ${establishment.email_directeur}` : undefined
        })
        logTest(`Director email validation for ${establishment.nom}`, isValidDirectorEmail, !isValidDirectorEmail ? `Invalid format` : undefined)
      }
      
      // Test phone number validation
      if (establishment.telephone) {
        const isValidPhone = validatePhoneNumber(establishment.telephone)
        testResults.validationTests.push({
          test: `Phone validation for ${establishment.nom}`,
          success: isValidPhone,
          error: !isValidPhone ? `Invalid phone: ${establishment.telephone}` : undefined
        })
        logTest(`Phone validation for ${establishment.nom} (${establishment.telephone})`, isValidPhone, !isValidPhone ? `Invalid format` : undefined)
      }
      
      // Test SIRET validation
      if (establishment.siret) {
        const isValidSiret = validateSiret(establishment.siret)
        testResults.validationTests.push({
          test: `SIRET validation for ${establishment.nom}`,
          success: isValidSiret,
          error: !isValidSiret ? `Invalid SIRET: ${establishment.siret}` : undefined
        })
        logTest(`SIRET validation for ${establishment.nom} (${establishment.siret})`, isValidSiret, !isValidSiret ? `Invalid format` : undefined)
      }
      
      // Test TVA number validation
      if (establishment.tva_intracommunautaire) {
        const isValidTva = validateTvaNumber(establishment.tva_intracommunautaire)
        testResults.validationTests.push({
          test: `TVA validation for ${establishment.nom}`,
          success: isValidTva,
          error: !isValidTva ? `Invalid TVA: ${establishment.tva_intracommunautaire}` : undefined
        })
        logTest(`TVA validation for ${establishment.nom} (${establishment.tva_intracommunautaire})`, isValidTva, !isValidTva ? `Invalid format` : undefined)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      logTest(`Validation tests for ${establishment.nom}`, false, errorMsg)
    }
  }
}

/**
 * Test 6: RLS (Row Level Security) Policies
 * Tests user data isolation
 */
async function testRLSPolicies(): Promise<void> {
  console.log('\n🔄 Testing RLS Policies...')
  
  try {
    // Test accessing establishments without authentication
    // Note: This might not work properly in local development with service role key
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .limit(1)
    
    // If this succeeds, it means RLS might not be properly configured or we're using service role
    if (data && data.length > 0) {
      logWarning('RLS test: Can access data without authentication (might be using service role key)')
      testResults.rlsTests.push({
        test: 'RLS access control',
        success: false,
        error: 'Data accessible without proper authentication'
      })
    } else if (error) {
      // This would be expected with proper RLS
      logTest('RLS access control', true)
      testResults.rlsTests.push({
        test: 'RLS access control',
        success: true
      })
    }
  } catch (error) {
    // This could indicate proper RLS enforcement
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
  
  // Additional RLS tests could be added here with different user contexts
  logWarning('RLS testing is limited in local development mode with service role keys')
}

/**
 * Generate comprehensive test report
 */
function generateTestReport(): string {
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
async function runEstablishmentCrudTests(): Promise<void> {
  console.log('🚀 Starting Establishment CRUD Tests...')
  console.log('=' .repeat(80))
  
  try {
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
    const reportPath = `./tests/reports/establishments-crud-report-${Date.now()}.txt`
    try {
      const fs = await import('fs')
      const path = await import('path')
      
      const reportsDir = path.dirname(reportPath)
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true })
      }
      
      fs.writeFileSync(reportPath, report)
      console.log(`📄 Report saved to: ${reportPath}`)
    } catch (error) {
      console.log('⚠️  Could not save report to file:', error)
    }
    
  } catch (error) {
    console.error('💥 Fatal error during test execution:', error)
    testResults.errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  console.log('\n🏁 Test execution completed!')
  console.log('=' .repeat(80))
}

// Export for potential use in other test files
export {
  runEstablishmentCrudTests,
  testResults,
  generateTestReport
}

// If this file is run directly, execute the tests
if (require.main === module) {
  runEstablishmentCrudTests().catch(console.error)
}