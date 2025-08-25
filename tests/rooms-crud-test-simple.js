/**
 * Simple Rooms CRUD Test with Comprehensive Coverage
 * Uses JavaScript for better compatibility and includes synthetic data
 */

const { createClient } = require('@supabase/supabase-js')

// Synthetic data generation functions (embedded to avoid module issues)
function generateSyntheticHotel() {
  const cities = [
    { ville: 'Paris', codePostal: '75001' },
    { ville: 'Lyon', codePostal: '69001' },
    { ville: 'Marseille', codePostal: '13001' },
    { ville: 'Toulouse', codePostal: '31000' },
    { ville: 'Nice', codePostal: '06000' }
  ]

  const hotelPrefixes = ['Hôtel', 'Le', 'La', 'Résidence', 'Domaine']
  const hotelSuffixes = ['Royal', 'Palace', 'Grand', 'Moderne', 'Élégant', 'du Parc', 'de la Gare']

  const city = cities[Math.floor(Math.random() * cities.length)]
  const prefix = hotelPrefixes[Math.floor(Math.random() * hotelPrefixes.length)]
  const suffix = hotelSuffixes[Math.floor(Math.random() * hotelSuffixes.length)]
  const totalRooms = 10 + Math.floor(Math.random() * 40)
  const occupiedRooms = Math.floor(Math.random() * totalRooms)

  return {
    nom: `${prefix} ${suffix}`,
    adresse: `${Math.floor(Math.random() * 999) + 1} rue ${suffix}`,
    ville: city.ville,
    code_postal: city.codePostal,
    type_etablissement: ['hotel', 'residence', 'foyer'][Math.floor(Math.random() * 3)],
    telephone: `01${Math.floor(Math.random() * 90000000) + 10000000}`,
    email: `contact@hotel-${suffix.toLowerCase().replace(/\s+/g, '')}.fr`,
    gestionnaire: `${['Jean', 'Marie', 'Pierre', 'Sophie'][Math.floor(Math.random() * 4)]} ${['Martin', 'Dupont', 'Bernard'][Math.floor(Math.random() * 3)]}`,
    statut: Math.random() > 0.2 ? 'ACTIF' : 'INACTIF',
    chambres_total: totalRooms,
    chambres_occupees: occupiedRooms,
    taux_occupation: parseFloat(((occupiedRooms / totalRooms) * 100).toFixed(2)),
    siret: Math.floor(Math.random() * 90000000000000) + 10000000000000,
    directeur: `${['Paul', 'Claire', 'Michel'][Math.floor(Math.random() * 3)]} ${['Durand', 'Moreau'][Math.floor(Math.random() * 2)]}`,
    telephone_directeur: `06${Math.floor(Math.random() * 90000000) + 10000000}`,
    email_directeur: `directeur@hotel-${suffix.toLowerCase().replace(/\s+/g, '')}.fr`,
    capacite: totalRooms * 2,
    description: `Un établissement ${['moderne', 'traditionnel', 'contemporain'][Math.floor(Math.random() * 3)]} situé à ${city.ville}`,
    check_in_time: ['14:00', '15:00', '16:00'][Math.floor(Math.random() * 3)],
    check_out_time: ['10:00', '11:00', '12:00'][Math.floor(Math.random() * 3)],
    parking_places: Math.floor(Math.random() * 46) + 5,
    surface_totale: Math.floor(Math.random() * 4500) + 500,
    nombre_etages: Math.floor(Math.random() * 10) + 1,
    classement_etoiles: Math.floor(Math.random() * 5) + 1
  }
}

function generateSyntheticRoom(floorCount = 5) {
  const roomTypes = [
    { type: 'Simple', basePrice: 45 },
    { type: 'Double', basePrice: 65 },
    { type: 'Twin', basePrice: 65 },
    { type: 'Familiale', basePrice: 95 },
    { type: 'Suite', basePrice: 120 },
    { type: 'PMR', basePrice: 55 }
  ]
  
  const bedTypes = ['Lit simple', 'Lit double', 'Lits jumeaux', 'Lit Queen Size']
  const viewTypes = ['Vue mer', 'Vue jardin', 'Vue ville', 'Vue cour intérieure']
  const amenities = ['WiFi', 'TV', 'Climatisation', 'Minibar', 'Coffre-fort', 'Salle de bain privée']
  
  const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)]
  const floor = Math.floor(Math.random() * floorCount)
  const roomNumber = `${floor}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`
  
  const priceVariation = 0.8 + Math.random() * 0.5
  const finalPrice = Math.round(roomType.basePrice * priceVariation)
  
  const numberOfAmenities = 3 + Math.floor(Math.random() * 5)
  const selectedAmenities = []
  for (let i = 0; i < numberOfAmenities; i++) {
    const amenity = amenities[Math.floor(Math.random() * amenities.length)]
    if (!selectedAmenities.includes(amenity)) {
      selectedAmenities.push(amenity)
    }
  }
  
  const statuses = ['disponible', 'occupee', 'maintenance']
  const weights = [60, 35, 5]
  let random = Math.random() * 100
  let status = statuses[0]
  let cumulative = 0
  
  for (let i = 0; i < statuses.length; i++) {
    cumulative += weights[i]
    if (random <= cumulative) {
      status = statuses[i]
      break
    }
  }
  
  return {
    numero: roomNumber,
    type: roomType.type,
    prix: finalPrice,
    statut: status,
    description: `${roomType.type} ${['confortable', 'moderne', 'spacieuse'][Math.floor(Math.random() * 3)]}`,
    floor: floor,
    room_size: 15 + Math.floor(Math.random() * 20),
    bed_type: bedTypes[Math.floor(Math.random() * bedTypes.length)],
    view_type: viewTypes[Math.floor(Math.random() * viewTypes.length)],
    is_smoking: Math.random() < 0.1,
    amenities: selectedAmenities,
    notes: Math.random() < 0.3 ? 'Notes spéciales pour cette chambre' : null
  }
}

function generateRoomsForHotel(hotelFloors, roomCount) {
  const rooms = []
  const usedNumbers = new Set()
  
  for (let i = 0; i < roomCount; i++) {
    let room
    let attempts = 0
    
    do {
      room = generateSyntheticRoom(hotelFloors)
      attempts++
    } while (usedNumbers.has(room.numero) && attempts < 100)
    
    if (!usedNumbers.has(room.numero)) {
      usedNumbers.add(room.numero)
      rooms.push(room)
    }
  }
  
  return rooms
}

function generateMultipleHotels(count) {
  const hotels = []
  for (let i = 0; i < count; i++) {
    hotels.push(generateSyntheticHotel())
  }
  return hotels
}

function generateUpdateData(entityType) {
  const amenities = ['WiFi Premium', 'Room Service', 'Balcon', 'Jacuzzi', 'Vue panoramique']
  
  if (entityType === 'room') {
    return {
      prix: 40 + Math.random() * 200,
      statut: ['disponible', 'occupee', 'maintenance'][Math.floor(Math.random() * 3)],
      description: 'Chambre mise à jour avec de nouveaux équipements',
      amenities: amenities.slice(0, 2 + Math.floor(Math.random() * 3))
    }
  }
  
  return {}
}

// Load environment variables
require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') })

// Test configuration
const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  roomTypesToTest: ['Simple', 'Double', 'Twin', 'Familiale', 'Suite', 'PMR'],
  roomStatusesToTest: ['disponible', 'occupee', 'maintenance'],
  totalRoomsToCreate: 20,
  testHotelsCount: 3
}

console.log('🔧 Configuration:')
console.log('   Supabase URL:', TEST_CONFIG.supabaseUrl)
console.log('   Has Service Role Key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
console.log('   Has Anon Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Initialize Supabase client with service role for admin operations
const supabase = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseKey)

class RoomsCRUDTester {
  constructor() {
    this.testHotels = []
    this.createdRooms = []
    this.testReport = {
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
  }

  async testConnection() {
    console.log('\n🔌 Testing Supabase connection...')
    
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('count')
        .limit(1)

      if (error) {
        console.error('❌ Connection failed:', error.message)
        return false
      }

      console.log('✅ Supabase connection successful')
      return true
    } catch (err) {
      console.error('❌ Connection error:', err.message)
      return false
    }
  }

  async setupTestEnvironment() {
    console.log('\n🏗️  Setting up test environment...')
    
    // First, check if there are existing hotels we can use
    const { data: existingHotels, error: fetchError } = await supabase
      .from('hotels')
      .select('*')
      .limit(TEST_CONFIG.testHotelsCount)

    if (fetchError) {
      console.error('❌ Error fetching existing hotels:', fetchError.message)
    }

    if (existingHotels && existingHotels.length >= TEST_CONFIG.testHotelsCount) {
      // Use existing hotels
      this.testHotels = existingHotels.slice(0, TEST_CONFIG.testHotelsCount)
      console.log(`✅ Using ${this.testHotels.length} existing hotels for testing`)
      
      for (const hotel of this.testHotels) {
        console.log(`   - ${hotel.nom} (ID: ${hotel.id})`)
      }
    } else {
      // Create new test hotels with a default test user ID
      const testUserId = '3a160e48-007a-4571-88a9-cbf3c6a63e35' // Use existing user ID from the system
      const syntheticHotels = generateMultipleHotels(TEST_CONFIG.testHotelsCount)
      
      for (const syntheticHotel of syntheticHotels) {
        try {
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
              classement_etoiles: syntheticHotel.classement_etoiles,
              user_owner_id: testUserId // Add the required user_owner_id
            })
            .select()
            .single()

          if (error) {
            throw new Error(`Failed to create test hotel: ${error.message}`)
          }

          this.testHotels.push(hotel)
          console.log(`✅ Created hotel: ${hotel.nom} (ID: ${hotel.id})`)
        } catch (error) {
          console.error(`❌ Error creating hotel ${syntheticHotel.nom}:`, error.message)
          throw error
        }
      }
    }

    console.log(`✅ Setup completed with ${this.testHotels.length} hotels`)
  }

  async testCreateOperations() {
    const startTime = Date.now()
    const errors = []
    let roomsCreated = 0

    console.log('\n📝 Testing CREATE operations...')

    try {
      // Distribute rooms across hotels
      const roomsPerHotel = Math.floor(TEST_CONFIG.totalRoomsToCreate / this.testHotels.length)
      const remainingRooms = TEST_CONFIG.totalRoomsToCreate % this.testHotels.length

      for (let i = 0; i < this.testHotels.length; i++) {
        const hotel = this.testHotels[i]
        const roomCount = roomsPerHotel + (i < remainingRooms ? 1 : 0)
        
        console.log(`   Creating ${roomCount} rooms for hotel ${hotel.nom}`)
        
        // Generate synthetic rooms for this hotel
        const syntheticRooms = generateRoomsForHotel(hotel.nombre_etages || 5, roomCount)

        for (const syntheticRoom of syntheticRooms) {
          try {
            const roomData = {
              hotel_id: hotel.id,
              numero: syntheticRoom.numero,
              type: syntheticRoom.type,
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

            const { data: room, error } = await supabase
              .from('rooms')
              .insert(roomData)
              .select()
              .single()
            
            if (error) {
              errors.push(`Failed to create room ${syntheticRoom.numero}: ${error.message}`)
              continue
            }

            this.createdRooms.push(room)
            roomsCreated++

            // Track room type distribution
            const roomType = room.type
            this.testReport.summary.roomTypeDistribution[roomType] = 
              (this.testReport.summary.roomTypeDistribution[roomType] || 0) + 1

            // Track rooms per hotel
            this.testReport.summary.roomsPerHotel[hotel.id] = 
              (this.testReport.summary.roomsPerHotel[hotel.id] || 0) + 1

          } catch (error) {
            errors.push(`Error creating room ${syntheticRoom.numero}: ${error.message}`)
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
      errors.push(`Unexpected error in CREATE phase: ${error.message}`)
      return {
        phase: 'CREATE',
        success: false,
        duration: Date.now() - startTime,
        details: { roomsCreated },
        errors
      }
    }
  }

  async testReadOperations() {
    const startTime = Date.now()
    const errors = []
    const readTests = {}

    console.log('\n📖 Testing READ operations...')

    try {
      const hotel = this.testHotels[0]

      // Test 1: Read all rooms for first hotel
      const { data: allRooms, error: allRoomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', hotel.id)
      
      if (allRoomsError) {
        errors.push(`Failed to read all rooms: ${allRoomsError.message}`)
        readTests.allRooms = { success: false }
      } else {
        readTests.allRooms = {
          count: allRooms.length,
          success: true
        }
        console.log(`✅ Read all rooms for hotel ${hotel.nom}: ${allRooms.length} rooms`)
      }

      // Test 2: Filter by status
      for (const status of TEST_CONFIG.roomStatusesToTest) {
        const { data: statusRooms, error: statusError } = await supabase
          .from('rooms')
          .select('*')
          .eq('hotel_id', hotel.id)
          .eq('statut', status)
        
        if (statusError) {
          errors.push(`Failed to read rooms by status ${status}: ${statusError.message}`)
          readTests[`status_${status}`] = { success: false }
        } else {
          readTests[`status_${status}`] = {
            count: statusRooms.length,
            success: true
          }
          console.log(`✅ Read rooms with status '${status}': ${statusRooms.length} rooms`)
        }
      }

      // Test 3: Filter by type
      for (const roomType of TEST_CONFIG.roomTypesToTest) {
        const { data: typeRooms, error: typeError } = await supabase
          .from('rooms')
          .select('*')
          .eq('hotel_id', hotel.id)
          .eq('type', roomType)
        
        if (typeError) {
          errors.push(`Failed to read rooms by type ${roomType}: ${typeError.message}`)
          readTests[`type_${roomType}`] = { success: false }
        } else {
          readTests[`type_${roomType}`] = {
            count: typeRooms.length,
            success: true
          }
          console.log(`✅ Read rooms of type '${roomType}': ${typeRooms.length} rooms`)
        }
      }

      // Test 4: Filter by floor
      const { data: floorRooms, error: floorError } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', hotel.id)
        .eq('floor', 1)
      
      if (floorError) {
        errors.push(`Failed to read rooms by floor: ${floorError.message}`)
        readTests.floor_filter = { success: false }
      } else {
        readTests.floor_filter = {
          count: floorRooms.length,
          success: true
        }
        console.log(`✅ Read rooms on floor 1: ${floorRooms.length} rooms`)
      }

      // Test 5: Get single room
      if (this.createdRooms.length > 0) {
        const testRoom = this.createdRooms[0]
        const { data: singleRoom, error: singleError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', testRoom.id)
          .single()
        
        if (singleError) {
          errors.push(`Failed to read single room: ${singleError.message}`)
          readTests.single_room = { success: false }
        } else {
          readTests.single_room = {
            roomNumber: singleRoom.numero,
            success: true
          }
          console.log(`✅ Read single room: ${singleRoom.numero}`)
        }
      }

      return {
        phase: 'READ',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: readTests,
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error) {
      errors.push(`Unexpected error in READ phase: ${error.message}`)
      return {
        phase: 'READ',
        success: false,
        duration: Date.now() - startTime,
        details: readTests,
        errors
      }
    }
  }

  async testUpdateOperations() {
    const startTime = Date.now()
    const errors = []
    let statusChanges = 0
    let priceModifications = 0

    console.log('\n🔄 Testing UPDATE operations...')

    try {
      // Test 1: Update room status
      for (let i = 0; i < Math.min(5, this.createdRooms.length); i++) {
        const room = this.createdRooms[i]
        const newStatus = room.statut === 'disponible' ? 'maintenance' : 'disponible'
        
        const { data: updatedRoom, error } = await supabase
          .from('rooms')
          .update({ 
            statut: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', room.id)
          .select()
          .single()
        
        if (error) {
          errors.push(`Failed to update status for room ${room.numero}: ${error.message}`)
        } else {
          statusChanges++
          console.log(`✅ Updated room ${room.numero} status from ${room.statut} to ${newStatus}`)
          room.statut = updatedRoom.statut
        }
      }

      // Test 2: Update room prices
      for (let i = 0; i < Math.min(3, this.createdRooms.length); i++) {
        const room = this.createdRooms[i]
        const newPrice = room.prix + (Math.random() > 0.5 ? 10 : -10)
        
        const { data: updatedRoom, error } = await supabase
          .from('rooms')
          .update({ 
            prix: newPrice,
            updated_at: new Date().toISOString()
          })
          .eq('id', room.id)
          .select()
          .single()
        
        if (error) {
          errors.push(`Failed to update price for room ${room.numero}: ${error.message}`)
        } else {
          priceModifications++
          console.log(`✅ Updated room ${room.numero} price from ${room.prix}€ to ${newPrice}€`)
          room.prix = updatedRoom.prix
        }
      }

      // Test 3: Update amenities
      if (this.createdRooms.length > 0) {
        const room = this.createdRooms[0]
        const updateData = generateUpdateData('room')
        
        const { data: updatedRoom, error } = await supabase
          .from('rooms')
          .update({
            ...updateData,
            amenities: updateData.amenities ? updateData.amenities.map(a => ({ name: a })) : undefined,
            updated_at: new Date().toISOString()
          })
          .eq('id', room.id)
          .select()
          .single()
        
        if (error) {
          errors.push(`Failed to update amenities for room ${room.numero}: ${error.message}`)
        } else {
          console.log(`✅ Updated room ${room.numero} amenities and other properties`)
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
      errors.push(`Unexpected error in UPDATE phase: ${error.message}`)
      return {
        phase: 'UPDATE',
        success: false,
        duration: Date.now() - startTime,
        details: { statusChanges, priceModifications },
        errors
      }
    }
  }

  async testDeleteOperations() {
    const startTime = Date.now()
    const errors = []
    let roomsDeleted = 0

    console.log('\n🗑️  Testing DELETE operations...')

    try {
      const roomsToDelete = this.createdRooms.slice(0, 3)

      for (const room of roomsToDelete) {
        // First verify the room exists
        const { data: existingRoom, error: existsError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', room.id)
          .single()
        
        if (existsError) {
          errors.push(`Room ${room.numero} not found before deletion attempt: ${existsError.message}`)
          continue
        }

        // Try to delete the room
        const { error: deleteError } = await supabase
          .from('rooms')
          .delete()
          .eq('id', room.id)
        
        if (deleteError) {
          errors.push(`Failed to delete room ${room.numero}: ${deleteError.message}`)
        } else {
          roomsDeleted++
          console.log(`✅ Successfully deleted room ${room.numero}`)
          
          // Verify it's actually deleted
          const { data: verifyRoom, error: verifyError } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', room.id)
            .single()
          
          if (verifyError && verifyError.code === 'PGRST116') {
            console.log(`✅ Verified room ${room.numero} is deleted`)
          } else if (verifyRoom) {
            errors.push(`Room ${room.numero} still exists after deletion`)
          }
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
      errors.push(`Unexpected error in DELETE phase: ${error.message}`)
      return {
        phase: 'DELETE',
        success: false,
        duration: Date.now() - startTime,
        details: { roomsDeleted },
        errors
      }
    }
  }

  async testRelationshipIntegrity() {
    const startTime = Date.now()
    const errors = []
    let validRelationships = 0
    let invalidRelationships = 0

    console.log('\n🔗 Testing relationship integrity...')

    try {
      // Check all created rooms have valid hotel relationships
      for (const room of this.createdRooms) {
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
      errors.push(`Unexpected error in RELATIONSHIP_INTEGRITY phase: ${error.message}`)
      return {
        phase: 'RELATIONSHIP_INTEGRITY',
        success: false,
        duration: Date.now() - startTime,
        details: { validRelationships, invalidRelationships },
        errors
      }
    }
  }

  async testOccupancyCalculations() {
    const startTime = Date.now()
    const errors = []

    console.log('\n📊 Testing occupancy calculations...')

    try {
      for (const hotel of this.testHotels) {
        const { data: rooms, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('hotel_id', hotel.id)
        
        if (error) {
          errors.push(`Failed to get rooms for hotel ${hotel.nom}: ${error.message}`)
          continue
        }

        const totalRooms = rooms.length
        const availableRooms = rooms.filter(r => r.statut === 'disponible').length
        const occupiedRooms = rooms.filter(r => r.statut === 'occupee').length
        const maintenanceRooms = rooms.filter(r => r.statut === 'maintenance').length
        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

        const totalPrice = rooms.reduce((sum, r) => sum + (Number(r.prix) || 0), 0)
        const averagePrice = totalRooms > 0 ? totalPrice / totalRooms : 0

        const potentialRevenue = rooms
          .filter(r => r.statut === 'disponible')
          .reduce((sum, r) => sum + (Number(r.prix) || 0), 0)

        // Verify room counts add up
        const sumRooms = availableRooms + occupiedRooms + maintenanceRooms
        if (sumRooms !== totalRooms) {
          errors.push(`Hotel ${hotel.nom}: Room count mismatch. Sum: ${sumRooms}, Total: ${totalRooms}`)
        }

        console.log(`📈 Hotel ${hotel.nom} statistics:`)
        console.log(`   - Total: ${totalRooms}`)
        console.log(`   - Available: ${availableRooms}`)
        console.log(`   - Occupied: ${occupiedRooms}`)
        console.log(`   - Maintenance: ${maintenanceRooms}`)
        console.log(`   - Occupancy Rate: ${occupancyRate.toFixed(2)}%`)
        console.log(`   - Average Price: ${averagePrice.toFixed(2)}€`)
        console.log(`   - Potential Revenue: ${potentialRevenue.toFixed(2)}€`)
      }

      return {
        phase: 'OCCUPANCY_CALCULATIONS',
        success: errors.length === 0,
        duration: Date.now() - startTime,
        details: {
          hotelsChecked: this.testHotels.length,
          calculationsPerformed: this.testHotels.length * 3
        },
        errors: errors.length > 0 ? errors : undefined
      }

    } catch (error) {
      errors.push(`Unexpected error in OCCUPANCY_CALCULATIONS phase: ${error.message}`)
      return {
        phase: 'OCCUPANCY_CALCULATIONS',
        success: false,
        duration: Date.now() - startTime,
        details: {},
        errors
      }
    }
  }

  async cleanupTestEnvironment() {
    console.log('\n🧹 Cleaning up test environment...')
    
    try {
      // Delete remaining test rooms
      console.log(`   Cleaning up ${this.createdRooms.length} test rooms...`)
      for (const room of this.createdRooms) {
        const { error } = await supabase.from('rooms').delete().eq('id', room.id)
        if (error) {
          console.error(`   Warning: Could not delete room ${room.numero}: ${error.message}`)
        }
      }

      console.log('✅ Test environment cleaned up (rooms only, hotels preserved)')
    } catch (error) {
      console.error('❌ Error during cleanup:', error.message)
    }
  }

  calculateScore() {
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
      const weight = weights[phase.phase] || 0
      const score = phase.success ? 100 : 0
      totalScore += score * weight
      totalWeight += weight
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0
  }

  async runFullTest() {
    const overallStartTime = Date.now()
    
    console.log('🚀 Starting comprehensive CRUD test suite for Rooms...')
    console.log(`📋 Test configuration:`)
    console.log(`   - Hotels to create: ${TEST_CONFIG.testHotelsCount}`)
    console.log(`   - Total rooms to create: ${TEST_CONFIG.totalRoomsToCreate}`)
    console.log(`   - Room types to test: ${TEST_CONFIG.roomTypesToTest.join(', ')}`)
    console.log(`   - Room statuses to test: ${TEST_CONFIG.roomStatusesToTest.join(', ')}`)

    // Test connection first
    const connectionOk = await this.testConnection()
    if (!connectionOk) {
      this.testReport.success = false
      this.testReport.totalDuration = Date.now() - overallStartTime
      return this.testReport
    }

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
      console.error('💥 Fatal error during testing:', error.message)
      this.testReport.phases.push({
        phase: 'FATAL_ERROR',
        success: false,
        duration: 0,
        details: { error: error.message }
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

function printTestReport(report) {
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

// Main execution
async function main() {
  const tester = new RoomsCRUDTester()
  
  try {
    const report = await tester.runFullTest()
    printTestReport(report)
    process.exit(report.success ? 0 : 1)
  } catch (error) {
    console.error('💥 Fatal error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { RoomsCRUDTester, printTestReport }