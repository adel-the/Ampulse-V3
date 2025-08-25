/**
 * TESTS END-TO-END AUTOMATISÉS - SYSTÈME GESTION DES CHAMBRES
 * Script de validation pour les scénarios critiques
 */

const { roomsApi } = require('../lib/api/rooms');

// Données de test
const TEST_HOTEL_ID = 1;
const TEST_ROOM_DATA = {
  hotel_id: TEST_HOTEL_ID,
  numero: 'TEST-E2E-001',
  type: 'Double',
  prix: 65,
  statut: 'disponible',
  description: 'Chambre de test E2E',
  floor: 1,
  room_size: 25,
  bed_type: 'double',
  view_type: 'jardin',
  is_smoking: false,
  amenities: ['WiFi', 'TV', 'Climatisation'],
  notes: 'Test automatisé'
};

let createdRoomId = null;

/**
 * SCÉNARIO 1 : Test création complète d'une chambre
 */
async function testCreateRoom() {
  console.log('\n🧪 TEST 1: Création d\'une chambre');
  
  try {
    const response = await roomsApi.createRoom(TEST_ROOM_DATA);
    
    if (response.success && response.data) {
      createdRoomId = response.data.id;
      console.log('✅ Chambre créée avec succès - ID:', createdRoomId);
      console.log('   Numéro:', response.data.numero);
      console.log('   Type:', response.data.type);
      console.log('   Prix:', response.data.prix);
      return true;
    } else {
      console.log('❌ Erreur création:', response.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Exception création:', error.message);
    return false;
  }
}

/**
 * SCÉNARIO 2 : Test lecture et vérification des données
 */
async function testReadRoom() {
  console.log('\n🧪 TEST 2: Lecture des données de la chambre');
  
  if (!createdRoomId) {
    console.log('❌ Pas de chambre à lire');
    return false;
  }
  
  try {
    const response = await roomsApi.getRoom(createdRoomId);
    
    if (response.success && response.data) {
      console.log('✅ Chambre lue avec succès');
      
      // Vérifications de cohérence
      const room = response.data;
      const checks = [
        { field: 'numero', expected: TEST_ROOM_DATA.numero, actual: room.numero },
        { field: 'type', expected: TEST_ROOM_DATA.type, actual: room.type },
        { field: 'prix', expected: TEST_ROOM_DATA.prix, actual: room.prix },
        { field: 'statut', expected: TEST_ROOM_DATA.statut, actual: room.statut },
        { field: 'floor', expected: TEST_ROOM_DATA.floor, actual: room.floor }
      ];
      
      let allValid = true;
      checks.forEach(check => {
        if (check.expected === check.actual) {
          console.log(`   ✅ ${check.field}: ${check.actual}`);
        } else {
          console.log(`   ❌ ${check.field}: attendu ${check.expected}, reçu ${check.actual}`);
          allValid = false;
        }
      });
      
      return allValid;
    } else {
      console.log('❌ Erreur lecture:', response.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Exception lecture:', error.message);
    return false;
  }
}

/**
 * SCÉNARIO 3 : Test modification de la chambre
 */
async function testUpdateRoom() {
  console.log('\n🧪 TEST 3: Modification de la chambre');
  
  if (!createdRoomId) {
    console.log('❌ Pas de chambre à modifier');
    return false;
  }
  
  const updateData = {
    type: 'Suite',
    prix: 120,
    statut: 'maintenance',
    description: 'Chambre modifiée par test E2E',
    amenities: ['WiFi', 'TV', 'Jacuzzi', 'Salon séparé']
  };
  
  try {
    const response = await roomsApi.updateRoom(createdRoomId, updateData);
    
    if (response.success && response.data) {
      console.log('✅ Chambre modifiée avec succès');
      console.log('   Nouveau type:', response.data.type);
      console.log('   Nouveau prix:', response.data.prix);
      console.log('   Nouveau statut:', response.data.statut);
      return true;
    } else {
      console.log('❌ Erreur modification:', response.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Exception modification:', error.message);
    return false;
  }
}

/**
 * SCÉNARIO 4 : Test de récupération de toutes les chambres
 */
async function testGetRooms() {
  console.log('\n🧪 TEST 4: Récupération de toutes les chambres');
  
  try {
    const response = await roomsApi.getRooms(TEST_HOTEL_ID);
    
    if (response.success && response.data) {
      console.log(`✅ ${response.data.length} chambres récupérées`);
      console.log(`   Nombre total: ${response.count}`);
      
      // Vérifier que notre chambre de test est présente
      const testRoom = response.data.find(room => room.id === createdRoomId);
      if (testRoom) {
        console.log('   ✅ Chambre de test trouvée dans la liste');
        return true;
      } else {
        console.log('   ❌ Chambre de test non trouvée dans la liste');
        return false;
      }
    } else {
      console.log('❌ Erreur récupération:', response.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Exception récupération:', error.message);
    return false;
  }
}

/**
 * SCÉNARIO 5 : Test des filtres
 */
async function testFilters() {
  console.log('\n🧪 TEST 5: Test des filtres');
  
  try {
    // Test filtre par statut
    const maintenanceRooms = await roomsApi.getRooms(TEST_HOTEL_ID, { statut: 'maintenance' });
    if (maintenanceRooms.success) {
      console.log(`✅ Filtre statut 'maintenance': ${maintenanceRooms.data.length} chambres`);
    }
    
    // Test filtre par type
    const suiteRooms = await roomsApi.getRooms(TEST_HOTEL_ID, { type: 'Suite' });
    if (suiteRooms.success) {
      console.log(`✅ Filtre type 'Suite': ${suiteRooms.data.length} chambres`);
    }
    
    // Test recherche
    const searchResults = await roomsApi.searchRooms(TEST_HOTEL_ID, 'TEST-E2E');
    if (searchResults.success) {
      console.log(`✅ Recherche 'TEST-E2E': ${searchResults.data.length} résultats`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Exception filtres:', error.message);
    return false;
  }
}

/**
 * SCÉNARIO 6 : Test des statistiques
 */
async function testStatistics() {
  console.log('\n🧪 TEST 6: Test des statistiques');
  
  try {
    const response = await roomsApi.getRoomStatistics(TEST_HOTEL_ID);
    
    if (response.success && response.data) {
      const stats = response.data;
      console.log('✅ Statistiques récupérées:');
      console.log(`   Total chambres: ${stats.total_rooms}`);
      console.log(`   Chambres disponibles: ${stats.available_rooms}`);
      console.log(`   Chambres occupées: ${stats.occupied_rooms}`);
      console.log(`   Chambres en maintenance: ${stats.maintenance_rooms}`);
      console.log(`   Taux d'occupation: ${stats.occupancy_rate}%`);
      console.log(`   Prix moyen: ${stats.average_price}€`);
      
      // Vérification cohérence
      const total = stats.available_rooms + stats.occupied_rooms + stats.maintenance_rooms;
      if (total === stats.total_rooms) {
        console.log('   ✅ Cohérence des totaux validée');
        return true;
      } else {
        console.log(`   ❌ Incohérence: ${total} ≠ ${stats.total_rooms}`);
        return false;
      }
    } else {
      console.log('❌ Erreur statistiques:', response.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Exception statistiques:', error.message);
    return false;
  }
}

/**
 * SCÉNARIO 7 : Test suppression (nettoyage)
 */
async function testDeleteRoom() {
  console.log('\n🧪 TEST 7: Suppression de la chambre');
  
  if (!createdRoomId) {
    console.log('❌ Pas de chambre à supprimer');
    return false;
  }
  
  try {
    const response = await roomsApi.deleteRoom(createdRoomId);
    
    if (response.success) {
      console.log('✅ Chambre supprimée avec succès');
      
      // Vérifier que la chambre n'existe plus
      const checkResponse = await roomsApi.getRoom(createdRoomId);
      if (!checkResponse.success) {
        console.log('   ✅ Vérification: chambre bien supprimée');
        return true;
      } else {
        console.log('   ❌ Vérification: chambre encore présente');
        return false;
      }
    } else {
      console.log('❌ Erreur suppression:', response.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Exception suppression:', error.message);
    return false;
  }
}

/**
 * EXÉCUTION DE TOUS LES TESTS
 */
async function runAllTests() {
  console.log('🚀 DÉBUT DES TESTS E2E - GESTION DES CHAMBRES');
  console.log('================================================');
  
  const results = [];
  
  try {
    results.push(await testCreateRoom());
    results.push(await testReadRoom());
    results.push(await testUpdateRoom());
    results.push(await testGetRooms());
    results.push(await testFilters());
    results.push(await testStatistics());
    results.push(await testDeleteRoom());
    
    // Résumé
    console.log('\n📊 RÉSUMÉ DES TESTS');
    console.log('==================');
    
    const passed = results.filter(r => r === true).length;
    const total = results.length;
    
    console.log(`Tests réussis: ${passed}/${total}`);
    console.log(`Taux de réussite: ${Math.round((passed/total) * 100)}%`);
    
    if (passed === total) {
      console.log('🎉 TOUS LES TESTS SONT PASSÉS - SYSTÈME VALIDÉ');
    } else {
      console.log('⚠️  CERTAINS TESTS ONT ÉCHOUÉ - VÉRIFICATION REQUISE');
    }
    
  } catch (error) {
    console.log('💥 ERREUR CRITIQUE DURANT LES TESTS:', error.message);
  }
}

// Exécution si appelé directement
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testCreateRoom,
  testReadRoom,
  testUpdateRoom,
  testGetRooms,
  testFilters,
  testStatistics,
  testDeleteRoom
};