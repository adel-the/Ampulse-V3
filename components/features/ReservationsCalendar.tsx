import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  Bed,
  Users,
  Eye,
  Filter,
  Sparkles,
  Wrench,
  LogIn,
  LogOut,
  CheckSquare,
  XSquare,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Reservation, Hotel } from '../../types';
import { useRoomCategories, useRooms } from '@/hooks/useSupabase';
import type { RoomCategory } from '@/lib/supabase';

interface ReservationsCalendarProps {
  reservations: Reservation[];
  hotels?: Hotel[];
  selectedHotel?: string; // Hôtel sélectionné dans les paramètres
}

type AvailabilityFilter = 'all' | 'available' | 'cleaning' | 'maintenance' | 'checkin' | 'checkout' | 'occupied_maintenance';
type RoomStatusType = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'checkin' | 'checkout' | 'occupied_maintenance';

interface RoomStatus {
  status: RoomStatusType;
  reservations: Reservation[];
  checkInCount: number;
  checkOutCount: number;
}

interface RoomState {
  roomId: string;
  date: string;
  status: RoomStatusType;
  notes?: string;
}

export default function ReservationsCalendar({ reservations, hotels = [], selectedHotel }: ReservationsCalendarProps) {
  // État initial hydratation-safe pour éviter les différences serveur/client
  const [currentDate, setCurrentDate] = useState(() => {
    if (typeof window === 'undefined') {
      // Retourner une date fixe pour le SSR
      return new Date('2024-01-01T00:00:00.000Z');
    }
    return new Date();
  });
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [roomStates, setRoomStates] = useState<RoomState[]>([]);
  const [editingRoom, setEditingRoom] = useState<{ roomId: string; date: string } | null>(null);
  const [editStatus, setEditStatus] = useState<RoomStatusType>('available');
  const [editNotes, setEditNotes] = useState<string>('');
  const [roomNumberFilter, setRoomNumberFilter] = useState<string>('');
  const { categories: roomCategories } = useRoomCategories();
  
  // Get real rooms from database - filter by selectedHotel if provided
  const selectedHotelId = selectedHotel ? hotels.find(h => h.nom === selectedHotel)?.id : undefined;
  const { rooms: realRooms, loading: roomsLoading } = useRooms(selectedHotelId);

  // Date stable pour éviter les problèmes d'hydratation
  const today = useMemo(() => {
    if (typeof window === 'undefined') {
      // SSR: utiliser une date fixe
      return new Date('2024-01-01T00:00:00.000Z');
    }
    return new Date();
  }, []);

  // Navigation dans le calendrier
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    if (typeof window !== 'undefined') {
      setCurrentDate(new Date());
    }
  };

  // Génération du calendrier - seulement les jours du mois actuel
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Jours du mois actuel seulement
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dayReservations = reservations.filter(reservation => {
        const arrivee = new Date(reservation.dateArrivee);
        const depart = new Date(reservation.dateDepart);
        return currentDate >= arrivee && currentDate <= depart;
      });
      days.push({ date: currentDate, isCurrentMonth: true, reservations: dayReservations });
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'CONFIRMEE': return 'bg-green-500';
      case 'EN_COURS': return 'bg-yellow-500';
      case 'ANNULEE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'CONFIRMEE': return <CheckCircle className="h-3 w-3" />;
      case 'EN_COURS': return <Clock className="h-3 w-3" />;
      case 'ANNULEE': return <XCircle className="h-3 w-3" />;
      default: return <CalendarIcon className="h-3 w-3" />;
    }
  };

  // Create dynamic headers for all days of the month
  const createDayHeaders = (days: any[]) => {
    return days.map(day => {
      const dayNum = day.date.getDate();
      const dayName = day.date.toLocaleDateString('fr-FR', { weekday: 'short' });
      return { dayNum, dayName };
    });
  };
  
  const dayHeaders = createDayHeaders(days);
  const totalColumns = dayHeaders.length + 1; // +1 for room column

  // Function to get real rooms from database
  const getRoomsByHotel = (hotelName: string) => {
    // If we have real rooms data, use it
    if (realRooms && realRooms.length > 0) {
      return realRooms.map(room => ({
        id: room.id.toString(),
        numero: room.numero,
        category_id: room.category_id,
        category_name: roomCategories?.find(cat => cat.id === room.category_id)?.name || 'Standard',
        etage: room.etage || 1
      }));
    }
    
    // Fallback to simulated data if no real data available
    const roomCounts: Record<string, number> = {
      'Hôtel Central': 25,
      'Hôtel du Parc': 30,
      'Hôtel des Alpes': 20,
      'Hôtel de la Gare': 15,
      'Hôtel du Lac': 18
    };
    
    const count = roomCounts[hotelName] || 20;
    const defaultCategories = roomCategories && roomCategories.length > 0 ? roomCategories : [
      { id: 1, name: 'Simple', capacity: 1, surface: 18 },
      { id: 2, name: 'Double', capacity: 2, surface: 25 },
      { id: 3, name: 'Suite', capacity: 4, surface: 40 }
    ];
    
    return Array.from({ length: count }, (_, i) => {
      // Ensure we have at least one category
      if (defaultCategories.length === 0) {
        return {
          id: `${hotelName}-room-${i + 1}`,
          numero: `${i + 1}`,
          category_id: 1,
          category_name: 'Standard',
          etage: Math.floor(i / 10) + 1
        };
      }
      
      // Calculate category index based on distribution, ensuring it's within bounds
      const categoryIndex = Math.min(
        i < count * 0.3 ? 0 : i < count * 0.7 ? 1 : 2,
        defaultCategories.length - 1
      );
      const category = defaultCategories[categoryIndex];
      
      return {
        id: `${hotelName}-room-${i + 1}`,
        numero: `${i + 1}`,
        category_id: category?.id || 1,
        category_name: category?.name || 'Standard',
        etage: Math.floor(i / 10) + 1
      };
    });
  };

  const getReservationsForRoom = (roomId: string, date: Date) => {
    return reservations.filter(reservation => {
      const arrivee = new Date(reservation.dateArrivee);
      const depart = new Date(reservation.dateDepart);
      return date >= arrivee && date <= depart && 
             reservation.hotel === roomId.split('-room-')[0];
    });
  };

  // Obtenir l'état d'une chambre pour une date donnée
  const getRoomStatusForDate = (roomId: string, date: Date): RoomStatus => {
    const roomReservations = getReservationsForRoom(roomId, date);
    const checkInCount = roomReservations.filter(r => {
      const arrivee = new Date(r.dateArrivee);
      return arrivee.toDateString() === date.toDateString();
    }).length;
    const checkOutCount = roomReservations.filter(r => {
      const depart = new Date(r.dateDepart);
      return depart.toDateString() === date.toDateString();
    }).length;

    // Vérifier s'il y a un état personnalisé pour cette chambre et cette date
    const dateString = date.toISOString().split('T')[0];
    const customState = roomStates.find(state => 
      state.roomId === roomId && state.date === dateString
    );

    if (customState) {
      return {
        status: customState.status,
        reservations: roomReservations,
        checkInCount,
        checkOutCount
      };
    }

    // Si la chambre est réservée, elle est occupée
    if (roomReservations.length > 0) {
      return {
        status: 'occupied',
        reservations: roomReservations,
        checkInCount,
        checkOutCount
      };
    }

    // Sinon, état par défaut (libre)
    return {
      status: 'available',
      reservations: roomReservations,
      checkInCount,
      checkOutCount
    };
  };

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-red-500';
      case 'occupied_maintenance': return 'bg-red-600';
      case 'cleaning': return 'bg-blue-500';
      case 'maintenance': return 'bg-orange-500';
      case 'checkin': return 'bg-green-600';
      case 'checkout': return 'bg-purple-500';
      default: return 'bg-green-400';
    }
  };

  const getRoomStatusIcon = (status: string) => {
    switch (status) {
      case 'occupied': return <Users className="h-3 w-3" />;
      case 'cleaning': return <Sparkles className="h-3 w-3" />;
      case 'maintenance': return <Wrench className="h-3 w-3" />;
      case 'checkin': return <LogIn className="h-3 w-3" />;
      case 'checkout': return <LogOut className="h-3 w-3" />;
      default: return <CheckSquare className="h-3 w-3" />;
    }
  };

  const getRoomStatusText = (status: string) => {
    switch (status) {
      case 'occupied': return 'Occupée';
      case 'occupied_maintenance': return 'Occupée + Maintenance';
      case 'cleaning': return 'Ménage';
      case 'maintenance': return 'Maintenance';
      case 'checkin': return 'Check-in';
      case 'checkout': return 'Check-out';
      default: return 'Libre';
    }
  };

  // Obtenir les types de chambres disponibles
  const getRoomTypes = () => {
    const types = [{ value: 'all', label: 'Toutes les catégories', icon: <Bed className="h-4 w-4" /> }];
    
    if (roomCategories) {
      roomCategories.forEach(category => {
        types.push({
          value: category.id.toString(),
          label: category.name,
          icon: <Bed className="h-4 w-4" />
        });
      });
    }
    
    return types;
  };

  // Filtrer les chambres par type
  const getRoomsByType = (hotelName: string, roomType: string) => {
    const allRooms = getRoomsByHotel(hotelName);
    
    if (roomType === 'all') return allRooms;
    
    return allRooms.filter(room => {
      return room.category_id?.toString() === roomType;
    });
  };

  // Filtrer les chambres par état de disponibilité et numéro de chambre
  const getFilteredRooms = (hotelName: string, roomType: string) => {
    let rooms = getRoomsByType(hotelName, roomType);
    
    // Filtrer par numéro de chambre si spécifié
    if (roomNumberFilter.trim()) {
      rooms = rooms.filter(room => 
        room.numero.toLowerCase().includes(roomNumberFilter.toLowerCase())
      );
    }
    
    // Filtrer par état de disponibilité si spécifié
    if (availabilityFilter !== 'all') {
      rooms = rooms.filter(room => {
        const status = getRoomStatusForDate(room.id, today);
        return status.status === availabilityFilter;
      });
    }
    
    return rooms;
  };

  const getRoomStatsByStatus = (hotelName: string, roomType: string = 'all') => {
    const rooms = getRoomsByType(hotelName, roomType);
    const todayForStats = typeof window === 'undefined' 
      ? new Date('2024-01-01T00:00:00.000Z') 
      : new Date();
    
    const stats = {
      available: 0,
      occupied: 0,
      occupied_maintenance: 0,
      cleaning: 0,
      maintenance: 0,
      checkin: 0,
      checkout: 0
    };

    rooms.forEach(room => {
      const status = getRoomStatusForDate(room.id, todayForStats);
      stats[status.status]++;
    });

    return stats;
  };

  // Fonctions pour l'édition des états
  const openEditModal = (roomId: string, date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const roomStatus = getRoomStatusForDate(roomId, date);
    
    // Permettre l'édition pour toutes les chambres, y compris celles occupées
    setEditingRoom({ roomId, date: dateString });
    setEditStatus(roomStatus.status);
    
    // Récupérer les notes existantes
    const existingState = roomStates.find(state => 
      state.roomId === roomId && state.date === dateString
    );
    setEditNotes(existingState?.notes || '');
  };

  const saveRoomState = () => {
    if (!editingRoom) return;

    const newState: RoomState = {
      roomId: editingRoom.roomId,
      date: editingRoom.date,
      status: editStatus,
      notes: editNotes.trim() || undefined
    };

    setRoomStates(prev => {
      const filtered = prev.filter(state => 
        !(state.roomId === editingRoom.roomId && state.date === editingRoom.date)
      );
      return [...filtered, newState];
    });

    closeEditModal();
  };

  const closeEditModal = () => {
    setEditingRoom(null);
    setEditStatus('available');
    setEditNotes('');
  };

  const deleteRoomState = () => {
    if (!editingRoom) return;

    setRoomStates(prev => 
      prev.filter(state => 
        !(state.roomId === editingRoom.roomId && state.date === editingRoom.date)
      )
    );

    closeEditModal();
  };

  const availabilityFilters = [
    { value: 'all', label: 'Toutes', icon: <Eye className="h-4 w-4" />, color: 'bg-gray-500' },
    { value: 'available', label: 'Libres', icon: <CheckSquare className="h-4 w-4" />, color: 'bg-green-400' },
    { value: 'occupied', label: 'Occupées', icon: <Users className="h-4 w-4" />, color: 'bg-red-500' },
    { value: 'occupied_maintenance', label: 'Occ. + Maint.', icon: <Wrench className="h-4 w-4" />, color: 'bg-red-600' },
    { value: 'cleaning', label: 'Ménage', icon: <Sparkles className="h-4 w-4" />, color: 'bg-blue-500' },
    { value: 'maintenance', label: 'Maintenance', icon: <Wrench className="h-4 w-4" />, color: 'bg-orange-500' },
    { value: 'checkin', label: 'Check-in', icon: <LogIn className="h-4 w-4" />, color: 'bg-green-600' },
    { value: 'checkout', label: 'Check-out', icon: <LogOut className="h-4 w-4" />, color: 'bg-purple-500' }
  ];

  const statusOptions = [
    { value: 'available', label: 'Libre', icon: <CheckSquare className="h-4 w-4" />, color: 'bg-green-400' },
    { value: 'occupied', label: 'Occupée', icon: <Users className="h-4 w-4" />, color: 'bg-red-500' },
    { value: 'occupied_maintenance', label: 'Occupée + Maintenance', icon: <Wrench className="h-4 w-4" />, color: 'bg-red-600' },
    { value: 'cleaning', label: 'Ménage', icon: <Sparkles className="h-4 w-4" />, color: 'bg-blue-500' },
    { value: 'maintenance', label: 'Maintenance', icon: <Wrench className="h-4 w-4" />, color: 'bg-orange-500' }
  ];

  return (
    <div className="space-y-6">
             <div className="flex items-center justify-between">
         <div className="flex items-center space-x-2">
           <Button variant="outline" onClick={goToToday}>
             Aujourd'hui
           </Button>
         </div>
       </div>

      

      {/* Calendrier par type de chambre */}
      <div className="space-y-6">
                 {/* Sélection de type de chambre et filtres - Version optimisée */}
         <Card>
           <CardContent className="p-4">
             <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                               {/* Hôtel et type */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      Type:
                    </label>
                    <select
                      value={selectedRoomType}
                      onChange={(e) => setSelectedRoomType(e.target.value)}
                      className="text-sm p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {getRoomTypes().map((roomType) => (
                        <option key={roomType.value} value={roomType.value}>
                          {roomType.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedHotel && (
                    <Badge variant="outline" className="text-xs">
                      {getFilteredRooms(selectedHotel, selectedRoomType).length} chambres
                    </Badge>
                  )}
                </div>

               {/* Recherche par numéro */}
               <div className="flex items-center gap-2 flex-1">
                 <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                   Recherche:
                 </label>
                 <div className="relative flex-1 max-w-xs">
                   <input
                     type="text"
                     value={roomNumberFilter}
                     onChange={(e) => setRoomNumberFilter(e.target.value)}
                     placeholder="Numéro de chambre..."
                     className="w-full text-sm p-2 pl-8 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                   />
                   <Bed className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                 </div>
                 
                 {roomNumberFilter && (
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => setRoomNumberFilter('')}
                     className="h-8 w-8 p-0"
                   >
                     <X className="h-4 w-4" />
                   </Button>
                 )}
               </div>

                               {/* Filtres de disponibilité */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    État:
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {availabilityFilters.map((filter) => (
                      <Button
                        key={filter.value}
                        variant={availabilityFilter === filter.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setAvailabilityFilter(filter.value as AvailabilityFilter)}
                        className="h-7 px-2 text-xs flex items-center gap-1"
                      >
                        <div className={`w-2 h-2 rounded-full ${filter.color}`}></div>
                        <span>{filter.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Filtres actifs compacts */}
                {(roomNumberFilter || availabilityFilter !== 'all') && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">Actifs:</span>
                    {roomNumberFilter && (
                      <Badge variant="secondary" className="text-xs px-2 py-1">
                        Ch.{roomNumberFilter}
                      </Badge>
                    )}
                    {availabilityFilter !== 'all' && (
                      <Badge variant="secondary" className="text-xs px-2 py-1">
                        {availabilityFilters.find(f => f.value === availabilityFilter)?.label}
                      </Badge>
                    )}
                  </div>
                )}
             </div>
           </CardContent>
         </Card>

        {selectedHotel ? (
          <>
            {/* Navigation du calendrier par chambre */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold capitalize">{monthName}</h2>
                    <Button variant="outline" size="sm" onClick={goToNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span>Libre</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Ménage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span>Maintenance</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span>Check-in</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span>Check-out</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* En-têtes des jours du mois */}
                <div className={`grid gap-1 mb-2`} style={{gridTemplateColumns: `200px repeat(${dayHeaders.length}, 1fr)`}}>
                  <div className="text-sm font-medium text-gray-500 py-2">Chambre</div>
                  {dayHeaders.map(({ dayNum, dayName }, index) => (
                    <div key={index} className="text-center text-sm font-medium text-gray-500 py-2">
                      <div className="font-semibold">{dayNum}</div>
                      <div className="text-xs">{dayName}</div>
                    </div>
                  ))}
                </div>

                {/* Grille du calendrier par chambre */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {getFilteredRooms(selectedHotel, selectedRoomType).map((room) => (
                    <div key={room.id} className={`grid gap-1 border-b border-gray-200 pb-2`} style={{gridTemplateColumns: `200px repeat(${dayHeaders.length}, 1fr)`}}>
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <Bed className="h-4 w-4 text-gray-600" />
                        <div>
                          <div className="font-medium text-sm">{room.numero}</div>
                          <div className="text-xs text-gray-500">{room.category_name} - Étage {room.etage}</div>
                        </div>
                      </div>
                      
                      {days.map((day, dayIndex) => {
                        const roomStatus = getRoomStatusForDate(room.id, day.date);
                        const isEditable = true; // Permettre l'édition de toutes les chambres
                        const hasCustomState = roomStates.some(state => 
                          state.roomId === room.id && state.date === day.date.toISOString().split('T')[0]
                        );
                          
                        return (
                          <div
                            key={dayIndex}
                            className={`min-h-[60px] p-1 border border-gray-200 rounded ${
                              getRoomStatusColor(roomStatus.status)
                            } text-white text-xs flex flex-col items-center justify-center relative cursor-pointer hover:opacity-80`}
                            title={`${room.numero} - ${getRoomStatusText(roomStatus.status)}`}
                            onClick={() => openEditModal(room.id, day.date)}
                          >
                            {/* Indicateur d'édition pour toutes les chambres */}
                            <div className="absolute top-1 right-1">
                              <Edit className="h-2 w-2 opacity-60" />
                            </div>
                            
                            {/* Indicateur d'état personnalisé */}
                            {hasCustomState && (
                              <div className="absolute top-1 left-1">
                                <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                              </div>
                            )}

                            <div className="flex items-center space-x-1">
                              {getRoomStatusIcon(roomStatus.status)}
                              <span className="font-medium">{getRoomStatusText(roomStatus.status)}</span>
                            </div>
                            
                            {roomStatus.reservations.length > 0 && (
                              <div className="text-center mt-1">
                                <div className="font-bold">{roomStatus.reservations.length}</div>
                                <div>réserv.</div>
                              </div>
                            )}
                            
                            {(roomStatus.checkInCount > 0 || roomStatus.checkOutCount > 0) && (
                              <div className="text-center mt-1 text-xs">
                                {roomStatus.checkInCount > 0 && (
                                  <div className="bg-green-700 px-1 rounded">+{roomStatus.checkInCount}</div>
                                )}
                                {roomStatus.checkOutCount > 0 && (
                                  <div className="bg-purple-700 px-1 rounded mt-1">-{roomStatus.checkOutCount}</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistiques par type de chambre */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {(() => {
                const stats = getRoomStatsByStatus(selectedHotel, selectedRoomType);
                return [
                  { key: 'available', label: 'Libres', color: 'text-green-600', bgColor: 'bg-green-400' },
                  { key: 'occupied', label: 'Occupées', color: 'text-red-600', bgColor: 'bg-red-500' },
                  { key: 'occupied_maintenance', label: 'Occ. + Maint.', color: 'text-red-700', bgColor: 'bg-red-600' },
                  { key: 'cleaning', label: 'Ménage', color: 'text-blue-600', bgColor: 'bg-blue-500' },
                  { key: 'maintenance', label: 'Maintenance', color: 'text-orange-600', bgColor: 'bg-orange-500' },
                  { key: 'checkin', label: 'Check-in', color: 'text-green-700', bgColor: 'bg-green-600' },
                  { key: 'checkout', label: 'Check-out', color: 'text-purple-600', bgColor: 'bg-purple-500' }
                ].map(({ key, label, color, bgColor }) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center">
                        <div className={`w-3 h-3 rounded-full ${bgColor} mr-2`}></div>
                        {label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${color}`}>
                        {stats[key as keyof typeof stats]}
                      </div>
                    </CardContent>
                  </Card>
                ));
              })()}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun établissement sélectionné</h3>
              <p className="text-gray-500">Veuillez sélectionner un établissement dans les paramètres pour afficher le calendrier.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal d'édition d'état de chambre */}
      {editingRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Modifier l'état de la chambre</h3>
              <Button variant="ghost" size="sm" onClick={closeEditModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  État de la chambre
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {statusOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={editStatus === option.value ? "default" : "outline"}
                      onClick={() => setEditStatus(option.value as RoomStatusType)}
                      className="justify-start"
                    >
                      <div className={`w-3 h-3 rounded-full ${option.color} mr-2`}></div>
                      {option.icon}
                      <span className="ml-2">{option.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                  rows={3}
                  placeholder="Ajouter des notes sur l'état de la chambre..."
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={closeEditModal}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={deleteRoomState}>
                  Supprimer
                </Button>
                <Button onClick={saveRoomState}>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
