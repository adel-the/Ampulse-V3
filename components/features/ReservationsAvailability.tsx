import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Bed, 
  Users, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  MapPin
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Reservation, Hotel } from '../../types';
import QuickReservationModal from '../modals/QuickReservationModal';
import { supabase } from '../../lib/supabase';
import EndingStaysAlert from './EndingStaysAlert';
import CriticalRoomsAlert from './CriticalRoomsAlert';

interface ReservationsAvailabilityProps {
  reservations: Reservation[];
  hotels: Hotel[];
  selectedHotel?: string; // Nom de l'hôtel sélectionné dans les paramètres
  operateurs?: any[]; // Opérateurs sociaux pour la réservation
}

export default function ReservationsAvailability({ reservations, hotels, selectedHotel, operateurs = [] }: ReservationsAvailabilityProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [selectedCharacteristic, setSelectedCharacteristic] = useState<string>('all');
  const [searchRoomNumber, setSearchRoomNumber] = useState<string>('');
  // Initialiser avec des dates par défaut pour déclencher la recherche automatiquement
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  
  const [searchDateRange, setSearchDateRange] = useState({
    startDate: today.toISOString().split('T')[0],
    endDate: tomorrow.toISOString().split('T')[0]
  });
  const [searchHotel, setSearchHotel] = useState<string>('all');
  const [numberOfGuests, setNumberOfGuests] = useState<number>(1);
  const [showAvailableOnly, setShowAvailableOnly] = useState<boolean>(false);
  const [rentalMode, setRentalMode] = useState<'pax' | 'room'>('room'); // Mode de location
  
  // États pour la réservation rapide
  const [isQuickReservationModalOpen, setIsQuickReservationModalOpen] = useState(false);
  const [selectedRoomForReservation, setSelectedRoomForReservation] = useState<any>(null);

  // Calcul de la disponibilité pour une date donnée
  const getAvailabilityForDate = (date: string, hotelFilter?: string) => {
    const targetDate = new Date(date);
    
    const filteredReservations = reservations.filter(reservation => {
      const arrivee = new Date(reservation.dateArrivee);
      const depart = new Date(reservation.dateDepart);
      const isInDateRange = targetDate >= arrivee && targetDate <= depart;
      
      if (hotelFilter && hotelFilter !== 'all') {
        return isInDateRange && reservation.hotel === hotelFilter;
      }
      return isInDateRange;
    });

    const totalRooms = hotelFilter && hotelFilter !== 'all' 
      ? hotels.find(h => h.nom === hotelFilter)?.chambresTotal || 0
      : hotels.reduce((sum, hotel) => sum + (hotel.chambresTotal || 0), 0);

    const occupiedRooms = filteredReservations.length;
    const availableRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms * 100).toFixed(1) : '0';

    return {
      totalRooms,
      occupiedRooms,
      availableRooms,
      occupancyRate,
      reservations: filteredReservations
    };
  };

  const availability = getAvailabilityForDate(selectedDate, selectedHotel || searchHotel || 'all');





  // Obtenir tous les types de chambres disponibles
  const getAvailableRoomTypes = () => {
    const roomTypes = new Set<string>();
    hotels.forEach(hotel => {
      // Simuler les types de chambres basés sur les réservations existantes
      if ((hotel.chambresTotal || 0) > 0) {
        roomTypes.add('Simple');
        roomTypes.add('Double');
        roomTypes.add('Suite');
        roomTypes.add('Familiale');
        roomTypes.add('Studio');
      }
    });
    return Array.from(roomTypes);
  };

  // Obtenir toutes les caractéristiques disponibles
  const getAvailableCharacteristics = () => {
    return [
      'WiFi',
      'TV',
      'Salle de bain privée',
      'Balcon',
      'Vue jardin',
      'Vue mer',
      'Vue montagne',
      'Climatisation',
      'Mini-bar',
      'Jacuzzi',
      'Cuisine équipée',
      'Accès PMR'
    ];
  };

  // Recherche avancée de disponibilité avec vraie base de données
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const searchAvailableRooms = async () => {
    if (!searchDateRange.startDate || !searchDateRange.endDate) {
      setAvailableRooms([]);
      return;
    }

    setLoadingRooms(true);
    console.log('🔍 Recherche de chambres avec paramètres:', {
      dates: `${searchDateRange.startDate} → ${searchDateRange.endDate}`,
      hotel: searchHotel,
      guests: numberOfGuests,
      roomType: selectedRoomType,
      characteristic: selectedCharacteristic,
      roomNumber: searchRoomNumber,
      rentalMode: rentalMode
    });
    
    try {
      // Trouver l'ID de l'hôtel si spécifié
      let hotelId = null;
      if (searchHotel !== 'all') {
        const hotel = hotels.find(h => h.nom === searchHotel);
        if (hotel) hotelId = hotel.id;
      }

             // Appeler la fonction de base de données avec tous les filtres
       const { data, error } = await supabase
         .rpc('get_available_rooms_with_details', {
           p_date_debut: searchDateRange.startDate,
           p_date_fin: searchDateRange.endDate,
           p_hotel_id: hotelId,
           p_room_type: selectedRoomType !== 'all' ? selectedRoomType : null,
           p_capacity: numberOfGuests,
           p_characteristic: selectedCharacteristic !== 'all' ? selectedCharacteristic : null,
           p_room_number: searchRoomNumber || null,
           p_rental_mode: rentalMode
         });

      if (error) {
        console.error('❌ Erreur lors de la recherche des chambres:', error);
        console.error('Détails de l\'erreur:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        // En cas d'erreur, afficher un tableau vide plutôt que des données simulées
        setAvailableRooms([]);
      } else if (data && data.length > 0) {
        console.log(`✅ Base de données a retourné ${data.length} chambres`);
        // Calculer le nombre de nuits pour le calcul du prix total
        const startDate = new Date(searchDateRange.startDate);
        const endDate = new Date(searchDateRange.endDate);
        const numberOfNights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Transformer les données pour correspondre au format attendu
        const transformedRooms = data.map((room: any) => ({
          hotel: room.hotel_nom || 'Hôtel',
          hotelAddress: room.hotel_adresse || '',
          hotelVille: room.hotel_ville || '',
          roomNumber: room.numero || `Room ${room.id}`,
          roomType: room.category_name || 'Standard',
          isAvailable: room.is_available !== false,
          pricePerNight: room.prix || 60,
          totalPrice: room.prix ? room.prix * numberOfNights : 60 * numberOfNights,
          characteristics: getRandomCharacteristics(),
          capacity: room.capacity || 2,
          roomId: room.id,
          hotelId: room.hotel_id
        }));
        
        // Filtrer les résultats par capacité si nécessaire
        let filteredRooms = transformedRooms;
        if (numberOfGuests > 1) {
          filteredRooms = transformedRooms.filter((room: any) => room.capacity >= numberOfGuests);
        }
        
        console.log(`📊 Après filtrage par capacité: ${filteredRooms.length} chambres disponibles`);
        setAvailableRooms(filteredRooms);
      } else if (data && data.length === 0) {
        // Si data est vide, aucune chambre trouvée
        console.log('⚠️ Aucune chambre trouvée pour ces critères');
        setAvailableRooms([]);
      } else {
        // Si data est null/undefined
        console.log('⚠️ Aucune donnée retournée par la base de données');
        setAvailableRooms([]);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche des chambres:', error);
      // En cas d'erreur, afficher un tableau vide plutôt que des données simulées
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Fonction supprimée - utilisation uniquement de données réelles
  /* REMOVED getSimulatedRooms
  const getSimulatedRooms = () => {
    const searchStart = new Date(searchDateRange.startDate);
    const searchEnd = new Date(searchDateRange.endDate);
    const simulatedRooms: any[] = [];

    hotels.forEach(hotel => {
      if (searchHotel !== 'all' && hotel.nom !== searchHotel) {
        return;
      }

      const totalRooms = hotel.chambresTotal || 0;
      
      for (let roomNum = 1; roomNum <= totalRooms; roomNum++) {
        const roomNumber = `${roomNum}`.padStart(3, '0');
        
        const isOccupied = reservations.some(reservation => {
          if (reservation.hotel !== hotel.nom) return false;
          
          const resStart = new Date(reservation.dateArrivee);
          const resEnd = new Date(reservation.dateDepart);
          
          return !(searchEnd < resStart || searchStart > resEnd);
        });

        if (!isOccupied || !showAvailableOnly) {
          let roomType = 'Simple';
          if (roomNum % 4 === 0) roomType = 'Familiale';
          else if (roomNum % 3 === 0) roomType = 'Suite';
          else if (roomNum % 2 === 0) roomType = 'Double';

          if (selectedRoomType !== 'all' && roomType !== selectedRoomType) {
            continue;
          }

          // Filtrer par numéro de chambre si spécifié
          if (searchRoomNumber && !roomNumber.includes(searchRoomNumber)) {
            continue;
          }

                     const days = Math.ceil((searchEnd.getTime() - searchStart.getTime()) / (1000 * 60 * 60 * 24));
           const basePrice = roomType === 'Suite' ? 120 : 
                            roomType === 'Familiale' ? 100 : 
                            roomType === 'Double' ? 80 : 60;
           
           // Calculer le prix selon le mode de location
           let totalPrice: number;
           if (rentalMode === 'pax') {
             // Mode PAX : prix par personne
             totalPrice = basePrice * numberOfGuests * days;
           } else {
             // Mode chambre complète : prix fixe pour la chambre
             totalPrice = basePrice * days;
           }

          const capacity = roomType === 'Familiale' ? 4 : 
                          roomType === 'Suite' ? 3 : 
                          roomType === 'Double' ? 2 : 1;

          // Filtrer par capacité si spécifié
          if (numberOfGuests > 1 && capacity < numberOfGuests) {
            continue;
          }

          const characteristics = getRandomCharacteristics();
          
          // Filtrer par caractéristique si spécifiée
          if (selectedCharacteristic !== 'all') {
                        const hasCharacteristic = Object.values(characteristics).some((char: any) =>
              typeof char === 'string' && char.toLowerCase().includes(selectedCharacteristic.toLowerCase())
            );
            if (!hasCharacteristic) {
              continue;
            }
          }

          simulatedRooms.push({
            hotel: hotel.nom,
            hotelAddress: hotel.adresse,
            hotelVille: hotel.ville,
            roomNumber,
            roomType,
            isAvailable: !isOccupied,
            pricePerNight: basePrice,
            totalPrice,
            characteristics,
            capacity
          });
        }
      }
    });

    return simulatedRooms;
  };
  */

  // Recherche automatique désactivée - section de recherche supprimée
  // useEffect(() => {
  //   if (searchDateRange.startDate && searchDateRange.endDate) {
  //     searchAvailableRooms();
  //   }
  // }, [searchDateRange.startDate, searchDateRange.endDate, searchHotel, selectedRoomType, numberOfGuests, selectedCharacteristic, searchRoomNumber]);

  // Générer des caractéristiques aléatoires pour les chambres
  const getRandomCharacteristics = () => {
    const characteristicsMap: { [key: string]: string } = {
      'WiFi': 'wifi',
      'Climatisation': 'climatisation',
      'Balcon': 'balcon',
      'Vue mer': 'vue_mer',
      'TV': 'tv',
      'Salle de bain privée': 'salle_bain_privee'
    };
    
    const allCharacteristics = getAvailableCharacteristics();
    const numCharacteristics = Math.floor(Math.random() * 4) + 2; // 2-5 caractéristiques
    const shuffled = [...allCharacteristics].sort(() => 0.5 - Math.random());
    const selectedChars = shuffled.slice(0, numCharacteristics);
    
    // Convertir en objet avec valeurs booléennes
    const characteristicsObj: { [key: string]: boolean } = {};
    selectedChars.forEach(char => {
      const key = characteristicsMap[char] || char.toLowerCase().replace(/ /g, '_');
      characteristicsObj[key] = true;
    });
    
    return characteristicsObj;
  };

  // Filtrer les réservations selon les critères de recherche
  const getFilteredReservations = () => {
    return reservations.filter(reservation => {
      // Filtre par date de réservation
      if (searchDateRange.startDate && searchDateRange.endDate) {
        const reservationStart = new Date(reservation.dateArrivee);
        const reservationEnd = new Date(reservation.dateDepart);
        const searchStart = new Date(searchDateRange.startDate);
        const searchEnd = new Date(searchDateRange.endDate);
        
        if (reservationStart > searchEnd || reservationEnd < searchStart) {
          return false;
        }
      }

      // Filtre par hôtel
      if (searchHotel !== 'all' && reservation.hotel !== searchHotel) {
        return false;
      }

      if (selectedHotel && reservation.hotel !== selectedHotel) {
        return false;
      }

      // Filtre par numéro de chambre
      if (searchRoomNumber && !reservation.chambre.includes(searchRoomNumber)) {
        return false;
      }

      // Filtre par type de chambre (simulé basé sur le numéro de chambre)
      if (selectedRoomType !== 'all') {
        const roomNumber = reservation.chambre;
        if (selectedRoomType === 'Simple' && !roomNumber.includes('1')) return false;
        if (selectedRoomType === 'Double' && !roomNumber.includes('2')) return false;
        if (selectedRoomType === 'Suite' && !roomNumber.includes('3')) return false;
        if (selectedRoomType === 'Familiale' && !roomNumber.includes('4')) return false;
      }

      return true;
    });
  };

  const availableRoomTypes = getAvailableRoomTypes();
  const availableCharacteristics = getAvailableCharacteristics();
  const filteredReservations = getFilteredReservations();


  const getOccupancyColor = (rate: string) => {
    const numRate = parseFloat(rate);
    if (numRate >= 90) return 'text-red-600';
    if (numRate >= 75) return 'text-orange-600';
    if (numRate >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getOccupancyIcon = (rate: string) => {
    const numRate = parseFloat(rate);
    if (numRate >= 90) return <XCircle className="h-4 w-4 text-red-600" />;
    if (numRate >= 75) return <AlertCircle className="h-4 w-4 text-orange-600" />;
    if (numRate >= 50) return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  const resetSearchFilters = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedRoomType('all');
    setSelectedCharacteristic('all');
    setSearchRoomNumber('');
    setSearchDateRange({ startDate: '', endDate: '' });
    setSearchHotel('all');
    setNumberOfGuests(1);
    setShowAvailableOnly(false);
    setRentalMode('room'); // Réinitialiser le mode de location
    setAvailableRooms([]); // Vider les résultats
  };

  // Fonctions pour la réservation rapide
  const handleQuickReservation = (room: any) => {
    setSelectedRoomForReservation(room);
    setIsQuickReservationModalOpen(true);
  };

  const handleQuickReservationSuccess = () => {
    setIsQuickReservationModalOpen(false);
    setSelectedRoomForReservation(null);
    // Ici vous pourriez recharger les données ou afficher une notification
    console.log('Réservation créée avec succès');
  };

  return (
    <div className="space-y-6">
      {/* Section de recherche de disponibilité supprimée - disponible dans un onglet dédié */}

             {/* Vue d'ensemble */}
       <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chambres totales</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availability.totalRooms}</div>
            <p className="text-xs text-muted-foreground">
              Capacité totale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chambres occupées</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{availability.occupiedRooms}</div>
            <p className="text-xs text-muted-foreground">
              Réservations actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chambres disponibles</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availability.availableRooms}</div>
            <p className="text-xs text-muted-foreground">
              Prêtes à réserver
            </p>
          </CardContent>
        </Card>

                 <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Taux d'occupation</CardTitle>
             <TrendingUp className="h-4 w-4 text-blue-600" />
           </CardHeader>
           <CardContent>
             <div className={`text-2xl font-bold ${getOccupancyColor(availability.occupancyRate)}`}>
               {availability.occupancyRate}%
             </div>
             <p className="text-xs text-muted-foreground">
               {parseFloat(availability.occupancyRate) > 80 ? 'Élevé' : 'Normal'}
             </p>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Alerte sur occupation</CardTitle>
             <AlertCircle className="h-4 w-4 text-orange-600" />
           </CardHeader>
           <CardContent>
             <div className={`text-2xl font-bold ${getOccupancyColor(availability.occupancyRate)}`}>
               {availability.occupancyRate}%
             </div>
             <p className="text-xs text-muted-foreground">
               {parseFloat(availability.occupancyRate) >= 90 ? 'CRITIQUE' : 
                parseFloat(availability.occupancyRate) >= 75 ? 'ÉLEVÉE' : 
                parseFloat(availability.occupancyRate) >= 50 ? 'MODÉRÉE' : 'FAIBLE'}
             </p>
           </CardContent>
         </Card>
      </div>





      {/* Réservations du jour sélectionné */}
      {availability.reservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Réservations pour le {new Date(selectedDate).toLocaleDateString('fr-FR')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availability.reservations.map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{reservation.usager}</p>
                      <p className="text-sm text-gray-500">{reservation.hotel} - {reservation.chambre}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={
                      reservation.statut === 'CONFIRMEE' ? 'bg-green-100 text-green-800' :
                      reservation.statut === 'EN_COURS' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {reservation.statut}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(reservation.dateArrivee).toLocaleDateString('fr-FR')} - {new Date(reservation.dateDepart).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

             {/* Modal de réservation rapide */}
       {isQuickReservationModalOpen && selectedRoomForReservation && (
         <QuickReservationModal
           isOpen={isQuickReservationModalOpen}
           onClose={() => setIsQuickReservationModalOpen(false)}
           onSuccess={handleQuickReservationSuccess}
           roomData={selectedRoomForReservation}
           dateRange={searchDateRange}
           hotels={hotels}
           operateurs={operateurs}
         />
       )}

       {/* Alertes et chambres critiques */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Alerte de fin de séjour */}
         <EndingStaysAlert maxDisplay={3} />
         
         {/* Chambres critiques */}
         <CriticalRoomsAlert maxDisplay={3} />
       </div>
     </div>
   );
 } 
