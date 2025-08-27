import { useState, useEffect } from 'react'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { 
  Hotel, 
  Room, 
  Usager, 
  OperateurSocial, 
  Reservation, 
  ConventionPrix,
  ProcessusReservation,
  Conversation,
  Message,
  DocumentTemplate,
  Document,
  Notification,
  Client,
  ClientCategory,
  CLIENT_TYPES,
  ClientWithDetails,
  ClientSearchResult,
  ClientStatistics,
  Referent,
  ConventionTarifaire,
  Equipment,
  EquipmentInsert,
  EquipmentUpdate,
  HotelEquipment,
  HotelEquipmentInsert,
  HotelEquipmentUpdate,
  Inserts,
  Updates,
  RoomInsert,
  RoomUpdate
} from '@/lib/supabase'

// Types for API responses
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

// Hook options interface
interface HookOptions {
  enableRealTime?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

// Equipment filters
interface EquipmentFilters {
  categorie?: 'connectivity' | 'services' | 'wellness' | 'accessibility' | 'security' | 'recreation' | 'general'
  est_premium?: boolean
  est_actif?: boolean
}


// Hook pour les établissements (hôtels) avec support multi-tenant
export const useEstablishments = (options?: HookOptions) => {
  const [establishments, setEstablishments] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const { enableRealTime = true, autoRefresh = false, refreshInterval = 30000 } = options || {}

  const fetchEstablishments = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user) {
        setEstablishments([])
        return
      }

      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('user_owner_id', user.id)
        .order('nom')

      if (error) throw error
      setEstablishments(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des établissements')
    } finally {
      setLoading(false)
    }
  }

  const createEstablishment = async (establishment: Omit<Hotel, 'id' | 'created_at' | 'updated_at' | 'user_owner_id'>): Promise<ApiResponse<Hotel>> => {
    try {
      if (!user) {
        return { data: null, error: 'Utilisateur non authentifié', success: false }
      }

      setError(null)
      const establishmentData = {
        ...establishment,
        user_owner_id: user.id,
        statut: establishment.statut || 'ACTIF',
        chambres_total: establishment.chambres_total || 0,
        chambres_occupees: establishment.chambres_occupees || 0,
        taux_occupation: establishment.taux_occupation || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('hotels')
        .insert(establishmentData)
        .select()
        .single()

      if (error) throw error
      setEstablishments(prev => [...prev, data])
      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de l\'établissement'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const updateEstablishment = async (id: number, updates: Partial<Hotel>): Promise<ApiResponse<Hotel>> => {
    try {
      setError(null)
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('hotels')
        .update(updateData)
        .eq('id', id)
        .eq('user_owner_id', user?.id) // Ensure user can only update their own establishments
        .select()
        .single()

      if (error) throw error
      setEstablishments(prev => prev.map(hotel => hotel.id === id ? data : hotel))
      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'établissement'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const deleteEstablishment = async (id: number, hardDelete = false): Promise<ApiResponse<boolean>> => {
    try {
      setError(null)

      if (hardDelete) {
        const { error } = await supabase
          .from('hotels')
          .delete()
          .eq('id', id)
          .eq('user_owner_id', user?.id)

        if (error) throw error
        setEstablishments(prev => prev.filter(hotel => hotel.id !== id))
      } else {
        const { data, error } = await supabase
          .from('hotels')
          .update({ statut: 'INACTIF', updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_owner_id', user?.id)
          .select()
          .single()

        if (error) throw error
        setEstablishments(prev => prev.map(hotel => hotel.id === id ? data : hotel))
      }

      return { data: true, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'établissement'
      setError(errorMessage)
      return { data: false, error: errorMessage, success: false }
    }
  }

  // Real-time subscription
  useEffect(() => {
    if (!enableRealTime || !user) return

    const channel = supabase
      .channel(`hotels-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hotels',
          filter: `user_owner_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time establishment update:', payload)
          
          switch (payload.eventType) {
            case 'INSERT':
              setEstablishments(prev => {
                if (!prev.some(e => e.id === payload.new.id)) {
                  return [...prev, payload.new as Hotel].sort((a, b) => a.nom.localeCompare(b.nom))
                }
                return prev
              })
              break
            case 'UPDATE':
              setEstablishments(prev => prev.map(establishment => 
                establishment.id === payload.new.id ? payload.new as Hotel : establishment
              ))
              break
            case 'DELETE':
              setEstablishments(prev => prev.filter(establishment => establishment.id !== payload.old.id))
              break
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, enableRealTime])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchEstablishments, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  // Initial fetch
  useEffect(() => {
    fetchEstablishments()
  }, [user])

  return { 
    establishments, 
    loading, 
    error, 
    fetchEstablishments, 
    createEstablishment, 
    updateEstablishment, 
    deleteEstablishment
  }
}

// Backward compatibility alias
export const useHotels = useEstablishments

// Hook pour les réservations
export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          usagers (nom, prenom, telephone, email),
          hotels (nom, adresse, ville),
          rooms (numero, type),
          operateurs_sociaux (nom, prenom, organisation)
        `)
        .order('date_arrivee', { ascending: false })

      if (error) throw error
      setReservations(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des réservations')
    } finally {
      setLoading(false)
    }
  }

  const createReservation = async (reservation: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert(reservation)
        .select(`
          *,
          usagers (nom, prenom),
          hotels (nom, adresse),
          rooms (numero, type)
        `)
        .single()

      if (error) throw error
      setReservations(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la réservation')
      throw err
    }
  }

  const updateReservation = async (id: number, updates: Partial<Reservation>) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          usagers (nom, prenom),
          hotels (nom, adresse),
          rooms (numero, type)
        `)
        .single()

      if (error) throw error
      setReservations(prev => prev.map(res => res.id === id ? data : res))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la réservation')
      throw err
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [])

  return { reservations, loading, error, fetchReservations, createReservation, updateReservation }
}

// Hook pour les chambres avec support API complet et multi-tenancy
export const useRooms = (hotelId?: number, options?: {
  enableRealTime?: boolean
  autoRefresh?: boolean
  filters?: {
    statut?: 'disponible' | 'occupee' | 'maintenance'
    type?: string
    floor?: number
  }
}) => {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuth()

  const { enableRealTime = true, autoRefresh = false, filters } = options || {}

  const fetchRooms = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      if (!hotelId) {
        setRooms([])
        return
      }

      // Verify user owns the hotel
      if (user) {
        const { data: hotelData, error: hotelError } = await supabase
          .from('hotels')
          .select('id')
          .eq('id', hotelId)
          .eq('user_owner_id', user.id)
          .single()

        if (hotelError || !hotelData) {
          throw new Error('Accès non autorisé à cet hôtel')
        }
      }

      let query = supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('numero')

      // Apply filters
      if (filters?.statut) {
        query = query.eq('statut', filters.statut)
      }
      if (filters?.type) {
        query = query.eq('type', filters.type)
      }
      if (filters?.floor !== undefined) {
        query = query.eq('floor', filters.floor)
      }

      const { data, error } = await query

      if (error) throw error
      setRooms(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des chambres'
      setError(errorMessage)
      console.error('Error fetching rooms:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const createRoom = async (room: RoomInsert): Promise<ApiResponse<Room>> => {
    try {
      if (!hotelId) {
        return { data: null, error: 'ID d\'hôtel requis', success: false }
      }

      // Verify user owns the hotel
      if (user) {
        const { data: hotelData, error: hotelError } = await supabase
          .from('hotels')
          .select('id')
          .eq('id', hotelId)
          .eq('user_owner_id', user.id)
          .single()

        if (hotelError || !hotelData) {
          return { data: null, error: 'Accès non autorisé à cet hôtel', success: false }
        }
      }

      setError(null)
      
      const roomData = {
        ...room,
        hotel_id: hotelId,
        statut: room.statut || 'disponible',
        equipment_ids: room.equipment_ids || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('rooms')
        .insert(roomData)
        .select()
        .single()

      if (error) throw error
      
      // Update local state optimistically
      setRooms(prev => {
        const newRooms = [...prev, data]
        return newRooms.sort((a, b) => a.numero.localeCompare(b.numero))
      })
      
      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la chambre'
      setError(errorMessage)
      console.error('Error creating room:', err)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const updateRoom = async (id: number, updates: RoomUpdate): Promise<ApiResponse<Room>> => {
    try {
      if (!hotelId) {
        return { data: null, error: 'ID d\'hôtel requis', success: false }
      }

      setError(null)
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('rooms')
        .update(updateData)
        .eq('id', id)
        .eq('hotel_id', hotelId) // Ensure room belongs to the specified hotel
        .select()
        .single()

      if (error) throw error
      
      // Update local state optimistically
      setRooms(prev => prev.map(room => room.id === id ? data : room))
      
      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la chambre'
      setError(errorMessage)
      console.error('Error updating room:', err)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const deleteRoom = async (id: number): Promise<ApiResponse<boolean>> => {
    try {
      if (!hotelId) {
        return { data: false, error: 'ID d\'hôtel requis', success: false }
      }

      setError(null)
      
      // Check for active reservations first
      const { data: reservations, error: checkError } = await supabase
        .from('reservations')
        .select('id')
        .eq('chambre_id', id)
        .in('statut', ['CONFIRMEE', 'EN_COURS'])
        .limit(1)

      if (checkError) {
        console.warn('Could not check reservations before deletion:', checkError)
      } else if (reservations && reservations.length > 0) {
        throw new Error('Impossible de supprimer une chambre avec des réservations actives')
      }

      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id)
        .eq('hotel_id', hotelId) // Ensure room belongs to the specified hotel

      if (error) throw error
      
      // Update local state optimistically
      setRooms(prev => prev.filter(room => room.id !== id))
      
      return { data: true, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la chambre'
      setError(errorMessage)
      console.error('Error deleting room:', err)
      return { data: false, error: errorMessage, success: false }
    }
  }

  const updateRoomStatus = async (id: number, status: 'disponible' | 'occupee' | 'maintenance'): Promise<ApiResponse<Room>> => {
    try {
      if (!hotelId) {
        return { data: null, error: 'ID d\'hôtel requis', success: false }
      }

      setError(null)
      const updateData: Partial<Room> = {
        statut: status,
        updated_at: new Date().toISOString()
      }

      // If room becomes available, update last_cleaned
      if (status === 'disponible') {
        updateData.last_cleaned = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('rooms')
        .update(updateData)
        .eq('id', id)
        .eq('hotel_id', hotelId) // Ensure room belongs to the specified hotel
        .select()
        .single()

      if (error) throw error
      
      // Update local state optimistically
      setRooms(prev => prev.map(room => room.id === id ? data : room))
      
      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut'
      setError(errorMessage)
      console.error('Error updating room status:', err)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const checkRoomAvailability = async (roomId: number, dates: { dateArrivee: string, dateDepart: string }) => {
    try {
      setError(null)
      
      // Check if room exists and is not in maintenance
      const room = rooms.find(r => r.id === roomId)
      if (!room) {
        return { available: false, reason: 'Chambre non trouvée', success: false }
      }

      if (room.statut === 'maintenance') {
        return { available: false, reason: 'Chambre en maintenance', success: true }
      }

      // Check for conflicting reservations
      const { data: conflictingReservations, error } = await supabase
        .from('reservations')
        .select('id, date_arrivee, date_depart, statut')
        .eq('chambre_id', roomId)
        .in('statut', ['CONFIRMEE', 'EN_COURS'])
        .or(`date_arrivee.lte.${dates.dateDepart},date_depart.gte.${dates.dateArrivee}`)

      if (error) throw error

      const hasConflicts = conflictingReservations && conflictingReservations.length > 0
      
      return {
        available: !hasConflicts,
        conflictingReservations: conflictingReservations || [],
        reason: hasConflicts ? 'Chambre déjà réservée pour ces dates' : undefined,
        success: true
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la vérification de disponibilité'
      setError(errorMessage)
      console.error('Error checking room availability:', err)
      return { available: false, reason: errorMessage, success: false }
    }
  }

  const getRoomById = (id: number): Room | undefined => {
    return rooms.find(room => room.id === id)
  }

  const getRoomsByType = (type: string): Room[] => {
    return rooms.filter(room => room.type === type)
  }

  const getAvailableRooms = (): Room[] => {
    return rooms.filter(room => room.statut === 'disponible')
  }

  const getRoomStatistics = () => {
    const total = rooms.length
    const available = rooms.filter(r => r.statut === 'disponible').length
    const occupied = rooms.filter(r => r.statut === 'occupee').length
    const maintenance = rooms.filter(r => r.statut === 'maintenance').length
    const occupancyRate = total > 0 ? (occupied / total) * 100 : 0

    const roomsByType: Record<string, number> = {}
    rooms.forEach(room => {
      if (room.type) {
        roomsByType[room.type] = (roomsByType[room.type] || 0) + 1
      }
    })

    return {
      total,
      available,
      occupied,
      maintenance,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      roomsByType
    }
  }

  const getRoomEquipmentDetails = async (roomId: number) => {
    try {
      const room = rooms.find(r => r.id === roomId)
      if (!room || !room.equipment_ids || room.equipment_ids.length === 0) {
        return []
      }

      const { data, error } = await supabaseAdmin
        .from('hotel_equipment')
        .select('*')
        .in('id', room.equipment_ids)
        .eq('est_actif', true)
        .order('categorie')
        .order('ordre_affichage')
        .order('nom')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching room equipment details:', err)
      return []
    }
  }

  // Real-time subscription setup
  useEffect(() => {
    if (!enableRealTime || !hotelId) return

    const channel = supabase
      .channel(`rooms-${hotelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `hotel_id=eq.${hotelId}`
        },
        (payload) => {
          console.log('Real-time room update:', payload)
          
          switch (payload.eventType) {
            case 'INSERT':
              setRooms(prev => {
                if (!prev.some(r => r.id === payload.new.id)) {
                  const newRooms = [...prev, payload.new as Room]
                  return newRooms.sort((a, b) => a.numero.localeCompare(b.numero))
                }
                return prev
              })
              break
            case 'UPDATE':
              setRooms(prev => prev.map(room => 
                room.id === payload.new.id ? payload.new as Room : room
              ))
              break
            case 'DELETE':
              setRooms(prev => prev.filter(room => room.id !== payload.old.id))
              break
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [hotelId, enableRealTime])

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchRooms(true)
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, hotelId, filters])

  // Initial fetch
  useEffect(() => {
    fetchRooms()
  }, [hotelId, filters])

  return { 
    rooms, 
    loading, 
    error, 
    refreshing,
    fetchRooms: () => fetchRooms(true), 
    createRoom, 
    updateRoom, 
    deleteRoom,
    updateRoomStatus,
    checkRoomAvailability,
    getRoomById,
    getRoomsByType,
    getAvailableRooms,
    getRoomStatistics,
    getRoomEquipmentDetails
  }
}

// Hook pour les usagers
export const useUsagers = () => {
  const [usagers, setUsagers] = useState<Usager[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsagers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('usagers')
        .select('*')
        .order('nom')

      if (error) throw error
      setUsagers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des usagers')
    } finally {
      setLoading(false)
    }
  }

  const createUsager = async (usager: Omit<Usager, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('usagers')
        .insert(usager)
        .select()
        .single()

      if (error) throw error
      setUsagers(prev => [...prev, data])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de l\'usager')
      throw err
    }
  }

  useEffect(() => {
    fetchUsagers()
  }, [])

  return { usagers, loading, error, fetchUsagers, createUsager }
}

// Hook pour les opérateurs sociaux
export const useOperateursSociaux = () => {
  const [operateurs, setOperateurs] = useState<OperateurSocial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOperateurs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('operateurs_sociaux')
        .select('*')
        .order('nom')

      if (error) throw error
      setOperateurs(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des opérateurs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOperateurs()
  }, [])

  return { operateurs, loading, error, fetchOperateurs }
}

// Hook pour les templates de documents
export const useDocumentTemplates = () => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('statut', 'actif')
        .order('nom')

      if (error) throw error
      setTemplates(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  return { templates, loading, error, fetchTemplates }
}

// Hook pour les notifications
export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error
      setNotifications(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ lu: true })
        .eq('id', id)

      if (error) throw error
      setNotifications(prev => prev.map(notif => 
        notif.id === id ? { ...notif, lu: true } : notif
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la notification')
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [userId])

  return { notifications, loading, error, fetchNotifications, markAsRead }
}

// Hook pour les statistiques du tableau de bord
export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalHotels: 0,
    activeHotels: 0,
    totalChambres: 0,
    chambresOccupees: 0,
    tauxOccupationMoyen: 0,
    reservationsActives: 0,
    revenusMensuel: 0,
    totalOperateurs: 0,
    operateursActifs: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Récupérer les statistiques des hôtels
      const { data: hotels, error: hotelsError } = await supabase
        .from('hotels')
        .select('chambres_total, chambres_occupees, taux_occupation, statut')

      if (hotelsError) throw hotelsError

      // Récupérer les réservations actives
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('prix, duree, statut')
        .in('statut', ['CONFIRMEE', 'EN_COURS'])

      if (reservationsError) throw reservationsError

      // Récupérer les opérateurs
      const { data: operateurs, error: operateursError } = await supabase
        .from('operateurs_sociaux')
        .select('statut')

      if (operateursError) throw operateursError

      // Calculer les statistiques
      const totalHotels = hotels?.length || 0
      const activeHotels = hotels?.filter(h => h.statut === 'ACTIF').length || 0
      const totalChambres = hotels?.reduce((sum, h) => sum + h.chambres_total, 0) || 0
      const chambresOccupees = hotels?.reduce((sum, h) => sum + h.chambres_occupees, 0) || 0
      const tauxOccupationMoyen = hotels?.length ? 
        Math.round(hotels.reduce((sum, h) => sum + h.taux_occupation, 0) / hotels.length) : 0
      const reservationsActives = reservations?.length || 0
      const revenusMensuel = reservations?.reduce((sum, r) => sum + (r.prix * r.duree), 0) || 0
      const totalOperateurs = operateurs?.length || 0
      const operateursActifs = operateurs?.filter(o => o.statut === 'actif').length || 0

      setStats({
        totalHotels,
        activeHotels,
        totalChambres,
        chambresOccupees,
        tauxOccupationMoyen,
        reservationsActives,
        revenusMensuel,
        totalOperateurs,
        operateursActifs
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return { stats, loading, error, fetchStats }
}

// DEPRECATED: Hook pour les équipements (ancien système global)
// Utiliser useHotelEquipmentCRUD à la place
/*
export const useEquipments = (filters?: EquipmentFilters, options?: HookOptions) => {
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { enableRealTime = false, autoRefresh = false, refreshInterval = 30000 } = options || {}

  const fetchEquipments = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('equipments')
        .select('*')

      // Apply filters
      if (filters?.categorie) {
        query = query.eq('categorie', filters.categorie)
      }
      if (filters?.est_premium !== undefined) {
        query = query.eq('est_premium', filters.est_premium)
      }
      if (filters?.est_actif !== undefined) {
        query = query.eq('est_actif', filters.est_actif)
      }

      query = query.order('categorie').order('ordre_affichage').order('nom')

      const { data, error } = await query

      if (error) throw error
      setEquipments(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des équipements')
    } finally {
      setLoading(false)
    }
  }

  const createEquipment = async (equipment: EquipmentInsert): Promise<ApiResponse<Equipment>> => {
    try {
      setError(null)
      const equipmentData = {
        ...equipment,
        est_actif: equipment.est_actif ?? true,
        ordre_affichage: equipment.ordre_affichage ?? 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('equipments')
        .insert(equipmentData)
        .select()
        .single()

      if (error) throw error
      setEquipments(prev => [...prev, data].sort((a, b) => 
        a.categorie.localeCompare(b.categorie) || a.ordre_affichage - b.ordre_affichage || a.nom.localeCompare(b.nom)
      ))
      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de l\'équipement'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const updateEquipment = async (id: number, updates: EquipmentUpdate): Promise<ApiResponse<Equipment>> => {
    try {
      setError(null)
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('equipments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setEquipments(prev => prev.map(equipment => equipment.id === id ? data : equipment))
      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'équipement'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const deleteEquipment = async (id: number): Promise<ApiResponse<boolean>> => {
    try {
      setError(null)


      const { error } = await supabase
        .from('equipments')
        .delete()
        .eq('id', id)

      if (error) throw error
      setEquipments(prev => prev.filter(equipment => equipment.id !== id))
      return { data: true, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'équipement'
      setError(errorMessage)
      return { data: false, error: errorMessage, success: false }
    }
  }

  // Real-time subscription
  useEffect(() => {
    if (!enableRealTime) return

    const channel = supabase
      .channel('equipments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipments'
        },
        (payload) => {
          console.log('Real-time equipment update:', payload)
          
          switch (payload.eventType) {
            case 'INSERT':
              setEquipments(prev => {
                if (!prev.some(e => e.id === payload.new.id)) {
                  const newEquipments = [...prev, payload.new as Equipment]
                  return newEquipments.sort((a, b) => 
                    a.categorie.localeCompare(b.categorie) || a.ordre_affichage - b.ordre_affichage || a.nom.localeCompare(b.nom)
                  )
                }
                return prev
              })
              break
            case 'UPDATE':
              setEquipments(prev => prev.map(equipment => 
                equipment.id === payload.new.id ? payload.new as Equipment : equipment
              ))
              break
            case 'DELETE':
              setEquipments(prev => prev.filter(equipment => equipment.id !== payload.old.id))
              break
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enableRealTime])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchEquipments, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  // Initial fetch
  useEffect(() => {
    fetchEquipments()
  }, [filters?.categorie, filters?.est_premium, filters?.est_actif])

  return { 
    equipments, 
    loading, 
    error, 
    fetchEquipments, 
    createEquipment, 
    updateEquipment, 
    deleteEquipment
  }
}
*/

// Hook pour les clients
export const useClients = (options?: HookOptions) => {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { enableRealTime = false, autoRefresh = false, refreshInterval = 30000 } = options || {}

  const fetchClients = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabaseAdmin
        .from('clients')
        .select('*')
        .order('nom')

      if (error) throw error
      setClients(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
    }
  }

  const createClient = async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Client>> => {
    try {
      setError(null)
      const clientData = {
        ...client,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabaseAdmin
        .from('clients')
        .insert(clientData)
        .select()
        .single()

      if (error) throw error
      setClients(prev => [...prev, data].sort((a, b) => a.nom.localeCompare(b.nom)))
      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du client'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const updateClient = async (id: number, updates: Partial<Client>): Promise<ApiResponse<Client>> => {
    try {
      setError(null)
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabaseAdmin
        .from('clients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setClients(prev => prev.map(client => client.id === id ? data : client))
      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du client'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const deleteClient = async (id: number): Promise<ApiResponse<boolean>> => {
    try {
      setError(null)

      // Check for active reservations first
      const { data: reservations, error: checkError } = await supabase
        .from('reservations')
        .select('id')
        .eq('usager_id', id) // Assuming clients are linked as usagers in reservations
        .in('statut', ['CONFIRMEE', 'EN_COURS'])
        .limit(1)

      if (checkError) {
        console.warn('Could not check reservations before deletion:', checkError)
      } else if (reservations && reservations.length > 0) {
        throw new Error('Impossible de supprimer un client avec des réservations actives')
      }

      const { error } = await supabaseAdmin
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error
      setClients(prev => prev.filter(client => client.id !== id))
      return { data: true, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du client'
      setError(errorMessage)
      return { data: false, error: errorMessage, success: false }
    }
  }

  const getClientById = (id: number): Client | undefined => {
    return clients.find(client => client.id === id)
  }

  const searchClients = async (searchTerm?: string, typeId?: number, statut?: string): Promise<ApiResponse<ClientSearchResult[]>> => {
    try {
      setError(null)
      
      const { data, error } = await supabaseAdmin
        .rpc('search_simple_clients', {
          p_search_term: searchTerm || '',
          p_client_type: typeId ? (typeId === 1 ? 'Particulier' : typeId === 2 ? 'Entreprise' : 'Association') : null,
          p_statut: statut || null,
          p_limit: 100
        })

      if (error) throw error
      return { data: data || [], error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la recherche des clients'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const getClientWithDetails = async (id: number): Promise<ApiResponse<ClientWithDetails>> => {
    try {
      setError(null)
      
      const { data, error } = await supabaseAdmin
        .from('clients')
        .select(`
          *,
          type:client_types(*),
          referents(*),
          conventions:conventions_tarifaires(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des détails du client'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const getClientStatistics = async (): Promise<ApiResponse<ClientStatistics>> => {
    try {
      setError(null)
      
      const { data, error } = await supabaseAdmin
        .rpc('get_simple_client_statistics')

      if (error) throw error
      return { data: data?.[0] || null, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const getClientTypes = async (): Promise<ApiResponse<Array<{id: number, nom: string}>>> => {
    try {
      setError(null)
      
      // Return static client types for backward compatibility
      const types = CLIENT_TYPES.map((type, index) => ({
        id: index + 1,
        nom: type
      }));
      
      return { data: types, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des types de clients'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const getBasicClientStatistics = () => {
    const total = clients.length
    const activeClients = clients.filter(c => c.statut === 'actif').length
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)
    const nouveauxCeMois = clients.filter(c => new Date(c.created_at) >= thisMonth).length

    return {
      total_clients: total,
      clients_actifs: activeClients,
      nouveaux_ce_mois: nouveauxCeMois
    }
  }

  // Real-time subscription
  useEffect(() => {
    if (!enableRealTime) return

    const channel = supabase
      .channel('clients')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients'
        },
        (payload) => {
          console.log('Real-time client update:', payload)
          
          switch (payload.eventType) {
            case 'INSERT':
              setClients(prev => {
                if (!prev.some(c => c.id === payload.new.id)) {
                  const newClients = [...prev, payload.new as Client]
                  return newClients.sort((a, b) => a.nom.localeCompare(b.nom))
                }
                return prev
              })
              break
            case 'UPDATE':
              setClients(prev => prev.map(client => 
                client.id === payload.new.id ? payload.new as Client : client
              ))
              break
            case 'DELETE':
              setClients(prev => prev.filter(client => client.id !== payload.old.id))
              break
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enableRealTime])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchClients, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  // Initial fetch
  useEffect(() => {
    fetchClients()
  }, [])

  return { 
    clients, 
    loading, 
    error, 
    fetchClients, 
    createClient, 
    updateClient, 
    deleteClient,
    getClientById,
    searchClients,
    getClientWithDetails,
    getClientStatistics,
    getClientTypes,
    getBasicClientStatistics
  }
}

// Hook pour les référents
export const useReferents = (clientId?: number) => {
  const [referents, setReferents] = useState<Referent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReferents = async () => {
    if (!clientId) {
      setReferents([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('referents')
        .select('*')
        .eq('client_id', clientId)
        .order('nom')

      if (error) throw error
      setReferents(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des référents')
    } finally {
      setLoading(false)
    }
  }

  const createReferent = async (referent: Omit<Referent, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Referent>> => {
    try {
      setError(null)
      const referentData = {
        ...referent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('referents')
        .insert(referentData)
        .select()
        .single()

      if (error) throw error
      setReferents(prev => [...prev, data].sort((a, b) => a.nom.localeCompare(b.nom)))
      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du référent'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const updateReferent = async (id: number, updates: Partial<Referent>): Promise<ApiResponse<Referent>> => {
    try {
      setError(null)
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('referents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setReferents(prev => prev.map(ref => ref.id === id ? data : ref))
      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du référent'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const deleteReferent = async (id: number): Promise<ApiResponse<boolean>> => {
    try {
      setError(null)
      
      const { error } = await supabase
        .from('referents')
        .delete()
        .eq('id', id)

      if (error) throw error
      setReferents(prev => prev.filter(ref => ref.id !== id))
      return { data: true, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du référent'
      setError(errorMessage)
      return { data: false, error: errorMessage, success: false }
    }
  }

  useEffect(() => {
    fetchReferents()
  }, [clientId])

  return {
    referents,
    loading,
    error,
    fetchReferents,
    createReferent,
    updateReferent,
    deleteReferent
  }
}

// Hook pour les conventions tarifaires
export const useConventions = (clientId?: number) => {
  const [conventions, setConventions] = useState<ConventionTarifaire[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConventions = async () => {
    if (!clientId) {
      setConventions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('conventions_tarifaires')
        .select('*')
        .eq('client_id', clientId)
        .order('date_debut', { ascending: false })

      if (error) throw error
      setConventions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des conventions')
    } finally {
      setLoading(false)
    }
  }

  const createConvention = async (convention: Omit<ConventionTarifaire, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<ConventionTarifaire>> => {
    try {
      setError(null)
      const conventionData = {
        ...convention,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('conventions_tarifaires')
        .insert(conventionData)
        .select()
        .single()

      if (error) throw error
      setConventions(prev => [data, ...prev])
      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la convention'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const updateConvention = async (id: number, updates: Partial<ConventionTarifaire>): Promise<ApiResponse<ConventionTarifaire>> => {
    try {
      setError(null)
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('conventions_tarifaires')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setConventions(prev => prev.map(conv => conv.id === id ? data : conv))
      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la convention'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const deleteConvention = async (id: number): Promise<ApiResponse<boolean>> => {
    try {
      setError(null)
      
      const { error } = await supabase
        .from('conventions_tarifaires')
        .delete()
        .eq('id', id)

      if (error) throw error
      setConventions(prev => prev.filter(conv => conv.id !== id))
      return { data: true, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la convention'
      setError(errorMessage)
      return { data: false, error: errorMessage, success: false }
    }
  }

  useEffect(() => {
    fetchConventions()
  }, [clientId])

  return {
    conventions,
    loading,
    error,
    fetchConventions,
    createConvention,
    updateConvention,
    deleteConvention
  }
}

// DEPRECATED: Hook pour les équipements d'hôtel (ancien système equipment_assignments)
// Utiliser useHotelEquipmentCRUD à la place
/*
export const useHotelEquipments = (hotelId?: number, options?: HookOptions) => {
  const [equipments, setEquipments] = useState<EquipmentWithHotelInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { enableRealTime = false, autoRefresh = false, refreshInterval = 30000 } = options || {}

  const fetchHotelEquipments = async () => {
    try {
      if (!hotelId) {
        setEquipments([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // Get only equipments that are assigned to this hotel from equipment_assignments
      const { data, error } = await supabase
        .from('equipment_assignments')
        .select(`
          id,
          est_disponible,
          est_gratuit,
          prix_supplement,
          description_specifique,
          conditions_usage,
          equipment:equipments(*)
        `)
        .eq('hotel_id', hotelId)
        .is('room_id', null)
        .eq('est_disponible', true)
        .order('equipment_id')

      if (error) throw error

      // Transform the data to include hotel availability info
      const transformedData: EquipmentWithHotelInfo[] = (data || [])
        .filter(assignment => assignment.equipment && assignment.equipment.est_actif) // Only include assignments with valid, active equipment
        .map(assignment => ({
          ...assignment.equipment!,
          is_available_in_hotel: true, // Since we're only getting assigned equipments
          is_free: assignment.est_gratuit ?? true,
          supplement_price: assignment.prix_supplement ?? null,
          equipment_assignment: assignment
        }))

      setEquipments(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des équipements de l\'hôtel')
    } finally {
      setLoading(false)
    }
  }

  const addEquipmentToHotel = async (equipmentId: number, equipmentData?: Partial<EquipmentAssignmentInsert>): Promise<ApiResponse<EquipmentAssignment>> => {
    try {
      if (!hotelId) {
        return { data: null, error: 'ID d\'hôtel requis', success: false }
      }

      setError(null)

      const insertData: EquipmentAssignmentInsert = {
        hotel_id: hotelId,
        equipment_id: equipmentId,
        room_id: null, // Hotel-level equipment
        est_disponible: equipmentData?.est_disponible ?? true,
        est_gratuit: equipmentData?.est_gratuit ?? true,
        prix_supplement: equipmentData?.prix_supplement ?? null,
        description_specifique: equipmentData?.description_specifique ?? null,
        conditions_usage: equipmentData?.conditions_usage ?? null,
        notes_internes: equipmentData?.notes_internes ?? null,
        ...equipmentData
      }

      const { data, error } = await supabase
        .from('equipment_assignments')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      // Refresh the equipments list
      await fetchHotelEquipments()

      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'ajout de l\'équipement'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const removeEquipmentFromHotel = async (equipmentId: number): Promise<ApiResponse<boolean>> => {
    try {
      if (!hotelId) {
        return { data: false, error: 'ID d\'hôtel requis', success: false }
      }

      setError(null)

      const { error } = await supabase
        .from('equipment_assignments')
        .delete()
        .eq('hotel_id', hotelId)
        .eq('equipment_id', equipmentId)
        .is('room_id', null) // Only hotel-level equipment

      if (error) throw error

      // Refresh the equipments list
      await fetchHotelEquipments()

      return { data: true, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'équipement'
      setError(errorMessage)
      return { data: false, error: errorMessage, success: false }
    }
  }

  const updateHotelEquipment = async (equipmentId: number, updates: Partial<EquipmentAssignmentUpdate>): Promise<ApiResponse<EquipmentAssignment>> => {
    try {
      if (!hotelId) {
        return { data: null, error: 'ID d\'hôtel requis', success: false }
      }

      setError(null)

      const { data, error } = await supabase
        .from('equipment_assignments')
        .update(updates)
        .eq('hotel_id', hotelId)
        .eq('equipment_id', equipmentId)
        .is('room_id', null) // Only hotel-level equipment
        .select()
        .single()

      if (error) throw error

      // Refresh the equipments list
      await fetchHotelEquipments()

      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'équipement'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  useEffect(() => {
    fetchHotelEquipments()
  }, [hotelId])

  return {
    equipments,
    loading,
    error,
    fetchHotelEquipments,
    addEquipmentToHotel,
    removeEquipmentFromHotel,
    updateHotelEquipment
  }
}

*/

// DEPRECATED: Hook pour les équipements disponibles (ancien système)
// Utiliser useHotelEquipmentCRUD à la place
/*
export const useAvailableRoomEquipments = (hotelId?: number, options?: HookOptions) => {
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { enableRealTime = false } = options || {}

  const fetchAvailableEquipments = async () => {
    try {
      if (!hotelId) {
        setEquipments([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // Get only equipments that are available for this hotel from equipment_assignments
      const { data, error } = await supabase
        .from('equipments')
        .select(`
          *
        `)
        .in('id', 
          supabase
            .from('equipment_assignments')
            .select('equipment_id')
            .eq('hotel_id', hotelId)
            .is('room_id', null)
            .eq('est_disponible', true)
        )
        .eq('est_actif', true)
        .order('categorie, ordre_affichage, nom')

      if (error) throw error
      setEquipments(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des équipements disponibles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailableEquipments()
  }, [hotelId])

  // Set up real-time subscription if enabled
  useEffect(() => {
    if (!enableRealTime || !hotelId) return

    const subscription = supabase
      .channel(`equipment_assignments_${hotelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment_assignments',
          filter: `hotel_id=eq.${hotelId}`
        },
        () => {
          fetchAvailableEquipments()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [enableRealTime, hotelId])

  return {
    equipments,
    loading,
    error,
    fetchAvailableEquipments
  }
}

*/

// DEPRECATED: Hook pour les équipements de chambre (ancien système)
// Utiliser useRoomEquipmentIds à la place
/*
export const useRoomEquipments = (hotelId?: number, roomId?: number, options?: HookOptions) => {
  const [equipments, setEquipments] = useState<EquipmentAssignmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { enableRealTime = false } = options || {}

  const fetchRoomEquipments = async () => {
    try {
      if (!hotelId || !roomId) {
        setEquipments([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // Get room equipments with equipment details
      const { data, error } = await supabase
        .from('equipment_assignments')
        .select(`
          *,
          equipment:equipments(*)
        `)
        .eq('hotel_id', hotelId)
        .eq('room_id', roomId)
        .order('equipment.categorie, equipment.ordre_affichage, equipment.nom')

      if (error) throw error
      setEquipments(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des équipements de la chambre')
    } finally {
      setLoading(false)
    }
  }

  const addEquipmentToRoom = async (equipmentId: number, equipmentData?: Partial<EquipmentAssignmentInsert>): Promise<ApiResponse<EquipmentAssignment>> => {
    try {
      if (!hotelId || !roomId) {
        return { data: null, error: 'ID d\'hôtel et de chambre requis', success: false }
      }

      setError(null)

      // First, check if the equipment is available at the hotel level
      const { data: hotelEquipment, error: checkError } = await supabase
        .from('equipment_assignments')
        .select('id')
        .eq('hotel_id', hotelId)
        .eq('equipment_id', equipmentId)
        .is('room_id', null)
        .eq('est_disponible', true)
        .single()

      if (checkError || !hotelEquipment) {
        return { data: null, error: 'Équipement non disponible dans cet hôtel', success: false }
      }

      const insertData: EquipmentAssignmentInsert = {
        hotel_id: hotelId,
        equipment_id: equipmentId,
        room_id: roomId,
        est_disponible: equipmentData?.est_disponible ?? true,
        est_fonctionnel: equipmentData?.est_fonctionnel ?? true,
        date_installation: equipmentData?.date_installation ?? new Date().toISOString(),
        notes: equipmentData?.notes ?? null,
        ...equipmentData
      }

      const { data, error } = await supabase
        .from('equipment_assignments')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      // Refresh the equipments list
      await fetchRoomEquipments()

      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'ajout de l\'équipement à la chambre'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const removeEquipmentFromRoom = async (equipmentId: number): Promise<ApiResponse<boolean>> => {
    try {
      if (!hotelId || !roomId) {
        return { data: false, error: 'ID d\'hôtel et de chambre requis', success: false }
      }

      setError(null)

      const { error } = await supabase
        .from('equipment_assignments')
        .delete()
        .eq('hotel_id', hotelId)
        .eq('equipment_id', equipmentId)
        .eq('room_id', roomId)

      if (error) throw error

      // Refresh the equipments list
      await fetchRoomEquipments()

      return { data: true, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'équipement de la chambre'
      setError(errorMessage)
      return { data: false, error: errorMessage, success: false }
    }
  }

  const updateRoomEquipment = async (equipmentId: number, updates: Partial<EquipmentAssignmentUpdate>): Promise<ApiResponse<EquipmentAssignment>> => {
    try {
      if (!hotelId || !roomId) {
        return { data: null, error: 'ID d\'hôtel et de chambre requis', success: false }
      }

      setError(null)

      const { data, error } = await supabase
        .from('equipment_assignments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('hotel_id', hotelId)
        .eq('equipment_id', equipmentId)
        .eq('room_id', roomId)
        .select()
        .single()

      if (error) throw error

      // Refresh the equipments list
      await fetchRoomEquipments()

      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'équipement de la chambre'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  useEffect(() => {
    fetchRoomEquipments()
  }, [hotelId, roomId])

  // Set up real-time subscription if enabled
  useEffect(() => {
    if (!enableRealTime || !hotelId || !roomId) return

    const subscription = supabase
      .channel(`room_equipment_assignments_${hotelId}_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment_assignments',
          filter: `hotel_id=eq.${hotelId}.and.room_id=eq.${roomId}`
        },
        () => {
          fetchRoomEquipments()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [enableRealTime, hotelId, roomId])

  return {
    equipments,
    loading,
    error,
    fetchRoomEquipments,
    addEquipmentToRoom,
    removeEquipmentFromRoom,
    updateRoomEquipment
  }
}
*/

// ====================================
// Ultra-Simplified Room Equipment Management
// ====================================

// Hook for managing room equipment IDs (using equipment_ids array field)
export const useRoomEquipmentIds = (roomId?: number, hotelId?: number) => {
  const [equipmentIds, setEquipmentIds] = useState<number[]>([])
  const [equipments, setEquipments] = useState<HotelEquipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRoomEquipments = async () => {
    try {
      if (!roomId) {
        setEquipmentIds([])
        setEquipments([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // Get room with equipment_ids
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('equipment_ids')
        .eq('id', roomId)
        .single()

      if (roomError) throw roomError

      const ids = roomData?.equipment_ids || []
      setEquipmentIds(ids)

      // If there are equipment IDs, fetch their details
      if (ids.length > 0) {
        const { data: equipmentData, error: equipmentError } = await supabase
          .from('hotel_equipment')
          .select('*')
          .in('id', ids)
          .eq('est_actif', true)
          .order('categorie', { ascending: true })
          .order('ordre_affichage', { ascending: true })
          .order('nom', { ascending: true })

        if (equipmentError) throw equipmentError
        setEquipments(equipmentData || [])
      } else {
        setEquipments([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des équipements')
    } finally {
      setLoading(false)
    }
  }

  const setRoomEquipments = async (newEquipmentIds: number[]): Promise<ApiResponse<boolean>> => {
    try {
      if (!roomId) {
        return { data: false, error: 'ID de chambre requis', success: false }
      }

      setError(null)

      // Update room with new equipment IDs
      const { error } = await supabase
        .from('rooms')
        .update({ equipment_ids: newEquipmentIds })
        .eq('id', roomId)

      if (error) throw error

      // Update local state
      setEquipmentIds(newEquipmentIds)
      
      // Refresh equipment details
      await fetchRoomEquipments()

      return { data: true, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour des équipements'
      setError(errorMessage)
      return { data: false, error: errorMessage, success: false }
    }
  }

  const addEquipment = async (equipmentId: number): Promise<ApiResponse<boolean>> => {
    if (equipmentIds.includes(equipmentId)) {
      return { data: false, error: 'Équipement déjà présent', success: false }
    }
    
    return setRoomEquipments([...equipmentIds, equipmentId])
  }

  const removeEquipment = async (equipmentId: number): Promise<ApiResponse<boolean>> => {
    return setRoomEquipments(equipmentIds.filter(id => id !== equipmentId))
  }

  useEffect(() => {
    fetchRoomEquipments()
  }, [roomId])

  return {
    equipmentIds,
    equipments,
    loading,
    error,
    setRoomEquipments,
    addEquipment,
    removeEquipment,
    fetchRoomEquipments
  }
}

// ====================================
// Hotel Equipment Management Hooks (Simplified)
// ====================================

// Hook for hotel equipment management (full CRUD)
export const useHotelEquipmentCRUD = (hotelId?: number, options?: HookOptions) => {
  const [equipments, setEquipments] = useState<HotelEquipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { enableRealTime = false } = options || {}

  const fetchEquipments = async () => {
    try {
      if (!hotelId) {
        setEquipments([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error } = await supabaseAdmin
        .from('hotel_equipment')
        .select('*')
        .eq('hotel_id', hotelId)
        .order('categorie', { ascending: true })
        .order('ordre_affichage', { ascending: true })
        .order('nom', { ascending: true })

      if (error) throw error
      setEquipments(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des équipements')
    } finally {
      setLoading(false)
    }
  }

  const createEquipment = async (equipmentData: Omit<HotelEquipmentInsert, 'hotel_id'>): Promise<ApiResponse<HotelEquipment>> => {
    try {
      if (!hotelId) {
        return { data: null, error: 'ID d\'hôtel requis', success: false }
      }

      setError(null)
      const insertData = {
        ...equipmentData,
        hotel_id: hotelId
      }

      const { data, error } = await supabaseAdmin
        .from('hotel_equipment')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error

      setEquipments(prev => [...prev, data].sort((a, b) => 
        a.categorie.localeCompare(b.categorie) || 
        a.ordre_affichage - b.ordre_affichage ||
        a.nom.localeCompare(b.nom)
      ))

      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de l\'équipement'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const updateEquipment = async (id: number, updates: HotelEquipmentUpdate): Promise<ApiResponse<HotelEquipment>> => {
    try {
      setError(null)

      const { data, error } = await supabaseAdmin
        .from('hotel_equipment')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setEquipments(prev => 
        prev.map(eq => eq.id === id ? data : eq).sort((a, b) => 
          a.categorie.localeCompare(b.categorie) || 
          a.ordre_affichage - b.ordre_affichage ||
          a.nom.localeCompare(b.nom)
        )
      )

      return { data, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'équipement'
      setError(errorMessage)
      return { data: null, error: errorMessage, success: false }
    }
  }

  const deleteEquipment = async (id: number): Promise<ApiResponse<boolean>> => {
    try {
      setError(null)

      const { error } = await supabaseAdmin
        .from('hotel_equipment')
        .delete()
        .eq('id', id)

      if (error) throw error

      setEquipments(prev => prev.filter(eq => eq.id !== id))
      return { data: true, error: null, success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'équipement'
      setError(errorMessage)
      return { data: false, error: errorMessage, success: false }
    }
  }

  useEffect(() => {
    fetchEquipments()
  }, [hotelId])

  // Real-time subscription
  useEffect(() => {
    if (!enableRealTime || !hotelId) return

    const subscription = supabase
      .channel(`hotel_equipment_${hotelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hotel_equipment',
          filter: `hotel_id=eq.${hotelId}`
        },
        () => {
          fetchEquipments()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [enableRealTime, hotelId])

  return {
    equipments,
    loading,
    error,
    fetchEquipments,
    createEquipment,
    updateEquipment,
    deleteEquipment
  }
}

