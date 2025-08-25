// Script de test rapide pour vérifier que les équipements fonctionnent
// Exécuter avec : node test_equipments_fix.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pgjatiookprsvfesrsrx.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Test des équipements après correction RLS...\n')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testEquipments() {
  try {
    console.log('1. Test LECTURE des équipements...')
    const { data: equipments, error: readError } = await supabase
      .from('equipments')
      .select('*')
      .limit(5)

    if (readError) {
      console.error('❌ ERREUR LECTURE:', readError.message)
      return
    }
    console.log(`✅ LECTURE OK - ${equipments.length} équipements trouvés`)

    console.log('\n2. Test CRÉATION d\'équipement...')
    const { data: newEquipment, error: createError } = await supabase
      .from('equipments')
      .insert({
        name: 'Test JS Equipment',
        type: 'amenity',
        category: 'Test',
        description: 'Test depuis script Node.js',
        icon: 'Home',
        is_active: true,
        display_order: 999
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ ERREUR CRÉATION:', createError.message)
      return
    }
    console.log(`✅ CRÉATION OK - Équipement créé avec ID: ${newEquipment.id}`)

    console.log('\n3. Test SUPPRESSION...')
    const { error: deleteError } = await supabase
      .from('equipments')
      .delete()
      .eq('id', newEquipment.id)

    if (deleteError) {
      console.error('❌ ERREUR SUPPRESSION:', deleteError.message)
      return
    }
    console.log('✅ SUPPRESSION OK')

    console.log('\n🎉 TOUS LES TESTS RÉUSSIS !')
    console.log('✅ Plus d\'erreur 401')
    console.log('✅ CRUD complet fonctionnel')
    console.log('✅ Votre application peut maintenant gérer les équipements!')

  } catch (error) {
    console.error('❌ ERREUR GÉNÉRALE:', error.message)
  }
}

testEquipments()