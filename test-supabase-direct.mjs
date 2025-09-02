// Test direct de la connectivité Supabase avec ES modules
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qvvpjvgahhgzhtkavhuo.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2dnBqdmdhaGhnemh0a2F2aHVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMzk4OTQ5MiwiZXhwIjoyMDM5NTY1NDkyfQ.YFHd18TLfOJP7oNqcOmvJVz3cjGLjQWZYE9g9NxHX1U'

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🧪 Test de connectivité Supabase avec les vraies credentials')
console.log('==========================================================')

async function testSupabaseConnection() {
  try {
    // Test 1: Connexion de base
    console.log('\n1. Test de connexion de base...')
    const { data: connectionTest, error: connectionError } = await supabaseAdmin
      .from('maintenance_tasks')
      .select('count(*)', { count: 'exact' })
      .limit(0)
    
    if (connectionError) {
      console.error('❌ Erreur de connexion:', connectionError.message)
      return false
    }
    console.log('✅ Connexion Supabase réussie')
    console.log('📊 Nombre de tâches existantes:', connectionTest[0]?.count || 0)
    
    // Test 2: Vérification des tables requises
    console.log('\n2. Vérification des tables requises...')
    
    const tables = ['maintenance_tasks', 'hotels', 'rooms']
    for (const table of tables) {
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(0)
        
        if (error) {
          console.error(`❌ Table ${table} inaccessible:`, error.message)
        } else {
          console.log(`✅ Table ${table} accessible`)
        }
      } catch (err) {
        console.error(`❌ Erreur test table ${table}:`, err.message)
      }
    }
    
    // Test 3: Données de référence
    console.log('\n3. Vérification des données de référence...')
    
    // Vérifier les hôtels
    const { data: hotels, error: hotelsError } = await supabaseAdmin
      .from('hotels')
      .select('id, nom')
      .limit(3)
    
    if (hotelsError) {
      console.error('❌ Erreur récupération hôtels:', hotelsError.message)
      return false
    }
    
    if (!hotels || hotels.length === 0) {
      console.error('❌ Aucun hôtel trouvé dans la base de données')
      return false
    }
    
    console.log('✅ Hôtels disponibles:')
    hotels.forEach(hotel => console.log(`   - ${hotel.id}: ${hotel.nom}`))
    
    const testHotelId = hotels[0].id
    
    // Vérifier les chambres
    const { data: rooms, error: roomsError } = await supabaseAdmin
      .from('rooms')
      .select('id, numero, hotel_id')
      .eq('hotel_id', testHotelId)
      .limit(3)
    
    if (roomsError) {
      console.error('❌ Erreur récupération chambres:', roomsError.message)
      return false
    }
    
    if (!rooms || rooms.length === 0) {
      console.error(`❌ Aucune chambre trouvée pour l'hôtel ${testHotelId}`)
      return false
    }
    
    console.log(`✅ Chambres disponibles pour l'hôtel ${testHotelId}:`)
    rooms.forEach(room => console.log(`   - ${room.id}: Chambre ${room.numero}`))
    
    // Test 4: Simulation de création de tâche (avec rollback)
    console.log('\n4. Test de création de tâche de maintenance...')
    
    const testRoomId = rooms[0].id
    const taskData = {
      titre: 'TEST API - ' + new Date().toISOString(),
      description: 'Tâche de test pour diagnostiquer les erreurs API',
      priorite: 'moyenne',
      statut: 'en_attente',
      responsable: 'API Test',
      hotel_id: testHotelId,
      room_id: testRoomId,
      user_owner_id: 'c8c827c4-419f-409c-a696-e6bf0856984b',
      created_by: 'c8c827c4-419f-409c-a696-e6bf0856984b',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('📝 Données à insérer:')
    console.log(JSON.stringify(taskData, null, 2))
    
    const { data: newTask, error: createError } = await supabaseAdmin
      .from('maintenance_tasks')
      .insert(taskData)
      .select(`
        *,
        room:rooms(numero, bed_type),
        hotel:hotels(nom)
      `)
      .single()
    
    if (createError) {
      console.error('❌ Erreur création tâche:')
      console.error('   Message:', createError.message)
      console.error('   Code:', createError.code)
      console.error('   Détails:', createError.details)
      console.error('   Hint:', createError.hint)
      
      // Diagnostic des erreurs RLS
      if (createError.message.includes('policy') || createError.message.includes('permission') || createError.code === '42501') {
        console.log('\n🔒 Erreur de permissions RLS détectée')
        console.log('   Vérification des politiques...')
        
        try {
          const { data: policies, error: policiesError } = await supabaseAdmin
            .rpc('get_rls_policies', { schema_name: 'public', table_name: 'maintenance_tasks' })
          
          if (policies) {
            console.log('📋 Politiques RLS actives:')
            policies.forEach(policy => {
              console.log(`   - ${policy.policyname}: ${policy.cmd} pour ${policy.roles}`)
            })
          } else if (policiesError) {
            console.log('⚠️ Impossible de récupérer les politiques:', policiesError.message)
          }
        } catch (policyErr) {
          console.log('⚠️ Erreur récupération politiques:', policyErr.message)
        }
      }
      
      // Test des contraintes de colonnes
      if (createError.code === '23502') {  // NOT NULL violation
        console.log('\n📋 Erreur de contrainte NOT NULL détectée')
        console.log('   Colonnes requises manquantes dans les données')
      }
      
      if (createError.code === '23505') {  // UNIQUE violation
        console.log('\n📋 Erreur de contrainte UNIQUE détectée')
        console.log('   Conflit avec des données existantes')
      }
      
      if (createError.code === '23503') {  // FOREIGN KEY violation
        console.log('\n📋 Erreur de contrainte FOREIGN KEY détectée')
        console.log('   Références vers des données inexistantes')
        console.log(`   Vérifiez hotel_id=${testHotelId} et room_id=${testRoomId}`)
      }
      
      return false
    } else {
      console.log('✅ Tâche créée avec succès!')
      console.log('📊 Tâche créée:', JSON.stringify(newTask, null, 2))
      
      // Test 5: Nettoyage
      console.log('\n5. Nettoyage - suppression de la tâche de test...')
      
      const { error: deleteError } = await supabaseAdmin
        .from('maintenance_tasks')
        .delete()
        .eq('id', newTask.id)
      
      if (deleteError) {
        console.error('⚠️ Erreur suppression tâche de test:', deleteError.message)
        console.log(`   Tâche ID ${newTask.id} doit être supprimée manuellement`)
      } else {
        console.log('✅ Tâche de test supprimée avec succès')
      }
    }
    
    console.log('\n🏁 Test terminé avec succès')
    return true
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message)
    console.error('Stack trace:', error.stack)
    return false
  }
}

// Fonction pour tester les types d'erreurs spécifiques
async function testSpecificErrors() {
  console.log('\n🔍 Test d\'erreurs spécifiques...')
  
  const testCases = [
    {
      name: 'Données invalides',
      data: {
        titre: '', // Titre vide
        hotel_id: 999999, // Hôtel inexistant
        room_id: 999999,  // Chambre inexistante
        user_owner_id: 'fake-user-id'
      }
    },
    {
      name: 'Colonnes manquantes',
      data: {
        titre: 'Test colonnes manquantes'
        // Manque hotel_id, user_owner_id, etc.
      }
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`\n   Test: ${testCase.name}`)
    
    try {
      const { error } = await supabaseAdmin
        .from('maintenance_tasks')
        .insert(testCase.data)
        .single()
      
      if (error) {
        console.log(`   ❌ Erreur attendue: ${error.code} - ${error.message}`)
      } else {
        console.log(`   ⚠️ Insertion inattendue réussie`)
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`)
    }
  }
}

// Exécution des tests
async function runAllTests() {
  const success = await testSupabaseConnection()
  
  if (success) {
    await testSpecificErrors()
  }
  
  // Son de notification
  console.log('\a')
}

runAllTests()