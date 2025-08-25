import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
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
  Equipment,
  EquipmentInsert,
  EquipmentUpdate,
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
    getRoomStatistics
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

// Hook pour les équipements
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


 