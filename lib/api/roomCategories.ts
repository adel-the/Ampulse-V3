import { supabaseAdmin } from '../supabase';
import type { RoomCategory, RoomCategoryInsert, RoomCategoryUpdate } from '../supabase';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export const roomCategoriesApi = {
  // Get all room categories
  async getCategories(): Promise<ApiResponse<RoomCategory[]>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('room_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des catégories';
      console.error('Error loading room categories:', error);
      return { data: null, error: message, success: false };
    }
  },

  // Get a single category by ID
  async getCategory(id: number): Promise<ApiResponse<RoomCategory>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('room_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement de la catégorie';
      console.error('Error loading room category:', error);
      return { data: null, error: message, success: false };
    }
  },

  // Create a new room category
  async createCategory(category: RoomCategoryInsert): Promise<ApiResponse<RoomCategory>> {
    try {
      const insertData = {
        ...category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('room_categories')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la création de la catégorie';
      console.error('Error creating room category:', error);
      return { data: null, error: message, success: false };
    }
  },

  // Update an existing room category
  async updateCategory(id: number, updates: RoomCategoryUpdate): Promise<ApiResponse<RoomCategory>> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('room_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la catégorie';
      console.error('Error updating room category:', error);
      return { data: null, error: message, success: false };
    }
  },

  // Delete a room category
  async deleteCategory(id: number): Promise<ApiResponse<boolean>> {
    try {
      // Check if category is used by any rooms
      const { data: rooms, error: checkError, count } = await supabaseAdmin
        .from('rooms')
        .select('id', { count: 'exact' })
        .eq('category_id', id);

      if (checkError) throw checkError;

      if (rooms && rooms.length > 0) {
        const roomCount = count || rooms.length;
        throw new Error(
          `Impossible de supprimer cette catégorie : ${roomCount} chambre${roomCount > 1 ? 's sont rattachées' : ' est rattachée'} à cette catégorie. Veuillez d'abord modifier ou supprimer ces chambres avant de supprimer la catégorie.`
        );
      }

      const { error } = await supabaseAdmin
        .from('room_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression de la catégorie';
      console.error('Error deleting room category:', error);
      return { data: false, error: message, success: false };
    }
  },

  // Get categories with room count
  async getCategoriesWithStats(): Promise<ApiResponse<(RoomCategory & { room_count: number })[]>> {
    try {
      const { data: categories, error: catError } = await supabaseAdmin
        .from('room_categories')
        .select('*')
        .order('name', { ascending: true });

      if (catError) throw catError;

      // Get room counts for each category
      const categoriesWithStats = await Promise.all(
        (categories || []).map(async (category) => {
          const { count } = await supabaseAdmin
            .from('rooms')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);

          return {
            ...category,
            room_count: count || 0
          };
        })
      );

      return { data: categoriesWithStats, error: null, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des statistiques';
      console.error('Error loading room categories with stats:', error);
      return { data: null, error: message, success: false };
    }
  }
};