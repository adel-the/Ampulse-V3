import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  Users,
  Calendar,
  Building2,
  Settings
} from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedRole: string;
  onRoleChange: (role: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedHotel: string;
  onHotelChange: (hotel: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  roles: FilterOption[];
  hotels: FilterOption[];
  totalUsers: number;
  filteredUsers: number;
  onClearFilters: () => void;
}

export default function UserFilters({
  searchQuery,
  onSearchChange,
  selectedRole,
  onRoleChange,
  selectedStatus,
  onStatusChange,
  selectedHotel,
  onHotelChange,
  dateRange,
  onDateRangeChange,
  roles,
  hotels,
  totalUsers,
  filteredUsers,
  onClearFilters
}: UserFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedRole) count++;
    if (selectedStatus) count++;
    if (selectedHotel) count++;
    if (dateRange.start || dateRange.end) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-white border-b border-gray-200 p-6">
      {/* Barre de recherche principale */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Rechercher par nom, email, téléphone..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown 
              className={`h-4 w-4 transition-transform ${
                showAdvancedFilters ? 'rotate-180' : ''
              }`} 
            />
          </Button>
          
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Effacer
            </Button>
          )}
        </div>
      </div>

      {/* Filtres avancés */}
      {showAdvancedFilters && (
        <div className="border-t border-gray-100 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtre par rôle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="h-4 w-4 inline mr-1" />
                Rôle
              </label>
              <select
                value={selectedRole}
                onChange={(e) => onRoleChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les rôles</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label} {role.count && `(${role.count})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Settings className="h-4 w-4 inline mr-1" />
                Statut
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>

            {/* Filtre par établissement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building2 className="h-4 w-4 inline mr-1" />
                Établissement
              </label>
              <select
                value={selectedHotel}
                onChange={(e) => onHotelChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les établissements</option>
                {hotels.map((hotel) => (
                  <option key={hotel.value} value={hotel.value}>
                    {hotel.label} {hotel.count && `(${hotel.count})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date de création
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                  className="p-2 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                  className="p-2 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Résumé des résultats */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          {filteredUsers === totalUsers ? (
            <span>
              <strong>{totalUsers}</strong> utilisateur{totalUsers > 1 ? 's' : ''}
            </span>
          ) : (
            <span>
              <strong>{filteredUsers}</strong> sur <strong>{totalUsers}</strong> utilisateur{totalUsers > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Filtres actifs */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Filtres actifs :</span>
            <div className="flex flex-wrap gap-1">
              {selectedRole && (
                <Badge variant="outline" className="text-xs">
                  Rôle: {roles.find(r => r.value === selectedRole)?.label}
                </Badge>
              )}
              {selectedStatus && (
                <Badge variant="outline" className="text-xs">
                  Statut: {selectedStatus}
                </Badge>
              )}
              {selectedHotel && (
                <Badge variant="outline" className="text-xs">
                  Hôtel: {hotels.find(h => h.value === selectedHotel)?.label}
                </Badge>
              )}
              {(dateRange.start || dateRange.end) && (
                <Badge variant="outline" className="text-xs">
                  Période: {dateRange.start || '...'} - {dateRange.end || '...'}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 