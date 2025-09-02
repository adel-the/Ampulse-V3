"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Hotel {
  id: number;
  nom: string;
  adresse: string;
  ville: string;
  codePostal: string;
  telephone: string;
  email: string;
  gestionnaire: string;
  statut: string;
  chambresTotal: number;
  chambresOccupees: number;
  tauxOccupation: number;
}

interface EstablishmentContextValue {
  selectedHotelId: number | null;
  selectedHotel: Hotel | null;
  availableHotels: Hotel[];
  setSelectedHotelId: (hotelId: number | null) => void;
  setAvailableHotels: (hotels: Hotel[]) => void;
  isLoading: boolean;
}

const EstablishmentContext = createContext<EstablishmentContextValue | undefined>(undefined);

const STORAGE_KEY = 'soliReserve_selectedEstablishment';

// Helper function to get localStorage safely  
const getStoredHotelId = (): number | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      return isNaN(parsed) ? null : parsed;
    }
  } catch (error) {
    console.warn('Error reading from localStorage:', error);
  }
  return null;
};
const EVENT_NAME = 'establishmentChanged';

interface EstablishmentProviderProps {
  children: ReactNode;
}

export function EstablishmentProvider({ children }: EstablishmentProviderProps) {
  const [selectedHotelId, setSelectedHotelIdState] = useState<number | null>(null);
  const [availableHotels, setAvailableHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRestoredFromStorage, setHasRestoredFromStorage] = useState(false);

  // Debug: Log when available hotels change (can be removed in production)
  useEffect(() => {
    console.log('🏨 EstablishmentContext: Available hotels updated:', availableHotels.map(h => ({ id: h.id, nom: h.nom })));
    console.log('📊 EstablishmentContext: Current state when hotels change - selectedHotelId:', selectedHotelId, 'isLoading:', isLoading, 'hasRestoredFromStorage:', hasRestoredFromStorage);
  }, [availableHotels]);

  // Debug: Log when selected hotel ID changes (can be removed in production)
  useEffect(() => {
    console.log('🎯 EstablishmentContext: Selected hotel ID updated:', selectedHotelId);
  }, [selectedHotelId]);

  // Get the selected hotel object
  const selectedHotel = selectedHotelId 
    ? availableHotels.find(hotel => hotel.id === selectedHotelId) || null 
    : null;

  // Initial setup: mark loading as false on mount
  useEffect(() => {
    console.log('✅ EstablishmentContext: Component mounted, setting isLoading to false');
    console.log('💾 EstablishmentContext: Initial localStorage check:', localStorage.getItem(STORAGE_KEY));
    setIsLoading(false);
  }, []);

  // Restore selection from localStorage AFTER hotels are available
  useEffect(() => {
    console.log('🔍 EstablishmentContext: Restore effect triggered - isLoading:', isLoading, 'hasRestoredFromStorage:', hasRestoredFromStorage, 'availableHotels.length:', availableHotels.length);
    
    if (!isLoading && !hasRestoredFromStorage && availableHotels.length > 0) {
      console.log('🔍 EstablishmentContext: CONDITIONS MET - Restoring from localStorage...');
      
      const storedHotelId = getStoredHotelId();
      console.log('📦 EstablishmentContext: Retrieved stored hotel ID:', storedHotelId);
      
      if (storedHotelId !== null) {
        // Check if this hotel exists in available hotels
        const hotelExists = availableHotels.some(hotel => hotel.id === storedHotelId);
        console.log('🏨 EstablishmentContext: Available hotels:', availableHotels.map(h => ({ id: h.id, nom: h.nom })));
        console.log('✅ EstablishmentContext: Hotel exists check for ID', storedHotelId, ':', hotelExists);
        
        if (hotelExists) {
          const foundHotel = availableHotels.find(hotel => hotel.id === storedHotelId);
          console.log('✅ EstablishmentContext: RESTORING hotel:', foundHotel?.nom, 'ID:', storedHotelId);
          setSelectedHotelIdState(storedHotelId);
          
          // Fire the event to notify other components of the restoration
          try {
            const event = new CustomEvent(EVENT_NAME, {
              detail: { 
                hotelId: storedHotelId, 
                hotel: foundHotel,
                timestamp: Date.now(),
                reason: 'restored_from_localStorage'
              }
            });
            window.dispatchEvent(event);
            console.log('📡 EstablishmentContext: Dispatched restoration event for:', foundHotel?.nom);
          } catch (error) {
            console.warn('Failed to dispatch restoration event:', error);
          }
        } else {
          console.log('⚠️ EstablishmentContext: Saved hotel ID not found in available hotels, will auto-select');
        }
      } else {
        console.log('📭 EstablishmentContext: No saved establishment found in localStorage');
      }
      
      console.log('🏁 EstablishmentContext: Setting hasRestoredFromStorage to true');
      setHasRestoredFromStorage(true);
    } else {
      console.log('❌ EstablishmentContext: Restore conditions NOT met - isLoading:', isLoading, 'hasRestoredFromStorage:', hasRestoredFromStorage, 'availableHotels.length:', availableHotels.length);
    }
  }, [isLoading, availableHotels, hasRestoredFromStorage]);

  // Auto-select first hotel if none is selected and hotels are available
  useEffect(() => {
    console.log('🏨 EstablishmentContext: Auto-selection check - isLoading:', isLoading, 'selectedHotelId:', selectedHotelId, 'availableHotels.length:', availableHotels.length, 'hasRestoredFromStorage:', hasRestoredFromStorage);
    
    // ONLY auto-select if:
    // 1. Not loading
    // 2. Has attempted to restore from localStorage (regardless of success)
    // 3. No hotel is currently selected
    // 4. Hotels are available
    if (!isLoading && hasRestoredFromStorage && selectedHotelId === null && availableHotels.length > 0) {
      const firstHotel = availableHotels[0];
      console.log('🎯 EstablishmentContext: Auto-selecting first hotel (localStorage restoration completed but no hotel found):', firstHotel.nom, 'ID:', firstHotel.id);
      setSelectedHotelId(firstHotel.id);
    } else {
      console.log('❌ EstablishmentContext: Auto-selection SKIPPED - one of the conditions not met');
    }
  }, [availableHotels, selectedHotelId, isLoading, hasRestoredFromStorage]);

  // Handle case where selected hotel is no longer available
  useEffect(() => {
    if (!isLoading && selectedHotelId && availableHotels.length > 0) {
      const isSelectedHotelAvailable = availableHotels.some(hotel => hotel.id === selectedHotelId);
      if (!isSelectedHotelAvailable) {
        // Selected hotel is no longer available, select the first available one
        const firstHotel = availableHotels[0];
        setSelectedHotelId(firstHotel.id);
        
        // Dispatch event to notify components
        const event = new CustomEvent(EVENT_NAME, {
          detail: { 
            hotelId: firstHotel.id, 
            hotel: firstHotel,
            timestamp: Date.now(),
            reason: 'hotel_no_longer_available'
          }
        });
        window.dispatchEvent(event);
      }
    }
  }, [selectedHotelId, availableHotels, isLoading]);

  // Function to change selected hotel
  const setSelectedHotelId = (hotelId: number | null) => {
    console.log('🏨 EstablishmentContext: setSelectedHotelId called with:', hotelId);
    console.log('📊 EstablishmentContext: Current state - selectedHotelId:', selectedHotelId, 'availableHotels:', availableHotels.map(h => ({ id: h.id, nom: h.nom })));
    console.trace('🔍 EstablishmentContext: Call stack for setSelectedHotelId');
    
    // Validate that the hotel exists in available hotels
    if (hotelId !== null) {
      const hotelExists = availableHotels.some(hotel => hotel.id === hotelId);
      console.log('✅ EstablishmentContext: Hotel exists check:', hotelExists, 'Available hotels:', availableHotels.map(h => ({ id: h.id, nom: h.nom })));
      if (!hotelExists) {
        console.warn(`❌ Hotel with ID ${hotelId} not found in available hotels`);
        return;
      }
    }

    console.log('🔄 EstablishmentContext: Setting selectedHotelIdState to:', hotelId);
    setSelectedHotelIdState(hotelId);
    
    // Persist to localStorage
    try {
      if (hotelId === null) {
        console.log('🗑️ EstablishmentContext: Removing from localStorage');
        localStorage.removeItem(STORAGE_KEY);
      } else {
        console.log('💾 EstablishmentContext: Saving to localStorage:', STORAGE_KEY, '=', hotelId.toString());
        localStorage.setItem(STORAGE_KEY, hotelId.toString());
        
        // Verify it was saved
        const verification = localStorage.getItem(STORAGE_KEY);
        console.log('✅ EstablishmentContext: Verification - saved value:', verification);
      }
    } catch (error) {
      console.warn('❌ Failed to save selected establishment to localStorage:', error);
    }

    // Dispatch custom event for cross-component communication
    const hotel = hotelId ? availableHotels.find(h => h.id === hotelId) : null;
    try {
      const event = new CustomEvent(EVENT_NAME, {
        detail: { 
          hotelId, 
          hotel,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.warn('Failed to dispatch establishment change event:', error);
    }
  };

  // Listen for establishment changes from other components/tabs
  useEffect(() => {
    const handleEstablishmentChange = (event: CustomEvent) => {
      const { hotelId } = event.detail;
      if (hotelId !== selectedHotelId) {
        setSelectedHotelIdState(hotelId);
      }
    };

    window.addEventListener(EVENT_NAME, handleEstablishmentChange as EventListener);
    
    return () => {
      window.removeEventListener(EVENT_NAME, handleEstablishmentChange as EventListener);
    };
  }, [selectedHotelId]);

  const value: EstablishmentContextValue = {
    selectedHotelId,
    selectedHotel,
    availableHotels,
    setSelectedHotelId,
    setAvailableHotels,
    isLoading
  };

  return (
    <EstablishmentContext.Provider value={value}>
      {children}
    </EstablishmentContext.Provider>
  );
}

// Custom hook to use the establishment context
export function useEstablishment() {
  const context = useContext(EstablishmentContext);
  if (context === undefined) {
    throw new Error('useEstablishment must be used within an EstablishmentProvider');
  }
  return context;
}

// Custom hook for listening to establishment changes with automatic cleanup
export function useEstablishmentListener(callback: (hotel: Hotel | null) => void) {
  const { selectedHotel } = useEstablishment();

  useEffect(() => {
    const handleEstablishmentChange = (event: CustomEvent) => {
      const { hotel } = event.detail;
      callback(hotel);
    };

    window.addEventListener(EVENT_NAME, handleEstablishmentChange as EventListener);
    
    return () => {
      window.removeEventListener(EVENT_NAME, handleEstablishmentChange as EventListener);
    };
  }, [callback]);

  // Call callback immediately with current hotel
  useEffect(() => {
    callback(selectedHotel);
  }, [selectedHotel, callback]);
}