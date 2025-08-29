'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Bed, 
  Users, 
  Euro,
  Search,
  Filter,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  X,
  AlertCircle,
  Star,
  Wifi,
  Tv,
  Droplets,
  Coffee,
  Car,
  Baby,
  Accessibility,
  TrendingUp,
  Building2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { roomsApi } from '@/lib/api/rooms';
import { establishmentsApi } from '@/lib/api/establishments';
import { useNotifications } from '@/hooks/useNotifications';
import type { Room as DbRoom, RoomInsert, RoomUpdate } from '@/lib/api/rooms';
import type { Establishment } from '@/lib/api/establishments';
import { useRoomCategories } from '@/hooks/useSupabase';
import type { RoomCategory } from '@/lib/supabase';

interface RoomFormData {
  numero: string;
  floor: number;
  category_id: number | null;
  prix: number;
  statut: 'disponible' | 'occupee' | 'maintenance';
  description: string;
  room_size?: number;
  bed_type?: string;
  amenities: string[];
  notes: string;
}

// Room types are now managed through the database room_categories table

const availableCharacteristics = [
  'Lit simple',
  'Lit double',
  'Lit king',
  '2 lits doubles',
  'Salle de bain privée',
  'Salle de bain partagée',
  'Douche',
  'Baignoire',
  'WiFi',
  'TV',
  'TV 4K',
  'Climatisation',
  'Chauffage',
  'Mini-bar',
  'Coffre-fort',
  'Balcon',
  'Terrasse',
  'Vue jardin',
  'Vue ville',
  'Vue mer',
  'Vue montagne',
  'Ascenseur',
  'Accès PMR',
  'Salle de bain adaptée',
  'Espace de jeu',
  'Salon séparé',
  'Cuisine équipée',
  'Machine à café',
  'Bouilloire',
  'Sèche-cheveux',
  'Produits de toilette',
  'Serviettes',
  'Linge de lit',
  'Nettoyage quotidien',
  'Room service',
  'Parking privé',
  'Garage',
  'Piscine',
  'Spa',
  'Fitness',
  'Restaurant',
  'Bar',
  'Conciergerie',
  'Réception 24h/24'
];

export default function RoomList() {
  const [rooms, setRooms] = useState<DbRoom[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();
  const { categories: roomCategories, loading: categoriesLoading } = useRoomCategories();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<DbRoom | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // État du formulaire
  const [formData, setFormData] = useState<RoomFormData>({
    numero: '',
    floor: 1,
    category_id: null,
    prix: 45,
    statut: 'disponible',
    description: '',
    room_size: 18,
    bed_type: 'Lit simple',
    amenities: [],
    notes: ''
  });

  // Charger les établissements au montage
  useEffect(() => {
    loadEstablishments();
  }, []);

  // Charger les chambres quand un hôtel est sélectionné
  useEffect(() => {
    if (selectedHotelId) {
      loadRooms();
    }
  }, [selectedHotelId]);

  const loadEstablishments = async () => {
    try {
      const response = await establishmentsApi.getEstablishments();
      if (response.success && response.data) {
        setEstablishments(response.data);
        if (response.data.length > 0) {
          setSelectedHotelId(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des établissements:', error);
      addNotification('error', 'Erreur lors du chargement des établissements');
    }
  };

  const loadRooms = async () => {
    if (!selectedHotelId) return;
    
    try {
      setLoading(true);
      const response = await roomsApi.getRoomsByHotel(selectedHotelId);
      if (response.success && response.data) {
        setRooms(response.data);
      } else {
        addNotification('error', response.error || 'Erreur lors du chargement des chambres');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des chambres:', error);
      addNotification('error', 'Erreur lors du chargement des chambres');
    } finally {
      setLoading(false);
    }
  };

  // Calculs globaux
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(room => room.statut === 'disponible').length;
  const occupiedRooms = rooms.filter(room => room.statut === 'occupee').length;
  const maintenanceRooms = rooms.filter(room => room.statut === 'maintenance').length;
  const totalRevenue = rooms.reduce((sum, room) => sum + Number(room.prix || 0), 0);
  const averageOccupancy = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

  // Helper to get category name from category_id
  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId || !roomCategories) return 'Non défini';
    const category = roomCategories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Non défini';
  };

  // Filtrage
  const filteredRooms = rooms.filter(room => {
    const categoryName = getCategoryName(room.category_id);
    const matchesSearch = room.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (room.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (room.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || room.statut === statusFilter;
    const matchesCategory = categoryFilter === 'all' || room.category_id?.toString() === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'disponible': return 'bg-green-100 text-green-800';
      case 'occupee': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'disponible': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'occupee': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'maintenance': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getOccupancyColor = (taux: number) => {
    if (taux >= 90) return 'text-red-600';
    if (taux >= 75) return 'text-orange-600';
    if (taux >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const resetForm = () => {
    setFormData({
      numero: '',
      floor: 1,
      category_id: roomCategories && roomCategories.length > 0 ? roomCategories[0].id : null,
      prix: 45,
      statut: 'disponible',
      description: '',
      room_size: 18,
      bed_type: 'Lit simple',
      amenities: [],
      notes: ''
    });
  };

  const handleCreateRoom = async () => {
    if (!selectedHotelId) {
      addNotification('error', 'Veuillez sélectionner un établissement');
      return;
    }

    if (formData.numero && formData.category_id) {
      try {
        const roomData: RoomInsert = {
          hotel_id: selectedHotelId,
          numero: formData.numero,
          category_id: formData.category_id,
          prix: formData.prix,
          statut: formData.statut,
          description: formData.description || null,
          floor: formData.floor,
          room_size: formData.room_size || null,
          bed_type: formData.bed_type || null,
          amenities: formData.amenities.map(a => ({ name: a })),
          notes: formData.notes || null
        };

        const response = await roomsApi.createRoom(roomData);
        
        if (response.success) {
          addNotification('success', 'Chambre créée avec succès');
          await loadRooms();
          setIsCreating(false);
          resetForm();
        } else {
          addNotification('error', response.error || 'Erreur lors de la création');
        }
      } catch (error) {
        console.error('Erreur lors de la création:', error);
        addNotification('error', 'Erreur lors de la création de la chambre');
      }
    } else {
      addNotification('warning', 'Veuillez remplir tous les champs obligatoires');
    }
  };

  const handleUpdateRoom = async () => {
    if (!selectedRoom) return;

    if (formData.numero && formData.category_id) {
      try {
        const updateData: RoomUpdate = {
          numero: formData.numero,
          category_id: formData.category_id,
          prix: formData.prix,
          statut: formData.statut,
          description: formData.description || null,
          floor: formData.floor,
          room_size: formData.room_size || null,
          bed_type: formData.bed_type || null,
          amenities: formData.amenities.map(a => ({ name: a })),
          notes: formData.notes || null
        };

        const response = await roomsApi.updateRoom(selectedRoom.id, updateData);
        
        if (response.success) {
          addNotification('success', 'Chambre mise à jour avec succès');
          await loadRooms();
          setIsEditing(false);
          setSelectedRoom(null);
          resetForm();
        } else {
          addNotification('error', response.error || 'Erreur lors de la mise à jour');
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        addNotification('error', 'Erreur lors de la mise à jour de la chambre');
      }
    }
  };

  const handleEditRoom = (room: DbRoom) => {
    const amenitiesList = Array.isArray(room.amenities) 
      ? room.amenities.map((a: any) => typeof a === 'string' ? a : a.name || '')
      : [];

    setFormData({
      numero: room.numero,
      floor: room.floor || 1,
      category_id: room.category_id,
      prix: Number(room.prix),
      statut: room.statut || 'disponible',
      description: room.description || '',
      room_size: room.room_size ? Number(room.room_size) : undefined,
      bed_type: room.bed_type || 'Lit simple',
      amenities: amenitiesList,
      notes: room.notes || ''
    });
    setSelectedRoom(room);
    setIsEditing(true);
  };

  const handleDeleteRoom = async (roomId: number) => {
    try {
      const response = await roomsApi.deleteRoom(roomId);
      
      if (response.success) {
        addNotification('success', 'Chambre supprimée avec succès');
        await loadRooms();
      } else {
        addNotification('error', response.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      addNotification('error', 'Erreur lors de la suppression de la chambre');
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const getCharacteristicIcon = (characteristic: string) => {
    if (characteristic.includes('WiFi')) return <Wifi className="h-3 w-3" />;
    if (characteristic.includes('TV')) return <Tv className="h-3 w-3" />;
    if (characteristic.includes('bain') || characteristic.includes('Douche')) return <Droplets className="h-3 w-3" />;
    if (characteristic.includes('café') || characteristic.includes('Café')) return <Coffee className="h-3 w-3" />;
    if (characteristic.includes('Parking') || characteristic.includes('Garage')) return <Car className="h-3 w-3" />;
    if (characteristic.includes('PMR') || characteristic.includes('Adaptée')) return <Accessibility className="h-3 w-3" />;
    if (characteristic.includes('jeu') || characteristic.includes('Familiale')) return <Baby className="h-3 w-3" />;
    return <Star className="h-3 w-3" />;
  };

  if (loading && !selectedHotelId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des établissements...</p>
        </div>
      </div>
    );
  }

  if (establishments.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Aucun établissement trouvé.</p>
        <p className="text-sm text-gray-500 mt-2">Veuillez d'abord créer un établissement.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selecteur d'etablissement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Selection de l'etablissement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedHotelId || ''}
            onChange={(e) => setSelectedHotelId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {establishments.map(hotel => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.nom} - {hotel.ville}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* En-tete avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des chambres</h2>
          {selectedHotelId && (
            <p className="text-gray-600 mt-1">
              {establishments.find(e => e.id === selectedHotelId)?.nom}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="flex items-center gap-2"
          >
            {viewMode === 'grid' ? 'Vue liste' : 'Vue grille'}
          </Button>
          <Button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvelle chambre
          </Button>
        </div>
      </div>



      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par numéro, catégorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="disponible">Disponible</option>
              <option value="occupee">Occupée</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les catégories</option>
              {roomCategories?.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {filteredRooms.length} chambre{filteredRooms.length > 1 ? 's' : ''} trouvée{filteredRooms.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des chambres */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des chambres...</p>
          </div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune chambre trouvée.</p>
            <Button onClick={() => setIsCreating(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une chambre
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-4"}>
          {filteredRooms.map((room) => (
          <Card key={room.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Bed className="h-5 w-5 text-blue-600" />
                    <span>Chambre {room.numero}</span>
                    <Badge className={getStatusColor(room.statut)}>
                      {room.statut === 'disponible' ? 'Disponible' :
                       room.statut === 'occupee' ? 'Occupée' : 'Maintenance'}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {getCategoryName(room.category_id)} - Étage {room.floor || 0}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditRoom(room)}
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setShowDeleteConfirm(room.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Informations de base */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Catégorie:</span>
                    <div className="font-semibold">{getCategoryName(room.category_id)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Prix:</span>
                    <div className="font-semibold text-green-600">{room.prix}€/nuit</div>
                  </div>
                  {room.bed_type && (
                    <div>
                      <span className="text-gray-500">Type de lit:</span>
                      <div className="font-semibold">{room.bed_type}</div>
                    </div>
                  )}
                  {room.room_size && (
                    <div>
                      <span className="text-gray-500">Superficie:</span>
                      <div className="font-semibold">{room.room_size}m²</div>
                    </div>
                  )}
                </div>

                {/* Équipements */}
                {room.amenities && Array.isArray(room.amenities) && room.amenities.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Équipements:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {room.amenities.map((amenity: any, index: number) => {
                        const name = typeof amenity === 'string' ? amenity : amenity.name || '';
                        return (
                          <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                            {getCharacteristicIcon(name)}
                            {name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Infos supplémentaires */}
                {(room.description || room.notes) && (
                  <div className="text-sm">
                    {room.description && (
                      <div>
                        <span className="text-gray-500">Description:</span>
                        <div className="font-semibold">{room.description}</div>
                      </div>
                    )}
                    {room.notes && (
                      <div className="mt-2">
                        <span className="text-gray-500">Notes:</span>
                        <div className="font-semibold">{room.notes}</div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* Modal de création de chambre */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nouvelle chambre</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Informations de base</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero">Numéro *</Label>
                    <Input
                      id="numero"
                      value={formData.numero}
                      onChange={(e) => setFormData({...formData, numero: e.target.value})}
                      placeholder="101"
                    />
                  </div>
                  <div>
                    <Label htmlFor="floor">Étage</Label>
                    <Input
                      id="floor"
                      type="number"
                      value={formData.floor}
                      onChange={(e) => setFormData({...formData, floor: Number(e.target.value)})}
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Catégorie *</Label>
                  <select
                    id="category"
                    value={formData.category_id || ''}
                    onChange={(e) => setFormData({...formData, category_id: Number(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-md"
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
                    value={formData.prix}
                    onChange={(e) => setFormData({...formData, prix: Number(e.target.value)})}
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="statut">Statut</Label>
                  <select
                    id="statut"
                    value={formData.statut}
                    onChange={(e) => setFormData({...formData, statut: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="occupee">Occupée</option>
                    <option value="maintenance">Maintenance</option>
                        </select>
                </div>
              </div>

              {/* Caractéristiques et détails */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Caractéristiques et détails</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="room_size">Superficie (m²)</Label>
                    <Input
                      id="room_size"
                      type="number"
                      value={formData.room_size || ''}
                      onChange={(e) => setFormData({...formData, room_size: Number(e.target.value)})}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bed_type">Type de lit</Label>
                    <Input
                      id="bed_type"
                      value={formData.bed_type || ''}
                      onChange={(e) => setFormData({...formData, bed_type: e.target.value})}
                      placeholder="Ex: Lit double, Lit simple"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                </div>

                <div>
                  <Label>Caractéristiques</Label>
                  <div className="mt-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                    <div className="grid grid-cols-1 gap-2">
                      {availableCharacteristics.map(characteristic => (
                        <label key={characteristic} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.amenities.includes(characteristic)}
                            onChange={() => toggleAmenity(characteristic)}
                            className="rounded"
                          />
                          <span>{characteristic}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md h-20 resize-none"
                    placeholder="Notes spéciales, observations..."
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleCreateRoom} 
                disabled={!formData.numero || !formData.category_id}
              >
                <Save className="h-4 w-4 mr-2" />
                Créer la chambre
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition de chambre */}
      {isEditing && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Modifier la chambre {selectedRoom.numero}</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Informations de base</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-numero">Numéro *</Label>
                    <Input
                      id="edit-numero"
                      value={formData.numero}
                      onChange={(e) => setFormData({...formData, numero: e.target.value})}
                      placeholder="101"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-etage">Étage</Label>
                    <Input
                      id="edit-etage"
                      type="number"
                      value={formData.floor}
                      onChange={(e) => setFormData({...formData, floor: Number(e.target.value)})}
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-category">Catégorie *</Label>
                  <select
                    id="edit-category"
                    value={formData.category_id || ''}
                    onChange={(e) => setFormData({...formData, category_id: Number(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {roomCategories?.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="edit-prix">Prix par nuit (€)</Label>
                  <Input
                    id="edit-prix"
                    type="number"
                    value={formData.prix}
                    onChange={(e) => setFormData({...formData, prix: Number(e.target.value)})}
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-statut">Statut</Label>
                  <select
                    id="edit-statut"
                    value={formData.statut}
                    onChange={(e) => setFormData({...formData, statut: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="occupee">Occupée</option>
                    <option value="maintenance">Maintenance</option>
                        </select>
                </div>
              </div>

              {/* Caractéristiques et détails */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Caractéristiques et détails</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-superficie">Superficie (m²)</Label>
                    <Input
                      id="edit-superficie"
                      type="number"
                      value={formData.room_size || ''}
                      onChange={(e) => setFormData({...formData, room_size: Number(e.target.value)})}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-vue">Vue</Label>
                  </div>
                </div>

                <div>
                  <Label>Caractéristiques</Label>
                  <div className="mt-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                    <div className="grid grid-cols-1 gap-2">
                      {availableCharacteristics.map(characteristic => (
                        <label key={characteristic} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.amenities.includes(characteristic)}
                            onChange={() => toggleAmenity(characteristic)}
                            className="rounded"
                          />
                          <span>{characteristic}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <textarea
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md h-20 resize-none"
                    placeholder="Notes spéciales, observations..."
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleUpdateRoom} 
                disabled={!formData.numero || !formData.category_id}
              >
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-bold">Confirmer la suppression</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cette chambre ? Cette action est irréversible.
            </p>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteRoom(showDeleteConfirm)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
