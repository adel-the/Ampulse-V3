'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';
import AvailabilitySearchForm, { AvailabilitySearchCriteria } from '../features/AvailabilitySearchForm';
import AvailabilityResults, { AvailableRoom } from '../features/AvailabilityResults';
import { useHotels, useRoomCategories, useRooms, useHotelEquipmentCRUD } from '@/hooks/useSupabase';
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
  // Data hooks
  const { establishments: hotels, loading: hotelsLoading, error: hotelsError } = useHotels();
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

  // Mock availability check function
  const checkRoomAvailability = async (room: Room, criteria: AvailabilitySearchCriteria): Promise<boolean> => {
    // Mock logic: room is available if not in maintenance
    // In a real implementation, this would check reservation conflicts
    if (room.statut === 'maintenance') {
      return false;
    }

    // Check for overlapping reservations (mock implementation)
    try {
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('id, date_arrivee, date_depart, statut')
        .eq('chambre_id', room.id)
        .in('statut', ['CONFIRMEE', 'EN_COURS'])
        .or(`date_arrivee.lte.${criteria.checkOutDate},date_depart.gte.${criteria.checkInDate}`);

      if (error) {
        console.warn('Error checking reservations:', error);
        return true; // Assume available on error
      }

      return !reservations || reservations.length === 0;
    } catch (err) {
      console.warn('Error in availability check:', err);
      return true; // Assume available on error
    }
  };

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

  // Main search function
  const handleSearch = async (criteria: AvailabilitySearchCriteria) => {
    setIsSearching(true);
    setSearchError(null);
    setSearchCriteria(criteria);
    setHasSearched(true);

    try {
      // Get all rooms based on criteria
      let query = supabase
        .from('rooms')
        .select(`
          *,
          hotels!inner(*)
        `);

      // Apply hotel filter
      if (criteria.hotelId) {
        query = query.eq('hotel_id', criteria.hotelId);
      }

      // Apply category filter
      if (criteria.categoryId) {
        query = query.eq('category_id', criteria.categoryId);
      }

      // Order by hotel name and room number
      query = query.order('numero');

      const { data: roomsWithHotels, error: roomsError } = await query;

      if (roomsError) {
        throw new Error(`Erreur lors de la recherche: ${roomsError.message}`);
      }

      if (!roomsWithHotels || roomsWithHotels.length === 0) {
        setSearchResults([]);
        return;
      }

      // Get room categories
      const roomCategoryIds = [...new Set(roomsWithHotels
        .map(r => r.category_id)
        .filter(id => id !== null)
      )];

      let roomCategories: RoomCategory[] = [];
      if (roomCategoryIds.length > 0) {
        const { data: categoriesData } = await supabase
          .from('room_categories')
          .select('*')
          .in('id', roomCategoryIds);
        roomCategories = categoriesData || [];
      }

      // Process each room
      const availableRooms: AvailableRoom[] = [];

      for (const roomData of roomsWithHotels) {
        const room = roomData as Room & { hotels: HotelType };
        const hotel = room.hotels;

        // Check availability
        const isAvailable = await checkRoomAvailability(room, criteria);

        // Get category details
        const category = room.category_id 
          ? roomCategories.find(c => c.id === room.category_id)
          : undefined;

        // Get equipment details
        const equipmentDetails = await getRoomEquipmentDetails(room, room.hotel_id);

        // Check capacity constraint
        const totalGuests = criteria.adults + criteria.children;
        const hasCapacityConstraint = category && totalGuests > category.capacity;

        availableRooms.push({
          ...room,
          hotel,
          category,
          equipmentDetails,
          isAvailable: isAvailable && !hasCapacityConstraint
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