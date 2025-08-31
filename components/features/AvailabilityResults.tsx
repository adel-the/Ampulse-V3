'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
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
  Hotel,
  Calendar,
  CreditCard,
  FileText,
  ArrowLeft,
  Search,
  X,
  Edit
} from 'lucide-react';
import { Room, RoomCategory, Hotel as HotelType, HotelEquipment, Client } from '@/lib/supabase';
import { AvailabilitySearchCriteria } from './AvailabilitySearchForm';
import { useNotifications } from '@/hooks/useNotifications';
import { clientsApi } from '@/lib/api/clients';
import { usagersApi, type UsagerWithPrescripteur } from '@/lib/api/usagers';
import { reservationsApi, type SimpleReservationInsert } from '@/lib/api/reservations';
import UsagerEditModal from '../modals/UsagerEditModal';
import QuickUsagerCreateModal from '../modals/QuickUsagerCreateModal';

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
  const { addNotification } = useNotifications();
  const [groupBy, setGroupBy] = useState<'category' | 'price' | 'hotel'>('category');
  const [selectedRoom, setSelectedRoom] = useState<AvailableRoom | null>(null);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [usagers, setUsagers] = useState<UsagerWithPrescripteur[]>([]);
  const [usagersLoading, setUsagersLoading] = useState(false);
  const [selectedUsagerId, setSelectedUsagerId] = useState<number | null>(null);
  const [usagerInputValue, setUsagerInputValue] = useState('');
  const [showUsagerSuggestions, setShowUsagerSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [reservationLoading, setReservationLoading] = useState(false);
  const [showEditUsagerModal, setShowEditUsagerModal] = useState(false);
  const [showCreateUsagerModal, setShowCreateUsagerModal] = useState(false);
  
  // New state for prescripteur selection
  const [selectedPrescripteur, setSelectedPrescripteur] = useState<Client | null>(null);
  const [prescripteurInputValue, setPrescripteurInputValue] = useState('');
  const [showPrescripteurSuggestions, setShowPrescripteurSuggestions] = useState(false);
  const [prescripteurHighlightedIndex, setPrescripteurHighlightedIndex] = useState(-1);
  
  const usagerInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const prescripteurInputRef = useRef<HTMLInputElement>(null);
  const prescripteurSuggestionsRef = useRef<HTMLDivElement>(null);

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

  // Load clients and usagers when a room is selected
  useEffect(() => {
    if (showRoomDetails && selectedRoom) {
      loadClients();
      loadUsagers();
    }
  }, [showRoomDetails, selectedRoom]);

  // Reload usagers when prescripteur is selected
  useEffect(() => {
    if (selectedPrescripteur) {
      loadUsagers();
    }
  }, [selectedPrescripteur]);

  const loadClients = async () => {
    try {
      const response = await clientsApi.getClients();
      if (response.success && response.data) {
        const activeClients = response.data.filter(client => client.statut === 'actif');
        setClients(activeClients);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadUsagers = async () => {
    setUsagersLoading(true);
    try {
      const response = await usagersApi.searchUsagers();
      if (response.success && response.data) {
        const activeUsagers = response.data.filter(usager => usager.statut === 'actif');
        setUsagers(activeUsagers);
      } else {
        addNotification('error', 'Erreur lors du chargement des usagers');
      }
    } catch (error) {
      console.error('Error loading usagers:', error);
      addNotification('error', 'Erreur lors du chargement des usagers');
    } finally {
      setUsagersLoading(false);
    }
  };

  // Filter prescripteurs based on search
  const getFilteredPrescripteurs = useCallback(() => {
    return clients.filter(client => {
      if (prescripteurInputValue) {
        const searchLower = prescripteurInputValue.toLowerCase();
        const nom = (client.nom || '').toLowerCase();
        const prenom = (client.prenom || '').toLowerCase();
        const raisonSociale = (client.raison_sociale || '').toLowerCase();
        const email = (client.email || '').toLowerCase();
        
        return nom.includes(searchLower) ||
               prenom.includes(searchLower) ||
               raisonSociale.includes(searchLower) ||
               email.includes(searchLower);
      }
      return true;
    });
  }, [clients, prescripteurInputValue]);

  // Filter usagers based on prescripteur only (for validation)
  const getUsagersForPrescripteur = useCallback(() => {
    return usagers.filter(usager => {
      // Filter by selected specific prescripteur (Step 2)
      if (selectedPrescripteur && usager.prescripteur?.id !== selectedPrescripteur.id) {
        return false;
      }
      
      return true;
    });
  }, [usagers, selectedPrescripteur]);

  // Filter usagers based on selected prescripteur and search (for autocomplete)
  const getFilteredUsagers = useCallback(() => {
    return usagers.filter(usager => {
      // Filter by selected specific prescripteur (Step 2)
      if (selectedPrescripteur && usager.prescripteur?.id !== selectedPrescripteur.id) {
        return false;
      }
      
      // Filter by search term (from input)
      if (usagerInputValue) {
        const searchLower = usagerInputValue.toLowerCase();
        const fullName = `${usager.nom} ${usager.prenom || ''}`.toLowerCase();
        const email = (usager.email || '').toLowerCase();
        const phone = (usager.telephone || '').toLowerCase();
        const numero = (usager.numero_usager || '').toLowerCase();
        
        return fullName.includes(searchLower) ||
               email.includes(searchLower) ||
               phone.includes(searchLower) ||
               numero.includes(searchLower);
      }
      return true;
    });
  }, [usagers, selectedPrescripteur, usagerInputValue]);

  // Handle prescripteur selection from suggestions
  const handlePrescripteurSelect = (prescripteur: Client) => {
    setSelectedPrescripteur(prescripteur);
    const displayName = prescripteur.client_type === 'Particulier'
      ? `${prescripteur.nom} ${prescripteur.prenom || ''}`.trim()
      : prescripteur.raison_sociale || prescripteur.nom || 'Sans nom';
    setPrescripteurInputValue(displayName);
    setShowPrescripteurSuggestions(false);
    setPrescripteurHighlightedIndex(-1);
    
    // Reset usager selection when prescripteur changes
    setSelectedUsagerId(null);
    setUsagerInputValue('');
    setShowUsagerSuggestions(false);
    setHighlightedIndex(-1);
  };

  // Handle usager selection from suggestions
  const handleUsagerSelect = (usager: UsagerWithPrescripteur) => {
    setSelectedUsagerId(usager.id);
    const prescripteurName = usager.prescripteur?.client_type === 'Particulier' 
      ? `${usager.prescripteur.nom} ${usager.prescripteur.prenom || ''}`.trim()
      : usager.prescripteur?.raison_sociale || usager.prescripteur?.nom || 'Sans prescripteur';
    setUsagerInputValue(`${usager.nom} ${usager.prenom} - ${prescripteurName}`);
    setShowUsagerSuggestions(false);
    setHighlightedIndex(-1);
  };

  // Handle keyboard navigation for prescripteur
  const handlePrescripteurKeyDown = (e: React.KeyboardEvent) => {
    const filteredPrescripteurs = getFilteredPrescripteurs();
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPrescripteurHighlightedIndex(prev => 
        prev < filteredPrescripteurs.length - 1 ? prev + 1 : prev
      );
      setShowPrescripteurSuggestions(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPrescripteurHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (prescripteurHighlightedIndex >= 0 && prescripteurHighlightedIndex < filteredPrescripteurs.length) {
        handlePrescripteurSelect(filteredPrescripteurs[prescripteurHighlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowPrescripteurSuggestions(false);
      setPrescripteurHighlightedIndex(-1);
    }
  };

  // Handle keyboard navigation for usager
  const handleUsagerKeyDown = (e: React.KeyboardEvent) => {
    const filteredUsagers = getFilteredUsagers();
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredUsagers.length - 1 ? prev + 1 : prev
      );
      setShowUsagerSuggestions(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredUsagers.length) {
        handleUsagerSelect(filteredUsagers[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowUsagerSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close prescripteur suggestions
      if (prescripteurSuggestionsRef.current && !prescripteurSuggestionsRef.current.contains(event.target as Node) &&
          prescripteurInputRef.current && !prescripteurInputRef.current.contains(event.target as Node)) {
        setShowPrescripteurSuggestions(false);
      }
      
      // Close usager suggestions
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          usagerInputRef.current && !usagerInputRef.current.contains(event.target as Node)) {
        setShowUsagerSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle room selection
  const handleRoomSelect = (room: AvailableRoom) => {
    setSelectedRoom(room);
    setShowRoomDetails(true);
    onRoomSelect?.(room);
  };

  // Handle back to list
  const handleBackToList = () => {
    setShowRoomDetails(false);
    setSelectedRoom(null);
    setSelectedUsagerId(null);
    setUsagerInputValue('');
    setShowUsagerSuggestions(false);
    setHighlightedIndex(-1);
    
    // Reset prescripteur selection state
    setSelectedPrescripteur(null);
    setPrescripteurInputValue('');
    setShowPrescripteurSuggestions(false);
    setPrescripteurHighlightedIndex(-1);
    
    setSpecialRequests('');
  };

  // Handle reservation creation
  const handleCreateReservation = async () => {
    if (!selectedUsagerId || !selectedRoom) {
      addNotification('error', 'Veuillez sélectionner un usager');
      return;
    }

    setReservationLoading(true);
    try {
      const reservationData: SimpleReservationInsert = {
        hotel_id: selectedRoom.hotel_id,
        chambre_id: selectedRoom.id,
        usager_id: selectedUsagerId,
        date_arrivee: criteria.checkInDate,
        date_depart: criteria.checkOutDate,
        adults_count: criteria.adults,
        children_count: criteria.children,
        room_rate: selectedRoom.prix,
        total_amount: selectedRoom.prix * nights,
        special_requests: specialRequests.trim() || undefined,
        statut: 'confirmed'
      };

      const response = await reservationsApi.createReservation(reservationData);

      if (response.success && response.data) {
        addNotification('success', `Réservation ${response.data.reservation_number} créée avec succès`);
        onReservationCreated?.();
        handleBackToList();
      } else {
        addNotification('error', response.error || 'Erreur lors de la création de la réservation');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      addNotification('error', 'Erreur lors de la création de la réservation');
    } finally {
      setReservationLoading(false);
    }
  };

  // Handle usager update success
  const handleUsagerUpdateSuccess = async () => {
    // Reload usagers to get updated data
    await loadUsagers();
    
    // Ensure the selected usager is still valid after reload
    if (selectedUsagerId) {
      // The usager list has been reloaded, selectedUsager will be updated automatically
      // through the derived state on next render
    }
    
    setShowEditUsagerModal(false);
    addNotification('success', 'Usager mis à jour avec succès');
  };

  // Handle new usager creation from quick modal
  const handleUsagerCreated = async (usagerId: number) => {
    setShowCreateUsagerModal(false);
    
    // Reload usagers list
    await loadUsagers();
    
    // Find and select the newly created usager
    const response = await usagersApi.getUsagerWithPrescripteur(usagerId);
    if (response.success && response.data) {
      const newUsager = response.data;
      handleUsagerSelect(newUsager);
      
      // Show success notification
      addNotification('success', `Usager ${newUsager.nom} ${newUsager.prenom} créé avec succès`);
    }
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

  // Show room details view if a room is selected
  if (showRoomDetails && selectedRoom) {
    const checkInDate = new Date(criteria.checkInDate);
    const checkOutDate = new Date(criteria.checkOutDate);
    const roomRate = selectedRoom.prix;
    const totalAmount = roomRate * nights;
    const selectedUsager = selectedUsagerId ? usagers.find(u => u.id === selectedUsagerId) : null;

    return (
      <>
        <div className={`w-full space-y-6 ${className}`}>
          {/* Back button */}
          <Button
            variant="outline"
            onClick={handleBackToList}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la liste
          </Button>

        {/* Compact Room & Reservation Details */}
        <Card className="p-3">
          <div className="flex justify-between items-center mb-1.5">
            <h3 className="text-base font-semibold flex items-center gap-1.5">
              <Hotel className="h-4 w-4 text-blue-600" />
              Chambre {selectedRoom.numero} - {selectedRoom.hotel?.nom}
            </h3>
            <div className="text-right">
              <span className="text-lg font-bold text-blue-600">{totalAmount}€</span>
              <span className="text-xs text-gray-500 ml-1">({roomRate}€×{nights}n)</span>
            </div>
          </div>
          
          {/* Ultra Compact Info - Single Line */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mb-1.5">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <strong>Arrivée:</strong> {checkInDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <strong>Départ:</strong> {checkOutDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <strong>Voyageurs:</strong> {criteria.adults + criteria.children}
            </span>
            <span className="flex items-center gap-1">
              <Bed className="h-3 w-3" />
              <strong>Lit:</strong> {selectedRoom.bed_type || 'Standard'}
            </span>
          </div>

          {/* Equipment - Ultra Compact */}
          {selectedRoom.equipmentDetails && selectedRoom.equipmentDetails.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedRoom.equipmentDetails.slice(0, 6).map((equipment) => (
                <span
                  key={equipment.id}
                  className="inline-flex items-center gap-0.5 bg-gray-100 rounded px-1.5 py-0.5 text-xs"
                >
                  {getEquipmentIcon('general')}
                  {`Équipement ${equipment.equipment_id}`}
                </span>
              ))}
              {selectedRoom.equipmentDetails.length > 6 && (
                <span className="bg-gray-100 rounded px-1.5 py-0.5 text-xs">
                  +{selectedRoom.equipmentDetails.length - 6}
                </span>
              )}
            </div>
          )}
        </Card>

        {/* Steps 1 & 2: Prescripteur and Usager Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Step 1: Prescripteur Selection */}
          <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Étape 1: Prescripteur
            </CardTitle>
            <p className="text-xs text-gray-600">
              Association ou entreprise qui prescrit
            </p>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucun prescripteur trouvé. Veuillez d'abord créer un client prescripteur.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {/* Prescripteur autocomplete */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="prescripteur-input" className="text-sm font-medium">Prescripteur *</Label>
                    <span className="text-xs text-gray-500">
                      {getFilteredPrescripteurs().length} trouvé{getFilteredPrescripteurs().length > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* Prescripteur Input */}
                  <div className="relative">
                    <input
                      ref={prescripteurInputRef}
                      id="prescripteur-input"
                      type="text"
                      placeholder="Tapez pour rechercher un prescripteur..."
                      value={prescripteurInputValue}
                      onChange={(e) => {
                        setPrescripteurInputValue(e.target.value);
                        setSelectedPrescripteur(null);
                        setShowPrescripteurSuggestions(true);
                        setPrescripteurHighlightedIndex(-1);
                      }}
                      onFocus={() => setShowPrescripteurSuggestions(true)}
                      onKeyDown={handlePrescripteurKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={!selectedPrescripteur}
                    />
                    
                    {/* Clear button */}
                    {prescripteurInputValue && (
                      <button
                        type="button"
                        onClick={() => {
                          setPrescripteurInputValue('');
                          setSelectedPrescripteur(null);
                          setShowPrescripteurSuggestions(false);
                          prescripteurInputRef.current?.focus();
                          
                          // Reset usager selection
                          setSelectedUsagerId(null);
                          setUsagerInputValue('');
                          setShowUsagerSuggestions(false);
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Prescripteur Dropdown Suggestions */}
                  {showPrescripteurSuggestions && getFilteredPrescripteurs().length > 0 && (
                    <div
                      ref={prescripteurSuggestionsRef}
                      className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white border border-gray-300 rounded-md shadow-lg"
                    >
                      {getFilteredPrescripteurs().map((prescripteur, index) => {
                        const displayName = prescripteur.client_type === 'Particulier'
                          ? `${prescripteur.nom} ${prescripteur.prenom || ''}`.trim()
                          : prescripteur.raison_sociale || prescripteur.nom || 'Sans nom';
                        
                        return (
                          <div
                            key={prescripteur.id}
                            onClick={() => handlePrescripteurSelect(prescripteur)}
                            onMouseEnter={() => setPrescripteurHighlightedIndex(index)}
                            className={`px-3 py-2 cursor-pointer ${
                              index === prescripteurHighlightedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                            } ${selectedPrescripteur?.id === prescripteur.id ? 'bg-blue-50' : ''}`}
                          >
                            <div className="font-medium">
                              {displayName}
                            </div>
                            <div className="text-xs text-gray-600">
                              [{prescripteur.client_type}]
                              {prescripteur.email && ` • ${prescripteur.email}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* No prescripteur results message */}
                  {showPrescripteurSuggestions && prescripteurInputValue && getFilteredPrescripteurs().length === 0 && (
                    <div className="absolute z-10 w-full mt-1 p-3 bg-white border border-gray-300 rounded-md shadow-lg">
                      <p className="text-sm text-gray-500">Aucun prescripteur trouvé</p>
                    </div>
                  )}
                </div>

                {/* Selected Prescripteur Info */}
                {selectedPrescripteur && (
                  <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                    <div className="flex items-center gap-1 mb-1">
                      <Check className="h-3 w-3 text-green-600" />
                      <h4 className="text-sm font-medium text-green-900">Prescripteur sélectionné</h4>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex gap-4">
                        <div>
                          <span className="text-green-700">Nom:</span>
                          <span className="ml-1 text-green-900 font-medium">
                            {selectedPrescripteur.client_type === 'Particulier'
                              ? `${selectedPrescripteur.nom} ${selectedPrescripteur.prenom || ''}`.trim()
                              : selectedPrescripteur.raison_sociale || selectedPrescripteur.nom}
                          </span>
                        </div>
                        <div>
                          <span className="text-green-700">Type:</span>
                          <span className="ml-1 text-green-900">{selectedPrescripteur.client_type}</span>
                        </div>
                      </div>
                      {(selectedPrescripteur.email || selectedPrescripteur.telephone) && (
                        <div className="flex gap-4">
                          {selectedPrescripteur.email && (
                            <div>
                              <span className="text-green-700">Email:</span>
                              <span className="ml-1 text-green-900">{selectedPrescripteur.email}</span>
                            </div>
                          )}
                          {selectedPrescripteur.telephone && (
                            <div>
                              <span className="text-green-700">Tél:</span>
                              <span className="ml-1 text-green-900">{selectedPrescripteur.telephone}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                
              </div>
            )}
          </CardContent>
          </Card>

          {/* Step 2: Usager Selection */}
          <Card className={!selectedPrescripteur ? 'opacity-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Étape 2: Usager (bénéficiaire)
            </CardTitle>
            <p className="text-xs text-gray-600">
              {selectedPrescripteur 
                ? `Lié à ${selectedPrescripteur.client_type === 'Particulier' 
                    ? `${selectedPrescripteur.nom} ${selectedPrescripteur.prenom || ''}`.trim()
                    : selectedPrescripteur.raison_sociale || selectedPrescripteur.nom}`
                : 'Sélectionnez d\'abord un prescripteur'
              }
            </p>
          </CardHeader>
          <CardContent>
            {!selectedPrescripteur ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Veuillez d'abord sélectionner un prescripteur à l'étape 1.
                </AlertDescription>
              </Alert>
            ) : usagersLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Chargement des usagers...</p>
              </div>
            ) : getUsagersForPrescripteur().length === 0 ? (
              <div className="space-y-3">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {selectedPrescripteur 
                      ? 'Aucun usager actif trouvé pour ce prescripteur.'
                      : 'Aucun usager actif trouvé.'
                    }
                  </AlertDescription>
                </Alert>
                {selectedPrescripteur && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowCreateUsagerModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Créer un nouvel usager
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">

                {/* Usager selection with autocomplete */}
                <div className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="usager-input" className="text-sm font-medium">Usager *</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {usagerInputValue ? (
                          `${getFilteredUsagers().length}/${getUsagersForPrescripteur().length} trouvé${getFilteredUsagers().length > 1 ? 's' : ''}`
                        ) : (
                          `${getUsagersForPrescripteur().length} disponible${getUsagersForPrescripteur().length > 1 ? 's' : ''}`
                        )}
                      </span>
                      {selectedPrescripteur && (
                        <button
                          type="button"
                          onClick={() => setShowCreateUsagerModal(true)}
                          className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <Users className="h-3 w-3" />
                          Créer
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Autocomplete Input */}
                  <div className="relative">
                    <input
                      ref={usagerInputRef}
                      id="usager-input"
                      type="text"
                      placeholder="Tapez pour rechercher un usager..."
                      value={usagerInputValue}
                      onChange={(e) => {
                        setUsagerInputValue(e.target.value);
                        setSelectedUsagerId(null);
                        setShowUsagerSuggestions(true);
                        setHighlightedIndex(-1);
                      }}
                      onFocus={() => setShowUsagerSuggestions(true)}
                      onKeyDown={handleUsagerKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={!selectedUsagerId}
                      disabled={!selectedPrescripteur}
                    />
                    
                    {/* Clear button */}
                    {usagerInputValue && (
                      <button
                        type="button"
                        onClick={() => {
                          setUsagerInputValue('');
                          setSelectedUsagerId(null);
                          setShowUsagerSuggestions(false);
                          usagerInputRef.current?.focus();
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Suggestions */}
                  {showUsagerSuggestions && getFilteredUsagers().length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white border border-gray-300 rounded-md shadow-lg"
                    >
                      {getFilteredUsagers().map((usager, index) => {
                        const prescripteurName = usager.prescripteur?.client_type === 'Particulier' 
                          ? `${usager.prescripteur.nom} ${usager.prescripteur.prenom || ''}`.trim()
                          : usager.prescripteur?.raison_sociale || usager.prescripteur?.nom || 'Sans prescripteur';
                        
                        return (
                          <div
                            key={usager.id}
                            onClick={() => handleUsagerSelect(usager)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`px-3 py-2 cursor-pointer ${
                              index === highlightedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                            } ${selectedUsagerId === usager.id ? 'bg-blue-50' : ''}`}
                          >
                            <div className="font-medium">
                              {usager.nom} {usager.prenom}
                            </div>
                            <div className="text-xs text-gray-600">
                              [{usager.prescripteur?.client_type?.substring(0, 3).toUpperCase() || 'N/A'}] {prescripteurName}
                              {usager.telephone && ` • ${usager.telephone}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* No results message */}
                  {showUsagerSuggestions && usagerInputValue && getFilteredUsagers().length === 0 && (
                    <div className="absolute z-10 w-full mt-1 p-3 bg-white border border-gray-300 rounded-md shadow-lg">
                      <p className="text-sm text-gray-500">Aucun usager trouvé</p>
                    </div>
                  )}
                </div>

                {/* Selected Usager Info */}
                {selectedUsager && (
                  <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-blue-600" />
                        <h4 className="text-sm font-medium text-blue-900">Usager sélectionné</h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEditUsagerModal(true)}
                        className="flex items-center gap-1 text-xs h-6 px-2"
                      >
                        <Edit className="h-3 w-3" />
                        Modifier
                      </Button>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex gap-4">
                        <div>
                          <span className="text-blue-700">Nom:</span>
                          <span className="ml-1 text-blue-900 font-medium">{selectedUsager.nom} {selectedUsager.prenom}</span>
                        </div>
                        {selectedUsager.autonomie_level && (
                          <div>
                            <span className="text-blue-700">Autonomie:</span>
                            <span className="ml-1 text-blue-900">{selectedUsager.autonomie_level}</span>
                          </div>
                        )}
                      </div>
                      {(selectedUsager.email || selectedUsager.telephone) && (
                        <div className="flex gap-4">
                          {selectedUsager.email && (
                            <div className="text-ellipsis overflow-hidden whitespace-nowrap">
                              <span className="text-blue-700">Email:</span>
                              <span className="ml-1 text-blue-900">{selectedUsager.email}</span>
                            </div>
                          )}
                          {selectedUsager.telephone && (
                            <div>
                              <span className="text-blue-700">Tél:</span>
                              <span className="ml-1 text-blue-900">{selectedUsager.telephone}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {selectedUsager.prescripteur && (
                        <div>
                          <span className="text-blue-700">Prescripteur:</span>
                          <span className="ml-1 text-blue-900">
                            [{selectedUsager.prescripteur?.client_type?.substring(0, 3).toUpperCase() || 'N/A'}]
                            {selectedUsager.prescripteur?.client_type === 'Particulier' 
                              ? ` ${selectedUsager.prescripteur?.nom || ''} ${selectedUsager.prescripteur?.prenom || ''}`.trim()
                              : ` ${selectedUsager.prescripteur?.raison_sociale || selectedUsager.prescripteur?.nom || 'Sans prescripteur'}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          </Card>
        </div>

        {/* Special Requests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              Demandes spéciales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Demandes particulières du client (facultatif)..."
              rows={3}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={handleBackToList}>
            Annuler
          </Button>
          <Button
            onClick={handleCreateReservation}
            disabled={reservationLoading || !selectedUsagerId || usagers.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {reservationLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Création...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmer la réservation
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Usager Edit Modal */}
      {selectedUsager && (
        <UsagerEditModal
          isOpen={showEditUsagerModal}
          onClose={() => setShowEditUsagerModal(false)}
          usager={selectedUsager}
          onSuccess={handleUsagerUpdateSuccess}
        />
      )}
      
      {/* Quick Usager Create Modal */}
      {selectedPrescripteur && (
        <QuickUsagerCreateModal
          isOpen={showCreateUsagerModal}
          onClose={() => setShowCreateUsagerModal(false)}
          prescripteur={selectedPrescripteur}
          onUsagerCreated={handleUsagerCreated}
        />
      )}
      </>
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
                            {getEquipmentIcon('general')}
                            <span>Équipement {equipment.equipment_id}</span>
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

    </div>
  );
}
