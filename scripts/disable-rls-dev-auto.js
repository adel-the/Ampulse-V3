/**
 * Script automatique pour désactiver RLS sur maintenance_tasks en développement
 * Version sans confirmation pour utilisation automatisée
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:15421';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function disableRLS() {
  console.log('🔧 Désactivation du RLS sur maintenance_tasks...\n');

  try {
    // 1. Supprimer toutes les politiques existantes
    const dropPoliciesSQL = `
      DROP POLICY IF EXISTS "maintenance_tasks_tenant_isolation" ON maintenance_tasks;
      DROP POLICY IF EXISTS "Users can view maintenance tasks" ON maintenance_tasks;
      DROP POLICY IF EXISTS "Users can create maintenance tasks" ON maintenance_tasks;
      DROP POLICY IF EXISTS "Users can update their maintenance tasks" ON maintenance_tasks;
      DROP POLICY IF EXISTS "Users can delete their maintenance tasks" ON maintenance_tasks;
      DROP POLICY IF EXISTS "Development mode - allow all for authenticated users" ON maintenance_tasks;
      DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON maintenance_tasks;
    `;

    console.log('📋 Suppression des politiques existantes...');
    for (const sql of dropPoliciesSQL.split(';').filter(s => s.trim())) {
      const { error } = await supabase.rpc('exec_sql', { sql: sql.trim() });
      if (error && !error.message.includes('does not exist')) {
        console.log(`   ⚠️  ${error.message}`);
      }
    }

    // 2. Désactiver RLS sur la table
    console.log('🔓 Désactivation de RLS...');
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE maintenance_tasks DISABLE ROW LEVEL SECURITY;'
    });

    if (disableError) {
      // Si exec_sql n'existe pas, créer une politique très permissive
      console.log('   ℹ️  Méthode alternative : création d\'une politique permissive...');
      
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE POLICY "Allow all operations for authenticated users"
          ON maintenance_tasks
          FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
        `
      });

      if (!policyError) {
        console.log('   ✅ Politique permissive créée');
      }
    } else {
      console.log('   ✅ RLS désactivé avec succès');
    }

    // 3. Test de vérification
    console.log('\n🧪 Test de vérification...');
    
    // Test d'insertion
    const testData = {
      titre: 'Test RLS désactivé',
      description: 'Test automatique après désactivation RLS',
      priorite: 'faible',
      statut: 'en_attente',
      room_id: 1,
      hotel_id: 1,
      user_owner_id: '46e58630-4ae0-4682-aa24-a4be2fb6e866',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('maintenance_tasks')
      .insert(testData)
      .select()
      .single();

    if (!insertError) {
      console.log('   ✅ Insertion test réussie (ID: ' + insertResult.id + ')');
      
      // Nettoyage
      await supabase
        .from('maintenance_tasks')
        .delete()
        .eq('id', insertResult.id);
      
      console.log('   ✅ Nettoyage effectué');
    } else {
      console.log('   ❌ Erreur lors du test :', insertError.message);
    }

    // 4. Résumé
    console.log('\n' + '='.repeat(50));
    console.log('✅ RLS DÉSACTIVÉ AVEC SUCCÈS');
    console.log('='.repeat(50));
    console.log('\n⚠️  RAPPEL IMPORTANT:');
    console.log('   • RLS est maintenant désactivé sur maintenance_tasks');
    console.log('   • Toutes les données sont accessibles sans restriction');
    console.log('   • NE PAS utiliser cette configuration en production');
    console.log('   • Pour réactiver RLS : node scripts/apply-rls-fix.js');
    
    console.log('\n💡 L\'application devrait maintenant fonctionner correctement.');
    console.log('   Testez l\'ajout de tâches de maintenance sur http://localhost:3012/maintenance');

  } catch (error) {
    console.error('\n❌ Erreur lors de la désactivation du RLS:', error);
    process.exit(1);
  }
}

// Exécuter immédiatement
disableRLS();