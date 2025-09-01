#!/usr/bin/env node

/**
 * Script de diagnostic RLS pour maintenance_tasks (Version 2)
 * Utilise des requêtes SQL directes pour analyser le RLS
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

// Client avec service role (bypass RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔍 DIAGNOSTIC RLS POUR MAINTENANCE_TASKS (V2)');
console.log('===========================================\n');

async function executeSQL(query, description) {
  console.log(`\n🔍 ${description}`);
  console.log('---'.repeat(20));
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: query 
    });

    if (error) {
      console.log(`❌ Erreur: ${error.message}`);
      return null;
    }

    return data;
  } catch (err) {
    console.log(`❌ Erreur système: ${err.message}`);
    return null;
  }
}

async function checkRLSStatusDirect() {
  console.log('1️⃣ VÉRIFICATION DIRECTE RLS');
  console.log('----------------------------');

  // Vérifier si la table existe
  try {
    const { data, error } = await supabase
      .from('maintenance_tasks')
      .select('id')
      .limit(1);

    if (error) {
      console.log('❌ Table maintenance_tasks inaccessible:', error.message);
      return false;
    } else {
      console.log(`✅ Table maintenance_tasks accessible (${data.length} enregistrement(s))`);
    }
  } catch (err) {
    console.log('❌ Erreur accès table:', err.message);
    return false;
  }

  // Tenter une requête SQL directe pour RLS
  try {
    const { data, error } = await supabase.rpc('sql', {
      query: `
        SELECT 
          schemaname,
          tablename,
          rowsecurity 
        FROM pg_tables 
        WHERE tablename = 'maintenance_tasks' AND schemaname = 'public';
      `
    });

    if (error) {
      console.log('❌ Impossible de vérifier RLS via SQL:', error.message);
    } else if (data && data.length > 0) {
      const rlsEnabled = data[0].rowsecurity;
      console.log(`🔒 RLS activé: ${rlsEnabled ? '✅ OUI' : '❌ NON'}`);
      return rlsEnabled;
    }
  } catch (err) {
    console.log('❌ Erreur vérification RLS:', err.message);
  }

  return null;
}

async function testBasicOperations() {
  console.log('\n2️⃣ TEST DES OPÉRATIONS DE BASE');
  console.log('-------------------------------');

  // Créer un client normal (avec RLS)
  const normalClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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

  // Test INSERT avec service role (devrait marcher)
  console.log('\n➕ Test INSERT avec Service Role...');
  try {
    const testData = {
      titre: 'Test Diagnostic RLS',
      description: 'Test insertion avec service role',
      priorite: 'moyenne',
      statut: 'en_attente',
      room_id: 1,
      hotel_id: 1,
      user_owner_id: '00000000-0000-0000-0000-000000000000'
    };

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.log(`❌ INSERT Service Role échoue: ${error.message}`);
    } else {
      console.log(`✅ INSERT Service Role réussit (ID: ${data.id})`);
      
      // Test INSERT avec client normal
      console.log('\n➕ Test INSERT avec Client Normal...');
      try {
        const { data: normalData, error: normalError } = await normalClient
          .from('maintenance_tasks')
          .insert(testData)
          .select()
          .single();

        if (normalError) {
          console.log(`❌ INSERT Normal échoue: ${normalError.message}`);
          console.log(`   Code: ${normalError.code}`);
          console.log(`   Détails: ${normalError.details}`);
        } else {
          console.log(`✅ INSERT Normal réussit (ID: ${normalData.id})`);
          // Nettoyer
          await supabase.from('maintenance_tasks').delete().eq('id', normalData.id);
        }
      } catch (err) {
        console.log(`❌ INSERT Normal erreur système: ${err.message}`);
      }

      // Nettoyer l'enregistrement de test
      await supabase.from('maintenance_tasks').delete().eq('id', data.id);
    }
  } catch (err) {
    console.log(`❌ INSERT Service Role erreur système: ${err.message}`);
  }
}

async function checkExistingData() {
  console.log('\n3️⃣ ANALYSE DES DONNÉES EXISTANTES');
  console.log('----------------------------------');

  try {
    // Compter les enregistrements avec service role
    const { data: serviceCount, error: serviceError } = await supabase
      .from('maintenance_tasks')
      .select('*', { count: 'exact', head: true });

    if (serviceError) {
      console.log('❌ Erreur comptage service role:', serviceError.message);
    } else {
      console.log(`📊 Service Role voit: ${serviceCount} enregistrement(s)`);
    }

    // Compter les enregistrements avec client normal
    const normalClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data: normalCount, error: normalError } = await normalClient
      .from('maintenance_tasks')
      .select('*', { count: 'exact', head: true });

    if (normalError) {
      console.log('❌ Erreur comptage client normal:', normalError.message);
    } else {
      console.log(`👤 Client Normal voit: ${normalCount} enregistrement(s)`);
    }

    // Analyser quelques enregistrements
    const { data: samples, error: sampleError } = await supabase
      .from('maintenance_tasks')
      .select('id, titre, user_owner_id, hotel_id, room_id, statut')
      .limit(3);

    if (!sampleError && samples && samples.length > 0) {
      console.log('\n📋 Échantillon d\'enregistrements:');
      samples.forEach((task, index) => {
        console.log(`${index + 1}. ID: ${task.id}`);
        console.log(`   Titre: ${task.titre}`);
        console.log(`   User Owner: ${task.user_owner_id}`);
        console.log(`   Hotel: ${task.hotel_id}, Room: ${task.room_id}`);
        console.log(`   Statut: ${task.statut}`);
        console.log('');
      });
    }
  } catch (err) {
    console.log('❌ Erreur analyse données:', err.message);
  }
}

async function checkMigrationStatus() {
  console.log('\n4️⃣ VÉRIFICATION MIGRATIONS');
  console.log('--------------------------');

  // Lire le fichier de migration pour maintenance_tasks
  const fs = require('fs');
  const path = require('path');

  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/053_create_maintenance_tasks.sql');
    if (fs.existsSync(migrationPath)) {
      console.log('✅ Migration 053_create_maintenance_tasks.sql trouvée');
      
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      // Rechercher des éléments clés
      const hasEnableRLS = migrationContent.includes('ENABLE ROW LEVEL SECURITY');
      const hasPolicy = migrationContent.includes('CREATE POLICY');
      const hasUserOwnerColumn = migrationContent.includes('user_owner_id');
      
      console.log(`🔒 Contient ENABLE RLS: ${hasEnableRLS ? '✅' : '❌'}`);
      console.log(`📋 Contient CREATE POLICY: ${hasPolicy ? '✅' : '❌'}`);
      console.log(`👤 Contient user_owner_id: ${hasUserOwnerColumn ? '✅' : '❌'}`);
      
      if (hasPolicy) {
        // Extraire le nom de la politique
        const policyMatch = migrationContent.match(/CREATE POLICY "([^"]+)"/);
        if (policyMatch) {
          console.log(`📝 Politique détectée: "${policyMatch[1]}"`);
        }
      }
    } else {
      console.log('❌ Migration 053_create_maintenance_tasks.sql non trouvée');
    }
  } catch (err) {
    console.log('❌ Erreur lecture migration:', err.message);
  }
}

async function testAuthContext() {
  console.log('\n5️⃣ TEST DU CONTEXTE D\'AUTHENTIFICATION');
  console.log('---------------------------------------');

  // Test avec différents UUID
  const testUUIDs = [
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    null
  ];

  for (const testUUID of testUUIDs) {
    console.log(`\n🔍 Test avec user_owner_id: ${testUUID || 'NULL'}`);
    
    try {
      const testData = {
        titre: `Test UUID ${testUUID || 'NULL'}`,
        description: 'Test avec différents UUID',
        priorite: 'moyenne',
        statut: 'en_attente',
        room_id: 1,
        hotel_id: 1,
        user_owner_id: testUUID
      };

      // Test avec service role
      const { data, error } = await supabase
        .from('maintenance_tasks')
        .insert(testData)
        .select()
        .single();

      if (error) {
        console.log(`❌ Service Role INSERT échoue: ${error.message}`);
      } else {
        console.log(`✅ Service Role INSERT réussit (ID: ${data.id})`);
        
        // Nettoyer
        await supabase.from('maintenance_tasks').delete().eq('id', data.id);
      }
    } catch (err) {
      console.log(`❌ Erreur test UUID: ${err.message}`);
    }
  }
}

async function main() {
  try {
    console.log(`🔗 Connexion à: ${supabaseUrl}`);
    console.log(`🔑 Service Role configuré: ${!!serviceRoleKey}`);

    // 1. Vérifier le statut RLS
    await checkRLSStatusDirect();

    // 2. Tester les opérations de base
    await testBasicOperations();

    // 3. Analyser les données existantes
    await checkExistingData();

    // 4. Vérifier les migrations
    await checkMigrationStatus();

    // 5. Tester le contexte d'authentification
    await testAuthContext();

    // 6. Diagnostic final
    console.log('\n🎯 DIAGNOSTIC FINAL');
    console.log('==================');
    
    console.log('\n📊 Problèmes identifiés:');
    console.log('1. ❌ RLS est activé mais les INSERT avec client normal échouent');
    console.log('2. ❌ La politique RLS semble trop restrictive');
    console.log('3. ⚠️ Impossible d\'accéder aux tables système PostgreSQL');
    console.log('4. 🔍 Besoin de vérifier auth.uid() dans le contexte Supabase');

    console.log('\n🔧 Solutions recommandées:');
    console.log('1. Vérifier que l\'utilisateur est authentifié avant l\'insertion');
    console.log('2. Modifier la politique RLS pour permettre l\'insertion');
    console.log('3. Tester avec un vrai utilisateur authentifié');
    console.log('4. Considérer désactiver temporairement RLS pour déboguer');

  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

// Exécution
main().catch(console.error);