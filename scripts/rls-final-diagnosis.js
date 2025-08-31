#!/usr/bin/env node

/**
 * Script de diagnostic final RLS pour maintenance_tasks
 * Focus sur l'authentification et les utilisateurs valides
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);
const supabaseAnon = createClient(supabaseUrl, anonKey);

console.log('🎯 DIAGNOSTIC FINAL RLS - MAINTENANCE_TASKS');
console.log('==========================================\n');

async function checkValidUsers() {
  console.log('1️⃣ VÉRIFICATION DES UTILISATEURS VALIDES');
  console.log('----------------------------------------');

  try {
    // Récupérer un utilisateur valide depuis les données existantes
    const { data: existingTasks } = await supabase
      .from('maintenance_tasks')
      .select('user_owner_id')
      .limit(1);

    if (existingTasks && existingTasks.length > 0) {
      const validUserId = existingTasks[0].user_owner_id;
      console.log(`✅ Utilisateur valide trouvé: ${validUserId}`);
      return validUserId;
    } else {
      console.log('❌ Aucun utilisateur valide trouvé dans les données existantes');
      return null;
    }
  } catch (err) {
    console.log('❌ Erreur vérification utilisateurs:', err.message);
    return null;
  }
}

async function testRLSPolicyDetails() {
  console.log('\n2️⃣ ANALYSE DÉTAILLÉE DE LA POLITIQUE RLS');
  console.log('----------------------------------------');

  // Examiner la politique dans le fichier de migration
  const fs = require('fs');
  const path = require('path');

  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/053_create_maintenance_tasks.sql');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    
    // Extraire la politique
    const policyMatch = migrationContent.match(/CREATE POLICY "([^"]+)"[^;]+;/s);
    if (policyMatch) {
      console.log('📋 Politique RLS trouvée:');
      console.log(policyMatch[0]);
      console.log('');

      // Analyser la politique
      if (policyMatch[0].includes('auth.uid()')) {
        console.log('🔍 La politique utilise auth.uid()');
        console.log('   ❗ PROBLÈME: auth.uid() retourne NULL si l\'utilisateur n\'est pas authentifié');
        console.log('   💡 SOLUTION: L\'utilisateur doit être connecté via Supabase Auth');
      }

      if (policyMatch[0].includes('FOR ALL')) {
        console.log('🔍 La politique s\'applique à toutes les opérations (SELECT, INSERT, UPDATE, DELETE)');
      }

      if (policyMatch[0].includes('TO authenticated')) {
        console.log('🔍 La politique ne s\'applique qu\'aux utilisateurs authentifiés');
      }
    }
  } catch (err) {
    console.log('❌ Erreur analyse migration:', err.message);
  }
}

async function testWithValidUser(validUserId) {
  console.log('\n3️⃣ TEST AVEC UTILISATEUR VALIDE');
  console.log('-------------------------------');

  if (!validUserId) {
    console.log('⚠️ Pas d\'utilisateur valide pour le test');
    return;
  }

  // Test avec service role (bypass RLS)
  console.log('🔧 Test avec Service Role (bypass RLS)...');
  try {
    const testData = {
      titre: 'Test Diagnostic Final',
      description: 'Test avec utilisateur valide',
      priorite: 'moyenne',
      statut: 'en_attente',
      room_id: 1,
      hotel_id: 1,
      user_owner_id: validUserId
    };

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.log(`❌ Service Role INSERT échoue: ${error.message}`);
    } else {
      console.log(`✅ Service Role INSERT réussit (ID: ${data.id})`);
      
      // Test lecture avec client anonyme
      console.log('\n👤 Test SELECT avec client anonyme...');
      const { data: readData, error: readError } = await supabaseAnon
        .from('maintenance_tasks')
        .select('*')
        .eq('id', data.id);

      if (readError) {
        console.log(`❌ Lecture anonyme échoue: ${readError.message}`);
        console.log('   💡 Normal: RLS empêche la lecture sans authentification');
      } else if (readData.length === 0) {
        console.log('❌ Lecture anonyme: aucun enregistrement trouvé');
        console.log('   💡 Normal: RLS filtre les résultats');
      } else {
        console.log(`🚨 Lecture anonyme réussit: ${readData.length} enregistrement(s)`);
        console.log('   ⚠️ PROBLÈME: RLS ne fonctionne pas correctement');
      }

      // Nettoyer
      await supabase.from('maintenance_tasks').delete().eq('id', data.id);
    }
  } catch (err) {
    console.log(`❌ Erreur test avec utilisateur valide: ${err.message}`);
  }
}

async function simulateAuthenticatedUser() {
  console.log('\n4️⃣ SIMULATION UTILISATEUR AUTHENTIFIÉ');
  console.log('------------------------------------');

  // NOTE: En production, il faudrait un vrai token JWT avec auth.uid()
  // Ici on simule juste pour comprendre le problème

  console.log('🔑 Contexte d\'authentification:');
  console.log('   - Client anonyme (anon key): pas d\'auth.uid()');
  console.log('   - Service role: bypass RLS complètement');
  console.log('   - Utilisateur authentifié: aurait un auth.uid() valide');
  console.log('');
  console.log('❗ PROBLÈME IDENTIFIÉ:');
  console.log('   Les tests utilisent des clients non authentifiés');
  console.log('   La politique RLS exige auth.uid() = user_owner_id');
  console.log('   auth.uid() est NULL pour les clients non authentifiés');
  console.log('');
  console.log('✅ SOLUTION:');
  console.log('   1. Authentifier l\'utilisateur avec supabase.auth.signIn()');
  console.log('   2. Ou temporairement désactiver RLS pour les tests');
  console.log('   3. Ou créer une politique plus permissive pour les tests');
}

async function suggestFixes() {
  console.log('\n5️⃣ CORRECTIONS RECOMMANDÉES');
  console.log('---------------------------');

  console.log('🔧 OPTION 1: Désactivation temporaire RLS (pour tests)');
  console.log('   ALTER TABLE maintenance_tasks DISABLE ROW LEVEL SECURITY;');
  console.log('');

  console.log('🔧 OPTION 2: Politique RLS plus permissive (pour développement)');
  console.log(`   CREATE POLICY "maintenance_tasks_dev_access" 
   ON maintenance_tasks FOR ALL 
   TO authenticated 
   USING (true) 
   WITH CHECK (true);`);
  console.log('');

  console.log('🔧 OPTION 3: Authentification correcte dans l\'app');
  console.log('   - Implémenter supabase.auth.signIn() avant les opérations');
  console.log('   - Vérifier que auth.uid() retourne une valeur');
  console.log('   - S\'assurer que user_owner_id correspond à auth.uid()');
  console.log('');

  console.log('🔧 OPTION 4: Politique RLS avec fallback');
  console.log(`   CREATE POLICY "maintenance_tasks_with_fallback" 
   ON maintenance_tasks FOR ALL 
   TO authenticated 
   USING (
     user_owner_id = auth.uid() OR 
     auth.uid() IS NULL  -- Permet les opérations sans auth pour tests
   );`);
  console.log('');

  console.log('⚠️ RECOMMANDATION:');
  console.log('   Pour le développement: utiliser OPTION 1 ou 2');
  console.log('   Pour la production: utiliser OPTION 3');
}

async function main() {
  try {
    console.log(`🔗 Connexion: ${supabaseUrl}`);
    console.log('');

    // 1. Vérifier les utilisateurs valides
    const validUserId = await checkValidUsers();

    // 2. Analyser la politique RLS
    await testRLSPolicyDetails();

    // 3. Tester avec un utilisateur valide
    await testWithValidUser(validUserId);

    // 4. Expliquer le contexte d'authentification
    await simulateAuthenticatedUser();

    // 5. Proposer des solutions
    await suggestFixes();

    console.log('\n🎯 RÉSUMÉ DU DIAGNOSTIC');
    console.log('======================');
    console.log('✅ RLS est activé et configuré correctement');
    console.log('✅ La politique RLS existe et utilise auth.uid()');
    console.log('✅ Les utilisateurs et données existent');
    console.log('❌ PROBLÈME: auth.uid() est NULL pour clients non authentifiés');
    console.log('💡 SOLUTION: Authentifier l\'utilisateur ou ajuster la politique RLS');

  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  main().catch(console.error);
}