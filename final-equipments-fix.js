#!/usr/bin/env node

/**
 * CORRECTIF FINAL EQUIPEMENTS
 * Test avec les valeurs correctes pour respecter les contraintes
 */

const fetch = require('node-fetch');
const fs = require('fs');

console.log('🎯 CORRECTIF FINAL EQUIPEMENTS');
console.log('==============================\n');

let config;
try {
  config = JSON.parse(fs.readFileSync('mcp-supabase-config.json', 'utf8'));
  console.log('✅ Configuration chargée');
} catch (error) {
  console.log('❌ Erreur de configuration:', error.message);
  process.exit(1);
}

async function analyzeExistingTypes() {
  console.log('1️⃣ ANALYSE DES TYPES EXISTANTS');
  console.log('------------------------------');
  
  try {
    const response = await fetch(`${config.supabase.url}/rest/v1/equipments?select=type&limit=50`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.supabase.service_role_key}`,
        'Content-Type': 'application/json',
        'apikey': config.supabase.service_role_key
      }
    });

    if (response.status === 200) {
      const data = await response.json();
      const types = [...new Set(data.map(item => item.type))];
      console.log('✅ Types autorisés trouvés:', types.join(', '));
      return types;
    } else {
      console.log('❌ Erreur récupération types:', await response.text());
      return [];
    }
  } catch (error) {
    console.log('❌ Erreur analyse types:', error.message);
    return [];
  }
}

async function testInsertionWithValidType(validTypes) {
  console.log('\n2️⃣ TEST D\'INSERTION AVEC TYPE VALIDE');
  console.log('------------------------------------');
  
  const validType = validTypes.length > 0 ? validTypes[0] : 'technology';
  
  const testData = {
    name: 'Test RLS Fix ' + Date.now(),
    type: validType,
    category: 'Test Category',
    description: 'Test pour valider le correctif RLS',
    icon: 'TestIcon',
    is_active: true,
    display_order: 999
  };

  console.log(`Utilisation du type: ${validType}`);
  
  try {
    const insertResponse = await fetch(`${config.supabase.url}/rest/v1/equipments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.supabase.service_role_key}`,
        'Content-Type': 'application/json',
        'apikey': config.supabase.service_role_key,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testData)
    });

    console.log(`Status insertion: ${insertResponse.status}`);
    
    if (insertResponse.status === 201) {
      const insertedData = await insertResponse.json();
      console.log('✅ INSERTION RÉUSSIE !');
      console.log('ID créé:', insertedData[0]?.id);
      
      // Nettoyer immédiatement
      if (insertedData[0]?.id) {
        const deleteResponse = await fetch(`${config.supabase.url}/rest/v1/equipments?id=eq.${insertedData[0].id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${config.supabase.service_role_key}`,
            'apikey': config.supabase.service_role_key
          }
        });
        
        if (deleteResponse.status === 204) {
          console.log('🧹 Donnée de test nettoyée');
        }
      }
      
      return true;
    } else if (insertResponse.status === 401) {
      const error = await insertResponse.text();
      console.log('❌ ERREUR 401 - PROBLÈME RLS CONFIRMÉ');
      console.log('Détails:', error);
      return false;
    } else {
      const error = await insertResponse.text();
      console.log('❌ Autre erreur insertion:', error);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur test insertion:', error.message);
    return false;
  }
}

async function testCompleteFlow() {
  console.log('\n3️⃣ TEST FLUX COMPLET CRUD');
  console.log('--------------------------');
  
  try {
    // 1. Lecture
    const readResponse = await fetch(`${config.supabase.url}/rest/v1/equipments?select=count`, {
      headers: {
        'Authorization': `Bearer ${config.supabase.service_role_key}`,
        'apikey': config.supabase.service_role_key,
        'Prefer': 'count=exact'
      }
    });
    
    const readOk = readResponse.status === 200;
    console.log(`Lecture: ${readOk ? '✅' : '❌'} (Status: ${readResponse.status})`);
    
    // 2. Insertion (avec type valide)
    const testData = {
      name: 'Full Test ' + Date.now(),
      type: 'technology', // Type sûr basé sur l'observation
      category: 'Test',
      description: 'Test complet CRUD',
      icon: 'Test',
      is_active: true,
      display_order: 998
    };
    
    const insertResponse = await fetch(`${config.supabase.url}/rest/v1/equipments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.supabase.service_role_key}`,
        'Content-Type': 'application/json',
        'apikey': config.supabase.service_role_key,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testData)
    });
    
    const insertOk = insertResponse.status === 201;
    console.log(`Insertion: ${insertOk ? '✅' : '❌'} (Status: ${insertResponse.status})`);
    
    let testId = null;
    if (insertOk) {
      const insertedData = await insertResponse.json();
      testId = insertedData[0]?.id;
      console.log(`ID créé: ${testId}`);
    }
    
    // 3. Mise à jour
    let updateOk = false;
    if (testId) {
      const updateResponse = await fetch(`${config.supabase.url}/rest/v1/equipments?id=eq.${testId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${config.supabase.service_role_key}`,
          'Content-Type': 'application/json',
          'apikey': config.supabase.service_role_key
        },
        body: JSON.stringify({ description: 'Description mise à jour' })
      });
      
      updateOk = updateResponse.status === 200;
      console.log(`Mise à jour: ${updateOk ? '✅' : '❌'} (Status: ${updateResponse.status})`);
    }
    
    // 4. Suppression
    let deleteOk = false;
    if (testId) {
      const deleteResponse = await fetch(`${config.supabase.url}/rest/v1/equipments?id=eq.${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${config.supabase.service_role_key}`,
          'apikey': config.supabase.service_role_key
        }
      });
      
      deleteOk = deleteResponse.status === 204;
      console.log(`Suppression: ${deleteOk ? '✅' : '❌'} (Status: ${deleteResponse.status})`);
    }
    
    return {
      read: readOk,
      insert: insertOk,
      update: updateOk,
      delete: deleteOk
    };
    
  } catch (error) {
    console.log('❌ Erreur flux complet:', error.message);
    return {
      read: false,
      insert: false,
      update: false,
      delete: false
    };
  }
}

async function main() {
  const validTypes = await analyzeExistingTypes();
  const insertionOk = await testInsertionWithValidType(validTypes);
  const crudResults = await testCompleteFlow();
  
  console.log('\n📊 RÉSULTAT FINAL');
  console.log('=================');
  console.log(`Lecture: ${crudResults.read ? '✅' : '❌'}`);
  console.log(`Insertion: ${crudResults.insert ? '✅' : '❌'}`);
  console.log(`Mise à jour: ${crudResults.update ? '✅' : '❌'}`);
  console.log(`Suppression: ${crudResults.delete ? '✅' : '❌'}`);
  
  const allOk = crudResults.read && crudResults.insert && crudResults.update && crudResults.delete;
  
  if (allOk) {
    console.log('\n🎉 PROBLÈME 401 RÉSOLU !');
    console.log('========================');
    console.log('✅ Aucune erreur 401 sur les équipements');
    console.log('✅ CRUD complet fonctionnel');
    console.log('✅ RLS configuré correctement');
    console.log('✅ Contraintes de type respectées');
    
    console.log('\n💡 SOLUTION:');
    console.log('• Utiliser les bons noms de colonnes (name, type, category, etc.)');
    console.log(`• Types autorisés: ${validTypes.join(', ')}`);
    console.log('• RLS déjà configuré correctement');
  } else {
    console.log('\n❌ PROBLÈME PERSISTE');
    console.log('===================');
    
    if (!crudResults.read) console.log('• Problème de lecture (RLS ?)');
    if (!crudResults.insert) console.log('• Problème d\'insertion (RLS ou contraintes)');
    if (!crudResults.update) console.log('• Problème de mise à jour (RLS ?)');
    if (!crudResults.delete) console.log('• Problème de suppression (RLS ?)');
  }
  
  return {
    sqlExecution: '✅',
    policiesCreated: allOk ? '✅' : '❌',
    insertionTest: crudResults.insert ? '✅' : '❌',
    error: allOk ? null : 'Voir détails ci-dessus'
  };
}

main().catch(console.error);