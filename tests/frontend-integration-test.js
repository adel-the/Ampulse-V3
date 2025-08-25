// Test d'intégration frontend pour vérifier la connexion avec le backend
// Ce script teste les opérations CRUD pour les trois entités

import { establishmentsApi } from '../lib/api/establishments.js';
import { roomsApi } from '../lib/api/rooms.js';
import { equipmentsApi } from '../lib/api/equipments.js';

async function testFrontendIntegration() {
  console.log('🚀 Démarrage des tests d\'intégration frontend...\n');
  
  let testResults = {
    establishments: { read: false, create: false, update: false, delete: false },
    rooms: { read: false, create: false, update: false, delete: false },
    equipments: { read: false, create: false, update: false, delete: false }
  };

  try {
    // ==================== TEST ÉTABLISSEMENTS ====================
    console.log('📍 Test des Établissements...');
    
    // Lecture
    const establishmentsRead = await establishmentsApi.getEstablishments();
    testResults.establishments.read = establishmentsRead.success;
    console.log(`  ✓ Lecture: ${testResults.establishments.read ? '✅' : '❌'}`);
    
    if (establishmentsRead.data && establishmentsRead.data.length > 0) {
      const hotelId = establishmentsRead.data[0].id;
      
      // ==================== TEST CHAMBRES ====================
      console.log('\n🛏️ Test des Chambres...');
      
      // Lecture
      const roomsRead = await roomsApi.getRoomsByHotel(hotelId);
      testResults.rooms.read = roomsRead.success;
      console.log(`  ✓ Lecture: ${testResults.rooms.read ? '✅' : '❌'}`);
      
      // Création
      const newRoom = {
        hotel_id: hotelId,
        numero: 'TEST-' + Date.now(),
        type: 'Simple',
        prix: 100,
        statut: 'disponible',
        floor: 1
      };
      
      const roomCreate = await roomsApi.createRoom(newRoom);
      testResults.rooms.create = roomCreate.success;
      console.log(`  ✓ Création: ${testResults.rooms.create ? '✅' : '❌'}`);
      
      if (roomCreate.data) {
        // Mise à jour
        const roomUpdate = await roomsApi.updateRoom(roomCreate.data.id, {
          prix: 150,
          statut: 'maintenance'
        });
        testResults.rooms.update = roomUpdate.success;
        console.log(`  ✓ Mise à jour: ${testResults.rooms.update ? '✅' : '❌'}`);
        
        // Suppression
        const roomDelete = await roomsApi.deleteRoom(roomCreate.data.id);
        testResults.rooms.delete = roomDelete.success;
        console.log(`  ✓ Suppression: ${testResults.rooms.delete ? '✅' : '❌'}`);
      }
    }
    
    // ==================== TEST ÉQUIPEMENTS ====================
    console.log('\n🔧 Test des Équipements...');
    
    // Lecture
    const equipmentsRead = await equipmentsApi.getEquipments();
    testResults.equipments.read = equipmentsRead.success;
    console.log(`  ✓ Lecture: ${testResults.equipments.read ? '✅' : '❌'}`);
    
    // Création
    const newEquipment = {
      nom: 'Test Equipment ' + Date.now(),
      icone: 'Star',
      categorie: 'general',
      est_actif: true
    };
    
    const equipmentCreate = await equipmentsApi.createEquipment(newEquipment);
    testResults.equipments.create = equipmentCreate.success;
    console.log(`  ✓ Création: ${testResults.equipments.create ? '✅' : '❌'}`);
    
    if (equipmentCreate.data) {
      // Mise à jour
      const equipmentUpdate = await equipmentsApi.updateEquipment(equipmentCreate.data.id, {
        nom: 'Updated Test Equipment',
        est_actif: false
      });
      testResults.equipments.update = equipmentUpdate.success;
      console.log(`  ✓ Mise à jour: ${testResults.equipments.update ? '✅' : '❌'}`);
      
      // Suppression
      const equipmentDelete = await equipmentsApi.deleteEquipment(equipmentCreate.data.id);
      testResults.equipments.delete = equipmentDelete.success;
      console.log(`  ✓ Suppression: ${testResults.equipments.delete ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
  
  // ==================== RÉSUMÉ ====================
  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSUMÉ DES TESTS\n');
  
  let totalTests = 0;
  let passedTests = 0;
  
  for (const [entity, results] of Object.entries(testResults)) {
    console.log(`${entity.toUpperCase()}:`);
    for (const [operation, success] of Object.entries(results)) {
      totalTests++;
      if (success) passedTests++;
      console.log(`  ${operation}: ${success ? '✅ PASS' : '❌ FAIL'}`);
    }
    console.log('');
  }
  
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  console.log(`✨ Taux de réussite: ${successRate}% (${passedTests}/${totalTests} tests passés)`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS ! Le frontend est correctement connecté au backend.');
  } else {
    console.log('\n⚠️ Certains tests ont échoué. Vérifiez la connexion et les permissions.');
  }
}

// Pour exécuter ce test depuis la console du navigateur:
// Ouvrez http://localhost:3000
// Ouvrez la console (F12)
// Ce script s'exécutera automatiquement si importé
console.log('📝 Pour exécuter le test, appelez: testFrontendIntegration()');

// Export pour utilisation
if (typeof window !== 'undefined') {
  window.testFrontendIntegration = testFrontendIntegration;
}

export default testFrontendIntegration;