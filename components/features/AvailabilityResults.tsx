'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Bed, 
  Users, 
  Square, 
  MapPin, 
  Wifi, 
  Car, 
  Utensils, 
  Tv,
  Bath,
  Wind,
  Shield,
  Accessibility,
  Check,
  AlertCircle,
  Hotel
} from 'lucide-react';
import { Room, RoomCategory, Hotel as HotelType, HotelEquipment } from '@/lib/supabase';
import { AvailabilitySearchCriteria } from './AvailabilitySearchForm';
import CreateReservationModal from '../modals/CreateReservationModal';

export interface AvailableRoom extends Room {
  category?: RoomCategory;
  hotel?: HotelType;
  equipmentDetails?: HotelEquipment[];
  isAvailable: boolean;
  nights?: number;
  totalPrice?: number;
}

interface AvailabilityResultsProps {
  results: AvailableRoom[];
  criteria: AvailabilitySearchCriteria;
  isLoading?: boolean;
  onRoomSelect?: (room: AvailableRoom) => void;
  onReservationCreated?: () => void;
  className?: string;
}

// Equipment icon mapping
const getEquipmentIcon = (category: string) => {
  switch (category) {
    case 'connectivity':
      return <Wifi className="h-4 w-4" />;
    case 'services':
      return <Utensils className="h-4 w-4" />;
    case 'wellness':
      return <Bath className="h-4 w-4" />;
    case 'accessibility':
      return <Accessibility className="h-4 w-4" />;
    case 'security':
      return <Shield className="h-4 w-4" />;
    case 'recreation':
      return <Tv className="h-4 w-4" />;
    case 'general':
      return <Wind className="h-4 w-4" />;
    default:
      return <Check className="h-4 w-4" />;
  }
};

// Group results by category or price
const groupResults = (results: AvailableRoom[], groupBy: 'category' | 'price' | 'hotel') => {
  if (groupBy === 'category') {
    const grouped = results.reduce((acc, room) => {
      const categoryName = room.category?.name || 'Sans catégorie';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(room);
      return acc;
    }, {} as Record<string, AvailableRoom[]>);
    return grouped;
  }

  if (groupBy === 'hotel') {
    const grouped = results.reduce((acc, room) => {
      const hotelName = room.hotel?.nom || 'Établissement inconnu';
      if (!acc[hotelName]) {
        acc[hotelName] = [];
      }
      acc[hotelName].push(room);
      return acc;
    }, {} as Record<string, AvailableRoom[]>);
    return grouped;
  }

  if (groupBy === 'price') {
    const grouped = results.reduce((acc, room) => {
      const priceRange = room.prix <= 50 ? '≤ 50€' : room.prix <= 100 ? '51-100€' : room.prix <= 150 ? '101-150€' : '> 150€';
      if (!acc[priceRange]) {
        acc[priceRange] = [];
      }
      acc[priceRange].push(room);
      return acc;
    }, {} as Record<string, AvailableRoom[]>);
    return grouped;
  }

  return { 'Tous': results };
};

export default function AvailabilityResults({
  results,
  criteria,
  isLoading = false,
  onRoomSelect,
  onReservationCreated,
  className = ''
}: AvailabilityResultsProps) {
  const [groupBy, setGroupBy] = useState<'category' | 'price' | 'hotel'>('category');
  const [selectedRoom, setSelectedRoom] = useState<AvailableRoom | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate number of nights
  const nights = criteria.checkInDate && criteria.checkOutDate
    ? Math.ceil((new Date(criteria.checkOutDate).getTime() - new Date(criteria.checkInDate).getTime()) / (1000 * 60 * 60 * 24))
    : 1;

  // Add calculated fields to results
  const enrichedResults = results.map(room => ({
    ...room,
    nights,
    totalPrice: room.prix * nights
  }));

  const groupedResults = groupResults(enrichedResults, groupBy);
  const totalResults = results.length;
  const availableResults = results.filter(r => r.isAvailable).length;

  // Handle room selection for reservation
  const handleRoomSelect = (room: AvailableRoom) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
    onRoomSelect?.(room);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  // Handle reservation success
  const handleReservationSuccess = () => {
    onReservationCreated?.();
  };

  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Recherche en cours...</p>
        </CardContent>
      </Card>
    );
  }

  if (totalResults === 0) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun résultat</h3>
          <p className="text-gray-600">
            Aucune chambre ne correspond à vos critères de recherche.
            <br />
            Essayez de modifier vos dates ou filtres.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Results Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-blue-600" />
                Résultats de recherche
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {availableResults} chambres disponibles sur {totalResults} trouvées
              </p>
            </div>
            
            {/* Group By Selector */}
            <div className="flex gap-2">
              <Button
                variant={groupBy === 'category' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGroupBy('category')}
              >
                Par catégorie
              </Button>
              <Button
                variant={groupBy === 'hotel' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGroupBy('hotel')}
              >
                Par établissement
              </Button>
              <Button
                variant={groupBy === 'price' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGroupBy('price')}
              >
                Par prix
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Results Groups */}
      {Object.entries(groupedResults).map(([groupName, rooms]) => (
        <div key={groupName} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            {groupName} ({rooms.length} chambres)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Card key={room.id} className={`relative ${!room.isAvailable ? 'opacity-75' : ''}`}>
                {!room.isAvailable && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge variant="destructive">Indisponible</Badge>
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Bed className="h-4 w-4" />
                        Chambre {room.numero}
                      </CardTitle>
                      {room.hotel && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Hotel className="h-3 w-3" />
                          {room.hotel.nom}
                        </p>
                      )}
                      {room.category && (
                        <Badge variant="secondary" className="mt-2">
                          {room.category.name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {room.prix}€
                      </p>
                      <p className="text-xs text-gray-500">par nuit</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Room Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {room.category && (
                      <>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{room.category.capacity} pers.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Square className="h-4 w-4 text-gray-500" />
                          <span>{room.category.surface}m²</span>
                        </div>
                      </>
                    )}
                    {room.bed_type && (
                      <div className="flex items-center gap-2">
                        <Bed className="h-4 w-4 text-gray-500" />
                        <span>{room.bed_type}</span>
                      </div>
                    )}
                    {room.view_type && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{room.view_type}</span>
                      </div>
                    )}
                  </div>

                  {/* Equipment/Amenities */}
                  {room.equipmentDetails && room.equipmentDetails.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Équipements:</p>
                      <div className="flex flex-wrap gap-2">
                        {room.equipmentDetails.slice(0, 6).map((equipment) => (
                          <div
                            key={equipment.id}
                            className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 text-xs"
                          >
                            {getEquipmentIcon(equipment.categorie)}
                            <span>{equipment.nom}</span>
                          </div>
                        ))}
                        {room.equipmentDetails.length > 6 && (
                          <div className="bg-gray-100 rounded-full px-2 py-1 text-xs">
                            +{room.equipmentDetails.length - 6} autres
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {room.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {room.description}
                    </p>
                  )}

                  {/* Total Price */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {nights} nuit{nights > 1 ? 's' : ''}
                      </span>
                      <span className="text-lg font-semibold">
                        {room.totalPrice}€ total
                      </span>
                    </div>
                  </div>

                  {/* Select Button */}
                  <Button
                    onClick={() => handleRoomSelect(room)}
                    disabled={!room.isAvailable}
                    className="w-full"
                  >
                    {room.isAvailable ? 'Sélectionner' : 'Indisponible'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Reservation Modal */}
      {selectedRoom && (
        <CreateReservationModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          roomData={selectedRoom}
          searchCriteria={criteria}
          onSuccess={handleReservationSuccess}
        />
      )}
    </div>
  );
}