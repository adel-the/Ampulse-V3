/**
 * Utilitaires pour gérer les transactions atomiques entre usagers et individus
 * Assure la cohérence des données : soit tout est sauvé, soit rien
 */

import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Individual } from '@/types/individuals';
import { individualToIndividuInsert } from '@/lib/individuAdapter';
import { usagersApi, type UsagerWithPrescripteur } from '@/lib/api/usagers';

export interface TransactionResult {
  success: boolean;
  usagerId?: number;
  individuCount?: number;
  error?: string;
}

export interface UsagerFormData {
  prescripteur_id: number;
  nom: string;
  prenom: string;
  date_naissance?: string;
  lieu_naissance?: string;
  nationalite?: string;
  telephone?: string;
  email?: string;
  autonomie_level?: string;
  statut?: string;
}

/**
 * Crée un usager avec ses individus de manière atomique
 */
export async function createUsagerWithIndividuals(
  formData: UsagerFormData,
  individuals: Individual[]
): Promise<TransactionResult> {
  let createdUsagerId: number | null = null;

  try {
    // ÉTAPE 1: Créer l'usager
    const usagerResponse = await usagersApi.createUsager(formData);
    
    if (!usagerResponse.success || !usagerResponse.data) {
      return {
        success: false,
        error: usagerResponse.error || 'Erreur lors de la création de l\'usager'
      };
    }

    createdUsagerId = usagerResponse.data.id;

    // ÉTAPE 2: Créer les individus si présents
    if (individuals.length > 0) {
      try {
        await saveIndividualsToDatabase(createdUsagerId, individuals);
      } catch (individualsError) {
        // ROLLBACK: Supprimer l'usager créé
        try {
          await usagersApi.deleteUsager(createdUsagerId);
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
          return {
            success: false,
            error: 'Erreur critique: impossible d\'annuler la création de l\'usager'
          };
        }
        
        throw individualsError;
      }
    }

    return {
      success: true,
      usagerId: createdUsagerId,
      individuCount: individuals.length
    };

  } catch (error) {
    console.error('Error in createUsagerWithIndividuals:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la transaction'
    };
  }
}

/**
 * Met à jour un usager (les individus sont gérés séparément par IndividualsSection)
 */
export async function updateUsager(
  usagerId: number,
  formData: Omit<UsagerFormData, 'prescripteur_id'> & { prescripteur_id?: number }
): Promise<TransactionResult> {
  try {
    const { prescripteur_id, ...updates } = formData;
    const usagerResponse = await usagersApi.updateUsager(usagerId, {
      ...updates,
      prescripteur_id: prescripteur_id
    });

    if (!usagerResponse.success) {
      return {
        success: false,
        error: usagerResponse.error || 'Erreur lors de la mise à jour de l\'usager'
      };
    }

    return {
      success: true,
      usagerId: usagerId
    };

  } catch (error) {
    console.error('Error in updateUsager:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
    };
  }
}

/**
 * Sauvegarde les individus en base de données
 */
async function saveIndividualsToDatabase(usagerId: number, individuals: Individual[]): Promise<void> {
  if (individuals.length === 0) return;

  try {
    // Convertir les Individual en IndividuInsert
    const individuInserts = individuals.map(individual => 
      individualToIndividuInsert(individual, usagerId)
    );

    // Utiliser le client admin en mode développement pour éviter les problèmes RLS
    const isDevelopment = process.env.NODE_ENV === 'development';
    const client = isDevelopment ? supabaseAdmin : supabase;

    // Sauvegarder en batch
    const { data, error } = await client
      .from('individus')
      .insert(individuInserts)
      .select();
    
    if (error) {
      throw new Error(`Erreur BDD: ${error.message}`);
    }

    // Nettoyer le localStorage si présent
    const storageKey = `usager_${usagerId}_individuals`;
    localStorage.removeItem(storageKey);

    console.log(`✅ Saved ${individuInserts.length} individuals for usager ${usagerId}`);

  } catch (error) {
    console.error('Error saving individuals:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des personnes liées'
    );
  }
}

/**
 * Vérifie la cohérence des données avant sauvegarde
 */
export function validateUsagerIndividualsData(
  formData: UsagerFormData,
  individuals: Individual[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validation usager
  if (!formData.nom?.trim()) {
    errors.push('Le nom est obligatoire');
  }
  if (!formData.prenom?.trim()) {
    errors.push('Le prénom est obligatoire');
  }
  if (!formData.prescripteur_id || formData.prescripteur_id <= 0) {
    errors.push('Un prescripteur doit être sélectionné');
  }

  // Validation individus
  individuals.forEach((individual, index) => {
    if (!individual.nom?.trim()) {
      errors.push(`Individu ${index + 1}: le nom est obligatoire`);
    }
    if (!individual.prenom?.trim()) {
      errors.push(`Individu ${index + 1}: le prénom est obligatoire`);
    }
  });

  // Vérification chef de famille unique
  const chefsFamille = individuals.filter(ind => ind.isChefFamille);
  if (chefsFamille.length > 1) {
    errors.push('Un seul responsable principal est autorisé');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}