// Test avec les vraies credentials locales Supabase
import { createClient } from '@supabase/supabase-js'

// Credentials locales depuis .env.local
const supabaseUrl = 'http://127.0.0.1:15421'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Client standard (anon role)
const supabase = createClient(supabaseUrl, supabaseAnonKey)
// Client admin (service role)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🧪 Test de création de tâches de maintenance avec Supabase local')
console.log('================================================================')

async function testMaintenanceTaskCreation() {
  try {
    console.log('\n1. Test de récupération des tâches existantes...')
    const { data: existingTasks, error: fetchError } = await supabaseAdmin
      .from('maintenance_tasks')
      .select('*')
      .limit(3)
    
    if (fetchError) {
      console.error('❌ Erreur récupération tâches:', fetchError.message)
      return false
    }
    
    console.log('✅ Tâches existantes récupérées:', existingTasks.length)
    if (existingTasks.length > 0) {
      console.log('📊 Exemple de tâche:', JSON.stringify(existingTasks[0], null, 2))
    }
    
    console.log('\n2. Test de récupération des hôtels et chambres...')
    
    // Récupérer les hôtels
    const { data: hotels, error: hotelsError } = await supabaseAdmin
      .from('hotels')
      .select('id, nom')
      .limit(3)
    
    if (hotelsError) {
      console.error('❌ Erreur récupération hôtels:', hotelsError.message)
      return false
    }
    
    if (!hotels || hotels.length === 0) {
      console.error('❌ Aucun hôtel trouvé')
      return false
    }
    
    console.log('✅ Hôtels disponibles:', hotels.map(h => `${h.id}: ${h.nom}`))
    const testHotelId = hotels[0].id
    
    // Récupérer les chambres
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
    
    console.log('✅ Chambres disponibles:', rooms.map(r => `${r.id}: Room ${r.numero}`))
    const testRoomId = rooms[0].id
    
    console.log('\n3. Test de création avec rôle anon (comme dans l\'app)...')
    
    const taskDataAnon = {
      titre: 'TEST ANON - ' + new Date().toISOString(),
      description: 'Test avec rôle anon comme dans l\'application',
      priorite: 'moyenne',
      statut: 'en_attente',
      responsable: 'Test User Anon',
      hotel_id: testHotelId,
      room_id: testRoomId,
      user_owner_id: 'c8c827c4-419f-409c-a696-e6bf0856984b',
      created_by: 'c8c827c4-419f-409c-a696-e6bf0856984b'
    }
    
    console.log('📝 Données avec rôle anon:')
    console.log(JSON.stringify(taskDataAnon, null, 2))
    
    const { data: anonTask, error: anonError } = await supabase
      .from('maintenance_tasks')
      .insert(taskDataAnon)
      .select(`
        *,
        room:rooms(numero, bed_type),
        hotel:hotels(nom)
      `)
      .single()
    
    if (anonError) {
      console.error('❌ Erreur création avec rôle anon:')
      console.error('   Message:', anonError.message)
      console.error('   Code:', anonError.code)
      console.error('   Détails:', anonError.details)
      
      if (anonError.code === '42501') {
        console.log('🔒 Erreur de permissions RLS avec rôle anon')
      }
    } else {
      console.log('✅ Tâche créée avec rôle anon!')
      console.log('📊 Tâche créée:', JSON.stringify(anonTask, null, 2))
      
      // Nettoyer
      await supabaseAdmin
        .from('maintenance_tasks')
        .delete()
        .eq('id', anonTask.id)
      console.log('🧹 Tâche de test supprimée')
    }
    
    console.log('\n4. Test de création avec rôle service_role (admin)...')
    
    const taskDataAdmin = {
      titre: 'TEST ADMIN - ' + new Date().toISOString(),
      description: 'Test avec rôle service_role',
      priorite: 'haute',
      statut: 'en_attente',
      responsable: 'Test User Admin',
      hotel_id: testHotelId,
      room_id: testRoomId,
      user_owner_id: 'c8c827c4-419f-409c-a696-e6bf0856984b',
      created_by: 'c8c827c4-419f-409c-a696-e6bf0856984b'
    }
    
    console.log('📝 Données avec rôle admin:')
    console.log(JSON.stringify(taskDataAdmin, null, 2))
    
    const { data: adminTask, error: adminError } = await supabaseAdmin
      .from('maintenance_tasks')
      .insert(taskDataAdmin)
      .select(`
        *,
        room:rooms(numero, bed_type),
        hotel:hotels(nom)
      `)
      .single()
    
    if (adminError) {
      console.error('❌ Erreur création avec rôle admin:')
      console.error('   Message:', adminError.message)
      console.error('   Code:', adminError.code)
      console.error('   Détails:', adminError.details)
    } else {
      console.log('✅ Tâche créée avec rôle admin!')
      console.log('📊 Tâche créée:', JSON.stringify(adminTask, null, 2))
      
      // Nettoyer
      const { error: deleteError } = await supabaseAdmin
        .from('maintenance_tasks')
        .delete()
        .eq('id', adminTask.id)
      
      if (deleteError) {
        console.error('⚠️ Erreur suppression:', deleteError.message)
      } else {
        console.log('🧹 Tâche de test supprimée')
      }
    }
    
    console.log('\n5. Test avec des données comme dans l\'API de l\'app...')
    
    // Simuler l'appel de createMaintenanceTask depuis lib/api/maintenance.ts
    const apiLikeData = {
      titre: 'API LIKE TEST - ' + new Date().toISOString(),
      description: 'Test simulant l\'API de l\'app',
      priorite: 'moyenne',
      responsable: 'API Test User',
      date_echeance: null,
      notes: null,
      room_id: testRoomId,
      hotel_id: testHotelId,
      user_owner_id: 'c8c827c4-419f-409c-a696-e6bf0856984b',
      statut: 'en_attente',
      created_by: 'c8c827c4-419f-409c-a696-e6bf0856984b',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('📝 Données comme dans l\'API:')
    console.log(JSON.stringify(apiLikeData, null, 2))
    
    // Test avec rôle developement (service_role pour développement)
    const { data: apiTask, error: apiError } = await supabaseAdmin
      .from('maintenance_tasks')
      .insert(apiLikeData)
      .select(`
        *,
        room:rooms(numero, bed_type),
        hotel:hotels(nom)
      `)
      .single()
    
    if (apiError) {
      console.error('❌ Erreur création API-like:')
      console.error('   Message:', apiError.message)
      console.error('   Code:', apiError.code)
      console.error('   Détails:', apiError.details)
      console.error('   Hint:', apiError.hint)
      
      // Analyser l'erreur en détail
      if (apiError.code === '23502') {
        console.log('📋 Erreur NOT NULL - colonnes requises manquantes')
      }
      if (apiError.code === '23503') {
        console.log('📋 Erreur FOREIGN KEY - références invalides')
        console.log(`   Vérifiez hotel_id=${testHotelId} et room_id=${testRoomId}`)
      }
      if (apiError.code === '42501') {
        console.log('🔒 Erreur de permissions RLS')
      }
    } else {
      console.log('✅ Tâche créée API-like!')
      console.log('📊 Tâche créée:', JSON.stringify(apiTask, null, 2))
      
      // Nettoyer
      const { error: deleteError } = await supabaseAdmin
        .from('maintenance_tasks')
        .delete()
        .eq('id', apiTask.id)
      
      if (deleteError) {
        console.error('⚠️ Erreur suppression:', deleteError.message)
      } else {
        console.log('🧹 Tâche de test supprimée')
      }
    }
    
    console.log('\n🏁 Test terminé')
    return true
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message)
    console.error('Stack trace:', error.stack)
    return false
  }
}

// Fonction pour analyser les politiques RLS
async function analyzeRLSPolicies() {
  console.log('\n🔍 Analyse des politiques RLS pour maintenance_tasks...')
  
  try {
    // Requête pour récupérer les politiques RLS
    const { data: policies, error } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'public')
      .eq('tablename', 'maintenance_tasks')
    
    if (error) {
      console.log('⚠️ Impossible de récupérer les politiques:', error.message)
    } else if (policies && policies.length > 0) {
      console.log('📋 Politiques RLS actives:')
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}:`)
        console.log(`     Commande: ${policy.cmd}`)
        console.log(`     Qualification: ${policy.qual}`)
        console.log(`     Avec check: ${policy.with_check}`)
      })
    } else {
      console.log('📋 Aucune politique RLS trouvée pour maintenance_tasks')
    }
    
  } catch (err) {
    console.log('⚠️ Erreur analyse RLS:', err.message)
  }
}

// Exécution
async function runTests() {
  await testMaintenanceTaskCreation()
  await analyzeRLSPolicies()
  
  console.log('\a') // Bell sound
}

runTests()