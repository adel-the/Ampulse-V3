import { supabase } from '../supabase';
import type { HotelEquipment, HotelEquipmentInsert, HotelEquipmentUpdate } from '../supabase';

export interface HotelEquipmentResponse {
  data: HotelEquipment[] | HotelEquipment | null;
  error: string | null;
  success: boolean;
}

export interface HotelEquipmentSingleResponse {
  data: HotelEquipment | null;
  error: string | null;
  success: boolean;
}

export const hotelEquipmentApi = {
  // Get all equipment for a specific hotel
  async getEquipmentByHotel(hotelId: number): Promise<HotelEquipmentResponse> {
    try {
      const { data, error } = await supabase
        .from('hotel_equipment')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('est_actif', true)
        .order('categorie', { ascending: true })
        .order('ordre_affichage', { ascending: true })
        .order('nom', { ascending: true });

      if (error) {
        console.error('Error fetching hotel equipment:', error);
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      console.error('Error in getEquipmentByHotel:', error);
      return { data: null, error: 'Erreur lors du chargement des équipements', success: false };
    }
  },

  // Get all equipment for all hotels (admin view)
  async getAllEquipment(): Promise<HotelEquipmentResponse> {
    try {
      const { data, error } = await supabase
        .from('hotel_equipment')
        .select('*')
        .order('hotel_id', { ascending: true })
        .order('categorie', { ascending: true })
        .order('ordre_affichage', { ascending: true })
        .order('nom', { ascending: true });

      if (error) {
        console.error('Error fetching all equipment:', error);
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      console.error('Error in getAllEquipment:', error);
      return { data: null, error: 'Erreur lors du chargement des équipements', success: false };
    }
  },

  // Get single equipment by ID
  async getEquipmentById(id: number): Promise<HotelEquipmentSingleResponse> {
    try {
      const { data, error } = await supabase
        .from('hotel_equipment')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching equipment by id:', error);
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      console.error('Error in getEquipmentById:', error);
      return { data: null, error: 'Erreur lors du chargement de l\'équipement', success: false };
    }
  },

  // Create new equipment
  async createEquipment(equipment: HotelEquipmentInsert): Promise<HotelEquipmentSingleResponse> {
    try {
      const { data, error } = await supabase
        .from('hotel_equipment')
        .insert(equipment)
        .select()
        .single();

      if (error) {
        console.error('Error creating equipment:', error);
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      console.error('Error in createEquipment:', error);
      return { data: null, error: 'Erreur lors de la création de l\'équipement', success: false };
    }
  },

  // Update equipment
  async updateEquipment(id: number, updates: HotelEquipmentUpdate): Promise<HotelEquipmentSingleResponse> {
    try {
      const { data, error } = await supabase
        .from('hotel_equipment')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating equipment:', error);
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      console.error('Error in updateEquipment:', error);
      return { data: null, error: 'Erreur lors de la mise à jour de l\'équipement', success: false };
    }
  },

  // Delete equipment
  async deleteEquipment(id: number): Promise<{ error: string | null; success: boolean }> {
    try {
      const { error } = await supabase
        .from('hotel_equipment')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting equipment:', error);
        return { error: error.message, success: false };
      }

      return { error: null, success: true };
    } catch (error) {
      console.error('Error in deleteEquipment:', error);
      return { error: 'Erreur lors de la suppression de l\'équipement', success: false };
    }
  },

  // Toggle equipment active status
  async toggleActive(id: number, isActive: boolean): Promise<HotelEquipmentSingleResponse> {
    try {
      const { data, error } = await supabase
        .from('hotel_equipment')
        .update({ est_actif: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling equipment status:', error);
        return { data: null, error: error.message, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      console.error('Error in toggleActive:', error);
      return { data: null, error: 'Erreur lors du changement de statut', success: false };
    }
  },

  // Search equipment
  async searchEquipment(hotelId: number | null, searchTerm: string, category?: string, isPremium?: boolean): Promise<HotelEquipmentResponse> {
    try {
      let query = supabase.from('hotel_equipment').select('*');

      if (hotelId) {
        query = query.eq('hotel_id', hotelId);
      }

      if (searchTerm) {
        query = query.or(`nom.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (category && category !== 'all') {
        query = query.eq('categorie', category);
      }

      if (isPremium !== undefined) {
        query = query.eq('est_premium', isPremium);
      }

      query = query.order('categorie', { ascending: true })
        .order('ordre_affichage', { ascending: true })
        .order('nom', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error searching equipment:', error);
        return { data: null, error: error.message, success: false };
      }

      return { data: data || [], error: null, success: true };
    } catch (error) {
      console.error('Error in searchEquipment:', error);
      return { data: null, error: 'Erreur lors de la recherche', success: false };
    }
  }
};