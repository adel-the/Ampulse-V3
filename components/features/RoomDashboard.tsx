"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
  TrendingUp
} from 'lucide-react';

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

  // Données synthétiques pour le tableau de bord
  const roomStats = {
    totalRooms: selectedHotel?.chambresTotal || 150,
    occupiedRooms: selectedHotel?.chambresOccupees || 120,
    availableRooms: (selectedHotel?.chambresTotal || 150) - (selectedHotel?.chambresOccupees || 120),
    maintenanceRooms: 8,
    cleaningRooms: 12,
    occupancyRate: selectedHotel?.tauxOccupation || 80,
    averageRating: 4.6,
    revenuePerRoom: 85.50
  };

  const roomCategories = [
    { name: 'Simple', count: 45, occupancy: 92, color: 'bg-blue-500' },
    { name: 'Double', count: 60, occupancy: 88, color: 'bg-green-500' },
    { name: 'Triple', count: 25, occupancy: 76, color: 'bg-purple-500' },
    { name: 'Suite', count: 20, occupancy: 95, color: 'bg-orange-500' }
  ];

  const roomCharacteristics = [
    { name: 'WiFi', count: 145, icon: Wifi, color: 'text-blue-600' },
    { name: 'TV', count: 150, icon: Tv, color: 'text-green-600' },
    { name: 'Salle de bain', count: 150, icon: Droplets, color: 'text-purple-600' },
    { name: 'Parking', count: 80, icon: Car, color: 'text-orange-600' },
    { name: 'Adaptée PMR', count: 15, icon: Accessibility, color: 'text-indigo-600' },
    { name: 'Lit bébé', count: 25, icon: Baby, color: 'text-pink-600' }
  ];

  const topPerformingRooms = [
    { id: 101, type: 'Suite', floor: '1er', occupancy: 98, revenue: 1200, rating: 4.9 },
    { id: 205, type: 'Double', floor: '2ème', occupancy: 95, revenue: 850, rating: 4.8 },
    { id: 312, type: 'Triple', floor: '3ème', occupancy: 92, revenue: 1100, rating: 4.7 },
    { id: 408, type: 'Simple', floor: '4ème', occupancy: 89, revenue: 650, rating: 4.6 },
    { id: 501, type: 'Suite', floor: '5ème', occupancy: 87, revenue: 1150, rating: 4.8 }
  ];

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
              { label: 'Occupées', value: roomStats.occupiedRooms, color: 'bg-green-500' },
              { label: 'Disponibles', value: roomStats.availableRooms, color: 'bg-blue-500' },
              { label: 'Maintenance', value: roomStats.maintenanceRooms, color: 'bg-orange-500' },
              { label: 'Nettoyage', value: roomStats.cleaningRooms, color: 'bg-purple-500' }
            ])}
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
                      <div className="font-medium text-gray-900">Chambre {room.id}</div>
                      <div className="text-sm text-gray-500">{room.type} - {room.floor} étage</div>
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
                <span className="text-sm text-gray-600">Maintenance</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                  </div>
                  <span className="text-sm font-medium">96%</span>
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
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-700">Maintenance</span>
                </div>
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  {roomStats.maintenanceRooms}
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
