// Script de débogage pour identifier le problème de création des tâches de maintenance
const fs = require('fs');
const path = require('path');

console.log('=== ANALYSE DU PROBLÈME DE CRÉATION DES TÂCHES DE MAINTENANCE ===\n');

// 1. Vérifier la fonction handleCreateSubmit
const todoListPath = path.join(__dirname, 'components/features/MaintenanceTasksTodoList.tsx');
const todoListContent = fs.readFileSync(todoListPath, 'utf8');

console.log('1. ANALYSE DE handleCreateSubmit:');
console.log('-------------------------------');

// Extraire la fonction handleCreateSubmit
const createSubmitMatch = todoListContent.match(/const handleCreateSubmit = async \(data: any\) => \{([\s\S]*?)^\s*\};/m);
if (createSubmitMatch) {
  const functionBody = createSubmitMatch[1];
  
  console.log('✓ Fonction handleCreateSubmit trouvée');
  
  // Vérifier les étapes critiques
  const criticalSteps = [
    { name: 'Création de la tâche optimiste', pattern: /optimisticTask.*=.*\{/ },
    { name: 'Ajout immédiat à l\'état', pattern: /setTasks\(prev => \[optimisticTask.*prev\]/ },
    { name: 'Appel API', pattern: /maintenanceApi\.createMaintenanceTask/ },
    { name: 'Remplacement par données serveur', pattern: /task\.id === optimisticTask\.id.*result\.data/ },
    { name: 'Réinitialisation des filtres', pattern: /setStatusFilter.*setSearchTerm/ },
  ];
  
  criticalSteps.forEach(step => {
    if (step.pattern.test(functionBody)) {
      console.log(`  ✓ ${step.name} - OK`);
    } else {
      console.log(`  ✗ ${step.name} - MANQUANT OU INCORRECT`);
    }
  });
} else {
  console.log('✗ Fonction handleCreateSubmit non trouvée');
}

console.log('\n2. ANALYSE DE L\'API MAINTENANCE:');
console.log('--------------------------------');

// 2. Vérifier l'API maintenance
const apiPath = path.join(__dirname, 'lib/api/maintenance.ts');
const apiContent = fs.readFileSync(apiPath, 'utf8');

// Vérifier la fonction createMaintenanceTask
const createFunctionMatch = apiContent.match(/export async function createMaintenanceTask\(([\s\S]*?)^\}/m);
if (createFunctionMatch) {
  const functionBody = createFunctionMatch[1];
  
  console.log('✓ Fonction createMaintenanceTask trouvée');
  
  // Vérifier les points critiques
  const apiChecks = [
    { name: 'Validation userId', pattern: /if.*!actualUserId.*return/ },
    { name: 'Construction insertData', pattern: /insertData.*=.*\{/ },
    { name: 'Insert avec select', pattern: /\.insert\(insertData\).*\.select/ },
    { name: 'Jointures room/hotel', pattern: /room:rooms.*hotel:hotels/ },
    { name: 'Retour des données', pattern: /return.*\{.*data.*error.*success/ },
  ];
  
  apiChecks.forEach(check => {
    if (check.pattern.test(functionBody)) {
      console.log(`  ✓ ${check.name} - OK`);
    } else {
      console.log(`  ✗ ${check.name} - POTENTIEL PROBLÈME`);
    }
  });
} else {
  console.log('✗ Fonction createMaintenanceTask non trouvée');
}

console.log('\n3. PROBLÈMES POTENTIELS IDENTIFIÉS:');
console.log('-----------------------------------');

// 3. Analyser les problèmes potentiels
const potentialIssues = [];

// Vérifier si room_id est optionnel dans Insert
const supabaseTypesPath = path.join(__dirname, 'lib/supabase.ts');
const supabaseContent = fs.readFileSync(supabaseTypesPath, 'utf8');

const maintenanceTaskInsertMatch = supabaseContent.match(/maintenance_tasks:[\s\S]*?Insert:\s*\{([\s\S]*?)\}/);
if (maintenanceTaskInsertMatch) {
  const insertDef = maintenanceTaskInsertMatch[1];
  
  if (insertDef.includes('room_id: number') && !insertDef.includes('room_id?: number')) {
    potentialIssues.push('❌ room_id est OBLIGATOIRE dans Insert mais peut être undefined dans les données');
  }
  
  if (!insertDef.includes('hotel_id: number')) {
    potentialIssues.push('❌ hotel_id manquant dans Insert');
  }
} else {
  potentialIssues.push('❌ Définition Insert de maintenance_tasks non trouvée');
}

// Vérifier la logique des filtres
if (todoListContent.includes('statusFilter !== \'all\'') && todoListContent.includes('setStatusFilter(\'all\')')) {
  console.log('  ✓ Réinitialisation des filtres - logique présente');
} else {
  potentialIssues.push('❌ Logique de réinitialisation des filtres manquante ou incomplète');
}

// Vérifier les optimistic updates
if (todoListContent.includes('_isOptimistic: true') && todoListContent.includes('task.id === optimisticTask.id')) {
  console.log('  ✓ Optimistic updates - logique présente');
} else {
  potentialIssues.push('❌ Logique d\'optimistic updates incomplète');
}

// Afficher les problèmes
if (potentialIssues.length > 0) {
  potentialIssues.forEach(issue => console.log(issue));
} else {
  console.log('  ✓ Aucun problème évident détecté dans le code statique');
}

console.log('\n4. RECOMMANDATIONS DE DÉBOGAGE:');
console.log('-------------------------------');

console.log(`  1. Vérifier les logs de la console du navigateur lors de la création d'une tâche
  2. Ajouter des console.log dans handleCreateSubmit pour tracer l'exécution
  3. Vérifier que room_id est bien passé même quand il est optionnel
  4. Tester avec les filtres sur 'all' pour éviter qu'une nouvelle tâche soit masquée
  5. Vérifier que l'API retourne bien les données attendues avec les jointures`);

console.log('\n=== FIN DE L\'ANALYSE ===');