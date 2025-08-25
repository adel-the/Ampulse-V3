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
  TrendingUp,
  CheckCircle,
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
  Accessibility
} from 'lucide-react';
import { useState } from 'react';

interface RoomCategory {
  id: number;
  nom: string;
  description: string;
  prixBase: number;
  capacite: number;
  nombreChambres: number;
  chambresOccupees: number;
  statut: 'active' | 'inactive';
  caracteristiques: string[];
  tauxOccupation: number;
  revenusMensuel: number;
  couleur?: string;
  icone?: string;
}

interface CategoryFormData {
  nom: string;
  description: string;
  prixBase: number;
  capacite: number;
  statut: 'active' | 'inactive';
  caracteristiques: string[];
  couleur: string;
  icone: string;
}

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

const categoryIcons = [
  { value: 'bed', label: 'Lit simple', icon: '🛏️' },
  { value: 'bed-double', label: 'Lit double', icon: '🛏️' },
  { value: 'users', label: 'Famille', icon: '👨‍👩‍👧‍👦' },
  { value: 'star', label: 'Luxe', icon: '⭐' },
  { value: 'wheelchair', label: 'PMR', icon: '♿' },
  { value: 'mountain', label: 'Vue montagne', icon: '🏔️' },
  { value: 'waves', label: 'Vue mer', icon: '🌊' },
  { value: 'building', label: 'Vue ville', icon: '🏙️' }
];

const categoryColors = [
  { value: 'blue', label: 'Bleu', color: '#3B82F6' },
  { value: 'green', label: 'Vert', color: '#10B981' },
  { value: 'purple', label: 'Violet', color: '#8B5CF6' },
  { value: 'orange', label: 'Orange', color: '#F59E0B' },
  { value: 'red', label: 'Rouge', color: '#EF4444' },
  { value: 'pink', label: 'Rose', color: '#EC4899' },
  { value: 'indigo', label: 'Indigo', color: '#6366F1' },
  { value: 'teal', label: 'Teal', color: '#14B8A6' }
];

export default function RoomCategories() {
  const [categories, setCategories] = useState<RoomCategory[]>([
    {
      id: 1,
      nom: 'Chambre Simple',
      description: 'Chambre confortable pour une personne avec lit simple',
      prixBase: 45,
      capacite: 1,
      nombreChambres: 25,
      chambresOccupees: 18,
      statut: 'active',
      caracteristiques: ['Lit simple', 'Salle de bain privée', 'WiFi'],
      tauxOccupation: 72,
      revenusMensuel: 24300,
      couleur: 'blue',
      icone: 'bed'
    },
    {
      id: 2,
      nom: 'Chambre Double',
      description: 'Chambre spacieuse avec lit double pour deux personnes',
      prixBase: 65,
      capacite: 2,
      nombreChambres: 40,
      chambresOccupees: 32,
      statut: 'active',
      caracteristiques: ['Lit double', 'Salle de bain privée', 'WiFi', 'TV'],
      tauxOccupation: 80,
      revenusMensuel: 62400,
      couleur: 'green',
      icone: 'bed-double'
    },
    {
      id: 3,
      nom: 'Chambre Familiale',
      description: 'Grande chambre avec plusieurs lits pour familles',
      prixBase: 85,
      capacite: 4,
      nombreChambres: 15,
      chambresOccupees: 12,
      statut: 'active',
      caracteristiques: ['2 lits doubles', 'Salle de bain privée', 'WiFi', 'TV', 'Espace de jeu'],
      tauxOccupation: 80,
      revenusMensuel: 30600,
      couleur: 'purple',
      icone: 'users'
    },
    {
      id: 4,
      nom: 'Suite',
      description: 'Suite luxueuse avec salon séparé et services premium',
      prixBase: 120,
      capacite: 2,
      nombreChambres: 8,
      chambresOccupees: 6,
      statut: 'active',
      caracteristiques: ['Lit king', 'Salon séparé', 'Salle de bain luxueuse', 'WiFi', 'TV 4K', 'Mini-bar'],
      tauxOccupation: 75,
      revenusMensuel: 21600,
      couleur: 'orange',
      icone: 'star'
    },
    {
      id: 5,
      nom: 'Chambre Adaptée',
      description: 'Chambre spécialement conçue pour personnes à mobilité réduite',
      prixBase: 55,
      capacite: 2,
      nombreChambres: 5,
      chambresOccupees: 3,
      statut: 'active',
      caracteristiques: ['Accès PMR', 'Salle de bain adaptée', 'Lit double', 'WiFi'],
      tauxOccupation: 60,
      revenusMensuel: 4950,
      couleur: 'teal',
      icone: 'accessibility'
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<RoomCategory | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // État du formulaire
  const [formData, setFormData] = useState<CategoryFormData>({
    nom: '',
    description: '',
    prixBase: 45,
    capacite: 1,
    statut: 'active',
    caracteristiques: [],
    couleur: 'blue',
    icone: 'bed'
  });

  // Calculs globaux
  const totalChambres = categories.reduce((sum, cat) => sum + cat.nombreChambres, 0);
  const totalOccupees = categories.reduce((sum, cat) => sum + cat.chambresOccupees, 0);
  const tauxOccupationGlobal = totalChambres > 0 ? (totalOccupees / totalChambres * 100).toFixed(1) : '0';
  const revenusTotaux = categories.reduce((sum, cat) => sum + cat.revenusMensuel, 0);

  const getStatusColor = (statut: string) => {
    return statut === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getOccupationColor = (taux: number) => {
    if (taux >= 90) return 'text-red-600';
    if (taux >= 75) return 'text-orange-600';
    if (taux >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      prixBase: 45,
      capacite: 1,
      statut: 'active',
      caracteristiques: [],
      couleur: 'blue',
      icone: 'bed'
    });
  };

  const handleCreateCategory = () => {
    if (formData.nom && formData.description) {
      const newCategory: RoomCategory = {
        ...formData,
        id: Math.max(...categories.map(c => c.id), 0) + 1,
        nombreChambres: 0,
        chambresOccupees: 0,
        tauxOccupation: 0,
        revenusMensuel: 0
      };
      setCategories(prev => [...prev, newCategory]);
      setIsCreating(false);
      resetForm();
    }
  };

  const handleUpdateCategory = () => {
    if (selectedCategory && formData.nom && formData.description) {
      setCategories(prev => prev.map(category => 
        category.id === selectedCategory.id ? { ...category, ...formData } : category
      ));
      setIsEditing(false);
      setSelectedCategory(null);
      resetForm();
    }
  };

  const handleEditCategory = (category: RoomCategory) => {
    setFormData({
      nom: category.nom,
      description: category.description,
      prixBase: category.prixBase,
      capacite: category.capacite,
      statut: category.statut,
      caracteristiques: category.caracteristiques,
      couleur: category.couleur || 'blue',
      icone: category.icone || 'bed'
    });
    setSelectedCategory(category);
    setIsEditing(true);
  };

  const handleDeleteCategory = (categoryId: number) => {
    setCategories(prev => prev.filter(category => category.id !== categoryId));
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

  const getCategoryIcon = (iconValue: string) => {
    const icon = categoryIcons.find(i => i.value === iconValue);
    return icon ? icon.icon : '🛏️';
  };

  const getCategoryColor = (colorValue: string) => {
    const color = categoryColors.find(c => c.value === colorValue);
    return color ? color.color : '#3B82F6';
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle catégorie
        </Button>
      </div>



      {/* Liste des catégories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span 
                      className="text-2xl"
                      style={{ color: getCategoryColor(category.couleur || 'blue') }}
                    >
                      {getCategoryIcon(category.icone || 'bed')}
                    </span>
                    <span>{category.nom}</span>
                    <Badge className={getStatusColor(category.statut)}>
                      {category.statut === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {category.description}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setShowDeleteConfirm(category.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Statistiques de la catégorie */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Prix de base:</span>
                    <div className="font-semibold text-green-600">{category.prixBase}€</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Capacité:</span>
                    <div className="font-semibold">{category.capacite} personne(s)</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Nombre de chambres:</span>
                    <div className="font-semibold">{category.nombreChambres}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Taux d'occupation:</span>
                    <div className={`font-semibold ${getOccupationColor(category.tauxOccupation)}`}>
                      {category.tauxOccupation}%
                    </div>
                  </div>
                </div>

                {/* Caractéristiques */}
                <div>
                  <span className="text-sm text-gray-500">Caractéristiques:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {category.caracteristiques.map((carac, index) => (
                      <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                        {getCharacteristicIcon(carac)}
                        {carac}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Revenus */}
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Revenus mensuels:
                    </div>
                    <div className="font-semibold text-green-600">
                      {category.revenusMensuel.toLocaleString()}€
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de création de catégorie */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nouvelle catégorie</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Informations de base</h3>
                
                <div>
                  <Label htmlFor="nom">Nom de la catégorie *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    placeholder="Chambre Simple"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md h-20 resize-none"
                    placeholder="Description détaillée de la catégorie..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
              </div>

              {/* Apparence et caractéristiques */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Apparence et caractéristiques</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Icône</Label>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {categoryIcons.map(icon => (
                        <button
                          key={icon.value}
                          type="button"
                          onClick={() => setFormData({...formData, icone: icon.value})}
                          className={`p-2 rounded border-2 text-lg ${
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
                      {categoryColors.map(color => (
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
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleCreateCategory} 
                disabled={!formData.nom || !formData.description}
              >
                <Save className="h-4 w-4 mr-2" />
                Créer la catégorie
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition de catégorie */}
      {isEditing && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Modifier {selectedCategory.nom}</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Informations de base</h3>
                
                <div>
                  <Label htmlFor="edit-nom">Nom de la catégorie *</Label>
                  <Input
                    id="edit-nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    placeholder="Chambre Simple"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-description">Description *</Label>
                  <textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md h-20 resize-none"
                    placeholder="Description détaillée de la catégorie..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
              </div>

              {/* Apparence et caractéristiques */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Apparence et caractéristiques</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Icône</Label>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {categoryIcons.map(icon => (
                        <button
                          key={icon.value}
                          type="button"
                          onClick={() => setFormData({...formData, icone: icon.value})}
                          className={`p-2 rounded border-2 text-lg ${
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
                      {categoryColors.map(color => (
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
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleUpdateCategory} 
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
              Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.
            </p>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteCategory(showDeleteConfirm)}
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
