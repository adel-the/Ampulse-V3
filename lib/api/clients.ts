import { supabaseAdmin } from '../supabase';
import type { Client, Referent, ConventionTarifaire, ClientCategory, CLIENT_TYPES } from '../supabase';

export interface ClientWithRelations extends Client {
  referents?: Referent[];
  conventions?: ConventionTarifaire[];
}

export interface ClientFormData {
  // ===== DATABASE FIELDS (will be sent to Supabase) =====
  // Informations de base
  client_type: ClientCategory;
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
  
  // Commercial/Legal
  siret?: string;
  
  // Statut
  statut?: 'actif' | 'inactif' | 'prospect' | 'archive';
  
  // ===== UI-ONLY FIELDS (not sent to database) =====
  // These fields are used for form display but filtered out before API calls
  secteur_activite?: string;
  nombre_employes?: number;
  numero_agrement?: string;
  nombre_adherents?: number;
  nombre_enfants?: number;
  mode_paiement?: string;
  delai_paiement?: number;
  taux_tva?: number;
  conditions_paiement?: string;
  notes?: string;
}

// Database-only interface that matches the exact Supabase schema
export interface ClientDatabaseData {
  id?: number;
  nom: string;
  prenom?: string | null;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  ville?: string | null;
  code_postal?: string | null;
  client_type: 'Particulier' | 'Entreprise' | 'Association';
  statut?: 'actif' | 'inactif' | 'prospect';
  numero_client?: string | null;
  raison_sociale?: string | null;
  siret?: string | null;
  created_at?: string;
  updated_at?: string;
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
  async searchClients(searchTerm?: string, clientType?: ClientCategory, statut?: string): Promise<ApiResponse<Client[]>> {
    try {
      let query = supabaseAdmin.from('clients').select('*');

      if (searchTerm) {
        query = query.or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,raison_sociale.ilike.%${searchTerm}%`);
      }

      if (clientType) {
        query = query.eq('client_type', clientType);
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
  async createClient(clientData: any): Promise<ApiResponse<Client>> {
    try {
      console.log('=== CLIENTS API DEBUG ===');
      console.log('Received clientData:', clientData);
      
      // Prepare data for insertion - only include fields that exist in database schema
      const insertData: ClientDatabaseData = {
        client_type: clientData.client_type,
        nom: clientData.nom,
        statut: clientData.statut || 'actif',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add optional fields only if they have values
      if (clientData.prenom?.trim()) insertData.prenom = clientData.prenom.trim();
      if (clientData.email?.trim()) insertData.email = clientData.email.trim();
      if (clientData.telephone?.trim()) insertData.telephone = clientData.telephone.trim();
      if (clientData.adresse?.trim()) insertData.adresse = clientData.adresse.trim();
      if (clientData.ville?.trim()) insertData.ville = clientData.ville.trim();
      if (clientData.code_postal?.trim()) insertData.code_postal = clientData.code_postal.trim();
      if (clientData.raison_sociale?.trim()) insertData.raison_sociale = clientData.raison_sociale.trim();
      if (clientData.siret?.trim()) insertData.siret = clientData.siret.trim();

      console.log('Prepared insertData (database-only fields):', insertData);

      const { data, error } = await supabaseAdmin
        .from('clients')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        throw error;
      }
      
      console.log('Successfully created client:', data);
      return { data, error: null, success: true };
    } catch (error) {
      console.error('Full createClient error:', error);
      let message = 'Erreur lors de la création du client';
      
      if (error instanceof Error) {
        // Provide more specific error messages for common issues
        if (error.message.includes('duplicate key')) {
          message = 'Un client avec ces informations existe déjà';
        } else if (error.message.includes('violates check constraint')) {
          message = 'Les données saisies ne respectent pas les contraintes';
        } else if (error.message.includes('column') && error.message.includes('does not exist')) {
          message = 'Erreur de structure de données (champ inexistant)';
        } else {
          message = error.message;
        }
      }
      
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

  // Récupérer les types de clients (pour compatibilité descendante)
  async getClientTypes(): Promise<ApiResponse<Array<{id: number, nom: string}>>> {
    try {
      // Return static client types for backward compatibility
      const types = CLIENT_TYPES.map((type, index) => ({
        id: index + 1,
        nom: type
      }));
      return { data: types, error: null, success: true };
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