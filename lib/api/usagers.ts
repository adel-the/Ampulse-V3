import { supabase, type Database } from '@/lib/supabase';

// Type definitions
export type Usager = Database['public']['Tables']['usagers']['Row'];
export type UsagerInsert = Database['public']['Tables']['usagers']['Insert'];
export type UsagerUpdate = Database['public']['Tables']['usagers']['Update'];

// Extended types with relations
export interface UsagerWithPrescripteur extends Usager {
  prescripteur?: {
    id: number;
    nom: string | null;
    prenom: string | null;
    raison_sociale: string | null;
    client_type: 'Particulier' | 'Entreprise' | 'Association';
    numero_client: string | null;
  };
}

export interface UsagerStats {
  total: number;
  actifs: number;
  inactifs: number;
  archives: number;
  autonomes: number;
  semi_autonomes: number;
  non_autonomes: number;
  by_prescripteur_type: {
    Particulier?: number;
    Entreprise?: number;
    Association?: number;
  };
}

// Type guards
export const isValidUsagerStatut = (statut: string): statut is 'actif' | 'inactif' | 'archive' => {
  return ['actif', 'inactif', 'archive'].includes(statut);
};

export const isValidAutonomieLevel = (level: string): level is 'Autonome' | 'Semi-autonome' | 'Non-autonome' => {
  return ['Autonome', 'Semi-autonome', 'Non-autonome'].includes(level);
};

export const isValidSituationFamiliale = (situation: string): situation is 'Célibataire' | 'Marié(e)' | 'Divorcé(e)' | 'Veuf/Veuve' | 'Pacsé(e)' | 'Union libre' => {
  return ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve', 'Pacsé(e)', 'Union libre'].includes(situation);
};

// API response type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class UsagersAPI {
  // Search usagers with filters
  async searchUsagers(
    searchTerm?: string,
    prescripteurId?: number,
    statut?: string,
    autonomieLevel?: string
  ): Promise<ApiResponse<UsagerWithPrescripteur[]>> {
    try {
      const { data, error } = await supabase.rpc('search_usagers', {
        search_term: searchTerm || null,
        prescripteur_filter: prescripteurId || null,
        statut_filter: statut || null,
        autonomie_filter: autonomieLevel || null
      });

      if (error) {
        console.error('Error searching usagers:', error);
        return { success: false, error: error.message };
      }

      // Transform the data to include prescripteur object using database-computed values
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        // Ensure all required fields are present with proper defaults
        lieu_naissance: item.lieu_naissance || null,
        nationalite: item.nationalite || null,
        adresse: item.adresse || null,
        code_postal: item.code_postal || null,
        numero_secu: item.numero_secu || null,
        caf_number: item.caf_number || null,
        nombre_enfants: item.nombre_enfants || 0,
        revenus: item.revenus || null,
        type_revenus: item.type_revenus || null,
        prestations: item.prestations || null,
        observations: item.observations || null,
        updated_at: item.updated_at || null,
        created_by: item.created_by || null,
        updated_by: item.updated_by || null,
        // Use the prescripteur data from the database join
        prescripteur: item.prescripteur_id ? {
          id: item.prescripteur_id,
          nom: item.prescripteur_nom,
          prenom: item.prescripteur_type === 'Particulier' ? 
            (item.prescripteur_display_name?.split(' ')[1] || null) : null,
          raison_sociale: item.prescripteur_raison_sociale,
          client_type: item.prescripteur_type,
          numero_client: item.prescripteur_numero || null,
          display_name: item.prescripteur_display_name
        } : undefined
      }));

      return { success: true, data: transformedData };
    } catch (error: any) {
      console.error('Error in searchUsagers:', error);
      return { success: false, error: error.message || 'Erreur lors de la recherche des usagers' };
    }
  }

  // Get all usagers
  async getAllUsagers(): Promise<ApiResponse<UsagerWithPrescripteur[]>> {
    try {
      const { data, error } = await supabase
        .from('usagers')
        .select(`
          *,
          prescripteur:clients!prescripteur_id (
            id,
            nom,
            prenom,
            raison_sociale,
            client_type,
            numero_client
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching usagers:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as UsagerWithPrescripteur[] };
    } catch (error: any) {
      console.error('Error in getAllUsagers:', error);
      return { success: false, error: error.message || 'Erreur lors de la récupération des usagers' };
    }
  }

  // Get single usager with prescripteur details
  async getUsagerWithPrescripteur(id: number): Promise<ApiResponse<UsagerWithPrescripteur>> {
    try {
      const { data, error } = await supabase
        .from('usagers')
        .select(`
          *,
          prescripteur:clients!prescripteur_id (
            id,
            nom,
            prenom,
            raison_sociale,
            client_type,
            numero_client,
            email,
            telephone,
            adresse,
            ville,
            code_postal
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching usager:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as UsagerWithPrescripteur };
    } catch (error: any) {
      console.error('Error in getUsagerWithPrescripteur:', error);
      return { success: false, error: error.message || 'Erreur lors de la récupération de l\'usager' };
    }
  }

  // Get usagers by prescripteur
  async getUsagersByPrescripteur(prescripteurId: number): Promise<ApiResponse<Usager[]>> {
    try {
      const { data, error } = await supabase
        .from('usagers')
        .select('*')
        .eq('prescripteur_id', prescripteurId)
        .order('nom', { ascending: true });

      if (error) {
        console.error('Error fetching usagers by prescripteur:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error in getUsagersByPrescripteur:', error);
      return { success: false, error: error.message || 'Erreur lors de la récupération des usagers' };
    }
  }

  // Create new usager
  async createUsager(usager: Omit<UsagerInsert, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Usager>> {
    try {
      // Validate required fields
      if (!usager.nom || !usager.prenom || !usager.prescripteur_id) {
        return { success: false, error: 'Les champs nom, prénom et prescripteur sont obligatoires' };
      }

      // Validate enums if provided
      if (usager.statut && !isValidUsagerStatut(usager.statut)) {
        return { success: false, error: 'Statut invalide' };
      }

      if (usager.autonomie_level && !isValidAutonomieLevel(usager.autonomie_level)) {
        return { success: false, error: 'Niveau d\'autonomie invalide' };
      }

      if (usager.situation_familiale && !isValidSituationFamiliale(usager.situation_familiale)) {
        return { success: false, error: 'Situation familiale invalide' };
      }

      const { data, error } = await supabase
        .from('usagers')
        .insert(usager)
        .select()
        .single();

      if (error) {
        console.error('Error creating usager:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error in createUsager:', error);
      return { success: false, error: error.message || 'Erreur lors de la création de l\'usager' };
    }
  }

  // Update usager
  async updateUsager(id: number, updates: UsagerUpdate): Promise<ApiResponse<Usager>> {
    try {
      // Validate enums if provided
      if (updates.statut && !isValidUsagerStatut(updates.statut)) {
        return { success: false, error: 'Statut invalide' };
      }

      if (updates.autonomie_level && !isValidAutonomieLevel(updates.autonomie_level)) {
        return { success: false, error: 'Niveau d\'autonomie invalide' };
      }

      if (updates.situation_familiale && !isValidSituationFamiliale(updates.situation_familiale)) {
        return { success: false, error: 'Situation familiale invalide' };
      }

      const { data, error } = await supabase
        .from('usagers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating usager:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error in updateUsager:', error);
      return { success: false, error: error.message || 'Erreur lors de la mise à jour de l\'usager' };
    }
  }

  // Delete usager
  async deleteUsager(id: number): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('usagers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting usager:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in deleteUsager:', error);
      return { success: false, error: error.message || 'Erreur lors de la suppression de l\'usager' };
    }
  }

  // Get usager statistics
  async getUsagerStatistics(): Promise<ApiResponse<UsagerStats>> {
    try {
      const { data, error } = await supabase.rpc('get_usager_statistics');

      if (error) {
        console.error('Error fetching usager statistics:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as UsagerStats };
    } catch (error: any) {
      console.error('Error in getUsagerStatistics:', error);
      return { success: false, error: error.message || 'Erreur lors de la récupération des statistiques' };
    }
  }

  // Generate usager number
  async generateUsagerNumber(): Promise<ApiResponse<string>> {
    try {
      const { data, error } = await supabase.rpc('generate_usager_number');

      if (error) {
        console.error('Error generating usager number:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data as string };
    } catch (error: any) {
      console.error('Error in generateUsagerNumber:', error);
      return { success: false, error: error.message || 'Erreur lors de la génération du numéro d\'usager' };
    }
  }

  // Check if usager exists
  async checkUsagerExists(nom: string, prenom: string, dateNaissance?: string): Promise<ApiResponse<boolean>> {
    try {
      let query = supabase
        .from('usagers')
        .select('id')
        .eq('nom', nom.toUpperCase())
        .eq('prenom', prenom);

      if (dateNaissance) {
        query = query.eq('date_naissance', dateNaissance);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking usager existence:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: (data && data.length > 0) };
    } catch (error: any) {
      console.error('Error in checkUsagerExists:', error);
      return { success: false, error: error.message || 'Erreur lors de la vérification de l\'existence de l\'usager' };
    }
  }

  // Bulk operations

  // Archive multiple usagers
  async archiveUsagers(ids: number[]): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('usagers')
        .update({ statut: 'archive' })
        .in('id', ids);

      if (error) {
        console.error('Error archiving usagers:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in archiveUsagers:', error);
      return { success: false, error: error.message || 'Erreur lors de l\'archivage des usagers' };
    }
  }

  // Activate multiple usagers
  async activateUsagers(ids: number[]): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('usagers')
        .update({ statut: 'actif' })
        .in('id', ids);

      if (error) {
        console.error('Error activating usagers:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in activateUsagers:', error);
      return { success: false, error: error.message || 'Erreur lors de l\'activation des usagers' };
    }
  }

  // Transfer usagers to another prescripteur
  async transferUsagers(usagerIds: number[], newPrescripteurId: number): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('usagers')
        .update({ prescripteur_id: newPrescripteurId })
        .in('id', usagerIds);

      if (error) {
        console.error('Error transferring usagers:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in transferUsagers:', error);
      return { success: false, error: error.message || 'Erreur lors du transfert des usagers' };
    }
  }
}

// Export singleton instance
export const usagersApi = new UsagersAPI();