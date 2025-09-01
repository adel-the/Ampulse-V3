"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { roomsApi } from '@/lib/api/rooms';
import { establishmentsApi } from '@/lib/api/establishments';
import type { Room } from '@/lib/api/rooms';
import type { Establishment } from '@/lib/api/establishments';
import { useRoomCategories } from '@/hooks/useSupabase';
import { 
  Building2, 
  Bed, 
  Users, 
  Plus, 
  Edit, 
  Eye, 
  Settings,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Clock,
  Star,
  MapPin,
  Building,
  Euro,
  FileText,
  Wifi,
  Tv,
  Droplets,
  Car,
  Baby,
  Accessibility,
  Coffee,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Wrench
} from 'lucide-react';
import { getMaintenanceStatusInfo, getStatusIcon } from '@/lib/maintenanceStatusUtils';
import type { RoomMaintenanceStatus } from '@/types';

interface RoomDashboardProps {
  selectedHotel?: {
    id: number;
    nom: string;
    chambresTotal: number;
    chambresOccupees: number;
    tauxOccupation: number;
  } | null;
  onActionClick: (action: string) => void;
}

export default function RoomDashboard({ selectedHotel, onActionClick }: RoomDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const { categories: roomCategories } = useRoomCategories();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les établissements
      const estResponse = await establishmentsApi.getEstablishments();
      if (estResponse.success && estResponse.data) {
        setEstablishments(estResponse.data);
        
        // Charger les chambres du premier établissement
        if (estResponse.data.length > 0) {
          const roomsResponse = await roomsApi.getRoomsByHotel(estResponse.data[0].id);
          if (roomsResponse.success && roomsResponse.data) {
            setRooms(roomsResponse.data);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculer les statistiques réelles avec les nouveaux statuts de maintenance
  const roomStats = {
    totalRooms: rooms.length,
    occupiedRooms: rooms.filter(r => r.statut === 'occupee').length,
    availableRooms: rooms.filter(r => r.statut === 'disponible').length,
    maintenanceRooms: rooms.filter(r => r.statut === 'maintenance').length,
    maintenanceDisponibleRooms: rooms.filter(r => r.statut === 'maintenance_disponible').length,
    maintenanceOccupeeRooms: rooms.filter(r => r.statut === 'maintenance_occupee').length,
    maintenanceHorsUsageRooms: rooms.filter(r => r.statut === 'maintenance_hors_usage').length,
    allMaintenanceRooms: rooms.filter(r => r.statut.includes('maintenance')).length,
    cleaningRooms: 0, // Pas de statut "cleaning" dans notre schéma
    occupancyRate: rooms.length > 0 ? Math.round((rooms.filter(r => r.statut === 'occupee').length / rooms.length) * 100) : 0,
    averageRating: 4.6, // Valeur par défaut car pas de ratings dans le schéma
    revenuePerRoom: rooms.length > 0 ? Math.round(rooms.reduce((sum, r) => sum + Number(r.prix || 0), 0) / rooms.length) : 0
  };

  // Helper to get category name from category_id
  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId || !roomCategories) return 'Non défini';
    const category = roomCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Non défini';
  };

  // Calculer les catégories de chambres réelles
  const roomTypeStats = rooms.reduce((acc, room) => {
    const categoryName = getCategoryName(room.category_id);
    if (!acc[categoryName]) {
      acc[categoryName] = { total: 0, occupied: 0 };
    }
    acc[categoryName].total++;
    if (room.statut === 'occupee') {
      acc[categoryName].occupied++;
    }
    return acc;
  }, {} as Record<string, { total: number; occupied: number }>);

  const roomCategories = Object.entries(roomTypeStats).map(([type, stats], index) => ({
    name: type,
    count: stats.total,
    occupancy: stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0,
    color: ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'][index % 4]
  }));

  const roomCharacteristics = [
    { name: 'WiFi', count: 145, icon: Wifi, color: 'text-blue-600' },
    { name: 'TV', count: 150, icon: Tv, color: 'text-green-600' },
    { name: 'Salle de bain', count: 150, icon: Droplets, color: 'text-purple-600' },
    { name: 'Parking', count: 80, icon: Car, color: 'text-orange-600' },
    { name: 'Adaptée PMR', count: 15, icon: Accessibility, color: 'text-indigo-600' },
    { name: 'Lit bébé', count: 25, icon: Baby, color: 'text-pink-600' }
  ];

  // Top 5 chambres par prix
  const topPerformingRooms = rooms
    .sort((a, b) => Number(b.prix) - Number(a.prix))
    .slice(0, 5)
    .map(room => ({
      id: room.id,
      numero: room.numero,
      categoryName: getCategoryName(room.category_id),
      floor: room.floor ? `${room.floor}ème` : 'RDC',
      occupancy: room.statut === 'occupee' ? 100 : 0,
      revenue: Number(room.prix),
      rating: 4.5 + Math.random() * 0.5 // Rating simulé
    }));

  const renderBarChart = (data: any[]) => {
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-20 text-sm text-gray-600">{item.name}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${item.color}`}
                style={{ width: `${item.occupancy}%` }}
              ></div>
            </div>
            <div className="w-12 text-sm font-medium text-gray-900">{item.occupancy}%</div>
          </div>
        ))}
      </div>
    );
  };

  const renderPieChart = (data: { label: string; value: number; color: string }[]) => {
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
              <span className="text-sm text-gray-700">{item.label}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">


      {/* Graphiques et Statistiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupation par catégorie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Occupation par catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderBarChart(roomCategories)}
          </CardContent>
        </Card>

        {/* Répartition des chambres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-green-600" />
              Répartition des chambres
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderPieChart([
              { label: 'Occupées', value: roomStats.occupiedRooms, color: 'bg-blue-500' },
              { label: 'Disponibles', value: roomStats.availableRooms, color: 'bg-green-500' },
              { label: 'Maintenance standard', value: roomStats.maintenanceRooms, color: 'bg-orange-500' },
              { label: 'Maint. disponible', value: roomStats.maintenanceDisponibleRooms, color: 'bg-yellow-500' },
              { label: 'Maint. occupée', value: roomStats.maintenanceOccupeeRooms, color: 'bg-amber-500' },
              { label: 'Hors d\'usage', value: roomStats.maintenanceHorsUsageRooms, color: 'bg-red-500' },
              { label: 'Nettoyage', value: roomStats.cleaningRooms, color: 'bg-purple-500' }
            ].filter(item => item.value > 0)}
          </CardContent>
        </Card>
      </div>

      {/* Caractéristiques des chambres et Meilleures chambres */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Caractéristiques disponibles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2 text-purple-600" />
              Caractéristiques disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {roomCharacteristics.map((char, index) => {
                const Icon = char.icon;
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Icon className={`h-5 w-5 ${char.color}`} />
                    <div>
                      <div className="font-medium text-gray-900">{char.name}</div>
                      <div className="text-sm text-gray-500">{char.count} chambres</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Meilleures chambres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-600" />
              Meilleures chambres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformingRooms.map((room, index) => (
                <div key={room.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Chambre {room.numero}</div>
                      <div className="text-sm text-gray-500">{room.categoryName} - {room.floor}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{room.occupancy}% occupation</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Star className="h-3 w-3 mr-1 text-yellow-500" />
                      {room.rating}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statuts de maintenance détaillés */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wrench className="h-5 w-5 mr-2 text-orange-600" />
            États de maintenance détaillés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Maintenance disponible */}
            {roomStats.maintenanceDisponibleRooms > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-900">Maintenance légère</span>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {roomStats.maintenanceDisponibleRooms}
                  </Badge>
                </div>
                <p className="text-xs text-yellow-700">
                  Chambres en maintenance mais réservables
                </p>
              </div>
            )}

            {/* Maintenance occupée */}
            {roomStats.maintenanceOccupeeRooms > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-amber-600 mr-2" />
                    <span className="font-medium text-amber-900">Maintenance active</span>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800">
                    {roomStats.maintenanceOccupeeRooms}
                  </Badge>
                </div>
                <p className="text-xs text-amber-700">
                  Maintenance pendant l'occupation
                </p>
              </div>
            )}

            {/* Maintenance hors d'usage */}
            {roomStats.maintenanceHorsUsageRooms > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="font-medium text-red-900">Hors service</span>
                  </div>
                  <Badge className="bg-red-100 text-red-800">
                    {roomStats.maintenanceHorsUsageRooms}
                  </Badge>
                </div>
                <p className="text-xs text-red-700">
                  Indisponibles pour maintenance lourde
                </p>
              </div>
            )}

            {/* Résumé maintenance */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">Total maintenance</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {roomStats.allMaintenanceRooms}
                </Badge>
              </div>
              <p className="text-xs text-blue-700">
                {Math.round((roomStats.allMaintenanceRooms / (roomStats.totalRooms || 1)) * 100)}% des chambres
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métriques de performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-indigo-600" />
              Objectifs mensuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Taux d'occupation</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${roomStats.occupancyRate}%` }}></div>
                  </div>
                  <span className="text-sm font-medium">{roomStats.occupancyRate}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Satisfaction client</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="text-sm font-medium">92%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Chambres opérationnelles</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.round(((roomStats.totalRooms - roomStats.maintenanceHorsUsageRooms) / (roomStats.totalRooms || 1)) * 100)}%` }}></div>
                  </div>
                  <span className="text-sm font-medium">{Math.round(((roomStats.totalRooms - roomStats.maintenanceHorsUsageRooms) / (roomStats.totalRooms || 1)) * 100)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-600" />
              Statut en temps réel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Prêtes</span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {roomStats.availableRooms}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-gray-700">Nettoyage</span>
                </div>
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  {roomStats.cleaningRooms}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wrench className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-gray-700">Maintenance standard</span>
                </div>
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  {roomStats.maintenanceRooms}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-700">Maint. disponible</span>
                </div>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  {roomStats.maintenanceDisponibleRooms}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-gray-700">Maint. occupée</span>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-700">
                  {roomStats.maintenanceOccupeeRooms}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-700">Hors d'usage</span>
                </div>
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  {roomStats.maintenanceHorsUsageRooms}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{roomStats.averageRating}</div>
                <div className="text-sm text-gray-600">Note moyenne</div>
                <div className="flex justify-center mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-4 w-4 ${star <= Math.floor(roomStats.averageRating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
              </div>
              <div className="text-center pt-4 border-t">
                <div className="text-2xl font-bold text-blue-600">{roomStats.revenuePerRoom}€</div>
                <div className="text-sm text-gray-600">Revenu moyen/chambre</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
