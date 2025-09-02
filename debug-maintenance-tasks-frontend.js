// Script de debug pour analyser le problème de création de tâches côté frontend
// À exécuter dans la console du navigateur sur la page de maintenance

console.log('🔍 Debug Frontend: Analyse de la création de tâches de maintenance');

// 1. Vérifier l'état React du composant
function debugReactState() {
  console.log('\n=== État React ===');
  
  // Essayer de trouver l'instance React du composant
  const componentNode = document.querySelector('[data-testid="maintenance-tasks-list"]') || 
                       document.querySelector('.space-y-6'); // Container principal
                       
  if (componentNode && componentNode._reactInternalFiber) {
    console.log('Instance React trouvée:', componentNode._reactInternalFiber);
  } else if (componentNode && componentNode._reactInternalInstance) {
    console.log('Instance React trouvée:', componentNode._reactInternalInstance);
  } else {
    console.log('❌ Instance React non trouvée');
  }
}

// 2. Intercepter les appels API de maintenance
function interceptMaintenanceAPI() {
  console.log('\n=== Interception API ===');
  
  // Sauvegarder la fonction fetch originale
  const originalFetch = window.fetch;
  
  // Créer un wrapper pour intercepter les appels
  window.fetch = function(...args) {
    const url = args[0];
    
    // Intercepter uniquement les appels aux tâches de maintenance
    if (typeof url === 'string' && url.includes('maintenance')) {
      console.log('🌐 Appel API Maintenance intercepté:', {
        url,
        method: args[1]?.method || 'GET',
        body: args[1]?.body ? JSON.parse(args[1].body) : null,
        timestamp: new Date().toISOString()
      });
      
      // Continuer avec l'appel original et logger la réponse
      return originalFetch.apply(this, args).then(response => {
        const clonedResponse = response.clone();
        clonedResponse.json().then(data => {
          console.log('📥 Réponse API Maintenance:', {
            status: response.status,
            ok: response.ok,
            data,
            timestamp: new Date().toISOString()
          });
        }).catch(() => {
          console.log('📥 Réponse API Maintenance (non-JSON):', {
            status: response.status,
            ok: response.ok,
            timestamp: new Date().toISOString()
          });
        });
        
        return response;
      });
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ Interception API activée');
}

// 3. Simuler la création d'une tâche
function simulateTaskCreation() {
  console.log('\n=== Simulation de création de tâche ===');
  
  // Chercher le bouton "Nouvelle tâche"
  const newTaskButton = document.querySelector('button:has([data-testid="plus-icon"])') ||
                       Array.from(document.querySelectorAll('button')).find(btn => 
                         btn.textContent.includes('Nouvelle tâche') || btn.textContent.includes('Créer')
                       );
  
  if (newTaskButton) {
    console.log('✅ Bouton "Nouvelle tâche" trouvé:', newTaskButton);
    
    // Vérifier s'il est clickable
    if (newTaskButton.disabled) {
      console.log('❌ Bouton désactivé');
    } else {
      console.log('🖱️ Simulation du clic sur "Nouvelle tâche"');
      newTaskButton.click();
    }
  } else {
    console.log('❌ Bouton "Nouvelle tâche" non trouvé');
  }
}

// 4. Analyser les filtres actuels
function debugFilters() {
  console.log('\n=== État des filtres ===');
  
  // Chercher les éléments de filtres
  const statusFilter = document.querySelector('select[value]');
  const searchInput = document.querySelector('input[placeholder*="Rechercher"]');
  
  if (statusFilter) {
    console.log('Filtre statut:', statusFilter.value);
  }
  
  if (searchInput) {
    console.log('Recherche:', searchInput.value);
  }
  
  // Vérifier les sélecteurs
  const allSelects = document.querySelectorAll('select');
  console.log('Tous les sélecteurs trouvés:', Array.from(allSelects).map(s => ({
    value: s.value,
    options: Array.from(s.options).map(o => o.value)
  })));
}

// 5. Analyser l'état des tâches dans le DOM
function debugTasksInDOM() {
  console.log('\n=== Tâches dans le DOM ===');
  
  // Chercher les cartes de tâches
  const taskCards = document.querySelectorAll('.border.border-gray-200.rounded-lg');
  console.log(`Nombre de tâches affichées: ${taskCards.length}`);
  
  taskCards.forEach((card, index) => {
    const title = card.querySelector('h4')?.textContent;
    const badges = Array.from(card.querySelectorAll('.badge, [class*="bg-"]')).map(b => b.textContent?.trim());
    
    console.log(`Tâche ${index + 1}:`, {
      title,
      badges,
      element: card
    });
  });
  
  // Vérifier s'il y a un message "Aucune tâche"
  const noTasksMessage = document.querySelector('h3:contains("Aucune tâche")') ||
                         Array.from(document.querySelectorAll('h3')).find(h => 
                           h.textContent.includes('Aucune tâche') || h.textContent.includes('Aucun résultat')
                         );
  
  if (noTasksMessage) {
    console.log('📝 Message trouvé:', noTasksMessage.textContent);
  }
}

// 6. Vérifier les logs de la console
function checkConsoleForErrors() {
  console.log('\n=== Vérification des erreurs ===');
  console.log('Vérifiez la console pour:');
  console.log('- Erreurs React (red text)');
  console.log('- Warnings de hooks (yellow text)');
  console.log('- Erreurs réseau (Network tab)');
  console.log('- Messages de debug du composant MaintenanceTaskFormComplete');
}

// 7. Test manuel de création avec données mockées
function testCreateWithMockData() {
  console.log('\n=== Test avec données mockées ===');
  
  const mockTaskData = {
    titre: 'Test Debug Task',
    description: 'Tâche créée via script de debug',
    priorite: 'moyenne',
    responsable: 'Debug User',
    date_echeance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 jours
    notes: 'Créé par le script de debug frontend',
    statut: 'en_attente'
  };
  
  console.log('Données de test:', mockTaskData);
  
  // Essayer de trouver et appeler la fonction handleCreateSubmit
  // (Ceci ne marchera que si on peut accéder à l'état React)
  console.log('Pour tester manuellement:');
  console.log('1. Ouvrir le formulaire de création');
  console.log('2. Remplir avec ces données:', mockTaskData);
  console.log('3. Soumettre et observer les logs');
}

// 8. Fonction principale de debug
function runFullDebug() {
  console.log('🚀 Lancement du debug complet...\n');
  
  debugReactState();
  debugFilters();
  debugTasksInDOM();
  checkConsoleForErrors();
  interceptMaintenanceAPI();
  testCreateWithMockData();
  
  console.log('\n=== Actions recommandées ===');
  console.log('1. Exécuter simulateTaskCreation() pour tester le clic');
  console.log('2. Créer manuellement une tâche et observer les logs API');
  console.log('3. Vérifier que les filtres ne masquent pas la nouvelle tâche');
  console.log('4. Analyser les re-renders avec React DevTools');
}

// Exposer les fonctions globalement pour utilisation manuelle
window.debugMaintenance = {
  runFullDebug,
  debugReactState,
  interceptMaintenanceAPI,
  simulateTaskCreation,
  debugFilters,
  debugTasksInDOM,
  checkConsoleForErrors,
  testCreateWithMockData
};

console.log('✅ Script de debug chargé!');
console.log('Utilisez: debugMaintenance.runFullDebug() pour commencer');
console.log('Ou utilisez les fonctions individuelles disponibles dans debugMaintenance.*');