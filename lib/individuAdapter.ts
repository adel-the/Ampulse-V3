/**
 * Adaptateur pour synchroniser les types Individual (client) et IndividuRow (BDD)
 * Gère la conversion entre les structures de données front-end et base de données
 */

import { Individual } from '@/types/individuals'
import { IndividuRow, IndividuInsert, IndividuUpdate } from '@/lib/supabase'

/**
 * Convertit un IndividuRow (BDD) vers Individual (client)
 */
export function individuRowToIndividual(row: IndividuRow): Individual {
  return {
    id: row.id.toString(), // Conversion bigint → string
    nom: row.nom,
    prenom: row.prenom,
    date_naissance: row.date_naissance || undefined,
    lieu_naissance: row.lieu_naissance || undefined,
    sexe: row.sexe || undefined,
    telephone: row.telephone || undefined,
    email: row.email || undefined,
    relation: row.relation || undefined,
    isChefFamille: row.is_chef_famille, // Conversion snake_case → camelCase
  }
}

/**
 * Convertit un Individual (client) vers IndividuInsert (pour création en BDD)
 */
export function individualToIndividuInsert(
  individual: Omit<Individual, 'id'>, 
  usagerId: number
): IndividuInsert {
  return {
    usager_id: usagerId,
    nom: individual.nom,
    prenom: individual.prenom,
    date_naissance: individual.date_naissance || null,
    lieu_naissance: individual.lieu_naissance || null,
    sexe: individual.sexe || null,
    telephone: individual.telephone || null,
    email: individual.email || null,
    relation: individual.relation || null,
    is_chef_famille: individual.isChefFamille || false, // Conversion camelCase → snake_case
  }
}

/**
 * Convertit un Individual (client) vers IndividuUpdate (pour mise à jour en BDD)
 */
export function individualToIndividuUpdate(individual: Individual): IndividuUpdate {
  return {
    nom: individual.nom,
    prenom: individual.prenom,
    date_naissance: individual.date_naissance || null,
    lieu_naissance: individual.lieu_naissance || null,
    sexe: individual.sexe || null,
    telephone: individual.telephone || null,
    email: individual.email || null,
    relation: individual.relation || null,
    is_chef_famille: individual.isChefFamille || false,
  }
}

/**
 * Convertit une liste d'IndividuRow vers Individual[]
 */
export function individuRowsToIndividuals(rows: IndividuRow[]): Individual[] {
  return rows.map(individuRowToIndividual)
}

/**
 * Convertit une liste d'Individual vers IndividuInsert[]
 */
export function individualsToIndividuInserts(
  individuals: Omit<Individual, 'id'>[], 
  usagerId: number
): IndividuInsert[] {
  return individuals.map(individual => individualToIndividuInsert(individual, usagerId))
}

/**
 * Utilitaire pour migrer les données localStorage vers la structure BDD
 */
export function migrateLocalStorageIndividuals(
  localStorageData: Individual[],
  usagerId: number
): IndividuInsert[] {
  return localStorageData.map(individual => ({
    usager_id: usagerId,
    nom: individual.nom,
    prenom: individual.prenom,
    date_naissance: individual.date_naissance || null,
    lieu_naissance: individual.lieu_naissance || null,
    sexe: individual.sexe || null,
    telephone: individual.telephone || null,
    email: individual.email || null,
    relation: individual.relation || null,
    is_chef_famille: individual.isChefFamille || false,
  }))
}

/**
 * Récupère les données localStorage pour un usager donné
 */
export function getLocalStorageIndividuals(usagerId: number): Individual[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(`usager_${usagerId}_individuals`)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.warn('Error parsing localStorage individuals:', error)
    return []
  }
}

/**
 * Sauvegarde les données dans localStorage (pour compatibilité temporaire)
 */
export function saveLocalStorageIndividuals(usagerId: number, individuals: Individual[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(`usager_${usagerId}_individuals`, JSON.stringify(individuals))
  } catch (error) {
    console.warn('Error saving to localStorage:', error)
  }
}

/**
 * Nettoie le localStorage après migration réussie vers BDD
 */
export function clearLocalStorageIndividuals(usagerId: number): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(`usager_${usagerId}_individuals`)
    console.log(`Cleared localStorage for usager ${usagerId}`)
  } catch (error) {
    console.warn('Error clearing localStorage:', error)
  }
}

/**
 * Vérifie si l'ID est temporaire (string) ou définitif (number en string)
 */
export function isTemporaryId(id: string): boolean {
  // Les IDs temporaires sont des UUIDs ou des chaînes non numériques
  return isNaN(Number(id)) || id.includes('-')
}

/**
 * Génère un ID temporaire pour un nouvel individu
 */
export function generateTemporaryId(): string {
  return crypto.randomUUID()
}