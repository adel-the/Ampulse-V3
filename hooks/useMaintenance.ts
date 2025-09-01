/**
 * Hook spécialisé pour la gestion des tâches de maintenance
 * Wrapper autour de useMaintenanceTasks pour une utilisation simplifiée
 */

import { useMaintenanceTasks } from './useSupabase'
import { MaintenanceTask, MaintenanceTaskInsert, MaintenanceTaskUpdate } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface MaintenanceFilters {
  statut?: 'en_attente' | 'en_cours' | 'terminee' | 'annulee'
  priorite?: 'faible' | 'moyenne' | 'haute' | 'urgente'
  responsable?: string
  dateEcheanceFrom?: string
  dateEcheanceTo?: string
}

export interface MaintenanceStats {
  total: number
  enAttente: number
  enCours: number
  terminees: number
  annulees: number
  parPriorite: {
    faible: number
    moyenne: number
    haute: number
    urgente: number
  }
  tachesEnRetard: number
  tachesProchesEcheance: number
}

/**
 * Hook principal pour la gestion des tâches de maintenance
 * @param hotelId - ID de l'hôtel (optionnel pour filtrer par hôtel)
 * @param roomId - ID de la chambre (optionnel pour filtrer par chambre)
 * @param filters - Filtres additionnels
 */
export function useMaintenance(hotelId?: number, roomId?: number, filters?: MaintenanceFilters) {
  const { user } = useAuth()
  const {
    tasks,
    loading,
    error,
    createTask: createMaintenanceTask,
    updateTask: updateMaintenanceTask,
    deleteTask: deleteMaintenanceTask,
    completeTask,
    cancelTask,
    startTask,
    getTaskById,
    getTasksByRoom,
    getTasksByStatus,
    refetch
  } = useMaintenanceTasks(hotelId, roomId)

  // Filtrer les tâches selon les critères
  const filteredTasks = tasks.filter(task => {
    if (filters?.statut && task.statut !== filters.statut) return false
    if (filters?.priorite && task.priorite !== filters.priorite) return false
    if (filters?.responsable && !task.responsable?.toLowerCase().includes(filters.responsable.toLowerCase())) return false
    if (filters?.dateEcheanceFrom && task.date_echeance && task.date_echeance < filters.dateEcheanceFrom) return false
    if (filters?.dateEcheanceTo && task.date_echeance && task.date_echeance > filters.dateEcheanceTo) return false
    return true
  })

  // Calculer les statistiques
  const stats: MaintenanceStats = {
    total: filteredTasks.length,
    enAttente: filteredTasks.filter(t => t.statut === 'en_attente').length,
    enCours: filteredTasks.filter(t => t.statut === 'en_cours').length,
    terminees: filteredTasks.filter(t => t.statut === 'terminee').length,
    annulees: filteredTasks.filter(t => t.statut === 'annulee').length,
    parPriorite: {
      faible: filteredTasks.filter(t => t.priorite === 'faible').length,
      moyenne: filteredTasks.filter(t => t.priorite === 'moyenne').length,
      haute: filteredTasks.filter(t => t.priorite === 'haute').length,
      urgente: filteredTasks.filter(t => t.priorite === 'urgente').length,
    },
    tachesEnRetard: filteredTasks.filter(t => 
      t.statut !== 'terminee' && 
      t.date_echeance && 
      new Date(t.date_echeance) < new Date()
    ).length,
    tachesProchesEcheance: filteredTasks.filter(t => 
      t.statut !== 'terminee' && 
      t.date_echeance && 
      new Date(t.date_echeance) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
    ).length
  }

  // Helper functions
  const getTachesByPriorite = (priorite: MaintenanceTask['priorite']) => {
    return filteredTasks.filter(task => task.priorite === priorite)
  }

  const getTachesEnRetard = () => {
    return filteredTasks.filter(task => 
      task.statut !== 'terminee' && 
      task.date_echeance && 
      new Date(task.date_echeance) < new Date()
    )
  }

  const getTachesProchesEcheance = (jours = 7) => {
    const deadline = new Date(Date.now() + jours * 24 * 60 * 60 * 1000)
    return filteredTasks.filter(task => 
      task.statut !== 'terminee' && 
      task.date_echeance && 
      new Date(task.date_echeance) <= deadline
    )
  }

  const getTachesByResponsable = (responsable: string) => {
    return filteredTasks.filter(task => 
      task.responsable?.toLowerCase().includes(responsable.toLowerCase())
    )
  }

  const creerTache = async (tacheData: {
    titre: string
    description?: string
    priorite?: MaintenanceTask['priorite']
    responsable?: string
    date_echeance?: string
    notes?: string
    room_id: number
  }) => {
    if (!user) {
      throw new Error('Utilisateur non connecté')
    }

    const taskData: Omit<MaintenanceTaskInsert, 'user_owner_id' | 'hotel_id'> = {
      titre: tacheData.titre,
      description: tacheData.description,
      priorite: tacheData.priorite || 'moyenne',
      responsable: tacheData.responsable,
      date_echeance: tacheData.date_echeance,
      notes: tacheData.notes,
      statut: 'en_attente',
      room_id: tacheData.room_id,
      created_by: user.id
    }

    return await createMaintenanceTask(taskData)
  }

  const modifierTache = async (id: number, updates: Partial<MaintenanceTaskUpdate>) => {
    return await updateMaintenanceTask(id, updates)
  }

  const terminerTache = async (id: number, notes?: string) => {
    const updates: MaintenanceTaskUpdate = {
      statut: 'terminee',
      completed_at: new Date().toISOString(),
      ...(notes && { notes })
    }
    return await updateMaintenanceTask(id, updates)
  }

  const commencerTache = async (id: number, responsable?: string) => {
    const updates: MaintenanceTaskUpdate = {
      statut: 'en_cours',
      ...(responsable && { responsable })
    }
    return await updateMaintenanceTask(id, updates)
  }

  const annulerTache = async (id: number, raison?: string) => {
    const updates: MaintenanceTaskUpdate = {
      statut: 'annulee',
      ...(raison && { notes: raison })
    }
    return await updateMaintenanceTask(id, updates)
  }

  const supprimerTache = async (id: number) => {
    return await deleteMaintenanceTask(id)
  }

  return {
    // Données
    tasks: filteredTasks,
    allTasks: tasks,
    loading,
    error,
    stats,

    // Actions CRUD
    creerTache,
    modifierTache,
    terminerTache,
    commencerTache,
    annulerTache,
    supprimerTache,
    refetch,

    // Actions de workflow
    completeTask,
    cancelTask,
    startTask,

    // Helpers pour récupérer des données
    getTaskById,
    getTasksByRoom,
    getTasksByStatus,
    getTachesByPriorite,
    getTachesEnRetard,
    getTachesProchesEcheance,
    getTachesByResponsable,

    // Utilitaires
    isTaskOverdue: (task: MaintenanceTask) => {
      return task.statut !== 'terminee' && 
             task.date_echeance && 
             new Date(task.date_echeance) < new Date()
    },
    
    isTaskDueSoon: (task: MaintenanceTask, days = 7) => {
      return task.statut !== 'terminee' && 
             task.date_echeance && 
             new Date(task.date_echeance) <= new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    },

    getTaskPriorityColor: (priorite: MaintenanceTask['priorite']) => {
      switch (priorite) {
        case 'faible': return 'green'
        case 'moyenne': return 'yellow'
        case 'haute': return 'orange'
        case 'urgente': return 'red'
        default: return 'gray'
      }
    },

    getTaskStatusColor: (statut: MaintenanceTask['statut']) => {
      switch (statut) {
        case 'en_attente': return 'gray'
        case 'en_cours': return 'blue'
        case 'terminee': return 'green'
        case 'annulee': return 'red'
        default: return 'gray'
      }
    }
  }
}

/**
 * Hook pour récupérer les tâches de maintenance d'une chambre spécifique
 */
export function useMaintenanceForRoom(roomId: number, hotelId?: number) {
  return useMaintenance(hotelId, roomId)
}

/**
 * Hook pour récupérer les tâches de maintenance d'un hôtel
 */
export function useMaintenanceForHotel(hotelId: number) {
  return useMaintenance(hotelId)
}

/**
 * Hook pour les statistiques de maintenance globales
 */
export function useMaintenanceStats(hotelId?: number) {
  const { stats, loading, error } = useMaintenance(hotelId)
  
  return {
    stats,
    loading,
    error
  }
}