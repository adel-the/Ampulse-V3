import { supabaseAdmin } from '../supabase';
import type { Client, ClientType, Referent, ConventionTarifaire } from '../supabase';

export interface ClientWithRelations extends Client {
  type?: ClientType;
  referents?: Referent[];
  conventions?: ConventionTarifaire[];
}

export interface ClientFormData {
  // Informations de base
  type_id: number;
  nom: string;
  prenom?: string;
  raison_sociale?: string;
  
  // Contact
  email?: string;
  telephone?: string;
  
  // Adresse
  adresse?: string;
  ville?: string;
  code_postal?: string;
  
  // Informations commerciales (Entreprise/Association)
  siret?: string;
  secteur_activite?: string;
  nombre_employes?: number;
  numero_agrement?: string;
  nombre_adherents?: number;
  
  // Informations personnelles (Particulier)
  nombre_enfants?: number;
  
  // Statut et paiement
  statut?: 'actif' | 'inactif' | 'prospect' | 'archive';
  mode_paiement?: string;
  delai_paiement?: number;
  taux_tva?: number;
  conditions_paiement?: string;
  
  // Notes
  notes?: string;
}

export interface ReferentFormData {
  nom: string;
  prenom?: string;
  fonction?: string;
  telephone?: string;
  email?: string;
}

export interface ConventionFormData {
  date_debut?: string;
  date_fin?: string;
  reduction_pourcentage?: number;
  forfait_mensuel?: number;
  conditions?: string;
  active?: boolean;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export const clientsApi = {
  // ==================== CLIENTS ====================
  
  // Récupérer tous les clients
  async getClients(): Promise<ApiResponse<Client[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .select('*')
        .order('nom', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des clients';
      return { data: null, error: message, success: false };
    }
  },

  // Récupérer un client avec toutes ses relations
  async getClientWithRelations(id: number): Promise<ApiResponse<ClientWithRelations>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .select(`
          *,
          type:client_types(*),
          referents(*),
          conventions:conventions_tarifaires(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement du client';
      return { data: null, error: message, success: false };
    }
  },

  // Rechercher des clients
  async searchClients(searchTerm?: string, typeId?: number, statut?: string): Promise<ApiResponse<Client[]>> {
    try {
      let query = supabaseAdmin.from('clients').select('*');

      if (searchTerm) {
        query = query.or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,raison_sociale.ilike.%${searchTerm}%`);
      }

      if (typeId) {
        query = query.eq('type_id', typeId);
      }

      if (statut) {
        query = query.eq('statut', statut);
      }

      query = query.order('nom', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      return { data: data || [], error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la recherche';
      return { data: null, error: message, success: false };
    }
  },

  // Créer un client
  async createClient(clientData: ClientFormData): Promise<ApiResponse<Client>> {
    try {
      // Préparer les données pour l'insertion
      const insertData = {
        ...clientData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('clients')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la création du client';
      return { data: null, error: message, success: false };
    }
  },

  // Mettre à jour un client
  async updateClient(id: number, updates: Partial<ClientFormData>): Promise<ApiResponse<Client>> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('clients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du client';
      return { data: null, error: message, success: false };
    }
  },

  // Supprimer un client
  async deleteClient(id: number): Promise<ApiResponse<boolean>> {
    try {
      // Vérifier s'il y a des réservations actives
      const { data: reservations, error: checkError } = await supabaseAdmin
        .from('reservations')
        .select('id')
        .eq('client_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (reservations && reservations.length > 0) {
        return { 
          data: false, 
          error: 'Impossible de supprimer ce client car il a des réservations', 
          success: false 
        };
      }

      const { error } = await supabaseAdmin
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression du client';
      return { data: false, error: message, success: false };
    }
  },

  // Récupérer les types de clients
  async getClientTypes(): Promise<ApiResponse<ClientType[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('client_types')
        .select('*')
        .order('ordre', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des types';
      return { data: null, error: message, success: false };
    }
  },

  // ==================== REFERENTS ====================
  
  // Récupérer les référents d'un client
  async getReferents(clientId: number): Promise<ApiResponse<Referent[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('referents')
        .select('*')
        .eq('client_id', clientId)
        .order('nom', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des référents';
      return { data: null, error: message, success: false };
    }
  },

  // Créer un référent
  async createReferent(clientId: number, referentData: ReferentFormData): Promise<ApiResponse<Referent>> {
    try {
      const insertData = {
        ...referentData,
        client_id: clientId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('referents')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la création du référent';
      return { data: null, error: message, success: false };
    }
  },

  // Mettre à jour un référent
  async updateReferent(id: number, updates: Partial<ReferentFormData>): Promise<ApiResponse<Referent>> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('referents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du référent';
      return { data: null, error: message, success: false };
    }
  },

  // Supprimer un référent
  async deleteReferent(id: number): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabaseAdmin
        .from('referents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression du référent';
      return { data: false, error: message, success: false };
    }
  },

  // ==================== CONVENTIONS ====================
  
  // Récupérer les conventions d'un client
  async getConventions(clientId: number): Promise<ApiResponse<ConventionTarifaire[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('conventions_tarifaires')
        .select('*')
        .eq('client_id', clientId)
        .order('date_debut', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des conventions';
      return { data: null, error: message, success: false };
    }
  },

  // Créer une convention
  async createConvention(clientId: number, conventionData: ConventionFormData): Promise<ApiResponse<ConventionTarifaire>> {
    try {
      const insertData = {
        ...conventionData,
        client_id: clientId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('conventions_tarifaires')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la création de la convention';
      return { data: null, error: message, success: false };
    }
  },

  // Mettre à jour une convention
  async updateConvention(id: number, updates: Partial<ConventionFormData>): Promise<ApiResponse<ConventionTarifaire>> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('conventions_tarifaires')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la convention';
      return { data: null, error: message, success: false };
    }
  },

  // Supprimer une convention
  async deleteConvention(id: number): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabaseAdmin
        .from('conventions_tarifaires')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression de la convention';
      return { data: false, error: message, success: false };
    }
  },

  // ==================== STATISTIQUES ====================
  
  // Récupérer les statistiques des clients
  async getClientStatistics(): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_simple_client_statistics');

      if (error) throw error;
      return { data: data?.[0] || null, error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des statistiques';
      return { data: null, error: message, success: false };
    }
  }
};