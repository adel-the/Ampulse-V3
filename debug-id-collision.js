/**
 * DIAGNOSTIC: Problème potentiel avec les IDs temporaires
 * 
 * Vérification si Date.now() peut causer des collisions d'IDs
 * qui pourraient empêcher l'affichage correct des tâches optimistes
 */

console.log('=== DIAGNOSTIC IDS TEMPORAIRES ===\n');

// Simulation de création rapide de plusieurs tâches
console.log('🔍 Test de collision d\'IDs avec Date.now():');

const ids = [];
for (let i = 0; i < 10; i++) {
  const id = Date.now();
  ids.push(id);
  // Attendre un petit peu pour voir la différence
  if (i < 9) {
    const start = Date.now();
    while (Date.now() - start < 1) {
      // Attendre 1ms
    }
  }
}

console.log('IDs générés:', ids);
console.log('IDs uniques:', new Set(ids).size);
console.log('Collisions détectées:', ids.length !== new Set(ids).size ? '❌ OUI' : '✅ NON');

// Test de collision avec des vraies tâches
console.log('\n🧪 Simulation collision avec tâches existantes:');

// Supposons des tâches existantes avec des IDs réalistes
const existingTasks = [
  { id: 1, titre: "Tâche 1" },
  { id: 2, titre: "Tâche 2" },
  { id: 3, titre: "Tâche 3" },
  { id: 1756833663140, titre: "Tâche avec timestamp" } // ID déjà utilisé
];

const newOptimisticId = 1756833663140; // Même timestamp par coïncidence
console.log(`Nouvel ID optimiste: ${newOptimisticId}`);
console.log(`ID existe déjà: ${existingTasks.some(t => t.id === newOptimisticId) ? '❌ OUI' : '✅ NON'}`);

if (existingTasks.some(t => t.id === newOptimisticId)) {
  console.log('⚠️ COLLISION DÉTECTÉE!');
  console.log('Conséquences possibles:');
  console.log('- La tâche optimiste peut écraser une tâche existante');
  console.log('- React peut ignorer la mise à jour à cause de la même clé');
  console.log('- La tâche peut sembler "disparaître" à cause du conflit');
}

console.log('\n🔧 Solutions pour éviter les collisions:');
console.log('1. Utiliser crypto.randomUUID() pour des IDs vraiment uniques');
console.log('2. Utiliser un préfixe "temp_" + Date.now() + Math.random()');
console.log('3. Utiliser un compteur négatif décroissant (-1, -2, -3...)');
console.log('4. Utiliser Symbol() pour des IDs garantis uniques');

// Test des différentes approches
console.log('\n📊 Comparaison des méthodes:');

// Méthode 1: crypto.randomUUID (si disponible)
if (typeof crypto !== 'undefined' && crypto.randomUUID) {
  console.log('UUID:', crypto.randomUUID());
} else {
  console.log('UUID: Non disponible dans cet environnement');
}

// Méthode 2: Préfixe + timestamp + random
const method2 = `temp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
console.log('Préfixe + timestamp + random:', method2);

// Méthode 3: Compteur négatif
let negativeCounter = -1;
console.log('Compteur négatif:', negativeCounter--);
console.log('Compteur négatif suivant:', negativeCounter--);

// Méthode 4: Timestamp avec microsecondes simulées
const method4 = Date.now() * 1000 + Math.floor(Math.random() * 1000);
console.log('Timestamp avec microsecondes:', method4);

console.log('\n✅ RECOMMANDATION:');
console.log('Remplacer Date.now() par une méthode plus robuste:');
console.log('```javascript');
console.log('// Au lieu de:');
console.log('id: Date.now()');
console.log('');
console.log('// Utiliser:');
console.log('id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`');
console.log('// ou simplement:');
console.log('id: -Date.now() // ID négatif pour éviter les conflits');
console.log('```');

console.log('\n🎯 AUTRES VÉRIFICATIONS:');
console.log('1. Vérifier si les tâches existantes ont des IDs dans la plage Date.now()');
console.log('2. Ajouter une validation des IDs uniques dans le setState');
console.log('3. Utiliser React Developer Tools pour vérifier les clés des éléments');
console.log('4. Tester la création rapide de plusieurs tâches consécutives');