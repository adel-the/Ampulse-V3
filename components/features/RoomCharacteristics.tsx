import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Wifi, 
  Tv, 
  Droplets, 
  Bed, 
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  X,
  Wrench,
  Star,
  Shield,
  Coffee,
  Car,
  Baby,
  Accessibility,
  TrendingUp,
  Euro,
  Settings
} from 'lucide-react';
import { useState } from 'react';

interface RoomCharacteristic {
  id: number;
  nom: string;
  description: string;
  type: 'equipement' | 'service' | 'accessibilite' | 'luxe';
  icone: string;
  chambresEquipees: number;
  totalChambres: number;
  statut: 'active' | 'inactive';
  coutInstallation: number;
  coutMensuel: number;
  priorite: 'basse' | 'normale' | 'haute' | 'critique';
  couleur?: string;
}

interface CharacteristicFormData {
  nom: string;
  description: string;
  type: 'equipement' | 'service' | 'accessibilite' | 'luxe';
  icone: string;
  statut: 'active' | 'inactive';
  coutInstallation: number;
  coutMensuel: number;
  priorite: 'basse' | 'normale' | 'haute' | 'critique';
  couleur: string;
}

const characteristicIcons = [
  { value: 'wifi', label: 'WiFi', icon: <Wifi className="h-5 w-5" /> },
  { value: 'tv', label: 'Télévision', icon: <Tv className="h-5 w-5" /> },
  { value: 'shower', label: 'Douche', icon: <Droplets className="h-5 w-5" /> },
  { value: 'bed', label: 'Lit', icon: <Bed className="h-5 w-5" /> },
  { value: 'users', label: 'Utilisateurs', icon: <Users className="h-5 w-5" /> },
  { value: 'wrench', label: 'Outils', icon: <Wrench className="h-5 w-5" /> },
  { value: 'star', label: 'Luxe', icon: <Star className="h-5 w-5" /> },
  { value: 'shield', label: 'Sécurité', icon: <Shield className="h-5 w-5" /> },
  { value: 'coffee', label: 'Café', icon: <Coffee className="h-5 w-5" /> },
  { value: 'car', label: 'Parking', icon: <Car className="h-5 w-5" /> },
  { value: 'baby', label: 'Famille', icon: <Baby className="h-5 w-5" /> },
  { value: 'accessibility', label: 'PMR', icon: <Accessibility className="h-5 w-5" /> },
  { value: 'settings', label: 'Paramètres', icon: <Settings className="h-5 w-5" /> }
];

const characteristicColors = [
  { value: 'blue', label: 'Bleu', color: '#3B82F6' },
  { value: 'green', label: 'Vert', color: '#10B981' },
  { value: 'purple', label: 'Violet', color: '#8B5CF6' },
  { value: 'orange', label: 'Orange', color: '#F59E0B' },
  { value: 'red', label: 'Rouge', color: '#EF4444' },
  { value: 'pink', label: 'Rose', color: '#EC4899' },
  { value: 'indigo', label: 'Indigo', color: '#6366F1' },
  { value: 'teal', label: 'Teal', color: '#14B8A6' }
];

export default function RoomCharacteristics() {
  const [characteristics, setCharacteristics] = useState<RoomCharacteristic[]>([
    {
      id: 1,
      nom: 'WiFi haute vitesse',
      description: 'Connexion internet sans fil à haut débit',
      type: 'equipement',
      icone: 'wifi',
      chambresEquipees: 85,
      totalChambres: 93,
      statut: 'active',
      coutInstallation: 2500,
      coutMensuel: 180,
      priorite: 'haute',
      couleur: 'blue'
    },
    {
      id: 2,
      nom: 'Télévision LED',
      description: 'Écran plat avec chaînes numériques',
      type: 'equipement',
      icone: 'tv',
      chambresEquipees: 93,
      totalChambres: 93,
      statut: 'active',
      coutInstallation: 15000,
      coutMensuel: 120,
      priorite: 'normale',
      couleur: 'green'
    },
    {
      id: 3,
      nom: 'Salle de bain privée',
      description: 'Douche et WC privés dans chaque chambre',
      type: 'equipement',
      icone: 'shower',
      chambresEquipees: 93,
      totalChambres: 93,
      statut: 'active',
      coutInstallation: 45000,
      coutMensuel: 0,
      priorite: 'critique',
      couleur: 'purple'
    },
    {
      id: 4,
      nom: 'Climatisation',
      description: 'Contrôle de température individuel',
      type: 'equipement',
      icone: 'wrench',
      chambresEquipees: 78,
      totalChambres: 93,
      statut: 'active',
      coutInstallation: 28000,
      coutMensuel: 350,
      priorite: 'haute',
      couleur: 'orange'
    },
    {
      id: 5,
      nom: 'Mini-bar',
      description: 'Réfrigérateur avec boissons et snacks',
      type: 'service',
      icone: 'coffee',
      chambresEquipees: 25,
      totalChambres: 93,
      statut: 'active',
      coutInstallation: 8000,
      coutMensuel: 200,
      priorite: 'basse',
      couleur: 'pink'
    },
    {
      id: 6,
      nom: 'Accès PMR',
      description: 'Aménagements pour personnes à mobilité réduite',
      type: 'accessibilite',
      icone: 'accessibility',
      chambresEquipees: 5,
      totalChambres: 93,
      statut: 'active',
      coutInstallation: 12000,
      coutMensuel: 0,
      priorite: 'normale',
      couleur: 'teal'
    },
    {
      id: 7,
      nom: 'Balcon/Terrasse',
      description: 'Espace extérieur privatif',
      type: 'luxe',
      icone: 'star',
      chambresEquipees: 15,
      totalChambres: 93,
      statut: 'active',
      coutInstallation: 18000,
      coutMensuel: 0,
      priorite: 'basse',
      couleur: 'indigo'
    },
    {
      id: 8,
      nom: 'Coffre-fort',
      description: 'Sécurisation des objets de valeur',
      type: 'equipement',
      icone: 'shield',
      chambresEquipees: 45,
      totalChambres: 93,
      statut: 'active',
      coutInstallation: 6000,
      coutMensuel: 80,
      priorite: 'normale',
      couleur: 'red'
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCharacteristic, setSelectedCharacteristic] = useState<RoomCharacteristic | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // État du formulaire
  const [formData, setFormData] = useState<CharacteristicFormData>({
    nom: '',
    description: '',
    type: 'equipement',
    icone: 'wifi',
    statut: 'active',
    coutInstallation: 0,
    coutMensuel: 0,
    priorite: 'normale',
    couleur: 'blue'
  });

  // Calculs globaux
  const totalChambres = characteristics[0]?.totalChambres || 0;
  const totalEquipees = characteristics.reduce((sum, char) => sum + char.chambresEquipees, 0);
  const coutTotalInstallation = characteristics.reduce((sum, char) => sum + char.coutInstallation, 0);
  const coutTotalMensuel = characteristics.reduce((sum, char) => sum + char.coutMensuel, 0);

  const getStatusColor = (statut: string) => {
    return statut === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'equipement': return 'bg-blue-100 text-blue-800';
      case 'service': return 'bg-purple-100 text-purple-800';
      case 'accessibilite': return 'bg-orange-100 text-orange-800';
      case 'luxe': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'critique': return 'text-red-600';
      case 'haute': return 'text-orange-600';
      case 'normale': return 'text-blue-600';
      case 'basse': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityIcon = (priorite: string) => {
    switch (priorite) {
      case 'critique': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'haute': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'normale': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'basse': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getIconComponent = (iconName: string) => {
    const icon = characteristicIcons.find(i => i.value === iconName);
    return icon ? icon.icon : <CheckCircle className="h-5 w-5" />;
  };

  const getCharacteristicColor = (colorValue: string) => {
    const color = characteristicColors.find(c => c.value === colorValue);
    return color ? color.color : '#3B82F6';
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      type: 'equipement',
      icone: 'wifi',
      statut: 'active',
      coutInstallation: 0,
      coutMensuel: 0,
      priorite: 'normale',
      couleur: 'blue'
    });
  };

  const handleCreateCharacteristic = () => {
    if (formData.nom && formData.description) {
      const newCharacteristic: RoomCharacteristic = {
        ...formData,
        id: Math.max(...characteristics.map(c => c.id), 0) + 1,
        chambresEquipees: 0,
        totalChambres: totalChambres
      };
      setCharacteristics(prev => [...prev, newCharacteristic]);
      setIsCreating(false);
      resetForm();
    }
  };

  const handleUpdateCharacteristic = () => {
    if (selectedCharacteristic && formData.nom && formData.description) {
      setCharacteristics(prev => prev.map(char => 
        char.id === selectedCharacteristic.id ? { ...char, ...formData } : char
      ));
      setIsEditing(false);
      setSelectedCharacteristic(null);
      resetForm();
    }
  };

  const handleEditCharacteristic = (characteristic: RoomCharacteristic) => {
    setFormData({
      nom: characteristic.nom,
      description: characteristic.description,
      type: characteristic.type,
      icone: characteristic.icone,
      statut: characteristic.statut,
      coutInstallation: characteristic.coutInstallation,
      coutMensuel: characteristic.coutMensuel,
      priorite: characteristic.priorite,
      couleur: characteristic.couleur || 'blue'
    });
    setSelectedCharacteristic(characteristic);
    setIsEditing(true);
  };

  const handleDeleteCharacteristic = (characteristicId: number) => {
    setCharacteristics(prev => prev.filter(char => char.id !== characteristicId));
    setShowDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Caractéristiques des chambres</h2>
          <p className="text-gray-600">Gérez les équipements, services et caractéristiques disponibles</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle caractéristique
        </Button>
      </div>



      {/* Liste des caractéristiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {characteristics.map((characteristic) => (
          <Card key={characteristic.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: getCharacteristicColor(characteristic.couleur || 'blue') + '20' }}
                    >
                      <div style={{ color: getCharacteristicColor(characteristic.couleur || 'blue') }}>
                        {getIconComponent(characteristic.icone)}
                      </div>
                    </div>
                    <span>{characteristic.nom}</span>
                    <Badge className={getStatusColor(characteristic.statut)}>
                      {characteristic.statut === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {characteristic.description}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditCharacteristic(characteristic)}
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setShowDeleteConfirm(characteristic.id)}
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
                    <div>
                      <Badge className={getTypeColor(characteristic.type)}>
                        {characteristic.type === 'equipement' ? 'Équipement' :
                         characteristic.type === 'service' ? 'Service' :
                         characteristic.type === 'accessibilite' ? 'Accessibilité' : 'Luxe'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Priorité:</span>
                    <div className="flex items-center gap-1">
                      {getPriorityIcon(characteristic.priorite)}
                      <span className={`font-semibold ${getPriorityColor(characteristic.priorite)}`}>
                        {characteristic.priorite.charAt(0).toUpperCase() + characteristic.priorite.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statistiques d'équipement */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Chambres équipées:</span>
                    <div className="font-semibold">
                      {characteristic.chambresEquipees}/{characteristic.totalChambres}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(characteristic.chambresEquipees / characteristic.totalChambres) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Taux d'équipement:</span>
                    <div className="font-semibold text-blue-600">
                      {Math.round((characteristic.chambresEquipees / characteristic.totalChambres) * 100)}%
                    </div>
                  </div>
                </div>

                {/* Coûts */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Coût installation:</span>
                    <div className="font-semibold text-orange-600">
                      {characteristic.coutInstallation.toLocaleString()}€
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Coût mensuel:</span>
                    <div className="font-semibold text-red-600">
                      {characteristic.coutMensuel.toLocaleString()}€
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de création de caractéristique */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nouvelle caractéristique</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  placeholder="WiFi haute vitesse"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md h-20 resize-none"
                  placeholder="Description détaillée de la caractéristique..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="equipement">Équipement</option>
                    <option value="service">Service</option>
                    <option value="accessibilite">Accessibilité</option>
                    <option value="luxe">Luxe</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="priorite">Priorité</Label>
                  <select
                    id="priorite"
                    value={formData.priorite}
                    onChange={(e) => setFormData({...formData, priorite: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="basse">Basse</option>
                    <option value="normale">Normale</option>
                    <option value="haute">Haute</option>
                    <option value="critique">Critique</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="coutInstallation">Coût installation (€)</Label>
                  <Input
                    id="coutInstallation"
                    type="number"
                    value={formData.coutInstallation}
                    onChange={(e) => setFormData({...formData, coutInstallation: Number(e.target.value)})}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="coutMensuel">Coût mensuel (€)</Label>
                  <Input
                    id="coutMensuel"
                    type="number"
                    value={formData.coutMensuel}
                    onChange={(e) => setFormData({...formData, coutMensuel: Number(e.target.value)})}
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="statut">Statut</Label>
                <select
                  id="statut"
                  value={formData.statut}
                  onChange={(e) => setFormData({...formData, statut: e.target.value as 'active' | 'inactive'})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Icône</Label>
                  <div className="mt-2 grid grid-cols-6 gap-2">
                    {characteristicIcons.map(icon => (
                      <button
                        key={icon.value}
                        type="button"
                        onClick={() => setFormData({...formData, icone: icon.value})}
                        className={`p-2 rounded border-2 ${
                          formData.icone === icon.value 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        title={icon.label}
                      >
                        {icon.icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Couleur</Label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {characteristicColors.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({...formData, couleur: color.value})}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.couleur === color.value 
                            ? 'border-gray-800' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color.color }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleCreateCharacteristic} 
                disabled={!formData.nom || !formData.description}
              >
                <Save className="h-4 w-4 mr-2" />
                Créer la caractéristique
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition de caractéristique */}
      {isEditing && selectedCharacteristic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Modifier {selectedCharacteristic.nom}</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-nom">Nom *</Label>
                <Input
                  id="edit-nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  placeholder="WiFi haute vitesse"
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description *</Label>
                <textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md h-20 resize-none"
                  placeholder="Description détaillée de la caractéristique..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-type">Type</Label>
                  <select
                    id="edit-type"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="equipement">Équipement</option>
                    <option value="service">Service</option>
                    <option value="accessibilite">Accessibilité</option>
                    <option value="luxe">Luxe</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-priorite">Priorité</Label>
                  <select
                    id="edit-priorite"
                    value={formData.priorite}
                    onChange={(e) => setFormData({...formData, priorite: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="basse">Basse</option>
                    <option value="normale">Normale</option>
                    <option value="haute">Haute</option>
                    <option value="critique">Critique</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-coutInstallation">Coût installation (€)</Label>
                  <Input
                    id="edit-coutInstallation"
                    type="number"
                    value={formData.coutInstallation}
                    onChange={(e) => setFormData({...formData, coutInstallation: Number(e.target.value)})}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-coutMensuel">Coût mensuel (€)</Label>
                  <Input
                    id="edit-coutMensuel"
                    type="number"
                    value={formData.coutMensuel}
                    onChange={(e) => setFormData({...formData, coutMensuel: Number(e.target.value)})}
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-statut">Statut</Label>
                <select
                  id="edit-statut"
                  value={formData.statut}
                  onChange={(e) => setFormData({...formData, statut: e.target.value as 'active' | 'inactive'})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Icône</Label>
                  <div className="mt-2 grid grid-cols-6 gap-2">
                    {characteristicIcons.map(icon => (
                      <button
                        key={icon.value}
                        type="button"
                        onClick={() => setFormData({...formData, icone: icon.value})}
                        className={`p-2 rounded border-2 ${
                          formData.icone === icon.value 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        title={icon.label}
                      >
                        {icon.icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Couleur</Label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {characteristicColors.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({...formData, couleur: color.value})}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.couleur === color.value 
                            ? 'border-gray-800' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color.color }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleUpdateCharacteristic} 
                disabled={!formData.nom || !formData.description}
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
              Êtes-vous sûr de vouloir supprimer cette caractéristique ? Cette action est irréversible.
            </p>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteCharacteristic(showDeleteConfirm)}
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
