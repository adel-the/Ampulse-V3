import { supabaseAdmin } from '../supabase'
import type { Tables, Inserts, Updates } from '../supabase'

// Type aliases for better clarity
export type Reservation = Tables<'reservations'>
export type ReservationInsert = Inserts<'reservations'>
export type ReservationUpdate = Updates<'reservations'>

// Extended types for the simplified reservation system
export interface SimpleReservationInsert {
  hotel_id: number
  chambre_id: number
  usager_id: number
  date_arrivee: string
  date_depart: string
  adults_count: number
  children_count: number
  room_rate: number
  total_amount: number
  special_requests?: string
  statut?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  prescripteur_name?: string  // Optional: nom du prescripteur pour affichage
}

export interface SimpleReservation extends Reservation {
  client?: Tables<'clients'>
  room?: Tables<'rooms'>
  hotel?: Tables<'hotels'>
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
 * Reservations API - CRUD operations for reservations table
 * Uses existing French naming conventions (chambre_id, usager_id, etc.)
 */
export const reservationsApi = {
  /**
   * Create a new reservation
   */
  async createReservation(data: SimpleReservationInsert): Promise<ApiResponse<SimpleReservation>> {
    try {
      // First, get the usager to retrieve their prescripteur_id
      const { data: usager, error: usagerError } = await supabaseAdmin
        .from('usagers')
        .select('id, prescripteur_id, nom, prenom')
        .eq('id', data.usager_id)
        .single()

      if (usagerError || !usager) {
        console.error('Error fetching usager:', usagerError)
        return {
          data: null,
          error: 'Usager not found',
          success: false
        }
      }

      // Calculate duration in nights
      const checkInDate = new Date(data.date_arrivee)
      const checkOutDate = new Date(data.date_depart)
      const duration = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

      // Prepare reservation data using existing schema field names
      const reservationData: ReservationInsert = {
        hotel_id: data.hotel_id,
        chambre_id: data.chambre_id,
        usager_id: data.usager_id,
        date_arrivee: data.date_arrivee,
        date_depart: data.date_depart,
        adults_count: data.adults_count || 1,
        children_count: data.children_count || 0,
        room_rate: data.room_rate,
        total_amount: data.total_amount,
        special_requests: data.special_requests || null,
        statut: data.statut || 'pending',
        prescripteur: data.prescripteur_name || `${usager.nom} ${usager.prenom}`, // Use prescripteur name if provided, fallback to usager name
        prix: data.room_rate, // Keep compatibility with existing field
        duree: duration // Duration in days calculated from dates
        // Note: created_at and updated_at are auto-managed by database triggers
        // Note: prescripteur_id column does not exist in the reservations table
      }

      const { data: reservation, error } = await supabaseAdmin
        .from('reservations')
        .insert(reservationData)
        .select(`
          *,
          usagers:usager_id(*),
          rooms:chambre_id(*),
          hotels:hotel_id(*)
        `)
        .single()

      if (error) {
        console.error('Error creating reservation:', error)
        return {
          data: null,
          error: error.message,
          success: false
        }
      }

      return {
        data: reservation as SimpleReservation,
        error: null,
        success: true
      }
    } catch (err) {
      console.error('Unexpected error creating reservation:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  },

  /**
   * Get reservations with filters
   */
  async getReservations(filters?: {
    hotel_id?: number
    usager_id?: number
    statut?: string
    date_arrivee_gte?: string
    date_depart_lte?: string
    limit?: number
    offset?: number
  }): Promise<ApiListResponse<SimpleReservation>> {
    try {
      let query = supabaseAdmin
        .from('reservations')
        .select(`
          *,
          usagers:usager_id(*),
          clients:prescripteur_id(*),
          rooms:chambre_id(*),
          hotels:hotel_id(*)
        `, { count: 'exact' })

      // Apply filters
      if (filters?.hotel_id) {
        query = query.eq('hotel_id', filters.hotel_id)
      }
      if (filters?.usager_id) {
        query = query.eq('usager_id', filters.usager_id)
      }
      if (filters?.statut) {
        query = query.eq('statut', filters.statut)
      }
      if (filters?.date_arrivee_gte) {
        query = query.gte('date_arrivee', filters.date_arrivee_gte)
      }
      if (filters?.date_depart_lte) {
        query = query.lte('date_depart', filters.date_depart_lte)
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }
      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1)
      }

      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching reservations:', error)
        return {
          data: null,
          error: error.message,
          success: false
        }
      }

      return {
        data: data as SimpleReservation[] || [],
        error: null,
        success: true,
        count: count || 0
      }
    } catch (err) {
      console.error('Unexpected error fetching reservations:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  },

  /**
   * Get a single reservation by ID
   */
  async getReservationById(id: number): Promise<ApiResponse<SimpleReservation>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('reservations')
        .select(`
          *,
          usagers:usager_id(*),
          rooms:chambre_id(*),
          hotels:hotel_id(*)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching reservation:', error)
        return {
          data: null,
          error: error.message,
          success: false
        }
      }

      return {
        data: data as SimpleReservation,
        error: null,
        success: true
      }
    } catch (err) {
      console.error('Unexpected error fetching reservation:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  },

  /**
   * Update reservation status
   */
  async updateReservationStatus(
    id: number, 
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  ): Promise<ApiResponse<SimpleReservation>> {
    try {
      const updateData: ReservationUpdate = {
        statut: status,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabaseAdmin
        .from('reservations')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          usagers:usager_id(*),
          rooms:chambre_id(*),
          hotels:hotel_id(*)
        `)
        .single()

      if (error) {
        console.error('Error updating reservation status:', error)
        return {
          data: null,
          error: error.message,
          success: false
        }
      }

      return {
        data: data as SimpleReservation,
        error: null,
        success: true
      }
    } catch (err) {
      console.error('Unexpected error updating reservation status:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  },

  /**
   * Check room availability for specific dates
   */
  async checkRoomAvailability(
    roomId: number,
    dates: {
      checkInDate: string
      checkOutDate: string
    },
    excludeReservationId?: number
  ): Promise<ApiResponse<{
    available: boolean
    conflictingReservations?: SimpleReservation[]
    reason?: string
  }>> {
    try {
      // First check if room exists and is not in maintenance
      const { data: room, error: roomError } = await supabaseAdmin
        .from('rooms')
        .select('id, statut, hotel_id')
        .eq('id', roomId)
        .single()

      if (roomError || !room) {
        return {
          data: {
            available: false,
            reason: 'Room not found'
          },
          error: roomError?.message || 'Room not found',
          success: false
        }
      }

      if (room.statut === 'maintenance') {
        return {
          data: {
            available: false,
            reason: 'Room is under maintenance'
          },
          error: null,
          success: true
        }
      }

      // Check for conflicting reservations
      let query = supabaseAdmin
        .from('reservations')
        .select(`
          *,
          usagers:usager_id(*),
          rooms:chambre_id(*),
          hotels:hotel_id(*)
        `)
        .eq('chambre_id', roomId)
        .in('statut', ['confirmed', 'pending', 'CONFIRMEE', 'EN_COURS'])
        .or(`date_arrivee.lte.${dates.checkOutDate},date_depart.gte.${dates.checkInDate}`)

      // Exclude a specific reservation if provided (useful for updates)
      if (excludeReservationId) {
        query = query.neq('id', excludeReservationId)
      }

      const { data: conflictingReservations, error: resError } = await query

      if (resError) {
        console.error('Error checking room availability:', resError)
        return {
          data: {
            available: false,
            reason: 'Error checking reservations'
          },
          error: resError.message,
          success: false
        }
      }

      const hasConflicts = conflictingReservations && conflictingReservations.length > 0
      
      return {
        data: {
          available: !hasConflicts,
          conflictingReservations: (conflictingReservations as SimpleReservation[]) || [],
          reason: hasConflicts ? 'Room has conflicting reservations' : undefined
        },
        error: null,
        success: true
      }
    } catch (err) {
      console.error('Unexpected error checking room availability:', err)
      return {
        data: {
          available: false,
          reason: 'Unexpected error occurred'
        },
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  },

  /**
   * Cancel a reservation
   */
  async cancelReservation(id: number, reason?: string): Promise<ApiResponse<SimpleReservation>> {
    try {
      const updateData: ReservationUpdate = {
        statut: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled',
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabaseAdmin
        .from('reservations')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          usagers:usager_id(*),
          rooms:chambre_id(*),
          hotels:hotel_id(*)
        `)
        .single()

      if (error) {
        console.error('Error cancelling reservation:', error)
        return {
          data: null,
          error: error.message,
          success: false
        }
      }

      return {
        data: data as SimpleReservation,
        error: null,
        success: true
      }
    } catch (err) {
      console.error('Unexpected error cancelling reservation:', err)
      return {
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        success: false
      }
    }
  }
}

// Export individual functions for convenience
export const {
  createReservation,
  getReservations,
  getReservationById,
  updateReservationStatus,
  checkRoomAvailability,
  cancelReservation
} = reservationsApi

// Default export
export default reservationsApi