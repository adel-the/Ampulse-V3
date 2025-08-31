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
}

// Type guards
export const isValidUsagerStatut = (statut: string): statut is 'actif' | 'inactif' | 'archive' => {
  return ['actif', 'inactif', 'archive'].includes(statut);
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
    statut?: string
  ): Promise<ApiResponse<UsagerWithPrescripteur[]>> {
    try {
      // Build query with filters
      let query = supabase
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
      
      // Apply filters
      if (prescripteurId) {
        query = query.eq('prescripteur_id', prescripteurId);
      }
      if (statut) {
        query = query.eq('statut', statut);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error searching usagers:', error);
        return { success: false, error: error.message };
      }
      
      // Filter by search term on client side if needed
      let filteredData = data || [];
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        filteredData = filteredData.filter((usager: any) => 
          usager.nom?.toLowerCase().includes(term) ||
          usager.prenom?.toLowerCase().includes(term) ||
          usager.numero_usager?.toLowerCase().includes(term) ||
          usager.email?.toLowerCase().includes(term) ||
          usager.telephone?.includes(term)
        );
      }
      
      return { success: true, data: filteredData as UsagerWithPrescripteur[] };
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
            numero_client
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

      const { data, error } = await supabase
        .from('usagers')
        .insert(usager)
        .select()
        .single();

      if (error) {
        console.error('Error creating usager:', error);
        // Provide more detailed error information
        const errorMessage = error.message || 'Erreur lors de la création de l\'usager';
        const errorDetails = error.details || '';
        const fullError = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
        return { success: false, error: fullError };
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

      const { data, error } = await supabase
        .from('usagers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating usager:', error);
        // Provide more detailed error information
        const errorMessage = error.message || 'Erreur lors de la mise à jour de l\'usager';
        const errorDetails = error.details || '';
        const fullError = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
        return { success: false, error: fullError };
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