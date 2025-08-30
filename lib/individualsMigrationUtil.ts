/**
 * Utilitaire de migration des individus du localStorage vers la base de données
 * Gère la transition transparente entre les deux systèmes de stockage
 */

import { Individual } from '@/types/individuals'
import { useIndividus } from '@/hooks/useSupabase'
import { 
  getLocalStorageIndividuals, 
  clearLocalStorageIndividuals, 
  migrateLocalStorageIndividuals,
  individuRowsToIndividuals
} from './individuAdapter'

export interface MigrationResult {
  success: boolean
  migratedCount: number
  existingCount: number
  error?: string
}

/**
 * Migre automatiquement les données localStorage vers la BDD pour un usager
 */
export async function migrateIndividualsToDatabase(
  usagerId: number, 
  useIndividusHook: ReturnType<typeof useIndividus>
): Promise<MigrationResult> {
  try {
    // 1. Récupérer les données existantes en localStorage
    const localStorageData = getLocalStorageIndividuals(usagerId)
    
    if (localStorageData.length === 0) {
      return {
        success: true,
        migratedCount: 0,
        existingCount: 0
      }
    }

    // 2. Vérifier s'il y a déjà des données en BDD
    await useIndividusHook.fetchIndividus(usagerId)
    const existingInBDD = useIndividusHook.individus.length

    if (existingInBDD > 0) {
      // Des données existent déjà en BDD, on ne migre pas
      return {
        success: true,
        migratedCount: 0,
        existingCount: existingInBDD
      }
    }

    // 3. Préparer les données pour l'insertion
    const individuInserts = migrateLocalStorageIndividuals(localStorageData, usagerId)

    // 4. Insérer en batch dans la BDD
    const result = await useIndividusHook.createIndividusBatch(individuInserts)

    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de l\'insertion batch')
    }

    // 5. Nettoyer le localStorage après succès
    clearLocalStorageIndividuals(usagerId)

    return {
      success: true,
      migratedCount: localStorageData.length,
      existingCount: 0
    }

  } catch (error) {
    console.error('Migration error:', error)
    return {
      success: false,
      migratedCount: 0,
      existingCount: 0,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

/**
 * Hook personnalisé pour la migration automatique
 */
export function useMigrationOnMount(usagerId?: number) {
  const [migrationStatus, setMigrationStatus] = React.useState<{
    isLoading: boolean
    result?: MigrationResult
  }>({ isLoading: false })

  const useIndividusHook = useIndividus(usagerId)

  React.useEffect(() => {
    if (!usagerId) return

    const performMigration = async () => {
      setMigrationStatus({ isLoading: true })
      
      const result = await migrateIndividualsToDatabase(usagerId, useIndividusHook)
      
      setMigrationStatus({ 
        isLoading: false, 
        result 
      })

      if (result.success && result.migratedCount > 0) {
        console.log(`✅ Migrated ${result.migratedCount} individuals for usager ${usagerId}`)
      }
    }

    performMigration()
  }, [usagerId])

  return {
    ...useIndividusHook,
    migration: migrationStatus
  }
}

/**
 * Vérifie s'il y a des données à migrer pour un usager
 */
export function hasLocalStorageDataToMigrate(usagerId: number): boolean {
  const localData = getLocalStorageIndividuals(usagerId)
  return localData.length > 0
}

/**
 * Compte le nombre d'individus en localStorage pour tous les usagers
 */
export function getLocalStorageMigrationStats(): { 
  usagersWithData: number
  totalIndividuals: number
} {
  if (typeof window === 'undefined') {
    return { usagersWithData: 0, totalIndividuals: 0 }
  }

  let usagersWithData = 0
  let totalIndividuals = 0

  // Parcourir toutes les clés localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('usager_') && key.endsWith('_individuals')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '[]')
        if (Array.isArray(data) && data.length > 0) {
          usagersWithData++
          totalIndividuals += data.length
        }
      } catch (error) {
        console.warn(`Error parsing ${key}:`, error)
      }
    }
  }

  return { usagersWithData, totalIndividuals }
}

/**
 * Nettoie toutes les données localStorage des individus
 */
export function clearAllLocalStorageIndividuals(): number {
  if (typeof window === 'undefined') return 0

  let clearedCount = 0
  const keysToRemove: string[] = []

  // Collecter les clés à supprimer
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('usager_') && key.endsWith('_individuals')) {
      keysToRemove.push(key)
    }
  }

  // Supprimer les clés
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key)
      clearedCount++
    } catch (error) {
      console.warn(`Error removing ${key}:`, error)
    }
  })

  return clearedCount
}

/**
 * Import React pour le hook personnalisé
 */
import React from 'react'