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
      <style jsx global>{`
        /* Custom scrollbar styles for vertical scroll */
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #64748b;
          border-radius: 6px;
          border: 2px solid #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: #f1f5f9;
        }
        /* Firefox scrollbar */
        .custom-scrollbar {
          scrollbar-width: auto;
          scrollbar-color: #64748b #f1f5f9;
        }
        
        /* Custom scrollbar styles for horizontal scroll only */
        .custom-scrollbar-horizontal::-webkit-scrollbar {
          width: 0px;
          height: 12px;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 6px;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-thumb {
          background: #64748b;
          border-radius: 6px;
          border: 2px solid #f1f5f9;
        }
        .custom-scrollbar-horizontal::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
        /* Firefox horizontal scrollbar */
        .custom-scrollbar-horizontal {
          scrollbar-width: thin;
          scrollbar-color: #64748b #f1f5f9;
        }
      `}</style>
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
         <Card className="shadow-sm border-gray-200">
           <CardContent className="p-6">
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
            <Card className="shadow-lg border-gray-200 bg-gradient-to-r from-white to-gray-50">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="shadow-sm hover:shadow-md transition-shadow">
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Précédent</span>
                    </Button>
                    <h2 className="text-lg sm:text-xl font-bold capitalize text-gray-800 bg-white px-4 py-2 rounded-lg shadow-sm">{monthName}</h2>
                    <Button variant="outline" size="sm" onClick={goToNextMonth} className="shadow-sm hover:shadow-md transition-shadow">
                      <span className="hidden sm:inline mr-1">Suivant</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                    <span className="text-xs font-medium text-gray-600 mr-2">Légende:</span>
                    <div className="flex items-center space-x-2 px-2 py-1 bg-green-50 rounded-md">
                      <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm"></div>
                      <span className="hidden sm:inline font-medium text-green-700">Libre</span>
                      <span className="sm:hidden font-medium text-green-700">L</span>
                    </div>
                    <div className="flex items-center space-x-2 px-2 py-1 bg-blue-50 rounded-md">
                      <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                      <span className="hidden sm:inline font-medium text-blue-700">Ménage</span>
                      <span className="sm:hidden font-medium text-blue-700">M</span>
                    </div>
                    <div className="flex items-center space-x-2 px-2 py-1 bg-orange-50 rounded-md">
                      <div className="w-3 h-3 bg-orange-500 rounded-full shadow-sm"></div>
                      <span className="hidden sm:inline font-medium text-orange-700">Maintenance</span>
                      <span className="sm:hidden font-medium text-orange-700">Ma</span>
                    </div>
                    <div className="flex items-center space-x-2 px-2 py-1 bg-green-50 rounded-md">
                      <div className="w-3 h-3 bg-green-600 rounded-full shadow-sm"></div>
                      <span className="hidden sm:inline font-medium text-green-800">Check-in</span>
                      <span className="sm:hidden font-medium text-green-800">In</span>
                    </div>
                    <div className="flex items-center space-x-2 px-2 py-1 bg-purple-50 rounded-md">
                      <div className="w-3 h-3 bg-purple-500 rounded-full shadow-sm"></div>
                      <span className="hidden sm:inline font-medium text-purple-700">Check-out</span>
                      <span className="sm:hidden font-medium text-purple-700">Out</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Conteneur responsive avec scroll horizontal et vertical */}
                <div className="w-full border border-gray-200 rounded-lg overflow-hidden shadow-inner">
                  {/* Wrapper avec overflow horizontal SEULEMENT */}
                  <div className="overflow-x-auto overflow-y-hidden custom-scrollbar-horizontal">
                    {/* Conteneur avec largeur minimale pour forcer le scroll */}
                    <div className="min-w-fit" style={{ minWidth: `${240 + (dayHeaders.length * 70)}px` }}>
                      
                      {/* En-têtes des jours du mois - FIXES, ne scrollent pas verticalement */}
                      <div className="flex border-b-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100">
                        {/* Colonne des chambres - sticky */}
                        <div className="sticky left-0 z-20 bg-gradient-to-r from-gray-50 to-gray-100 border-r-2 border-gray-300 w-52 sm:w-60 lg:w-68 flex-shrink-0 shadow-sm">
                          <div className="text-sm font-bold text-gray-700 py-3 px-4 flex items-center">
                            <Bed className="h-4 w-4 mr-2 text-gray-600" />
                            Chambre
                          </div>
                        </div>
                        
                        {/* Colonnes des jours */}
                        <div className="flex">
                          {dayHeaders.map(({ dayNum, dayName }, index) => {
                            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
                            const isToday = dayDate.toDateString() === today.toDateString();
                            const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
                            
                            return (
                              <div 
                                key={index} 
                                className={`text-center text-sm font-medium py-3 px-3 border-r border-gray-200 last:border-r-0 w-18 sm:w-22 lg:w-26 flex-shrink-0 transition-all duration-200 ${
                                  isToday 
                                    ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm' 
                                    : isWeekend 
                                    ? 'bg-red-50 text-red-700' 
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                <div className={`font-bold text-base ${
                                  isToday ? 'text-blue-900' : isWeekend ? 'text-red-800' : 'text-gray-800'
                                }`}>{dayNum}</div>
                                <div className={`text-xs capitalize ${
                                  isToday ? 'text-blue-700' : isWeekend ? 'text-red-600' : 'text-gray-500'
                                }`}>{dayName}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Grille du calendrier par chambre avec scroll vertical UNIQUEMENT */}
                      <div className="max-h-[500px] overflow-y-auto custom-scrollbar bg-white">
                        {getFilteredRooms(selectedHotel, selectedRoomType).map((room, roomIndex) => (
                          <div key={room.id} className={`flex border-b border-gray-200 transition-colors duration-150 ${
                            roomIndex % 2 === 0 ? 'hover:bg-blue-50' : 'bg-gray-25 hover:bg-blue-50'
                          }`}>
                            {/* Colonne des chambres - sticky */}
                            <div className={`sticky left-0 z-10 border-r-2 border-gray-300 w-52 sm:w-60 lg:w-68 flex-shrink-0 shadow-sm ${
                              roomIndex % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                            }`}>
                              <div className="flex items-center space-x-3 p-4 h-full min-h-[72px]">
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Bed className="h-4 w-4 text-blue-600" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-base text-gray-900">{room.numero}</div>
                                  <div className="text-sm text-gray-600 truncate">{room.category_name}</div>
                                  <div className="text-xs text-gray-500">Étage {room.etage}</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Colonnes des jours */}
                            <div className="flex">
                              {days.map((day, dayIndex) => {
                                const roomStatus = getRoomStatusForDate(room.id, day.date);
                                const isEditable = true;
                                const hasCustomState = roomStates.some(state => 
                                  state.roomId === room.id && state.date === day.date.toISOString().split('T')[0]
                                );
                                  
                                return (
                                  <div
                                    key={dayIndex}
                                    className={`min-h-[72px] p-2 border-r border-gray-200 last:border-r-0 ${
                                      getRoomStatusColor(roomStatus.status)
                                    } text-white text-xs flex flex-col items-center justify-center relative cursor-pointer hover:opacity-90 hover:scale-105 transition-all duration-200 w-18 sm:w-22 lg:w-26 flex-shrink-0 shadow-sm group`}
                                    title={`${room.numero} - ${getRoomStatusText(roomStatus.status)}`}
                                    onClick={() => openEditModal(room.id, day.date)}
                                  >
                                    {/* Indicateur d'édition pour toutes les chambres */}
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="w-4 h-4 bg-black bg-opacity-20 rounded-full flex items-center justify-center">
                                        <Edit className="h-2 w-2" />
                                      </div>
                                    </div>
                                    
                                    {/* Indicateur d'état personnalisé */}
                                    {hasCustomState && (
                                      <div className="absolute top-1 left-1">
                                        <div className="w-3 h-3 bg-yellow-400 rounded-full border border-yellow-300 shadow-sm"></div>
                                      </div>
                                    )}

                                    <div className="flex flex-col items-center space-y-1 group">
                                      <div className="p-1 bg-white bg-opacity-20 rounded-full">
                                        {getRoomStatusIcon(roomStatus.status)}
                                      </div>
                                      <span className="font-semibold text-center leading-tight text-xs">{getRoomStatusText(roomStatus.status)}</span>
                                    </div>
                                    
                                    {roomStatus.reservations.length > 0 && (
                                      <div className="text-center mt-1 bg-white bg-opacity-20 rounded px-1 py-0.5">
                                        <div className="font-bold text-xs">{roomStatus.reservations.length}</div>
                                        <div className="text-xs">réserv.</div>
                                      </div>
                                    )}
                                    
                                    {(roomStatus.checkInCount > 0 || roomStatus.checkOutCount > 0) && (
                                      <div className="text-center mt-1 space-y-1">
                                        {roomStatus.checkInCount > 0 && (
                                          <div className="bg-green-700 bg-opacity-80 px-2 py-1 rounded-full text-xs font-semibold shadow-sm">
                                            <LogIn className="h-2 w-2 inline mr-1" />+{roomStatus.checkInCount}
                                          </div>
                                        )}
                                        {roomStatus.checkOutCount > 0 && (
                                          <div className="bg-purple-700 bg-opacity-80 px-2 py-1 rounded-full text-xs font-semibold shadow-sm">
                                            <LogOut className="h-2 w-2 inline mr-1" />-{roomStatus.checkOutCount}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                    </div>
                  </div>
                  
                  {/* Instructions de navigation */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-700 text-center font-medium">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Eye className="h-4 w-4" />
                        <span>Navigation du calendrier</span>
                      </div>
                      <div className="text-xs text-blue-600">
                        Défilez horizontalement pour voir tous les jours • Défilez verticalement pour voir toutes les chambres • Cliquez sur une cellule pour modifier l'état
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques par type de chambre */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
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
                  <Card key={key} className="shadow-md hover:shadow-lg transition-shadow duration-200 border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-center">
                        <div className={`w-4 h-4 rounded-full ${bgColor} mr-2 shadow-sm`}></div>
                        <span className="font-semibold text-gray-700">{label}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className={`text-2xl font-bold text-center ${color}`}>
                        {stats[key as keyof typeof stats]}
                      </div>
                    </CardContent>
                  </Card>
                ));
              })()}
            </div>
          </>
        ) : (
          <Card className="shadow-lg border-gray-200">
            <CardContent className="text-center py-12">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Aucun établissement sélectionné</h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">Veuillez sélectionner un établissement dans les paramètres pour afficher le calendrier des chambres.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal d'édition d'état de chambre */}
      {editingRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Edit className="h-5 w-5 mr-2 text-blue-600" />
                Modifier l'état de la chambre
              </h3>
              <Button variant="ghost" size="sm" onClick={closeEditModal} className="hover:bg-gray-100">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  État de la chambre
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {statusOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={editStatus === option.value ? "default" : "outline"}
                      onClick={() => setEditStatus(option.value as RoomStatusType)}
                      className={`justify-start p-4 h-auto transition-all duration-200 ${
                        editStatus === option.value 
                          ? 'bg-blue-600 hover:bg-blue-700 shadow-lg transform scale-105' 
                          : 'hover:bg-gray-50 hover:shadow-md'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full ${option.color} mr-3 shadow-sm`}></div>
                      <div className="mr-3">{option.icon}</div>
                      <span className="font-medium">{option.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  Notes (optionnel)
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  rows={3}
                  placeholder="Ajouter des notes sur l'état de la chambre..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button variant="outline" onClick={closeEditModal} className="px-6 py-2">
                  Annuler
                </Button>
                <Button variant="destructive" onClick={deleteRoomState} className="px-6 py-2">
                  <XSquare className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
                <Button onClick={saveRoomState} className="px-6 py-2 bg-blue-600 hover:bg-blue-700">
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
