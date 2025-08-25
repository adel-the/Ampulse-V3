"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Search, 
  Calendar, 
  Users, 
  Bed, 
  Wifi, 
  Tv, 
  Coffee, 
  Car, 
  Accessibility, 
  Euro,
  Star,
  MapPin,
  Phone,
  Mail,
  Settings,
  BarChart3,
  CalendarDays,
  Loader2,
  AlertCircle,
  CheckCircle,
  CheckCircle2
} from 'lucide-react';
import ReservationModal from '../modals/ReservationModal';

// Types
interface Room {
  id: number;
  numero: string;
  nom: string;
  type: string;
  capacite: number;
  prix_base: number;
  equipements: string[];
  statut: 'disponible' | 'occupee' | 'maintenance';
  hotel_id: number;
}

interface SearchFilters {
  startDate: string;
  endDate: string;
  guests: number;
  roomType: string;
}

const PMSHomePage: React.FC = () => {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [reservationModal, setReservationModal] = useState<{
    isOpen: boolean;
    room: Room | null;
  }>({
    isOpen: false,
    room: null
  });
  const [reservationSuccess, setReservationSuccess] = useState<{
    show: boolean;
    message: string;
  }>({
    show: false,
    message: ''
  });

  const [filters, setFilters] = useState<SearchFilters>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Demain
    guests: 1,
    roomType: ''
  });

  // Types de chambres disponibles
  const ROOM_TYPES = [
    'Chambre Simple',
    'Chambre Double', 
    'Chambre Familiale',
    'Suite',
    'Chambre Adaptée'
  ];

  // Équipements avec icônes
  const getEquipmentIcon = (equipment: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'WiFi': <Wifi className="h-4 w-4" />,
      'TV': <Tv className="h-4 w-4" />,
      'Climatisation': <Star className="h-4 w-4" />,
      'Mini-bar': <Coffee className="h-4 w-4" />,
      'Parking': <Car className="h-4 w-4" />,
      'Accès PMR': <Accessibility className="h-4 w-4" />,
      'Balcon': <MapPin className="h-4 w-4" />,
      'Salle de bain privée': <Star className="h-4 w-4" />
    };
    return icons[equipment] || <CheckCircle className="h-4 w-4" />;
  };

  // Charger les données initiales
  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      
      // Simulation de données si Supabase échoue
      const mockRooms: Room[] = [
        {
          id: 1,
          numero: '101',
          nom: 'Chambre Simple Standard',
          type: 'Chambre Simple',
          capacite: 1,
          prix_base: 45,
          equipements: ['WiFi', 'TV', 'Salle de bain privée'],
          statut: 'disponible',
          hotel_id: 1
        },
        {
          id: 2,
          numero: '102',
          nom: 'Chambre Double Confort',
          type: 'Chambre Double',
          capacite: 2,
          prix_base: 65,
          equipements: ['WiFi', 'TV', 'Climatisation', 'Mini-bar'],
          statut: 'disponible',
          hotel_id: 1
        },
        {
          id: 3,
          numero: '103',
          nom: 'Chambre Familiale Plus',
          type: 'Chambre Familiale',
          capacite: 4,
          prix_base: 85,
          equipements: ['WiFi', 'TV', 'Climatisation', 'Balcon'],
          statut: 'disponible',
          hotel_id: 1
        },
        {
          id: 4,
          numero: '201',
          nom: 'Suite Luxe',
          type: 'Suite',
          capacite: 2,
          prix_base: 120,
          equipements: ['WiFi', 'TV', 'Climatisation', 'Mini-bar', 'Balcon'],
          statut: 'disponible',
          hotel_id: 1
        },
        {
          id: 5,
          numero: '104',
          nom: 'Chambre Adaptée PMR',
          type: 'Chambre Adaptée',
          capacite: 2,
          prix_base: 55,
          equipements: ['WiFi', 'TV', 'Accès PMR', 'Salle de bain privée'],
          statut: 'disponible',
          hotel_id: 1
        },
        {
          id: 6,
          numero: '105',
          nom: 'Chambre Double Vue Jardin',
          type: 'Chambre Double',
          capacite: 2,
          prix_base: 75,
          equipements: ['WiFi', 'TV', 'Climatisation', 'Balcon', 'Mini-bar'],
          statut: 'disponible',
          hotel_id: 1
        }
      ];

      try {
        // Tentative de récupération depuis Supabase
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('statut', 'disponible');

        if (data && data.length > 0) {
          // S'assurer que tous les rooms ont un tableau d'équipements
          const roomsWithEquipments = data.map(room => ({
            ...room,
            equipements: room.equipements || ['WiFi', 'TV', 'Salle de bain privée']
          }));
          setRooms(roomsWithEquipments);
          setFilteredRooms(roomsWithEquipments);
        } else {
          // Utiliser les données mock
          setRooms(mockRooms);
          setFilteredRooms(mockRooms);
        }
      } catch (supabaseError) {
        // Utiliser les données mock en cas d'erreur
        setRooms(mockRooms);
        setFilteredRooms(mockRooms);
      }

    } catch (error) {
      setError('Erreur lors du chargement des chambres');
    } finally {
      setLoading(false);
    }
  };

  // Recherche et filtrage
  const handleSearch = async () => {
    setSearchLoading(true);
    
    // Simulation d'une recherche
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filtered = [...rooms];

    // Filtrer par type de chambre
    if (filters.roomType) {
      filtered = filtered.filter(room => room.type === filters.roomType);
    }

    // Filtrer par capacité
    filtered = filtered.filter(room => room.capacite >= filters.guests);

    // Simulation de vérification de disponibilité pour les dates
    // En production, ceci ferait une requête à la table bookings
    const isDateRangeValid = filters.startDate && filters.endDate && 
                           new Date(filters.startDate) < new Date(filters.endDate);
    
    if (!isDateRangeValid) {
      setError('Veuillez sélectionner des dates valides');
      setSearchLoading(false);
      return;
    }

    setFilteredRooms(filtered);
    setError(null);
    setSearchLoading(false);
  };

  // Calculer le prix selon le nombre de personnes
  const calculatePrice = (room: Room) => {
    let price = room.prix_base;
    
    // Supplément pour personne supplémentaire
    if (filters.guests > room.capacite) {
      price += (filters.guests - room.capacite) * 15;
    }
    
    return price;
  };

  // Calculer le prix total du séjour
  const calculateTotalPrice = (room: Room) => {
    const dailyPrice = calculatePrice(room);
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return dailyPrice * Math.max(1, nights);
  };

  const handleReservation = (room: Room) => {
    setReservationModal({
      isOpen: true,
      room: room
    });
  };

  const handleReservationClose = () => {
    setReservationModal({
      isOpen: false,
      room: null
    });
  };

  const handleReservationSuccess = (reservationId: number) => {
    setReservationSuccess({
      show: true,
      message: `Réservation #${reservationId} confirmée avec succès !`
    });
    
    // Recharger les chambres pour mettre à jour la disponibilité
    loadRooms();
    
    // Masquer le message de succès après 5 secondes
    setTimeout(() => {
      setReservationSuccess({
        show: false,
        message: ''
      });
    }, 5000);
  };

  // Skeleton de chargement
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-10 bg-gray-300 rounded"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Bed className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Ampulse PMS</h1>
              </div>
            </div>
            
            <nav className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2" onClick={() => router.push('/')}>
                <BarChart3 className="h-4 w-4" />
                <span>Tableau de bord</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2" onClick={() => router.push('/reservations')}>
                <CalendarDays className="h-4 w-4" />
                <span>Réservations</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2" onClick={() => router.push('/settings')}>
                <Settings className="h-4 w-4" />
                <span>Paramètres</span>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section héro avec recherche */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Trouvez votre chambre idéale
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Découvrez nos chambres disponibles et réservez en quelques clics
          </p>

          {/* Moteur de recherche */}
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label htmlFor="startDate" className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    <span>Arrivée</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate" className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    <span>Départ</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    min={filters.startDate}
                  />
                </div>

                <div>
                  <Label htmlFor="guests" className="flex items-center space-x-2 mb-2">
                    <Users className="h-4 w-4" />
                    <span>Personnes</span>
                  </Label>
                  <select
                    id="guests"
                    value={filters.guests}
                    onChange={(e) => setFilters(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>
                        {num} personne{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="roomType" className="flex items-center space-x-2 mb-2">
                    <Bed className="h-4 w-4" />
                    <span>Type de chambre</span>
                  </Label>
                  <select
                    id="roomType"
                    value={filters.roomType}
                    onChange={(e) => setFilters(prev => ({ ...prev, roomType: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tous les types</option>
                    {ROOM_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button 
                onClick={handleSearch} 
                disabled={searchLoading}
                className="w-full md:w-auto flex items-center space-x-2"
                size="lg"
              >
                {searchLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>{searchLoading ? 'Recherche...' : 'Rechercher'}</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {reservationSuccess.show && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-green-800">{reservationSuccess.message}</span>
          </div>
        )}

        {/* Résultats */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Chambres disponibles {filteredRooms.length > 0 && `(${filteredRooms.length})`}
            </h3>
            {filteredRooms.length > 0 && (
              <p className="text-sm text-gray-600">
                Du {new Date(filters.startDate).toLocaleDateString('fr-FR')} au{' '}
                {new Date(filters.endDate).toLocaleDateString('fr-FR')} • {filters.guests} personne{filters.guests > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : filteredRooms.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">🏨</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune chambre disponible
                </h3>
                <p className="text-gray-600 mb-4">
                  Aucune chambre ne correspond à vos critères de recherche.
                </p>
                <Button onClick={() => {
                  setFilters(prev => ({ ...prev, roomType: '', guests: 1 }));
                  handleSearch();
                }} variant="outline">
                  Réinitialiser les filtres
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room, index) => (
                <Card 
                  key={room.id} 
                  className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{room.nom}</CardTitle>
                        <p className="text-sm text-gray-600">Chambre {room.numero}</p>
                      </div>
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{room.capacite}</span>
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Équipements */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Équipements</p>
                      <div className="flex flex-wrap gap-2">
                        {(room.equipements || []).slice(0, 4).map((equipment, idx) => (
                          <div key={idx} className="flex items-center space-x-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                            {getEquipmentIcon(equipment)}
                            <span>{equipment}</span>
                          </div>
                        ))}
                        {(room.equipements || []).length > 4 && (
                          <div className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                            +{(room.equipements || []).length - 4} autres
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Prix */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Prix par nuit</span>
                        <div className="flex items-center space-x-1">
                          <Euro className="h-4 w-4 text-green-600" />
                          <span className="text-lg font-bold text-green-600">
                            {calculatePrice(room)}€
                          </span>
                        </div>
                      </div>
                      
                      {filters.startDate && filters.endDate && (
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm font-medium text-gray-900">Total du séjour</span>
                          <span className="text-xl font-bold text-blue-600">
                            {calculateTotalPrice(room)}€
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bouton de réservation */}
                    <Button 
                      onClick={() => handleReservation(room)}
                      className="w-full"
                      size="lg"
                    >
                      Réserver maintenant
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de réservation */}
      {reservationModal.room && (
        <ReservationModal
          room={reservationModal.room}
          startDate={filters.startDate}
          endDate={filters.endDate}
          guests={filters.guests}
          isOpen={reservationModal.isOpen}
          onClose={handleReservationClose}
          onSuccess={handleReservationSuccess}
        />
      )}
    </div>
  );
};

export default PMSHomePage; 
