#!/usr/bin/env node

/**
 * Script pour appliquer les corrections RLS des tâches de maintenance
 * Utilise l'API Supabase Admin pour corriger les politiques RLS
 * 
 * Usage:
 *   node scripts/apply-rls-fix.js
 *   node scripts/apply-rls-fix.js --dev-mode  # Active la politique développement
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const devMode = process.argv.includes('--dev-mode');

async function applyRLSFix() {
  console.log('🔧 Application des corrections RLS pour maintenance_tasks...\n');
  
  try {
    // 1. Nettoyer les politiques existantes
    console.log('1️⃣ Nettoyage des politiques existantes...');
    const cleanupPolicies = [
      'maintenance_tasks_tenant_isolation',
      'Users can view maintenance tasks',
      'Users can create maintenance tasks', 
      'Users can update their maintenance tasks',
      'Users can delete their maintenance tasks',
      'Development mode - allow all for authenticated users'
    ];
    
    for (const policy of cleanupPolicies) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "${policy}" ON maintenance_tasks;`
      });
      if (error && !error.message.includes('does not exist')) {
        console.warn(`⚠️  Erreur lors de la suppression de la politique "${policy}":`, error.message);
      }
    }
    console.log('✅ Politiques existantes supprimées');

    // 2. Désactiver temporairement RLS
    console.log('\n2️⃣ Désactivation temporaire de RLS...');
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE maintenance_tasks DISABLE ROW LEVEL SECURITY;'
    });
    console.log('✅ RLS désactivé temporairement');

    // 3. Réactiver RLS
    console.log('\n3️⃣ Réactivation de RLS...');
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;'
    });
    console.log('✅ RLS réactivé');

    // 4. Créer les nouvelles politiques
    console.log('\n4️⃣ Création des nouvelles politiques...');
    
    // Politique SELECT
    const selectPolicy = `
      CREATE POLICY "Users can view maintenance tasks"
      ON maintenance_tasks FOR SELECT
      TO authenticated
      USING (
        user_owner_id = auth.uid() 
        OR 
        EXISTS (
          SELECT 1 FROM hotels 
          WHERE hotels.id = maintenance_tasks.hotel_id 
          AND hotels.user_owner_id = auth.uid()
        )
      );`;
    
    const { error: selectError } = await supabase.rpc('exec_sql', { sql: selectPolicy });
    if (selectError) throw new Error(`Erreur politique SELECT: ${selectError.message}`);
    console.log('  ✅ Politique SELECT créée');

    // Politique INSERT
    const insertPolicy = `
      CREATE POLICY "Users can create maintenance tasks"
      ON maintenance_tasks FOR INSERT
      TO authenticated
      WITH CHECK (
        user_owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM hotels 
          WHERE hotels.id = hotel_id 
          AND hotels.user_owner_id = auth.uid()
        )
      );`;
    
    const { error: insertError } = await supabase.rpc('exec_sql', { sql: insertPolicy });
    if (insertError) throw new Error(`Erreur politique INSERT: ${insertError.message}`);
    console.log('  ✅ Politique INSERT créée');

    // Politique UPDATE
    const updatePolicy = `
      CREATE POLICY "Users can update their maintenance tasks"
      ON maintenance_tasks FOR UPDATE
      TO authenticated
      USING (
        user_owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM hotels 
          WHERE hotels.id = maintenance_tasks.hotel_id 
          AND hotels.user_owner_id = auth.uid()
        )
      )
      WITH CHECK (
        user_owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM hotels 
          WHERE hotels.id = maintenance_tasks.hotel_id 
          AND hotels.user_owner_id = auth.uid()
        )
      );`;
    
    const { error: updateError } = await supabase.rpc('exec_sql', { sql: updatePolicy });
    if (updateError) throw new Error(`Erreur politique UPDATE: ${updateError.message}`);
    console.log('  ✅ Politique UPDATE créée');

    // Politique DELETE
    const deletePolicy = `
      CREATE POLICY "Users can delete their maintenance tasks"
      ON maintenance_tasks FOR DELETE
      TO authenticated
      USING (
        user_owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM hotels 
          WHERE hotels.id = maintenance_tasks.hotel_id 
          AND hotels.user_owner_id = auth.uid()
        )
      );`;
    
    const { error: deleteError } = await supabase.rpc('exec_sql', { sql: deletePolicy });
    if (deleteError) throw new Error(`Erreur politique DELETE: ${deleteError.message}`);
    console.log('  ✅ Politique DELETE créée');

    // 5. Politique développement (optionnelle)
    if (devMode) {
      console.log('\n5️⃣ Activation du mode développement...');
      const devPolicy = `
        CREATE POLICY "Development mode - allow all for authenticated users"
        ON maintenance_tasks
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);`;
      
      const { error: devError } = await supabase.rpc('exec_sql', { sql: devPolicy });
      if (devError) throw new Error(`Erreur politique développement: ${devError.message}`);
      console.log('  ⚠️  Politique développement activée (ATTENTION: Ne pas utiliser en production!)');
    }

    // 6. Vérification finale
    console.log('\n6️⃣ Vérification des politiques...');
    const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          policyname, 
          permissive, 
          roles,
          cmd
        FROM pg_policies 
        WHERE tablename = 'maintenance_tasks' 
        ORDER BY policyname;`
    });
    
    if (policyError) {
      console.warn('⚠️  Impossible de vérifier les politiques:', policyError.message);
    } else if (policies && policies.length > 0) {
      console.log('✅ Politiques actives:');
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    }

    console.log('\n🎉 Corrections RLS appliquées avec succès !');
    
    if (devMode) {
      console.log('\n⚠️  MODE DÉVELOPPEMENT ACTIVÉ');
      console.log('   Pensez à désactiver la politique développement avant la production !');
    }

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'application des corrections:', error.message);
    process.exit(1);
  }
}

// Fonction pour désactiver complètement RLS (développement uniquement)
async function disableRLS() {
  console.log('⚠️  DÉSACTIVATION COMPLÈTE DE RLS (MODE DÉVELOPPEMENT)...\n');
  
  try {
    // Supprimer toutes les politiques
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        DECLARE r RECORD;
        BEGIN
          FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'maintenance_tasks' LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON maintenance_tasks';
          END LOOP;
        END $$;`
    });
    
    if (dropError) throw new Error(`Erreur suppression politiques: ${dropError.message}`);
    
    // Désactiver RLS
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE maintenance_tasks DISABLE ROW LEVEL SECURITY;'
    });
    
    if (disableError) throw new Error(`Erreur désactivation RLS: ${disableError.message}`);
    
    console.log('✅ RLS complètement désactivé pour maintenance_tasks');
    console.log('⚠️  ATTENTION: Tous les utilisateurs authentifiés ont accès à toutes les tâches !');
    console.log('⚠️  Ne jamais utiliser cette configuration en production !');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la désactivation RLS:', error.message);
    process.exit(1);
  }
}

// Point d'entrée principal
async function main() {
  if (process.argv.includes('--disable-rls')) {
    await disableRLS();
  } else {
    await applyRLSFix();
  }
}

main().catch(console.error);