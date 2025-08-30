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
    is_chef_famille: individual.isChefFamille,
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
    is_chef_famille: individual.isChefFamille,
  }
}

/**
 * Convertit un tableau d'IndividuRow vers un tableau d'Individual
 */
export function individuRowsToIndividuals(rows: IndividuRow[]): Individual[] {
  return rows.map(individuRowToIndividual)
}

/**
 * Prépare un batch d'individus pour l'insertion en BDD
 */
export function prepareBatchInsert(
  individuals: Omit<Individual, 'id'>[],
  usagerId: number
): IndividuInsert[] {
  return individuals.map(ind => individualToIndividuInsert(ind, usagerId))
}