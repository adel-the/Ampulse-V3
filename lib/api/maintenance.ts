// API simplifiée pour les tâches de maintenance avec optimistic updates
import { supabase, supabaseAdmin } from '@/lib/supabase';
import type { MaintenanceTaskWithRelations } from '@/lib/supabase';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Type pour les tâches avec état optimiste
export interface OptimisticTask extends MaintenanceTaskWithRelations {
  _isOptimistic?: boolean;
  _tempId?: string;
}

/**
 * Récupère toutes les tâches de maintenance
 */
export async function getMaintenanceTasks(
  hotelId?: number,
  roomId?: number
): Promise<ApiResponse<MaintenanceTaskWithRelations[]>> {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const client = isDevelopment ? supabaseAdmin : supabase;
    
    let query = client
      .from('maintenance_tasks')
      .select(`
        *,
        room:rooms(numero, bed_type),
        hotel:hotels(nom)
      `)
      .order('created_at', { ascending: false });
    
    if (hotelId) {
      query = query.eq('hotel_id', hotelId);
    }
    
    if (roomId) {
      query = query.eq('room_id', roomId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { data: data || [], error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des tâches';
    console.error('Error fetching maintenance tasks:', err);
    return { data: null, error: errorMessage, success: false };
  }
}

/**
 * Crée une nouvelle tâche de maintenance
 */
export async function createMaintenanceTask(
  taskData: {
    titre: string;
    description?: string;
    priorite: string;
    responsable?: string;
    date_echeance?: string;
    notes?: string;
    room_id?: number;
  },
  hotelId: number,
  userId?: string
): Promise<ApiResponse<MaintenanceTaskWithRelations>> {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const fallbackUserId = 'c8c827c4-419f-409c-a696-e6bf0856984b';
    const actualUserId = userId || (isDevelopment ? fallbackUserId : null);
    
    if (!actualUserId) {
      return { data: null, error: 'ID utilisateur requis', success: false };
    }
    
    const client = isDevelopment ? supabaseAdmin : supabase;
    
    const insertData = {
      ...taskData,
      hotel_id: hotelId,
      user_owner_id: actualUserId,
      statut: 'en_attente',
      created_by: actualUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await client
      .from('maintenance_tasks')
      .insert(insertData)
      .select(`
        *,
        room:rooms(numero, bed_type),
        hotel:hotels(nom)
      `)
      .single();
    
    if (error) throw error;
    
    return { data, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la tâche';
    console.error('Error creating maintenance task:', err);
    return { data: null, error: errorMessage, success: false };
  }
}

/**
 * Met à jour une tâche de maintenance
 */
export async function updateMaintenanceTask(
  id: number,
  updates: Partial<MaintenanceTask>,
  userId?: string
): Promise<ApiResponse<MaintenanceTaskWithRelations>> {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const fallbackUserId = 'c8c827c4-419f-409c-a696-e6bf0856984b';
    const actualUserId = userId || (isDevelopment ? fallbackUserId : null);
    
    if (!actualUserId) {
      return { data: null, error: 'ID utilisateur requis', success: false };
    }
    
    const client = isDevelopment ? supabaseAdmin : supabase;
    
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    // Gérer le completed_at automatiquement
    if (updates.statut === 'terminee' && !updates.completed_at) {
      updateData.completed_at = new Date().toISOString();
    } else if (updates.statut !== 'terminee') {
      updateData.completed_at = null;
    }
    
    const { data, error } = await client
      .from('maintenance_tasks')
      .update(updateData)
      .eq('id', id)
      .eq('user_owner_id', actualUserId)
      .select(`
        *,
        room:rooms(numero, bed_type),
        hotel:hotels(nom)
      `)
      .single();
    
    if (error) throw error;
    
    return { data, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la tâche';
    console.error('Error updating maintenance task:', err);
    return { data: null, error: errorMessage, success: false };
  }
}

/**
 * Supprime une tâche de maintenance
 */
export async function deleteMaintenanceTask(
  id: number,
  userId?: string
): Promise<ApiResponse<null>> {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const fallbackUserId = 'c8c827c4-419f-409c-a696-e6bf0856984b';
    const actualUserId = userId || (isDevelopment ? fallbackUserId : null);
    
    if (!actualUserId) {
      return { data: null, error: 'ID utilisateur requis', success: false };
    }
    
    const client = isDevelopment ? supabaseAdmin : supabase;
    
    const { error } = await client
      .from('maintenance_tasks')
      .delete()
      .eq('id', id)
      .eq('user_owner_id', actualUserId);
    
    if (error) throw error;
    
    return { data: null, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la tâche';
    console.error('Error deleting maintenance task:', err);
    return { data: null, error: errorMessage, success: false };
  }
}

/**
 * Change rapidement le statut d'une tâche
 */
export async function quickUpdateTaskStatus(
  id: number,
  action: 'start' | 'complete' | 'cancel',
  userId?: string
): Promise<ApiResponse<MaintenanceTaskWithRelations>> {
  const statusMap = {
    start: 'en_cours',
    complete: 'terminee',
    cancel: 'annulee'
  };
  
  return updateMaintenanceTask(id, { statut: statusMap[action] }, userId);
}