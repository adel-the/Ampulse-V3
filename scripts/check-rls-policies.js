#!/usr/bin/env node

/**
 * Script de diagnostic RLS pour maintenance_tasks
 * Analyse l'état du Row Level Security et identifie les problèmes
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

// Client avec service role (bypass RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔍 DIAGNOSTIC RLS POUR MAINTENANCE_TASKS');
console.log('=========================================\n');

async function checkRLSStatus() {
  console.log('1️⃣ VÉRIFICATION DU STATUT RLS');
  console.log('----------------------------');

  try {
    const { data, error } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'maintenance_tasks')
      .single();

    if (error) {
      console.error('❌ Erreur lors de la vérification RLS:', error.message);
      return false;
    }

    if (data) {
      const rlsEnabled = data.relrowsecurity;
      console.log(`📋 Table: ${data.relname}`);
      console.log(`🔒 RLS activé: ${rlsEnabled ? '✅ OUI' : '❌ NON'}`);
      return rlsEnabled;
    } else {
      console.log('❌ Table maintenance_tasks non trouvée');
      return false;
    }
  } catch (err) {
    console.error('❌ Erreur système:', err.message);
    return false;
  }
}

async function listRLSPolicies() {
  console.log('\n2️⃣ LISTE DES POLITIQUES RLS');
  console.log('---------------------------');

  try {
    const { data, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'maintenance_tasks');

    if (error) {
      console.error('❌ Erreur lors de la récupération des politiques:', error.message);
      return [];
    }

    if (data && data.length > 0) {
      console.log(`📋 ${data.length} politique(s) trouvée(s):\n`);
      
      data.forEach((policy, index) => {
        console.log(`${index + 1}. Politique: ${policy.policyname}`);
        console.log(`   - Commande: ${policy.cmd}`);
        console.log(`   - Permissive: ${policy.permissive ? 'OUI' : 'NON'}`);
        console.log(`   - Rôles: ${policy.roles || 'Tous'}`);
        console.log(`   - Expression: ${policy.qual || 'Aucune'}`);
        console.log(`   - Expression WITH CHECK: ${policy.with_check || 'Aucune'}`);
        console.log('');
      });
      
      return data;
    } else {
      console.log('⚠️ Aucune politique RLS trouvée pour maintenance_tasks');
      return [];
    }
  } catch (err) {
    console.error('❌ Erreur système:', err.message);
    return [];
  }
}

async function testOperations() {
  console.log('3️⃣ TEST DES OPÉRATIONS CRUD');
  console.log('----------------------------');

  // Créer un client normal (avec RLS)
  const normalClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

  const testData = {
    titre: 'Test RLS Diagnostic',
    description: 'Test automatisé pour diagnostic RLS',
    priorite: 'moyenne',
    statut: 'en_attente',
    room_id: 1,  // Doit être défini car NOT NULL
    hotel_id: 1, // Doit être défini car NOT NULL
    user_owner_id: '00000000-0000-0000-0000-000000000000' // UUID fictif
  };

  // Test SELECT
  console.log('🔍 Test SELECT...');
  try {
    const { data, error } = await normalClient
      .from('maintenance_tasks')
      .select('*')
      .limit(1);

    if (error) {
      console.log(`❌ SELECT échoue: ${error.message}`);
    } else {
      console.log(`✅ SELECT réussit (${data.length} enregistrement(s))`);
    }
  } catch (err) {
    console.log(`❌ SELECT erreur système: ${err.message}`);
  }

  // Test INSERT
  console.log('➕ Test INSERT...');
  try {
    const { data, error } = await normalClient
      .from('maintenance_tasks')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.log(`❌ INSERT échoue: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Détails: ${error.details}`);
      console.log(`   Hint: ${error.hint}`);
    } else {
      console.log(`✅ INSERT réussit (ID: ${data.id})`);
      
      // Test UPDATE
      console.log('✏️ Test UPDATE...');
      try {
        const { error: updateError } = await normalClient
          .from('maintenance_tasks')
          .update({ titre: 'Test RLS Diagnostic - Modifié' })
          .eq('id', data.id);

        if (updateError) {
          console.log(`❌ UPDATE échoue: ${updateError.message}`);
        } else {
          console.log('✅ UPDATE réussit');
        }
      } catch (err) {
        console.log(`❌ UPDATE erreur système: ${err.message}`);
      }

      // Test DELETE
      console.log('🗑️ Test DELETE...');
      try {
        const { error: deleteError } = await normalClient
          .from('maintenance_tasks')
          .delete()
          .eq('id', data.id);

        if (deleteError) {
          console.log(`❌ DELETE échoue: ${deleteError.message}`);
        } else {
          console.log('✅ DELETE réussit');
        }
      } catch (err) {
        console.log(`❌ DELETE erreur système: ${err.message}`);
      }
    }
  } catch (err) {
    console.log(`❌ INSERT erreur système: ${err.message}`);
  }
}

async function testWithAuth() {
  console.log('\n4️⃣ TEST AVEC AUTHENTIFICATION');
  console.log('------------------------------');

  // Simuler une authentification
  const normalClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

  // Vérifier si auth.uid() est disponible
  try {
    const { data, error } = await supabase.rpc('auth.uid');
    console.log('🔑 auth.uid() disponible:', !error);
    if (error) {
      console.log('   Erreur:', error.message);
    }
  } catch (err) {
    console.log('❌ auth.uid() non disponible:', err.message);
  }

  // Test avec user_owner_id défini
  console.log('\n📝 Test INSERT avec user_owner_id simulé...');
  try {
    const testDataWithOwner = {
      titre: 'Test avec owner ID',
      description: 'Test avec user_owner_id défini',
      priorite: 'moyenne',
      statut: 'en_attente',
      room_id: 1,
      hotel_id: 1,
      user_owner_id: '00000000-0000-0000-0000-000000000000' // UUID fictif
    };

    const { data, error } = await normalClient
      .from('maintenance_tasks')
      .insert(testDataWithOwner)
      .select()
      .single();

    if (error) {
      console.log(`❌ INSERT avec owner échoue: ${error.message}`);
    } else {
      console.log(`✅ INSERT avec owner réussit (ID: ${data.id})`);
      
      // Nettoyer
      await supabase
        .from('maintenance_tasks')
        .delete()
        .eq('id', data.id);
    }
  } catch (err) {
    console.log(`❌ INSERT avec owner erreur système: ${err.message}`);
  }
}

async function analyzeTableStructure() {
  console.log('\n5️⃣ ANALYSE DE LA STRUCTURE TABLE');
  console.log('--------------------------------');

  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'maintenance_tasks')
      .order('ordinal_position');

    if (error) {
      console.log('❌ Erreur récupération structure:', error.message);
      return;
    }

    console.log('📋 Colonnes de maintenance_tasks:');
    data.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`);
      if (col.column_default) {
        console.log(`     Default: ${col.column_default}`);
      }
    });

    // Vérifier la présence de user_owner_id
    const userOwnerCol = data.find(col => col.column_name === 'user_owner_id');
    if (userOwnerCol) {
      console.log('\n✅ Colonne user_owner_id présente');
      console.log(`   Type: ${userOwnerCol.data_type}`);
      console.log(`   Nullable: ${userOwnerCol.is_nullable}`);
    } else {
      console.log('\n❌ Colonne user_owner_id MANQUANTE');
    }
  } catch (err) {
    console.log('❌ Erreur analyse structure:', err.message);
  }
}

async function main() {
  try {
    console.log(`🔗 Connexion à: ${supabaseUrl}`);
    console.log(`🔑 Service Role: ${serviceRoleKey.substring(0, 20)}...`);
    console.log('');

    // 1. Vérifier le statut RLS
    const rlsEnabled = await checkRLSStatus();

    // 2. Lister les politiques
    const policies = await listRLSPolicies();

    // 3. Analyser la structure
    await analyzeTableStructure();

    // 4. Tester les opérations
    await testOperations();

    // 5. Tester avec authentification
    await testWithAuth();

    // 6. Résumé et recommandations
    console.log('\n🎯 RÉSUMÉ ET RECOMMANDATIONS');
    console.log('============================');

    if (!rlsEnabled) {
      console.log('⚠️ RLS n\'est PAS activé sur maintenance_tasks');
      console.log('   → Exécuter: ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;');
    } else {
      console.log('✅ RLS est activé sur maintenance_tasks');
    }

    if (policies.length === 0) {
      console.log('⚠️ Aucune politique RLS définie');
      console.log('   → Créer des politiques pour SELECT, INSERT, UPDATE, DELETE');
    } else {
      console.log(`✅ ${policies.length} politique(s) RLS définie(s)`);
    }

    console.log('\n📊 Actions recommandées:');
    console.log('1. Vérifier les migrations SQL pour maintenance_tasks');
    console.log('2. Créer/corriger les politiques RLS manquantes');
    console.log('3. Tester l\'authentification utilisateur');
    console.log('4. Vérifier la logique d\'attribution user_owner_id');

  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

// Exécution
main().catch(console.error);