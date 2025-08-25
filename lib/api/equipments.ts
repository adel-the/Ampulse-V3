import { supabase } from '../supabase'
import type { Tables, Inserts, Updates } from '../supabase'

// Type aliases for better clarity
export type Equipment = Tables<'equipments'>
export type EquipmentInsert = Inserts<'equipments'>
export type EquipmentUpdate = Updates<'equipments'>

// Extended type for equipment with usage count
export interface EquipmentWithUsageCount extends Equipment {
  hotels_count?: number
}

// Response types for consistent API responses
interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

interface ApiListResponse<T> {
  data: T[] | null
  error: string | null
  success: boolean
  count?: number
}

/**
 * Equipments API - CRUD operations for equipment management
 */
export const equipmentsApi = {
  /**
   * Get all equipments with optional filters
   */
  async getEquipments(filters?: {
    type?: string
    category?: string
    is_active?: boolean
    limit?: number
    offset?: number
  }): Promise<ApiListResponse<Equipment>> {
    try {
      let query = supabase
        .from('equipments')
        .select('*', { count: 'exact' })
        
      // Apply filters
      if (filters?.type) {
        query = query.eq('type', filters.type)
      }
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }
      
      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }
      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1)
      }
      
      // Order by ordre_affichage and nom
      query = query.order('ordre_affichage', { ascending: true })
        .order('nom', { ascending: true })

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching equipments:', error)
        return {
          data: null,
          error: error.message,
          success: false
        }
      }

      return {
        data: data || [],
        error: null,
        success: true,
        count: count || 0
      }
    } catch (err) {
      console.error('Unexpected error fetching equipments:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  },


  /**
   * Get a single equipment by ID
   */
  async getEquipment(id: number): Promise<ApiResponse<Equipment>> {
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching equipment:', error)
        return {
          data: null,
          error: error.message,
          success: false
        }
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (err) {
      console.error('Unexpected error fetching equipment:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  },

  /**
   * Create a new equipment
   */
  async createEquipment(data: EquipmentInsert): Promise<ApiResponse<Equipment>> {
    try {
      const equipmentData: EquipmentInsert = {
        ...data,
        est_actif: data.est_actif ?? true,
        ordre_affichage: data.ordre_affichage ?? 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: equipment, error } = await supabase
        .from('equipments')
        .insert(equipmentData)
        .select()
        .single()

      if (error) {
        console.error('Error creating equipment:', error)
        return {
          data: null,
          error: error.message,
          success: false
        }
      }

      return {
        data: equipment,
        error: null,
        success: true
      }
    } catch (err) {
      console.error('Unexpected error creating equipment:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  },

  /**
   * Update an existing equipment
   */
  async updateEquipment(id: number, data: EquipmentUpdate): Promise<ApiResponse<Equipment>> {
    try {
      const updateData: EquipmentUpdate = {
        ...data,
        updated_at: new Date().toISOString()
      }

      const { data: equipment, error } = await supabase
        .from('equipments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating equipment:', error)
        return {
          data: null,
          error: error.message,
          success: false
        }
      }

      return {
        data: equipment,
        error: null,
        success: true
      }
    } catch (err) {
      console.error('Unexpected error updating equipment:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  },

  /**
   * Delete an equipment
   */
  async deleteEquipment(id: number): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('equipments')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting equipment:', error)
        return {
          data: null,
          error: error.message,
          success: false
        }
      }

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (err) {
      console.error('Unexpected error deleting equipment:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  },




  /**
   * Search equipments by name or description
   */
  async searchEquipments(query: string, limit = 10): Promise<ApiListResponse<Equipment>> {
    try {
      const { data, error, count } = await supabase
        .from('equipments')
        .select('*', { count: 'exact' })
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Error searching equipments:', error)
        return {
          data: null,
          error: error.message,
          success: false
        }
      }

      return {
        data: data || [],
        error: null,
        success: true,
        count: count || 0
      }
    } catch (err) {
      console.error('Unexpected error searching equipments:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  },

}

// Export individual functions for convenience
export const {
  getEquipments,
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  searchEquipments
} = equipmentsApi

// Default export
export default equipmentsApi