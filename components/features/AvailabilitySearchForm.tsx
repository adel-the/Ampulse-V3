'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Search, X, ChevronDown, Calendar, Users, Hotel, Filter } from 'lucide-react';
import { Hotel as HotelType, RoomCategory } from '@/lib/supabase';

export interface AvailabilitySearchCriteria {
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  hotelId: number | null;
  categoryId: number | null;
}

interface AvailabilitySearchFormProps {
  hotels: HotelType[];
  categories: RoomCategory[];
  onSearch: (criteria: AvailabilitySearchCriteria) => void;
  isLoading?: boolean;
  className?: string;
  selectedHotelId?: number | null;
}

export default function AvailabilitySearchForm({
  hotels,
  categories,
  onSearch,
  isLoading = false,
  className = '',
  selectedHotelId = null
}: AvailabilitySearchFormProps) {
  const [criteria, setCriteria] = useState<AvailabilitySearchCriteria>({
    checkInDate: '',
    checkOutDate: '',
    adults: 1,
    children: 0,
    hotelId: null,
    categoryId: null
  });

  const [selectedHotel, setSelectedHotel] = useState<HotelType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<RoomCategory | null>(null);

  // Set default hotel when selectedHotelId prop is provided or changes
  useEffect(() => {
    if (selectedHotelId && hotels.length > 0) {
      const defaultHotel = hotels.find(hotel => hotel.id === selectedHotelId);
      if (defaultHotel && (!selectedHotel || selectedHotel.id !== selectedHotelId)) {
        setSelectedHotel(defaultHotel);
        setCriteria(prev => ({ ...prev, hotelId: defaultHotel.id }));
      }
    }
  }, [selectedHotelId, hotels, selectedHotel]);

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Get minimum checkout date (day after check-in)
  const minCheckOut = criteria.checkInDate 
    ? new Date(new Date(criteria.checkInDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : today;

  const handleInputChange = (field: keyof AvailabilitySearchCriteria, value: string | number) => {
    setCriteria(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleHotelSelect = (hotel: HotelType | null) => {
    setSelectedHotel(hotel);
    setCriteria(prev => ({
      ...prev,
      hotelId: hotel?.id || null
    }));
  };

  const handleCategorySelect = (category: RoomCategory | null) => {
    setSelectedCategory(category);
    setCriteria(prev => ({
      ...prev,
      categoryId: category?.id || null
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!criteria.checkInDate || !criteria.checkOutDate) {
      return;
    }
    onSearch(criteria);
  };

  const handleClearFilters = () => {
    setCriteria({
      checkInDate: '',
      checkOutDate: '',
      adults: 1,
      children: 0,
      hotelId: null,
      categoryId: null
    });
    setSelectedHotel(null);
    setSelectedCategory(null);
  };

  const canSearch = criteria.checkInDate && criteria.checkOutDate;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="h-4 w-4 text-blue-600" />
          Recherche de disponibilité
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Compact grid layout for all fields */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Date d'arrivée */}
            <div className="col-span-1">
              <Label htmlFor="checkIn" className="text-xs text-gray-600 mb-1 block">
                Arrivée
              </Label>
              <Input
                id="checkIn"
                type="date"
                value={criteria.checkInDate}
                min={today}
                onChange={(e) => handleInputChange('checkInDate', e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
            
            {/* Date de départ */}
            <div className="col-span-1">
              <Label htmlFor="checkOut" className="text-xs text-gray-600 mb-1 block">
                Départ
              </Label>
              <Input
                id="checkOut"
                type="date"
                value={criteria.checkOutDate}
                min={minCheckOut}
                onChange={(e) => handleInputChange('checkOutDate', e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
            
            {/* Adultes */}
            <div className="col-span-1">
              <Label htmlFor="adults" className="text-xs text-gray-600 mb-1 block">
                Adultes
              </Label>
              <Input
                id="adults"
                type="number"
                min="1"
                max="10"
                value={criteria.adults}
                onChange={(e) => handleInputChange('adults', parseInt(e.target.value) || 1)}
                className="h-9 text-sm"
                required
              />
            </div>
            
            {/* Enfants */}
            <div className="col-span-1">
              <Label htmlFor="children" className="text-xs text-gray-600 mb-1 block">
                Enfants
              </Label>
              <Input
                id="children"
                type="number"
                min="0"
                max="10"
                value={criteria.children}
                onChange={(e) => handleInputChange('children', parseInt(e.target.value) || 0)}
                className="h-9 text-sm"
              />
            </div>
            
            {/* Établissement */}
            <div className="col-span-2 md:col-span-2 lg:col-span-1">
              <Label className="text-xs text-gray-600 mb-1 block">
                Établissement
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-9 justify-between text-sm px-2"
                    type="button"
                  >
                    <span className="truncate">
                      {selectedHotel ? selectedHotel.nom : 'Tous'}
                    </span>
                    <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem onClick={() => handleHotelSelect(null)}>
                    Tous les établissements
                  </DropdownMenuItem>
                  {hotels.map((hotel) => (
                    <DropdownMenuItem
                      key={hotel.id}
                      onClick={() => handleHotelSelect(hotel)}
                    >
                      {hotel.nom}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Catégorie */}
            <div className="col-span-2 md:col-span-2 lg:col-span-1">
              <Label className="text-xs text-gray-600 mb-1 block">
                Catégorie
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-9 justify-between text-sm px-2"
                    type="button"
                  >
                    <span className="truncate">
                      {selectedCategory ? selectedCategory.name : 'Toutes'}
                    </span>
                    <ChevronDown className="h-3 w-3 ml-1 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                  <DropdownMenuItem onClick={() => handleCategorySelect(null)}>
                    Toutes catégories
                  </DropdownMenuItem>
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                    >
                      {category.name} ({category.capacity} pers. - {category.surface}m²)
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Action Buttons - More compact */}
          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              disabled={!canSearch || isLoading}
              className="h-9 px-4 text-sm"
              size="sm"
            >
              <Search className="h-3.5 w-3.5 mr-1.5" />
              {isLoading ? 'Recherche...' : 'Rechercher'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilters}
              className="h-9 px-3 text-sm"
              size="sm"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Effacer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}