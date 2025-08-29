'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';
import AvailabilitySearchForm, { AvailabilitySearchCriteria } from '../features/AvailabilitySearchForm';
import AvailabilityResults, { AvailableRoom } from '../features/AvailabilityResults';
import { useAllHotels, useRoomCategories, useRooms, useHotelEquipmentCRUD } from '@/hooks/useSupabase';
import { supabase } from '@/lib/supabase';
import { Room, RoomCategory, Hotel as HotelType, HotelEquipment } from '@/lib/supabase';

interface AvailabilitySearchPageProps {
  onRoomSelect?: (room: AvailableRoom, criteria: AvailabilitySearchCriteria) => void;
  className?: string;
  selectedHotelId?: number | null;
}

export default function AvailabilitySearchPage({
  onRoomSelect,
  className = '',
  selectedHotelId = null
}: AvailabilitySearchPageProps) {
  // Data hooks - Utilise useAllHotels pour récupérer TOUS les hôtels
  const { hotels, loading: hotelsLoading, error: hotelsError } = useAllHotels();
  const { categories, loading: categoriesLoading, error: categoriesError } = useRoomCategories();
  
  // State for search results and search process
  const [searchCriteria, setSearchCriteria] = useState<AvailabilitySearchCriteria | null>(null);
  const [searchResults, setSearchResults] = useState<AvailableRoom[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Loading state for the overall component
  const isLoading = hotelsLoading || categoriesLoading;
  const error = hotelsError || categoriesError;

  // Function removed - now using database function get_available_rooms_with_details

  // Get room equipment details
  const getRoomEquipmentDetails = async (room: Room, hotelId: number): Promise<HotelEquipment[]> => {
    if (!room.equipment_ids || room.equipment_ids.length === 0) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('hotel_equipment')
        .select('*')
        .eq('hotel_id', hotelId)
        .in('id', room.equipment_ids)
        .eq('est_actif', true)
        .order('categorie')
        .order('ordre_affichage')
        .order('nom');

      if (error) {
        console.warn('Error fetching equipment details:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.warn('Error in equipment fetch:', err);
      return [];
    }
  };

  // Main search function using the correct database function
  const handleSearch = async (criteria: AvailabilitySearchCriteria) => {
    setIsSearching(true);
    setSearchError(null);
    setSearchCriteria(criteria);
    setHasSearched(true);

    try {
      // Use the corrected database function get_available_rooms_with_details
      const { data: roomsData, error: roomsError } = await supabase
        .rpc('get_available_rooms_with_details', {
          p_date_debut: criteria.checkInDate,
          p_date_fin: criteria.checkOutDate,
          p_hotel_id: criteria.hotelId || null,
          p_room_type: criteria.categoryId ? categories.find(c => c.id === criteria.categoryId)?.name || null : null,
          p_capacity: criteria.adults + criteria.children,
          p_characteristic: null,
          p_room_number: null,
          p_rental_mode: 'night'
        });

      if (roomsError) {
        throw new Error(`Erreur lors de la recherche: ${roomsError.message}`);
      }

      if (!roomsData || roomsData.length === 0) {
        setSearchResults([]);
        return;
      }

      // Transform database results to AvailableRoom format
      const availableRooms: AvailableRoom[] = [];

      for (const roomData of roomsData) {
        // Get hotel details
        const hotel = hotels.find(h => h.id === roomData.hotel_id);
        
        // Get category details
        const category = roomData.category_id 
          ? categories.find(c => c.id === roomData.category_id)
          : undefined;

        // Get equipment details
        const equipmentDetails = await getRoomEquipmentDetails({
          id: roomData.id,
          equipment_ids: roomData.equipment_ids || []
        } as Room, roomData.hotel_id);

        // Calculate nights and total price
        const checkIn = new Date(criteria.checkInDate);
        const checkOut = new Date(criteria.checkOutDate);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = roomData.prix * nights;

        availableRooms.push({
          id: roomData.id,
          numero: roomData.numero,
          hotel_id: roomData.hotel_id,
          category_id: roomData.category_id,
          capacity: roomData.capacity,
          surface: roomData.surface,
          prix: roomData.prix,
          statut: roomData.statut,
          floor: roomData.floor,
          room_size: roomData.room_size,
          bed_type: roomData.bed_type,
          description: roomData.description,
          equipment_ids: roomData.equipment_ids || [],
          created_at: '',
          updated_at: '',
          last_cleaned: null,
          hotel,
          category,
          equipmentDetails,
          isAvailable: roomData.is_available === true, // Use the database result
          nights,
          totalPrice
        });
      }

      // Sort results: available first, then by price
      availableRooms.sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) {
          return a.isAvailable ? -1 : 1;
        }
        return a.prix - b.prix;
      });

      setSearchResults(availableRooms);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la recherche';
      setSearchError(errorMessage);
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle room selection
  const handleRoomSelect = (room: AvailableRoom) => {
    if (searchCriteria) {
      onRoomSelect?.(room, searchCriteria);
    }
  };

  // Handle reservation creation success
  const handleReservationCreated = () => {
    // Optionally refresh the search results or show success message
    // For now, we just trigger a re-search to update availability
    if (searchCriteria) {
      handleSearch(searchCriteria);
    }
  };

  // Retry search
  const handleRetrySearch = () => {
    if (searchCriteria) {
      handleSearch(searchCriteria);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={`w-full space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des données...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`w-full space-y-6 ${className}`}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement des données: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Search Form */}
      <AvailabilitySearchForm
        hotels={hotels}
        categories={categories}
        onSearch={handleSearch}
        isLoading={isSearching}
        selectedHotelId={selectedHotelId}
      />

      {/* Search Error */}
      {searchError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{searchError}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetrySearch}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search Results */}
      {hasSearched && searchCriteria && !searchError && (
        <AvailabilityResults
          results={searchResults}
          criteria={searchCriteria}
          isLoading={isSearching}
          onRoomSelect={handleRoomSelect}
          onReservationCreated={handleReservationCreated}
        />
      )}

      {/* Initial State - No Search Performed */}
      {!hasSearched && !isSearching && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Recherche de disponibilité
            </h3>
            <p className="text-gray-600">
              Sélectionnez vos dates et critères de recherche pour trouver les chambres disponibles.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}