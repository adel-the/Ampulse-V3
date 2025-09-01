# Configuration du Système de Maintenance - Worktree M

## Vue d'ensemble

La configuration de la base de données pour les tâches de maintenance a été vérifiée et est entièrement fonctionnelle dans le worktree M. Le système inclut :

- **Types TypeScript** : Définis dans `lib/supabase.ts`
- **Hooks de base** : Dans `hooks/useSupabase.ts`
- **Hook spécialisé** : Dans `hooks/useMaintenance.ts`
- **Exemples d'utilisation** : Dans `examples/maintenance-usage-example.tsx`

## 1. Types de Base de Données

### Table `maintenance_tasks`

La table `maintenance_tasks` contient les champs suivants :

```typescript
interface MaintenanceTask {
  id: number                    // ID unique de la tâche
  titre: string                 // Titre de la tâche
  description: string | null    // Description détaillée
  priorite: 'faible' | 'moyenne' | 'haute' | 'urgente'
  responsable: string | null    // Nom du responsable
  date_echeance: string | null  // Date d'échéance
  notes: string | null          // Notes additionnelles
  statut: 'en_attente' | 'en_cours' | 'terminee' | 'annulee'
  room_id: number              // ID de la chambre
  hotel_id: number             // ID de l'hôtel
  user_owner_id: string        // ID du propriétaire (utilisateur)
  created_by: string | null    // ID du créateur
  created_at: string           // Date de création
  updated_at: string           // Date de mise à jour
  completed_at: string | null  // Date de completion
}
```

### Types d'insertion et de mise à jour

```typescript
type MaintenanceTaskInsert = {
  // Champs requis
  titre: string
  room_id: number
  hotel_id: number
  user_owner_id: string
  
  // Champs optionnels avec valeurs par défaut
  description?: string | null
  priorite?: 'faible' | 'moyenne' | 'haute' | 'urgente'
  responsable?: string | null
  date_echeance?: string | null
  notes?: string | null
  statut?: 'en_attente' | 'en_cours' | 'terminee' | 'annulee'
  created_by?: string | null
  // ... autres champs automatiques
}

type MaintenanceTaskUpdate = {
  // Tous les champs sont optionnels pour les mises à jour
  titre?: string
  description?: string | null
  priorite?: 'faible' | 'moyenne' | 'haute' | 'urgente'
  responsable?: string | null
  date_echeance?: string | null
  notes?: string | null
  statut?: 'en_attente' | 'en_cours' | 'terminee' | 'annulee'
  completed_at?: string | null
  // ...
}
```

## 2. Hooks Disponibles

### Hook de base : `useMaintenanceTasks`

```typescript
import { useMaintenanceTasks } from '@/hooks/useSupabase'

// Pour toutes les tâches d'un utilisateur
const { tasks, loading, createTask, updateTask, deleteTask } = useMaintenanceTasks()

// Pour les tâches d'un hôtel spécifique
const { tasks, loading, createTask, updateTask, deleteTask } = useMaintenanceTasks(hotelId)

// Pour les tâches d'une chambre spécifique
const { tasks, loading, createTask, updateTask, deleteTask } = useMaintenanceTasks(hotelId, roomId)
```

**Fonctionnalités :**
- ✅ CRUD complet (Create, Read, Update, Delete)
- ✅ Filtrage par hôtel et/ou chambre
- ✅ Actions spécialisées (completeTask, cancelTask, startTask)
- ✅ Temps réel avec Supabase Real-time
- ✅ Gestion multi-tenant (par user_owner_id)

### Hook spécialisé : `useMaintenance`

```typescript
import { useMaintenance } from '@/hooks/useMaintenance'

const {
  tasks,           // Tâches filtrées
  allTasks,        // Toutes les tâches
  loading,
  error,
  stats,           // Statistiques calculées
  
  // Actions CRUD simplifiées
  creerTache,
  modifierTache,
  terminerTache,
  commencerTache,
  annulerTache,
  supprimerTache,
  
  // Helpers utiles
  getTachesByPriorite,
  getTachesEnRetard,
  getTachesProchesEcheance,
  isTaskOverdue,
  isTaskDueSoon,
  getTaskPriorityColor,
  getTaskStatusColor
} = useMaintenance(hotelId, roomId, filters)
```

**Fonctionnalités avancées :**
- ✅ Filtrage avancé (statut, priorité, responsable, dates)
- ✅ Statistiques automatiques
- ✅ Helpers pour identifier les tâches en retard/urgentes
- ✅ Utilitaires d'affichage (couleurs, états)
- ✅ API simplifiée pour les opérations courantes

### Hooks spécialisés

```typescript
// Pour une chambre spécifique
const { tasks, stats, creerTache } = useMaintenanceForRoom(roomId, hotelId)

// Pour un hôtel complet
const { tasks, stats, creerTache } = useMaintenanceForHotel(hotelId)

// Statistiques seulement
const { stats, loading, error } = useMaintenanceStats(hotelId)
```

## 3. Relations avec les Autres Tables

Le système de maintenance est intégré avec :

- **`rooms`** : Chaque tâche est liée à une chambre spécifique
- **`hotels`** : Chaque tâche appartient à un hôtel
- **`users`** : Via `user_owner_id` pour la gestion multi-tenant

### Requêtes avec relations

```typescript
// Les hooks incluent automatiquement les relations
const task = {
  id: 1,
  titre: "Réparer robinet",
  // ... autres champs
  rooms: {
    numero: "R101",
    bed_type: "Double"
  },
  hotels: {
    nom: "Hôtel Example"
  }
}
```

## 4. Statistiques Disponibles

Le hook `useMaintenance` calcule automatiquement :

```typescript
interface MaintenanceStats {
  total: number                 // Nombre total de tâches
  enAttente: number            // Tâches en attente
  enCours: number              // Tâches en cours
  terminees: number            // Tâches terminées
  annulees: number             // Tâches annulées
  
  parPriorite: {
    faible: number
    moyenne: number
    haute: number
    urgente: number
  }
  
  tachesEnRetard: number       // Tâches dépassant leur échéance
  tachesProchesEcheance: number // Tâches due dans les 7 prochains jours
}
```

## 5. Exemples d'Utilisation

### Créer une tâche simple

```typescript
const { creerTache } = useMaintenance()

await creerTache({
  titre: "Réparer climatisation",
  description: "La climatisation ne refroidit plus",
  priorite: "haute",
  responsable: "Jean Dupont",
  date_echeance: "2024-12-31",
  room_id: 123
})
```

### Filtrer les tâches

```typescript
const { tasks } = useMaintenance(hotelId, undefined, {
  statut: 'en_cours',
  priorite: 'urgente',
  responsable: 'Jean'
})
```

### Obtenir les tâches en retard

```typescript
const { getTachesEnRetard } = useMaintenance()
const tachesEnRetard = getTachesEnRetard()
```

### Composant simple

```typescript
function MaintenanceWidget({ roomId }) {
  const { tasks, creerTache, stats } = useMaintenanceForRoom(roomId)
  
  return (
    <div>
      <h3>Maintenance - Chambre {roomId}</h3>
      <p>Tâches actives: {stats.enAttente + stats.enCours}</p>
      
      {tasks.map(task => (
        <div key={task.id}>
          {task.titre} - {task.statut}
        </div>
      ))}
      
      <button onClick={() => creerTache({
        titre: "Nouvelle tâche",
        room_id: roomId
      })}>
        Ajouter tâche
      </button>
    </div>
  )
}
```

## 6. Tests de Validation

Les scripts de test vérifient :

- ✅ **Connexion à la base de données** : `scripts/test-maintenance-db.js`
- ✅ **Opérations CRUD** : `scripts/test-maintenance-simple.js`
- ✅ **Schéma de la table** : Tous les champs requis présents
- ✅ **Relations** : Jointures avec rooms et hotels
- ✅ **Contraintes** : Clés étrangères respectées

### Exécuter les tests

```bash
# Test complet
node scripts/test-maintenance-db.js

# Test simple
node scripts/test-maintenance-simple.js
```

## 7. Structure des Fichiers

```
M/
├── lib/
│   └── supabase.ts                    # Types de base de données
├── hooks/
│   ├── useSupabase.ts                 # Hook de base useMaintenanceTasks
│   └── useMaintenance.ts              # Hook spécialisé avec utilitaires
├── examples/
│   └── maintenance-usage-example.tsx  # Exemples d'utilisation complète
├── scripts/
│   ├── test-maintenance-db.js         # Tests complets
│   └── test-maintenance-simple.js     # Tests simplifiés
└── docs/
    └── maintenance-system-setup.md    # Cette documentation
```

## 8. État de la Configuration

✅ **Base de données** : Table `maintenance_tasks` configurée et testée  
✅ **Types TypeScript** : Complets avec MaintenanceTask, Insert, Update  
✅ **Hooks de base** : useMaintenanceTasks fonctionnel  
✅ **Hook spécialisé** : useMaintenance avec filtres et statistiques  
✅ **Exemples** : Composants d'exemple fournis  
✅ **Tests** : Scripts de validation opérationnels  
✅ **Documentation** : Guide complet disponible  

La configuration est **prête pour la production** et peut être utilisée immédiatement dans l'application.

## 9. Bonnes Pratiques

### Gestion des erreurs

```typescript
const { tasks, loading, error, creerTache } = useMaintenance()

if (loading) return <div>Chargement...</div>
if (error) return <div>Erreur: {error}</div>

const handleCreate = async (taskData) => {
  try {
    const result = await creerTache(taskData)
    if (!result.success) {
      // Gérer l'erreur
      console.error('Échec de la création:', result.error)
    }
  } catch (err) {
    console.error('Erreur:', err)
  }
}
```

### Optimisation des performances

```typescript
// Utiliser les filtres pour réduire les données
const { tasks } = useMaintenance(hotelId, roomId, {
  statut: 'en_cours' // Seulement les tâches en cours
})

// Utiliser des hooks spécialisés
const { stats } = useMaintenanceStats(hotelId) // Statistiques seulement
```

### Temps réel

Les hooks incluent la synchronisation temps réel par défaut. Les changements dans la base de données sont automatiquement reflétés dans l'interface utilisateur.

---

**Note** : Cette configuration a été testée et validée le 2025-08-31 dans le worktree M du projet Ampulse v3.