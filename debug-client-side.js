// Script pour déboguer côté client - à exécuter dans la console du navigateur

// Fonction pour tester la création de tâches côté client
async function testClientSideCreation() {
  console.log('🔧 Test création tâche côté client...');
  
  // Simuler les données du formulaire MaintenanceManagement
  const taskData = {
    titre: 'Test CLIENT DEBUG',
    description: 'Test depuis console navigateur',
    priorite: 'moyenne', // Note: le composant utilise 'moyenne' mais mappe vers 'moyenne'
    responsable: 'User Test',
    date_echeance: '2025-09-05',
    notes: 'Debug client side',
    room_id: 2 // ID d'une chambre existante
  };
  
  console.log('📝 Données à créer:', taskData);
  
  // Test de la fonction de validation
  const validateTaskData = (taskData) => {
    const errors = [];
    
    // Required field validations
    if (!taskData.titre?.trim()) {
      errors.push('Le titre est requis');
    }
    if (!taskData.room_id) {
      errors.push('L\'ID de la chambre est requis');
    }
    
    // Priority validation
    const validPriorities = ['faible', 'moyenne', 'haute', 'urgente'];
    if (taskData.priorite && !validPriorities.includes(taskData.priorite)) {
      errors.push('Priorité invalide');
    }
    
    // Status validation
    const validStatuses = ['en_attente', 'en_cours', 'terminee', 'annulee'];
    if (taskData.statut && !validStatuses.includes(taskData.statut)) {
      errors.push('Statut invalide');
    }
    
    // Date validation
    if (taskData.date_echeance) {
      const echeanceDate = new Date(taskData.date_echeance);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isNaN(echeanceDate.getTime())) {
        errors.push('Date d\'échéance invalide');
      } else if (echeanceDate < today) {
        errors.push('La date d\'échéance ne peut pas être dans le passé');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  const validation = validateTaskData(taskData);
  console.log('✅ Validation:', validation);
  
  if (!validation.isValid) {
    console.error('❌ Erreurs de validation:', validation.errors);
    return;
  }
  
  // Test du mapping de priorité comme dans le code
  const priorityMapping = {
    'basse': 'faible',
    'moyenne': 'moyenne', 
    'haute': 'haute',
    'critique': 'urgente'
  };
  
  const mappedData = {
    ...taskData,
    priorite: priorityMapping[taskData.priorite] || 'moyenne'
  };
  
  console.log('📝 Données après mapping:', mappedData);
  
  // Test d'accès aux variables d'environnement côté client
  console.log('🔧 Variables d\'environnement:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Non définie');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Définie' : 'Non définie');
  
  return mappedData;
}

// Instructions d'utilisation
console.log(`
🔧 INSTRUCTIONS DE DEBUG:

1. Ouvrir l'application dans le navigateur
2. Aller sur la page Maintenance 
3. Ouvrir la console (F12)
4. Coller et exécuter: testClientSideCreation()
5. Observer les erreurs/résultats

Ensuite, pour tester la vraie création de tâche:
1. Ouvrir l'inspecteur Réseau (Network)
2. Essayer de créer une tâche via l'interface
3. Observer si des requêtes POST sont envoyées
4. Vérifier les erreurs JavaScript dans la console

Si aucune requête POST n'apparaît, le problème est dans le JavaScript client.
Si une requête POST apparaît mais échoue, le problème est dans la communication avec l'API.
`);

// Exposer la fonction globalement pour utilisation dans la console
if (typeof window !== 'undefined') {
  window.testClientSideCreation = testClientSideCreation;
}