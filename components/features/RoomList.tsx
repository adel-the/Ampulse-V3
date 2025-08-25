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
import { useState } from 'react';

interface Room {
  id: number;
  numero: string;
  etage: number;
  categorie: string;
  type: string;
  capacite: number;
  prixBase: number;
  statut: 'disponible' | 'occupee' | 'maintenance' | 'reservee';
  derniereOccupation: string;
  prochaineReservation: string | null;
  caracteristiques: string[];
  notes: string;
  tauxOccupation: number;
  revenusMensuel: number;
  superficie?: number;
  vue?: string;
  equipements?: string[];
}

interface RoomFormData {
  numero: string;
  etage: number;
  categorie: string;
  type: string;
  capacite: number;
  prixBase: number;
  statut: 'disponible' | 'occupee' | 'maintenance' | 'reservee';
  caracteristiques: string[];
  notes: string;
  superficie?: number;
  vue?: string;
  equipements?: string[];
}

const roomCategories = [
  'Chambre Simple',
  'Chambre Double', 
  'Chambre Familiale',
  'Suite',
  'Chambre Adaptée',
  'Chambre Communicante',
  'Chambre Vue Mer',
  'Chambre Vue Montagne'
];

const roomTypes = [
  'Simple',
  'Double',
  'Twin',
  'Familiale',
  'Suite',
  'PMR',
  'Luxe',
  'Premium'
];

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
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: 1,
      numero: '101',
      etage: 1,
      categorie: 'Chambre Simple',
      type: 'Simple',
      capacite: 1,
      prixBase: 45,
      statut: 'disponible',
      derniereOccupation: '2024-01-15',
      prochaineReservation: '2024-01-20',
      caracteristiques: ['Lit simple', 'Salle de bain privée', 'WiFi'],
      notes: 'Vue sur la rue, calme',
      tauxOccupation: 75,
      revenusMensuel: 1350,
      superficie: 18,
      vue: 'Rue',
      equipements: ['WiFi', 'TV', 'Climatisation']
    },
    {
      id: 2,
      numero: '102',
      etage: 1,
      categorie: 'Chambre Double',
      type: 'Double',
      capacite: 2,
      prixBase: 65,
      statut: 'occupee',
      derniereOccupation: '2024-01-18',
      prochaineReservation: null,
      caracteristiques: ['Lit double', 'Salle de bain privée', 'WiFi', 'TV'],
      notes: 'Vue jardin, ensoleillée',
      tauxOccupation: 90,
      revenusMensuel: 1950,
      superficie: 25,
      vue: 'Jardin',
      equipements: ['WiFi', 'TV', 'Climatisation', 'Mini-bar']
    },
    {
      id: 3,
      numero: '201',
      etage: 2,
      categorie: 'Chambre Double',
      type: 'Double',
      capacite: 2,
      prixBase: 65,
      statut: 'disponible',
      derniereOccupation: '2024-01-16',
      prochaineReservation: '2024-01-22',
      caracteristiques: ['Lit double', 'Salle de bain privée', 'WiFi', 'TV'],
      notes: 'Vue sur la ville',
      tauxOccupation: 80,
      revenusMensuel: 1820,
      superficie: 25,
      vue: 'Ville',
      equipements: ['WiFi', 'TV', 'Climatisation']
    },
    {
      id: 4,
      numero: '202',
      etage: 2,
      categorie: 'Chambre Familiale',
      type: 'Familiale',
      capacite: 4,
      prixBase: 85,
      statut: 'reservee',
      derniereOccupation: '2024-01-14',
      prochaineReservation: '2024-01-19',
      caracteristiques: ['2 lits doubles', 'Salle de bain privée', 'WiFi', 'TV', 'Espace de jeu'],
      notes: 'Grande chambre, parfaite pour familles',
      tauxOccupation: 85,
      revenusMensuel: 2295,
      superficie: 35,
      vue: 'Jardin',
      equipements: ['WiFi', 'TV', 'Climatisation', 'Espace de jeu']
    },
    {
      id: 5,
      numero: '301',
      etage: 3,
      categorie: 'Suite',
      type: 'Suite',
      capacite: 2,
      prixBase: 120,
      statut: 'maintenance',
      derniereOccupation: '2024-01-10',
      prochaineReservation: '2024-01-25',
      caracteristiques: ['Lit king', 'Salon séparé', 'Salle de bain luxueuse', 'WiFi', 'TV 4K', 'Mini-bar'],
      notes: 'Suite de luxe, rénovation en cours',
      tauxOccupation: 60,
      revenusMensuel: 2160,
      superficie: 45,
      vue: 'Ville',
      equipements: ['WiFi', 'TV 4K', 'Climatisation', 'Mini-bar', 'Coffre-fort']
    },
    {
      id: 6,
      numero: '302',
      etage: 3,
      categorie: 'Chambre Adaptée',
      type: 'PMR',
      capacite: 2,
      prixBase: 55,
      statut: 'disponible',
      derniereOccupation: '2024-01-12',
      prochaineReservation: '2024-01-21',
      caracteristiques: ['Accès PMR', 'Salle de bain adaptée', 'Lit double', 'WiFi'],
      notes: 'Chambre adaptée PMR',
      tauxOccupation: 70,
      revenusMensuel: 1155,
      superficie: 28,
      vue: 'Jardin',
      equipements: ['WiFi', 'TV', 'Climatisation', 'Accès PMR']
    },
    {
      id: 7,
      numero: '401',
      etage: 4,
      categorie: 'Chambre Simple',
      type: 'Simple',
      capacite: 1,
      prixBase: 45,
      statut: 'disponible',
      derniereOccupation: '2024-01-17',
      prochaineReservation: null,
      caracteristiques: ['Lit simple', 'Salle de bain privée', 'WiFi'],
      notes: 'Vue panoramique, dernier étage',
      tauxOccupation: 65,
      revenusMensuel: 1170,
      superficie: 18,
      vue: 'Panoramique',
      equipements: ['WiFi', 'TV', 'Climatisation']
    },
    {
      id: 8,
      numero: '402',
      etage: 4,
      categorie: 'Chambre Double',
      type: 'Double',
      capacite: 2,
      prixBase: 65,
      statut: 'occupee',
      derniereOccupation: '2024-01-19',
      prochaineReservation: null,
      caracteristiques: ['Lit double', 'Salle de bain privée', 'WiFi', 'TV'],
      notes: 'Vue panoramique, balcon',
      tauxOccupation: 95,
      revenusMensuel: 1950,
      superficie: 25,
      vue: 'Panoramique',
      equipements: ['WiFi', 'TV', 'Climatisation', 'Balcon']
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // État du formulaire
  const [formData, setFormData] = useState<RoomFormData>({
    numero: '',
    etage: 1,
    categorie: 'Chambre Simple',
    type: 'Simple',
    capacite: 1,
    prixBase: 45,
    statut: 'disponible',
    caracteristiques: [],
    notes: '',
    superficie: 18,
    vue: 'Rue',
    equipements: []
  });

  // Calculs globaux
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(room => room.statut === 'disponible').length;
  const occupiedRooms = rooms.filter(room => room.statut === 'occupee').length;
  const maintenanceRooms = rooms.filter(room => room.statut === 'maintenance').length;
  const reservedRooms = rooms.filter(room => room.statut === 'reservee').length;
  const totalRevenue = rooms.reduce((sum, room) => sum + room.revenusMensuel, 0);
  const averageOccupancy = rooms.reduce((sum, room) => sum + room.tauxOccupation, 0) / rooms.length;

  // Filtrage
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.categorie.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || room.statut === statusFilter;
    const matchesCategory = categoryFilter === 'all' || room.categorie === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'disponible': return 'bg-green-100 text-green-800';
      case 'occupee': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'reservee': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'disponible': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'occupee': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'maintenance': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'reservee': return <Calendar className="h-4 w-4 text-blue-600" />;
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
      etage: 1,
      categorie: 'Chambre Simple',
      type: 'Simple',
      capacite: 1,
      prixBase: 45,
      statut: 'disponible',
      caracteristiques: [],
      notes: '',
      superficie: 18,
      vue: 'Rue',
      equipements: []
    });
  };

  const handleCreateRoom = () => {
    if (formData.numero && formData.categorie && formData.type) {
      const newRoom: Room = {
        ...formData,
        id: Math.max(...rooms.map(r => r.id), 0) + 1,
        derniereOccupation: new Date().toLocaleDateString('fr-FR'),
        prochaineReservation: null,
        tauxOccupation: 0,
        revenusMensuel: 0
      };
      setRooms(prev => [...prev, newRoom]);
      setIsCreating(false);
      resetForm();
    }
  };

  const handleUpdateRoom = () => {
    if (selectedRoom && formData.numero && formData.categorie && formData.type) {
      setRooms(prev => prev.map(room => 
        room.id === selectedRoom.id ? { ...room, ...formData } : room
      ));
      setIsEditing(false);
      setSelectedRoom(null);
      resetForm();
    }
  };

  const handleEditRoom = (room: Room) => {
    setFormData({
      numero: room.numero,
      etage: room.etage,
      categorie: room.categorie,
      type: room.type,
      capacite: room.capacite,
      prixBase: room.prixBase,
      statut: room.statut,
      caracteristiques: room.caracteristiques,
      notes: room.notes,
      superficie: room.superficie,
      vue: room.vue,
      equipements: room.equipements
    });
    setSelectedRoom(room);
    setIsEditing(true);
  };

  const handleDeleteRoom = (roomId: number) => {
    setRooms(prev => prev.filter(room => room.id !== roomId));
    setShowDeleteConfirm(null);
  };

  const toggleCharacteristic = (characteristic: string) => {
    setFormData(prev => ({
      ...prev,
      caracteristiques: prev.caracteristiques.includes(characteristic)
        ? prev.caracteristiques.filter(c => c !== characteristic)
        : [...prev.caracteristiques, characteristic]
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

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div>
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
              <option value="reservee">Réservée</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les catégories</option>
              {roomCategories.map(category => (
                <option key={category} value={category}>{category}</option>
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
                       room.statut === 'occupee' ? 'Occupée' :
                       room.statut === 'maintenance' ? 'Maintenance' : 'Réservée'}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {room.categorie} - Étage {room.etage}
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
                    <span className="text-gray-500">Type:</span>
                    <div className="font-semibold">{room.type}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Capacité:</span>
                    <div className="font-semibold">{room.capacite} personne(s)</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Prix de base:</span>
                    <div className="font-semibold text-green-600">{room.prixBase}€</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Taux d'occupation:</span>
                    <div className={`font-semibold ${getOccupancyColor(room.tauxOccupation)}`}>
                      {room.tauxOccupation}%
                    </div>
                  </div>
                  {room.superficie && (
                    <div>
                      <span className="text-gray-500">Superficie:</span>
                      <div className="font-semibold">{room.superficie}m²</div>
                    </div>
                  )}
                  {room.vue && (
                    <div>
                      <span className="text-gray-500">Vue:</span>
                      <div className="font-semibold">{room.vue}</div>
                    </div>
                  )}
                </div>

                {/* Caractéristiques */}
                <div>
                  <span className="text-sm text-gray-500">Caractéristiques:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {room.caracteristiques.map((carac, index) => (
                      <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                        {getCharacteristicIcon(carac)}
                        {carac}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Dernière occupation:</span>
                    <div className="font-semibold">
                      {new Date(room.derniereOccupation).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Prochaine réservation:</span>
                    <div className="font-semibold">
                      {room.prochaineReservation 
                        ? new Date(room.prochaineReservation).toLocaleDateString('fr-FR')
                        : 'Aucune'
                      }
                    </div>
                  </div>
                </div>

                {/* Notes et revenus */}
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {room.notes}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Revenus mensuels:</div>
                      <div className="font-semibold text-green-600">
                        {room.revenusMensuel.toLocaleString()}€
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
                    <Label htmlFor="etage">Étage</Label>
                    <Input
                      id="etage"
                      type="number"
                      value={formData.etage}
                      onChange={(e) => setFormData({...formData, etage: Number(e.target.value)})}
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="categorie">Catégorie *</Label>
                  <select
                    id="categorie"
                    value={formData.categorie}
                    onChange={(e) => setFormData({...formData, categorie: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {roomCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="type">Type *</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {roomTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="capacite">Capacité</Label>
                    <Input
                      id="capacite"
                      type="number"
                      value={formData.capacite}
                      onChange={(e) => setFormData({...formData, capacite: Number(e.target.value)})}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prixBase">Prix de base (€)</Label>
                    <Input
                      id="prixBase"
                      type="number"
                      value={formData.prixBase}
                      onChange={(e) => setFormData({...formData, prixBase: Number(e.target.value)})}
                      min="0"
                    />
                  </div>
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
                    <option value="reservee">Réservée</option>
                  </select>
                </div>
              </div>

              {/* Caractéristiques et détails */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Caractéristiques et détails</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="superficie">Superficie (m²)</Label>
                    <Input
                      id="superficie"
                      type="number"
                      value={formData.superficie || ''}
                      onChange={(e) => setFormData({...formData, superficie: Number(e.target.value)})}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vue">Vue</Label>
                    <Input
                      id="vue"
                      value={formData.vue || ''}
                      onChange={(e) => setFormData({...formData, vue: e.target.value})}
                      placeholder="Jardin, Ville, Mer..."
                    />
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
                            checked={formData.caracteristiques.includes(characteristic)}
                            onChange={() => toggleCharacteristic(characteristic)}
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
                disabled={!formData.numero || !formData.categorie || !formData.type}
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
                      value={formData.etage}
                      onChange={(e) => setFormData({...formData, etage: Number(e.target.value)})}
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-categorie">Catégorie *</Label>
                  <select
                    id="edit-categorie"
                    value={formData.categorie}
                    onChange={(e) => setFormData({...formData, categorie: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {roomCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="edit-type">Type *</Label>
                  <select
                    id="edit-type"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {roomTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-capacite">Capacité</Label>
                    <Input
                      id="edit-capacite"
                      type="number"
                      value={formData.capacite}
                      onChange={(e) => setFormData({...formData, capacite: Number(e.target.value)})}
                      min="1"
                      max="10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-prixBase">Prix de base (€)</Label>
                    <Input
                      id="edit-prixBase"
                      type="number"
                      value={formData.prixBase}
                      onChange={(e) => setFormData({...formData, prixBase: Number(e.target.value)})}
                      min="0"
                    />
                  </div>
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
                    <option value="reservee">Réservée</option>
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
                      value={formData.superficie || ''}
                      onChange={(e) => setFormData({...formData, superficie: Number(e.target.value)})}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-vue">Vue</Label>
                    <Input
                      id="edit-vue"
                      value={formData.vue || ''}
                      onChange={(e) => setFormData({...formData, vue: e.target.value})}
                      placeholder="Jardin, Ville, Mer..."
                    />
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
                            checked={formData.caracteristiques.includes(characteristic)}
                            onChange={() => toggleCharacteristic(characteristic)}
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
                disabled={!formData.numero || !formData.categorie || !formData.type}
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
