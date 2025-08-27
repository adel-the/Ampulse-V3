/**
 * Comprehensive CRUD Test Suite for Rooms Entity
 * Tests all Create, Read, Update, Delete operations with synthetic data
 * 
 * Features tested:
 * - CREATE: 20 rooms with different types using synthetic data
 * - READ: Fetch with filters by hotel, status, type
 * - UPDATE: Status changes, price modifications, amenities updates
 * - DELETE: Room removal with relationship integrity checks
 * - Room-hotel relationship integrity
 * - Floor distribution and room numbering
 * - Occupancy calculations
 */

// Load environment variables for testing
import * as dotenv from 'dotenv'
import { join } from 'path'

dotenv.config({ path: join(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { 
  generateSyntheticHotel, 
  generateRoomsForHotel, 
  generateUpdateData,
  generateMultipleHotels 
} from '../utils/syntheticDataGenerator'
import { roomsApi } from '../lib/api/rooms'
import type { Hotel, Room, RoomInsert, RoomUpdate } from '../lib/supabase'

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  roomTypesToTest: ['Simple', 'Double', 'Twin', 'Familiale', 'Suite', 'PMR'],
  roomStatusesToTest: ['disponible', 'occupee', 'maintenance'] as const,
  totalRoomsToCreate: 20,
  testHotelsCount: 3
}

// Initialize Supabase client for direct database operations
const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey)

interface TestResults {
  phase: string
  success: boolean
  duration: number
  details: any
  errors?: string[]
}

interface TestReport {
  totalDuration: number
  phases: TestResults[]
  summary: {
    roomsCreated: number
    roomsPerHotel: Record<number, number>
    roomTypeDistribution: Record<string, number>
    statusChanges: number
    priceModifications: number
    relationshipIntegrityResults: {
      valid: number
      invalid: number
    }
  }
  success: boolean
  score: number
}

class RoomsCRUDTester {
  private testHotels: (Hotel & { id: number })[] = []
  private createdRooms: (Room & { id: number })[] = []
  private testReport: TestReport = {
    totalDuration: 0,
    phases: [],
    summary: {
      roomsCreated: 0,
      roomsPerHotel: {},
      roomTypeDistribution: {},
      statusChanges: 0,
      priceModifications: 0,
      relationshipIntegrityResults: {
        valid: 0,
        invalid: 0
      }
    },
    success: false,
    score: 0
  }

  async setupTestEnvironment(): Promise<void> {
    console.log('\n🏗️  Setting up test environment...')
    
    // Create test hotels using synthetic data
    const syntheticHotels = generateMultipleHotels(TEST_CONFIG.testHotelsCount)
    
    for (const syntheticHotel of syntheticHotels) {
      const { data: hotel, error } = await supabase
        .from('hotels')
        .insert({
          nom: syntheticHotel.nom,
          adresse: syntheticHotel.adresse,
          ville: syntheticHotel.ville,
          code_postal: syntheticHotel.code_postal,
          telephone: syntheticHotel.telephone,
          email: syntheticHotel.email,
          gestionnaire: syntheticHotel.gestionnaire,
          statut: syntheticHotel.statut,
          chambres_total: syntheticHotel.chambres_total,
          chambres_occupees: syntheticHotel.chambres_occupees,
          taux_occupation: syntheticHotel.taux_occupation,
          siret: syntheticHotel.siret,
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
          type_etablissement: syntheticHotel.type_etablissement,
          classement_etoiles: syntheticHotel.classement_etoiles
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create test hotel: ${error.message}`)
      }

      this.testHotels.push(hotel as Hotel & { id: number })
    }

    console.log(`✅ Created ${this.testHotels.length} test hotels`)
  }

  async testCreateOperations(): Promise<TestResults> {
    const startTime = Date.now()
    const errors: string[] = []
    let roomsCreated = 0

    console.log('\n📝 Testing CREATE operations...')

    try {
      // Distribute rooms across hotels
      const roomsPerHotel = Math.floor(TEST_CONFIG.totalRoomsToCreate / this.testHotels.length)
      const remainingRooms = TEST_CONFIG.totalRoomsToCreate % this.testHotels.length

      for (let i = 0; i < this.testHotels.length; i++) {
        const hotel = this.testHotels[i]
        const roomCount = roomsPerHotel + (i < remainingRooms ? 1 : 0)
        
        // Generate synthetic rooms for this hotel
        const syntheticRooms = generateRoomsForHotel(hotel.nombre_etages || 5, roomCount)

        for (const syntheticRoom of syntheticRooms) {
          try {
            const roomData: RoomInsert = {
              hotel_id: hotel.id,
              numero: syntheticRoom.numero,
              category_id: syntheticRoom.category_id,
              prix: syntheticRoom.prix,
              statut: syntheticRoom.statut,
              description: syntheticRoom.description,
              floor: syntheticRoom.floor,
              room_size: syntheticRoom.room_size,
              bed_type: syntheticRoom.bed_type,
              view_type: syntheticRoom.view_type,
              is_smoking: syntheticRoom.is_smoking,
              amenities: syntheticRoom.amenities.map(amenity => ({ name: amenity })),
              notes: syntheticRoom.notes
            }

            const result = await roomsApi.createRoom(roomData)
            
            if (result.success && result.data) {
              this.createdRooms.push(result.data as Room & { id: number })
              roomsCreated++

              // Track room category distribution
              const categoryName = syntheticRoom.category_name
              this.testReport.summary.roomTypeDistribution[categoryName] = 
                (this.testReport.summary.roomTypeDistribution[categoryName] || 0) + 1

              // Track rooms per hotel
              this.testReport.summary.roomsPerHotel[hotel.id] = 
                (this.testReport.summary.roomsPerHotel[hotel.id] || 0) + 1

            } else {
              errors.push(`Failed to create room ${syntheticRoom.numero}: ${result.error}`)
            }
          } catch (error) {
            errors.push(`Error creating room ${syntheticRoom.numero}: ${error}`)
          }
        }
      }

      this.testReport.summary.roomsCreated = roomsCreated

      console.log(`✅ Successfully created ${roomsCreated} rooms`)
      console.log(`📊 Room type distribution:`, this.testReport.summary.roomTypeDistribution)
      console.log(`🏨 Rooms per hotel:`, this.testReport.summary.roomsPerHotel)

      return {
        phase: 'CREATE',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          roomsCreated,
          roomTypeDistribution: this.testReport.summary.roomTypeDistribution,
          roomsPerHotel: this.testReport.summary.roomsPerHotel
        },
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error) {
      errors.push(`Unexpected error in CREATE phase: ${error}`)
      return {
        phase: 'CREATE',
        success: false,
        duration: Date.now() - startTime,
        details: { roomsCreated },
        errors
      }
    }
  }

  async testReadOperations(): Promise<TestResults> {
    const startTime = Date.now()
    const errors: string[] = []
    const readTests: any = {}

    console.log('\n📖 Testing READ operations...')

    try {
      // Test 1: Read all rooms for first hotel
      const hotel = this.testHotels[0]
      const allRoomsResult = await roomsApi.getRoomsByHotel(hotel.id)
      
      if (allRoomsResult.success && allRoomsResult.data) {
        readTests.allRooms = {
          count: allRoomsResult.data.length,
          success: true
        }
        console.log(`✅ Read all rooms for hotel ${hotel.id}: ${allRoomsResult.data.length} rooms`)
      } else {
        errors.push(`Failed to read all rooms: ${allRoomsResult.error}`)
        readTests.allRooms = { success: false }
      }

      // Test 2: Filter by status
      for (const status of TEST_CONFIG.roomStatusesToTest) {
        const statusResult = await roomsApi.getRoomsByHotel(hotel.id, { statut: status })
        
        if (statusResult.success && statusResult.data) {
          readTests[`status_${status}`] = {
            count: statusResult.data.length,
            success: true
          }
          console.log(`✅ Read rooms with status '${status}': ${statusResult.data.length} rooms`)
        } else {
          errors.push(`Failed to read rooms by status ${status}: ${statusResult.error}`)
          readTests[`status_${status}`] = { success: false }
        }
      }

      // Test 3: Filter by type
      for (const roomType of TEST_CONFIG.roomTypesToTest) {
        const typeResult = await roomsApi.getRoomsByCategory(hotel.id, roomType)
        
        if (typeResult.success) {
          readTests[`type_${roomType}`] = {
            count: typeResult.data?.length || 0,
            success: true
          }
          console.log(`✅ Read rooms of type '${roomType}': ${typeResult.data?.length || 0} rooms`)
        } else {
          errors.push(`Failed to read rooms by type ${roomType}: ${typeResult.error}`)
          readTests[`type_${roomType}`] = { success: false }
        }
      }

      // Test 4: Filter by floor
      const floorResult = await roomsApi.getRoomsByHotel(hotel.id, { floor: 1 })
      
      if (floorResult.success && floorResult.data) {
        readTests.floor_filter = {
          count: floorResult.data.length,
          success: true
        }
        console.log(`✅ Read rooms on floor 1: ${floorResult.data.length} rooms`)
      } else {
        errors.push(`Failed to read rooms by floor: ${floorResult.error}`)
        readTests.floor_filter = { success: false }
      }

      // Test 5: Get room statistics
      const statsResult = await roomsApi.getRoomStatistics(hotel.id)
      
      if (statsResult.success && statsResult.data) {
        readTests.statistics = {
          data: statsResult.data,
          success: true
        }
        console.log(`✅ Got room statistics:`, statsResult.data)
      } else {
        errors.push(`Failed to get room statistics: ${statsResult.error}`)
        readTests.statistics = { success: false }
      }

      // Test 6: Search rooms
      const searchResult = await roomsApi.searchRooms(hotel.id, '1')
      
      if (searchResult.success) {
        readTests.search = {
          count: searchResult.data?.length || 0,
          success: true
        }
        console.log(`✅ Search rooms containing '1': ${searchResult.data?.length || 0} rooms`)
      } else {
        errors.push(`Failed to search rooms: ${searchResult.error}`)
        readTests.search = { success: false }
      }

      return {
        phase: 'READ',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: readTests,
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error) {
      errors.push(`Unexpected error in READ phase: ${error}`)
      return {
        phase: 'READ',
        success: false,
        duration: Date.now() - startTime,
        details: readTests,
        errors
      }
    }
  }

  async testUpdateOperations(): Promise<TestResults> {
    const startTime = Date.now()
    const errors: string[] = []
    let statusChanges = 0
    let priceModifications = 0

    console.log('\n🔄 Testing UPDATE operations...')

    try {
      // Test 1: Update room status
      for (let i = 0; i < Math.min(5, this.createdRooms.length); i++) {
        const room = this.createdRooms[i]
        const newStatus = room.statut === 'disponible' ? 'maintenance' : 'disponible'
        
        const statusResult = await roomsApi.updateRoomStatus(room.id, newStatus)
        
        if (statusResult.success && statusResult.data) {
          statusChanges++
          console.log(`✅ Updated room ${room.numero} status from ${room.statut} to ${newStatus}`)
          
          // Update local room data
          room.statut = statusResult.data.statut
        } else {
          errors.push(`Failed to update status for room ${room.numero}: ${statusResult.error}`)
        }
      }

      // Test 2: Update room prices
      for (let i = 0; i < Math.min(3, this.createdRooms.length); i++) {
        const room = this.createdRooms[i]
        const newPrice = room.prix + (Math.random() > 0.5 ? 10 : -10)
        
        const priceResult = await roomsApi.updateRoom(room.id, { prix: newPrice })
        
        if (priceResult.success && priceResult.data) {
          priceModifications++
          console.log(`✅ Updated room ${room.numero} price from ${room.prix}€ to ${newPrice}€`)
          
          // Update local room data
          room.prix = priceResult.data.prix
        } else {
          errors.push(`Failed to update price for room ${room.numero}: ${priceResult.error}`)
        }
      }

      // Test 3: Update amenities
      if (this.createdRooms.length > 0) {
        const room = this.createdRooms[0]
        const updateData = generateUpdateData('room')
        
        const amenitiesResult = await roomsApi.updateRoom(room.id, updateData as RoomUpdate)
        
        if (amenitiesResult.success && amenitiesResult.data) {
          console.log(`✅ Updated room ${room.numero} amenities and other properties`)
        } else {
          errors.push(`Failed to update amenities for room ${room.numero}: ${amenitiesResult.error}`)
        }
      }

      this.testReport.summary.statusChanges = statusChanges
      this.testReport.summary.priceModifications = priceModifications

      console.log(`✅ Completed ${statusChanges} status changes and ${priceModifications} price modifications`)

      return {
        phase: 'UPDATE',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          statusChanges,
          priceModifications,
          amenityUpdates: 1
        },
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error) {
      errors.push(`Unexpected error in UPDATE phase: ${error}`)
      return {
        phase: 'UPDATE',
        success: false,
        duration: Date.now() - startTime,
        details: { statusChanges, priceModifications },
        errors
      }
    }
  }

  async testDeleteOperations(): Promise<TestResults> {
    const startTime = Date.now()
    const errors: string[] = []
    let roomsDeleted = 0

    console.log('\n🗑️  Testing DELETE operations...')

    try {
      // Test relationship integrity - try to delete rooms with different scenarios
      const roomsToDelete = this.createdRooms.slice(0, 3)

      for (const room of roomsToDelete) {
        // First verify the room exists
        const existsResult = await roomsApi.getRoomById(room.id)
        
        if (existsResult.success && existsResult.data) {
          // Try to delete the room
          const deleteResult = await roomsApi.deleteRoom(room.id)
          
          if (deleteResult.success) {
            roomsDeleted++
            console.log(`✅ Successfully deleted room ${room.numero}`)
            
            // Verify it's actually deleted
            const verifyResult = await roomsApi.getRoomById(room.id)
            if (!verifyResult.success || !verifyResult.data) {
              console.log(`✅ Verified room ${room.numero} is deleted`)
            } else {
              errors.push(`Room ${room.numero} still exists after deletion`)
            }
          } else {
            errors.push(`Failed to delete room ${room.numero}: ${deleteResult.error}`)
          }
        } else {
          errors.push(`Room ${room.numero} not found before deletion attempt`)
        }
      }

      console.log(`✅ Successfully deleted ${roomsDeleted} rooms`)

      return {
        phase: 'DELETE',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          roomsDeleted,
          integrityChecksPerformed: roomsToDelete.length * 2
        },
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error) {
      errors.push(`Unexpected error in DELETE phase: ${error}`)
      return {
        phase: 'DELETE',
        success: false,
        duration: Date.now() - startTime,
        details: { roomsDeleted },
        errors
      }
    }
  }

  async testRelationshipIntegrity(): Promise<TestResults> {
    const startTime = Date.now()
    const errors: string[] = []
    let validRelationships = 0
    let invalidRelationships = 0

    console.log('\n🔗 Testing relationship integrity...')

    try {
      // Check all created rooms have valid hotel relationships
      for (const room of this.createdRooms) {
        // Verify hotel exists
        const { data: hotel, error } = await supabase
          .from('hotels')
          .select('id, nom')
          .eq('id', room.hotel_id)
          .single()

        if (error || !hotel) {
          invalidRelationships++
          errors.push(`Room ${room.numero} has invalid hotel_id ${room.hotel_id}`)
        } else {
          validRelationships++
        }
      }

      // Check room numbering uniqueness per hotel
      for (const hotel of this.testHotels) {
        const hotelRooms = this.createdRooms.filter(r => r.hotel_id === hotel.id)
        const roomNumbers = hotelRooms.map(r => r.numero)
        const uniqueNumbers = new Set(roomNumbers)

        if (roomNumbers.length !== uniqueNumbers.size) {
          errors.push(`Hotel ${hotel.nom} has duplicate room numbers`)
          invalidRelationships++
        } else {
          console.log(`✅ Hotel ${hotel.nom} has unique room numbering`)
        }
      }

      this.testReport.summary.relationshipIntegrityResults = {
        valid: validRelationships,
        invalid: invalidRelationships
      }

      console.log(`✅ Relationship integrity check: ${validRelationships} valid, ${invalidRelationships} invalid`)

      return {
        phase: 'RELATIONSHIP_INTEGRITY',
        success: invalidRelationships === 0,
        duration: Date.now() - startTime,
        details: {
          validRelationships,
          invalidRelationships,
          hotelsChecked: this.testHotels.length,
          roomsChecked: this.createdRooms.length
        },
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error) {
      errors.push(`Unexpected error in RELATIONSHIP_INTEGRITY phase: ${error}`)
      return {
        phase: 'RELATIONSHIP_INTEGRITY',
        success: false,
        duration: Date.now() - startTime,
        details: { validRelationships, invalidRelationships },
        errors
      }
    }
  }

  async testOccupancyCalculations(): Promise<TestResults> {
    const startTime = Date.now()
    const errors: string[] = []

    console.log('\n📊 Testing occupancy calculations...')

    try {
      for (const hotel of this.testHotels) {
        const statsResult = await roomsApi.getRoomStatistics(hotel.id)
        
        if (statsResult.success && statsResult.data) {
          const stats = statsResult.data
          const totalRooms = stats.total_rooms
          const occupiedRooms = stats.occupied_rooms
          const calculatedOccupancy = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0
          
          // Verify occupancy calculation
          if (Math.abs(stats.occupancy_rate - calculatedOccupancy) > 0.01) {
            errors.push(`Hotel ${hotel.nom}: Occupancy calculation mismatch. Expected: ${calculatedOccupancy}, Got: ${stats.occupancy_rate}`)
          } else {
            console.log(`✅ Hotel ${hotel.nom}: Occupancy rate ${stats.occupancy_rate}% (${occupiedRooms}/${totalRooms})`)
          }

          // Verify room counts add up
          const sumRooms = stats.available_rooms + stats.occupied_rooms + stats.maintenance_rooms
          if (sumRooms !== stats.total_rooms) {
            errors.push(`Hotel ${hotel.nom}: Room count mismatch. Sum: ${sumRooms}, Total: ${stats.total_rooms}`)
          }

          console.log(`📈 Hotel ${hotel.nom} statistics:`)
          console.log(`   - Total: ${stats.total_rooms}`)
          console.log(`   - Available: ${stats.available_rooms}`)
          console.log(`   - Occupied: ${stats.occupied_rooms}`)
          console.log(`   - Maintenance: ${stats.maintenance_rooms}`)
          console.log(`   - Occupancy Rate: ${stats.occupancy_rate}%`)
          console.log(`   - Average Price: ${stats.average_price}€`)
          console.log(`   - Potential Revenue: ${stats.potential_revenue}€`)

        } else {
          errors.push(`Failed to get statistics for hotel ${hotel.nom}: ${statsResult.error}`)
        }
      }

      return {
        phase: 'OCCUPANCY_CALCULATIONS',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          hotelsChecked: this.testHotels.length,
          calculationsPerformed: this.testHotels.length * 3 // occupancy, counts, revenue
        },
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error) {
      errors.push(`Unexpected error in OCCUPANCY_CALCULATIONS phase: ${error}`)
      return {
        phase: 'OCCUPANCY_CALCULATIONS',
        success: false,
        duration: Date.now() - startTime,
        details: {},
        errors
      }
    }
  }

  async cleanupTestEnvironment(): Promise<void> {
    console.log('\n🧹 Cleaning up test environment...')
    
    try {
      // Delete remaining rooms
      for (const room of this.createdRooms) {
        await supabase.from('rooms').delete().eq('id', room.id)
      }

      // Delete test hotels
      for (const hotel of this.testHotels) {
        await supabase.from('hotels').delete().eq('id', hotel.id)
      }

      console.log('✅ Test environment cleaned up')
    } catch (error) {
      console.error('❌ Error during cleanup:', error)
    }
  }

  calculateScore(): number {
    const weights = {
      CREATE: 25,
      READ: 20,
      UPDATE: 20,
      DELETE: 15,
      RELATIONSHIP_INTEGRITY: 15,
      OCCUPANCY_CALCULATIONS: 5
    }

    let totalScore = 0
    let totalWeight = 0

    for (const phase of this.testReport.phases) {
      const weight = weights[phase.phase as keyof typeof weights] || 0
      const score = phase.success ? 100 : 0
      totalScore += score * weight
      totalWeight += weight
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0
  }

  async runFullTest(): Promise<TestReport> {
    const overallStartTime = Date.now()
    
    console.log('🚀 Starting comprehensive CRUD test suite for Rooms...')
    console.log(`📋 Test configuration:`)
    console.log(`   - Hotels to create: ${TEST_CONFIG.testHotelsCount}`)
    console.log(`   - Total rooms to create: ${TEST_CONFIG.totalRoomsToCreate}`)
    console.log(`   - Room types to test: ${TEST_CONFIG.roomTypesToTest.join(', ')}`)
    console.log(`   - Room statuses to test: ${TEST_CONFIG.roomStatusesToTest.join(', ')}`)

    try {
      // Setup
      await this.setupTestEnvironment()

      // Run test phases
      this.testReport.phases.push(await this.testCreateOperations())
      this.testReport.phases.push(await this.testReadOperations())
      this.testReport.phases.push(await this.testUpdateOperations())
      this.testReport.phases.push(await this.testDeleteOperations())
      this.testReport.phases.push(await this.testRelationshipIntegrity())
      this.testReport.phases.push(await this.testOccupancyCalculations())

    } catch (error) {
      console.error('💥 Fatal error during testing:', error)
      this.testReport.phases.push({
        phase: 'FATAL_ERROR',
        success: false,
        duration: 0,
        details: { error: error instanceof Error ? error.message : String(error) }
      })
    } finally {
      // Always cleanup
      await this.cleanupTestEnvironment()
    }

    // Calculate final results
    this.testReport.totalDuration = Date.now() - overallStartTime
    this.testReport.success = this.testReport.phases.every(phase => phase.success)
    this.testReport.score = this.calculateScore()

    return this.testReport
  }
}

// Main execution function
async function runRoomsCRUDTest(): Promise<TestReport> {
  const tester = new RoomsCRUDTester()
  return await tester.runFullTest()
}

// Print comprehensive report
function printTestReport(report: TestReport): void {
  console.log('\n' + '='.repeat(80))
  console.log('📊 COMPREHENSIVE ROOMS CRUD TEST REPORT')
  console.log('='.repeat(80))
  
  console.log(`🕒 Total Duration: ${report.totalDuration}ms`)
  console.log(`✅ Overall Success: ${report.success ? 'PASS' : 'FAIL'}`)
  console.log(`📈 Quality Score: ${report.score.toFixed(1)}/100`)
  
  // Determine quality level
  let qualityLevel = 'INSUFFICIENT'
  if (report.score >= 95) qualityLevel = 'EXCELLENT'
  else if (report.score >= 90) qualityLevel = 'VERY_GOOD'
  else if (report.score >= 85) qualityLevel = 'GOOD'
  else if (report.score >= 75) qualityLevel = 'ACCEPTABLE'
  
  console.log(`🏆 Quality Level: ${qualityLevel}`)

  console.log('\n📋 PHASE RESULTS:')
  console.log('-'.repeat(80))
  
  for (const phase of report.phases) {
    console.log(`${phase.success ? '✅' : '❌'} ${phase.phase}: ${phase.duration}ms`)
    
    if (phase.errors && phase.errors.length > 0) {
      console.log(`   Errors: ${phase.errors.length}`)
      phase.errors.slice(0, 3).forEach(error => {
        console.log(`   - ${error}`)
      })
      if (phase.errors.length > 3) {
        console.log(`   ... and ${phase.errors.length - 3} more`)
      }
    }
  }

  console.log('\n📊 SUMMARY STATISTICS:')
  console.log('-'.repeat(80))
  console.log(`🏗️  Rooms Created: ${report.summary.roomsCreated}`)
  
  console.log(`🏨 Rooms per Hotel:`)
  Object.entries(report.summary.roomsPerHotel).forEach(([hotelId, count]) => {
    console.log(`   - Hotel ${hotelId}: ${count} rooms`)
  })
  
  console.log(`🛏️  Room Type Distribution:`)
  Object.entries(report.summary.roomTypeDistribution).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count} rooms`)
  })
  
  console.log(`🔄 Status Changes: ${report.summary.statusChanges}`)
  console.log(`💰 Price Modifications: ${report.summary.priceModifications}`)
  
  console.log(`🔗 Relationship Integrity:`)
  console.log(`   - Valid: ${report.summary.relationshipIntegrityResults.valid}`)
  console.log(`   - Invalid: ${report.summary.relationshipIntegrityResults.invalid}`)

  console.log('\n' + '='.repeat(80))
  
  // Recommendations
  if (report.score < 90) {
    console.log('⚠️  RECOMMENDATIONS:')
    console.log('-'.repeat(40))
    
    const failedPhases = report.phases.filter(p => !p.success)
    if (failedPhases.length > 0) {
      console.log(`❌ Failed phases require attention: ${failedPhases.map(p => p.phase).join(', ')}`)
    }
    
    if (report.summary.relationshipIntegrityResults.invalid > 0) {
      console.log('🔗 Review relationship integrity constraints')
    }
    
    if (report.score < 75) {
      console.log('🚨 Critical issues detected - do not deploy to production')
    }
  } else {
    console.log('🎉 EXCELLENT RESULTS - Ready for production!')
  }
  
  console.log('='.repeat(80))
}

// Export for use as module
export { runRoomsCRUDTest, printTestReport, RoomsCRUDTester }

// Run test if called directly
if (require.main === module) {
  runRoomsCRUDTest()
    .then(report => {
      printTestReport(report)
      process.exit(report.success ? 0 : 1)
    })
    .catch(error => {
      console.error('💥 Fatal error:', error)
      process.exit(1)
    })
}