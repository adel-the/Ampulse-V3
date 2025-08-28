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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />
          Recherche de disponibilité
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkIn" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date d'arrivée
              </Label>
              <Input
                id="checkIn"
                type="date"
                value={criteria.checkInDate}
                min={today}
                onChange={(e) => handleInputChange('checkInDate', e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOut" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date de départ
              </Label>
              <Input
                id="checkOut"
                type="date"
                value={criteria.checkOutDate}
                min={minCheckOut}
                onChange={(e) => handleInputChange('checkOutDate', e.target.value)}
                className="w-full"
                required
              />
            </div>
          </div>

          {/* Guests Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adults" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Adultes
              </Label>
              <Input
                id="adults"
                type="number"
                min="1"
                max="10"
                value={criteria.adults}
                onChange={(e) => handleInputChange('adults', parseInt(e.target.value) || 1)}
                className="w-full"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="children" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Enfants
              </Label>
              <Input
                id="children"
                type="number"
                min="0"
                max="10"
                value={criteria.children}
                onChange={(e) => handleInputChange('children', parseInt(e.target.value) || 0)}
                className="w-full"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hotel Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Hotel className="h-4 w-4" />
                Établissement
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    type="button"
                  >
                    {selectedHotel ? selectedHotel.nom : 'Tous les établissements'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
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

            {/* Category Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Catégorie
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    type="button"
                  >
                    {selectedCategory ? selectedCategory.name : 'Toutes catégories'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              disabled={!canSearch || isLoading}
              className="flex-1 flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {isLoading ? 'Recherche...' : 'Rechercher'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Effacer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}