#!/usr/bin/env node

/**
 * Script pour désactiver complètement RLS en environnement de développement
 * ⚠️  ATTENTION: À utiliser UNIQUEMENT en environnement local !
 * 
 * Ce script supprime toutes les politiques RLS et désactive la sécurité 
 * au niveau des lignes pour faciliter le développement et les tests.
 * 
 * Usage:
 *   node scripts/disable-rls-dev.js
 *   node scripts/disable-rls-dev.js --confirm  # Confirmation automatique
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
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

const autoConfirm = process.argv.includes('--confirm');

function askConfirmation(question) {
  return new Promise((resolve) => {
    if (autoConfirm) {
      console.log(question + ' (auto-confirmé: oui)');
      resolve(true);
      return;
    }
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(question + ' (oui/non): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'o' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function disableRLSForDevelopment() {
  console.log('🚨 DÉSACTIVATION RLS POUR DÉVELOPPEMENT');
  console.log('=====================================\n');
  
  console.log('⚠️  ATTENTION: Cette opération va:');
  console.log('   - Supprimer TOUTES les politiques RLS de maintenance_tasks');
  console.log('   - Désactiver complètement la sécurité au niveau des lignes');
  console.log('   - Permettre l\'accès à toutes les données pour tous les utilisateurs authentifiés');
  console.log('   - NE DOIT JAMAIS être utilisé en production !\n');
  
  // Vérifier l'environnement
  if (supabaseUrl && supabaseUrl.includes('supabase.co') && !supabaseUrl.includes('localhost')) {
    console.error('❌ ERREUR: URL Supabase détectée comme production !');
    console.error('   Cette opération est interdite sur un environnement de production.');
    console.error('   URL détectée:', supabaseUrl);
    process.exit(1);
  }
  
  const confirmed = await askConfirmation('Êtes-vous sûr de vouloir continuer ?');
  if (!confirmed) {
    console.log('❌ Opération annulée par l\'utilisateur');
    process.exit(0);
  }

  try {
    // 1. Lister les politiques existantes
    console.log('\n1️⃣ Vérification des politiques existantes...');
    const { data: existingPolicies, error: listError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT policyname, cmd
        FROM pg_policies 
        WHERE tablename = 'maintenance_tasks'
        ORDER BY policyname;`
    });
    
    if (listError) {
      console.warn('⚠️  Impossible de lister les politiques:', listError.message);
    } else if (existingPolicies && existingPolicies.length > 0) {
      console.log('📋 Politiques trouvées:');
      existingPolicies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log('   Aucune politique existante trouvée');
    }

    // 2. Supprimer toutes les politiques
    console.log('\n2️⃣ Suppression de toutes les politiques...');
    const dropPoliciesSQL = `
      DO $$ 
      DECLARE 
        r RECORD;
      BEGIN
        FOR r IN 
          SELECT policyname 
          FROM pg_policies 
          WHERE tablename = 'maintenance_tasks' 
        LOOP
          EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON maintenance_tasks';
          RAISE NOTICE 'Politique supprimée: %', r.policyname;
        END LOOP;
      END $$;`;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPoliciesSQL });
    if (dropError) throw new Error(`Erreur suppression politiques: ${dropError.message}`);
    console.log('✅ Toutes les politiques supprimées');

    // 3. Désactiver RLS
    console.log('\n3️⃣ Désactivation de RLS...');
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE maintenance_tasks DISABLE ROW LEVEL SECURITY;'
    });
    
    if (disableError) throw new Error(`Erreur désactivation RLS: ${disableError.message}`);
    console.log('✅ RLS désactivé pour maintenance_tasks');

    // 4. Vérification finale
    console.log('\n4️⃣ Vérification finale...');
    const { data: verification, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          relrowsecurity as rls_enabled,
          (SELECT count(*) FROM pg_policies WHERE tablename = 'maintenance_tasks') as policy_count
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' 
        AND c.relname = 'maintenance_tasks';`
    });
    
    if (verifyError) {
      console.warn('⚠️  Impossible de vérifier le statut:', verifyError.message);
    } else if (verification && verification.length > 0) {
      const status = verification[0];
      console.log('📊 Statut final:');
      console.log(`   - RLS activé: ${status.rls_enabled ? 'OUI' : 'NON'}`);
      console.log(`   - Nombre de politiques: ${status.policy_count}`);
      
      if (!status.rls_enabled && status.policy_count === '0') {
        console.log('✅ RLS complètement désactivé avec succès');
      } else {
        console.warn('⚠️  Désactivation incomplète détectée');
      }
    }

    // 5. Avertissements finaux
    console.log('\n🎉 DÉSACTIVATION RLS TERMINÉE');
    console.log('=============================');
    console.log('✅ Toutes les politiques RLS ont été supprimées');
    console.log('✅ RLS désactivé pour maintenance_tasks');
    console.log('\n⚠️  RAPPELS IMPORTANTS:');
    console.log('   - Tous les utilisateurs authentifiés peuvent accéder à toutes les tâches');
    console.log('   - Cette configuration est UNIQUEMENT pour le développement');
    console.log('   - Réactivez RLS avant le déploiement en production');
    console.log('   - Utilisez "node scripts/apply-rls-fix.js" pour restaurer la sécurité');

  } catch (error) {
    console.error('\n❌ Erreur lors de la désactivation RLS:', error.message);
    console.error('\n🔧 Pour corriger manuellement:');
    console.error('   1. Connectez-vous à votre base Supabase');
    console.error('   2. Exécutez: ALTER TABLE maintenance_tasks DISABLE ROW LEVEL SECURITY;');
    console.error('   3. Supprimez les politiques manuellement si nécessaire');
    process.exit(1);
  }
}

// Point d'entrée principal
async function main() {
  await disableRLSForDevelopment();
}

main().catch(console.error);