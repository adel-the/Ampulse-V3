"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Users, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Bed,
  Euro,
  Star
} from 'lucide-react';
import { Hotel, Room } from '../../types';
import { useRoomCategories } from '@/hooks/useSupabase';
import type { RoomCategory } from '@/lib/supabase';



interface HotelDetailProps {
  hotel: Hotel;
  onBack: () => void;
  onEditHotel: (hotel: Hotel) => void;
}

export default function HotelDetail({ hotel, onBack, onEditHotel }: HotelDetailProps) {
  const { categories: roomCategories } = useRoomCategories();
  
  // Helper to get category name from category_id
  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId || !roomCategories) return 'Non défini';
    const category = roomCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Non défini';
  };
  
  const [rooms, setRooms] = useState<Room[]>([
    { id: 1, numero: "101", type: "Simple", prix: 45, statut: "disponible", description: "Chambre simple avec salle de bain", hotelId: hotel.id, capacite: 1, accessibilite: false, dureeMaintenance: 0 },
    { id: 2, numero: "102", type: "Double", prix: 65, statut: "occupee", description: "Chambre double avec salle de bain", hotelId: hotel.id, capacite: 2, accessibilite: false, dureeMaintenance: 0 },
    { id: 3, numero: "103", type: "Familiale", prix: 85, statut: "disponible", description: "Chambre familiale avec 2 lits", hotelId: hotel.id, capacite: 4, accessibilite: true, dureeMaintenance: 0 },
    { id: 4, numero: "201", type: "Simple", prix: 45, statut: "maintenance", description: "Chambre simple avec salle de bain", hotelId: hotel.id, capacite: 1, accessibilite: false, dureeMaintenance: 2 },
  ]);

  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    numero: '',
    category_id: null as number | null,
    prix: '',
    description: ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponible': return 'bg-green-100 text-green-800';
      case 'occupee': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponible': return 'Disponible';
      case 'occupee': return 'Occupée';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.category_id) {
      // Handle case where no category is selected
      return;
    }
    
    const room: Room = {
      id: Date.now(),
      numero: newRoom.numero,
      type: getCategoryName(newRoom.category_id),
      prix: parseInt(newRoom.prix),
      statut: 'disponible',
      description: newRoom.description,
      hotelId: hotel.id,
      capacite: 1,
      accessibilite: false,
      dureeMaintenance: 0
    };
    setRooms([...rooms, room]);
    setNewRoom({ numero: '', category_id: null, prix: '', description: '' });
    setIsAddRoomModalOpen(false);
  };

  const handleDeleteRoom = (roomId: number) => {
    setRooms(rooms.filter(room => room.id !== roomId));
  };

  const availableRooms = rooms.filter(room => room.statut === 'disponible').length;
  const occupiedRooms = rooms.filter(room => room.statut === 'occupee').length;
  const maintenanceRooms = rooms.filter(room => room.statut === 'maintenance').length;

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton retour */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{hotel.nom}</h1>
            <p className="text-gray-600">Détails de l'établissement</p>
          </div>
        </div>
        <Button onClick={() => onEditHotel(hotel)}>
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      {/* Informations générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Chambres totales
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{rooms.length}</div>
            <p className="text-xs text-gray-500">Chambres dans l'établissement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Disponibles
            </CardTitle>
            <Bed className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableRooms}</div>
            <p className="text-xs text-gray-500">Chambres disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Occupées
            </CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{occupiedRooms}</div>
            <p className="text-xs text-gray-500">Chambres occupées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Taux d'occupation
            </CardTitle>
            <Star className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{hotel.tauxOccupation}%</div>
            <p className="text-xs text-gray-500">Taux actuel</p>
          </CardContent>
        </Card>
      </div>

      {/* Informations de contact */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{hotel.adresse}</p>
                  <p className="text-sm text-gray-600">{hotel.ville} {hotel.codePostal}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <p className="text-gray-900">{hotel.telephone}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <p className="text-gray-900">{hotel.email}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Gestionnaire</p>
                <p className="text-gray-900">{hotel.gestionnaire}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Statut</p>
                <Badge className={hotel.statut === 'ACTIF' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {hotel.statut}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gestion des chambres */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestion des chambres</CardTitle>
          <Button onClick={() => setIsAddRoomModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une chambre
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Numéro</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Catégorie</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Prix/nuit</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{room.numero}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-900">{getCategoryName(room.category_id) || room.type}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <Euro className="h-3 w-3 mr-1" />
                        {room.prix}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={getStatusColor(room.statut)}>
                        {getStatusText(room.statut)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {room.description}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteRoom(room.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal d'ajout de chambre */}
      {isAddRoomModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Ajouter une chambre</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsAddRoomModalOpen(false)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleAddRoom} className="p-6 space-y-4">
              <div>
                <Label htmlFor="numero">Numéro de chambre</Label>
                <Input
                  id="numero"
                  value={newRoom.numero}
                  onChange={(e) => setNewRoom({ ...newRoom, numero: e.target.value })}
                  placeholder="Ex: 101"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="category">Catégorie de chambre</Label>
                <select
                  id="category"
                  value={newRoom.category_id || ''}
                  onChange={(e) => setNewRoom({ ...newRoom, category_id: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {roomCategories?.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="prix">Prix par nuit (€)</Label>
                <Input
                  id="prix"
                  type="number"
                  value={newRoom.prix}
                  onChange={(e) => setNewRoom({ ...newRoom, prix: e.target.value })}
                  placeholder="45"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  placeholder="Description de la chambre..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 resize-none"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddRoomModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  Ajouter la chambre
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
