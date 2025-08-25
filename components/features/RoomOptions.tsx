'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Bed, 
  Bell, 
  Utensils, 
  Car, 
  Gamepad2, 
  Briefcase,
  Coffee,
  Wifi,
  Heart,
  Dumbbell,
  Plane,
  Bike,
  Waves,
  Users,
  Printer,
  Pill,
  Layers,
  Clock,
  Sparkles,
  ChefHat
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  OptionCategory, 
  RoomOption, 
  RoomOptionWithDetails, 
  OptionPack,
  Hotel 
} from '../../types';

interface RoomOptionsProps {
  hotelId?: number;
  roomId?: number;
  onOptionsChange?: (options: RoomOptionWithDetails[]) => void;
  selectedOptions?: RoomOptionWithDetails[];
  readOnly?: boolean;
}

interface NewOptionFormData {
  nom: string;
  description: string;
  categorieId: number;
  type: 'option' | 'supplement' | 'service';
  prix: number;
  prixType: 'fixe' | 'pourcentage' | 'par_nuit' | 'par_personne';
  unite: string;
  obligatoire: boolean;
  maxQuantite: number;
  minQuantite: number;
  icone: string;
  couleur: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  bed: <Bed className="h-4 w-4" />,
  bell: <Bell className="h-4 w-4" />,
  utensils: <Utensils className="h-4 w-4" />,
  car: <Car className="h-4 w-4" />,
  'gamepad-2': <Gamepad2 className="h-4 w-4" />,
  briefcase: <Briefcase className="h-4 w-4" />,
  coffee: <Coffee className="h-4 w-4" />,
  wifi: <Wifi className="h-4 w-4" />,
  heart: <Heart className="h-4 w-4" />,
  dumbbell: <Dumbbell className="h-4 w-4" />,
  plane: <Plane className="h-4 w-4" />,
  bike: <Bike className="h-4 w-4" />,
  waves: <Waves className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  printer: <Printer className="h-4 w-4" />,
  pillow: <Pill className="h-4 w-4" />,
  blanket: <Layers className="h-4 w-4" />,
  'alarm-clock': <Clock className="h-4 w-4" />,
  sparkles: <Sparkles className="h-4 w-4" />,
  'chef-hat': <ChefHat className="h-4 w-4" />
};

export default function RoomOptions({ 
  hotelId, 
  roomId, 
  onOptionsChange, 
  selectedOptions = [], 
  readOnly = false 
}: RoomOptionsProps) {
  const [categories, setCategories] = useState<OptionCategory[]>([]);
  const [options, setOptions] = useState<RoomOptionWithDetails[]>([]);
  const [packs, setPacks] = useState<OptionPack[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [editingOption, setEditingOption] = useState<RoomOption | null>(null);
  const [newOptionForm, setNewOptionForm] = useState<NewOptionFormData>({
    nom: '',
    description: '',
    categorieId: 1,
    type: 'option',
    prix: 0,
    prixType: 'fixe',
    unite: '€',
    obligatoire: false,
    maxQuantite: 1,
    minQuantite: 0,
    icone: 'bed',
    couleur: '#3B82F6'
  });

  // Charger les données
  useEffect(() => {
    loadCategories();
    loadOptions();
    loadPacks();
  }, [hotelId, roomId]);

  const loadCategories = async () => {
    try {
      // Simulation - remplacer par l'appel API réel
      const mockCategories: OptionCategory[] = [
        { id: 1, nom: 'Confort', description: 'Options de confort', icone: 'bed', couleur: '#10B981', ordre: 1, actif: true },
        { id: 2, nom: 'Services', description: 'Services hôteliers', icone: 'bell', couleur: '#3B82F6', ordre: 2, actif: true },
        { id: 3, nom: 'Restauration', description: 'Options de restauration', icone: 'utensils', couleur: '#F59E0B', ordre: 3, actif: true },
        { id: 4, nom: 'Transport', description: 'Services de transport', icone: 'car', couleur: '#8B5CF6', ordre: 4, actif: true },
        { id: 5, nom: 'Loisirs', description: 'Activités et loisirs', icone: 'gamepad-2', couleur: '#EC4899', ordre: 5, actif: true },
        { id: 6, nom: 'Business', description: 'Services professionnels', icone: 'briefcase', couleur: '#6B7280', ordre: 6, actif: true }
      ];
      setCategories(mockCategories);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const loadOptions = async () => {
    try {
      // Simulation - remplacer par l'appel API réel
      const mockOptions: RoomOptionWithDetails[] = [
        {
          id: 1,
          nom: 'Lit supplémentaire',
          description: 'Lit d\'appoint pour une personne supplémentaire',
          categorieId: 1,
          type: 'supplement',
          prix: 25,
          prixType: 'par_nuit',
          unite: '€',
          disponible: true,
          obligatoire: false,
          maxQuantite: 2,
          minQuantite: 0,
          icone: 'bed',
          couleur: '#10B981',
          ordre: 1,
          categorie: categories.find(c => c.id === 1)
        },
        {
          id: 2,
          nom: 'Petit-déjeuner',
          description: 'Petit-déjeuner continental servi en chambre',
          categorieId: 3,
          type: 'service',
          prix: 12,
          prixType: 'par_personne',
          unite: '€',
          disponible: true,
          obligatoire: false,
          maxQuantite: 4,
          minQuantite: 0,
          icone: 'coffee',
          couleur: '#F59E0B',
          ordre: 1,
          categorie: categories.find(c => c.id === 3)
        },
        {
          id: 3,
          nom: 'WiFi premium',
          description: 'Connexion WiFi haute vitesse illimitée',
          categorieId: 6,
          type: 'option',
          prix: 5,
          prixType: 'par_nuit',
          unite: '€',
          disponible: true,
          obligatoire: false,
          maxQuantite: 4,
          minQuantite: 0,
          icone: 'wifi',
          couleur: '#6B7280',
          ordre: 1,
          categorie: categories.find(c => c.id === 6)
        }
      ];
      setOptions(mockOptions);
    } catch (error) {
      console.error('Erreur lors du chargement des options:', error);
    }
  };

  const loadPacks = async () => {
    try {
      // Simulation - remplacer par l'appel API réel
      const mockPacks: OptionPack[] = [
        {
          id: 1,
          nom: 'Pack Confort',
          description: 'Options de confort pour un séjour agréable',
          prixPack: 35,
          reductionPourcentage: 10,
          actif: true,
          ordre: 1
        },
        {
          id: 2,
          nom: 'Pack Business',
          description: 'Services professionnels pour les voyageurs d\'affaires',
          prixPack: 25,
          reductionPourcentage: 15,
          actif: true,
          ordre: 2
        }
      ];
      setPacks(mockPacks);
    } catch (error) {
      console.error('Erreur lors du chargement des packs:', error);
    }
  };

  const handleAddOption = () => {
    setIsAddingOption(true);
    setEditingOption(null);
  };

  const handleEditOption = (option: RoomOption) => {
    setEditingOption(option);
    setNewOptionForm({
      nom: option.nom,
      description: option.description || '',
      categorieId: option.categorieId || 1,
      type: option.type,
      prix: option.prix,
      prixType: option.prixType,
      unite: option.unite,
      obligatoire: option.obligatoire,
      maxQuantite: option.maxQuantite,
      minQuantite: option.minQuantite,
      icone: option.icone || 'bed',
      couleur: option.couleur
    });
    setIsAddingOption(true);
  };

  const handleSaveOption = async () => {
    try {
      if (editingOption) {
        // Mettre à jour l'option existante
        const updatedOptions = options.map(opt => 
          opt.id === editingOption.id 
            ? { ...opt, ...newOptionForm }
            : opt
        );
        setOptions(updatedOptions);
      } else {
        // Créer une nouvelle option
        const newOption: RoomOptionWithDetails = {
          id: Date.now(), // Simulation d'ID
          ...newOptionForm,
          disponible: true,
          conditionsApplication: {},
          ordre: 0,
          categorie: categories.find(c => c.id === newOptionForm.categorieId)
        };
        setOptions([...options, newOption]);
      }

      // Réinitialiser le formulaire
      setNewOptionForm({
        nom: '',
        description: '',
        categorieId: 1,
        type: 'option',
        prix: 0,
        prixType: 'fixe',
        unite: '€',
        obligatoire: false,
        maxQuantite: 1,
        minQuantite: 0,
        icone: 'bed',
        couleur: '#3B82F6'
      });
      setIsAddingOption(false);
      setEditingOption(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleDeleteOption = async (optionId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette option ?')) {
      try {
        const updatedOptions = options.filter(opt => opt.id !== optionId);
        setOptions(updatedOptions);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleOptionSelection = (option: RoomOptionWithDetails, quantite: number) => {
    const updatedSelectedOptions = [...selectedOptions];
    const existingIndex = updatedSelectedOptions.findIndex(opt => opt.id === option.id);

    if (quantite > 0) {
      if (existingIndex >= 0) {
        updatedSelectedOptions[existingIndex].quantiteSelectionnee = quantite;
      } else {
        updatedSelectedOptions.push({ ...option, quantiteSelectionnee: quantite });
      }
    } else {
      if (existingIndex >= 0) {
        updatedSelectedOptions.splice(existingIndex, 1);
      }
    }

    onOptionsChange?.(updatedSelectedOptions);
  };

  const getFilteredOptions = () => {
    if (selectedCategory === 'all') {
      return options;
    }
    return options.filter(option => 
      option.categorie?.nom === selectedCategory
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'option': return 'bg-blue-100 text-blue-800';
      case 'supplement': return 'bg-green-100 text-green-800';
      case 'service': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'option': return 'Option';
      case 'supplement': return 'Supplément';
      case 'service': return 'Service';
      default: return type;
    }
  };

  const calculateOptionPrice = (option: RoomOptionWithDetails, quantite: number = 1) => {
    switch (option.prixType) {
      case 'fixe':
        return option.prix * quantite;
      case 'pourcentage':
        return (option.prix / 100) * quantite; // Prix de base nécessaire
      case 'par_nuit':
        return option.prix * quantite; // Nombre de nuits nécessaire
      case 'par_personne':
        return option.prix * quantite; // Nombre de personnes nécessaire
      default:
        return option.prix * quantite;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Options et suppléments</h2>
          <p className="text-gray-600">Gérez les options, suppléments et services disponibles</p>
        </div>
        {!readOnly && (
          <Button onClick={handleAddOption} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle option
          </Button>
        )}
      </div>

      <Tabs defaultValue="options" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="options">Options disponibles</TabsTrigger>
          <TabsTrigger value="packs">Packs d'options</TabsTrigger>
          <TabsTrigger value="selected">Options sélectionnées</TabsTrigger>
        </TabsList>

        <TabsContent value="options" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                  size="sm"
                >
                  Toutes
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.nom ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(category.nom)}
                    size="sm"
                    style={{ backgroundColor: selectedCategory === category.nom ? category.couleur : undefined }}
                  >
                    {ICON_MAP[category.icone || 'bed']}
                    <span className="ml-2">{category.nom}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Liste des options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredOptions().map((option) => {
              const selectedOption = selectedOptions.find(so => so.id === option.id);
              const quantiteSelectionnee = selectedOption?.quantiteSelectionnee || 0;

              return (
                <Card key={option.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: option.couleur + '20', color: option.couleur }}
                        >
                          {ICON_MAP[option.icone || 'bed']}
                        </div>
                        <div>
                          <CardTitle className="text-base">{option.nom}</CardTitle>
                          <Badge className={getTypeColor(option.type)}>
                            {getTypeLabel(option.type)}
                          </Badge>
                        </div>
                      </div>
                      {!readOnly && (
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditOption(option)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOption(option.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {option.description && (
                      <p className="text-sm text-gray-600">{option.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold">
                        {option.prix} {option.unite}
                        {option.prixType !== 'fixe' && (
                          <span className="text-sm text-gray-500 ml-1">
                            / {option.prixType === 'par_nuit' ? 'nuit' : 
                                option.prixType === 'par_personne' ? 'personne' : '%'}
                          </span>
                        )}
                      </div>
                      {option.obligatoire && (
                        <Badge variant="destructive">Obligatoire</Badge>
                      )}
                    </div>

                    {!readOnly && (
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`quantite-${option.id}`} className="text-sm">
                          Quantité:
                        </Label>
                        <Input
                          id={`quantite-${option.id}`}
                          type="number"
                          min={option.minQuantite}
                          max={option.maxQuantite}
                          value={quantiteSelectionnee}
                          onChange={(e) => handleOptionSelection(option, parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <span className="text-sm text-gray-500">
                          max: {option.maxQuantite}
                        </span>
                      </div>
                    )}

                    {quantiteSelectionnee > 0 && (
                      <div className="bg-green-50 p-2 rounded-lg">
                        <p className="text-sm font-medium text-green-800">
                          Total: {calculateOptionPrice(option, quantiteSelectionnee)} {option.unite}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="packs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packs.map((pack) => (
              <Card key={pack.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{pack.nom}</span>
                    <Badge variant="secondary">
                      -{pack.reductionPourcentage}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{pack.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold">
                      {pack.prixPack} €
                    </div>
                    {!readOnly && (
                      <Button size="sm" variant="outline">
                        Sélectionner le pack
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="selected" className="space-y-4">
          {selectedOptions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Aucune option sélectionnée</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {selectedOptions.map((option) => (
                <Card key={option.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: option.couleur + '20', color: option.couleur }}
                      >
                        {ICON_MAP[option.icone || 'bed']}
                      </div>
                      <div>
                        <h3 className="font-medium">{option.nom}</h3>
                        <p className="text-sm text-gray-500">
                          Quantité: {option.quantiteSelectionnee}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {calculateOptionPrice(option, option.quantiteSelectionnee || 0)} {option.unite}
                      </div>
                      <div className="text-sm text-gray-500">
                        {option.prix} {option.unite} / unité
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total des options:</span>
                    <span>
                      {selectedOptions.reduce((total, option) => 
                        total + calculateOptionPrice(option, option.quantiteSelectionnee || 0), 0
                      )} €
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal pour ajouter/éditer une option */}
      {isAddingOption && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold">
                {editingOption ? 'Modifier l\'option' : 'Nouvelle option'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingOption(false);
                  setEditingOption(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={newOptionForm.nom}
                    onChange={(e) => setNewOptionForm({...newOptionForm, nom: e.target.value})}
                    placeholder="Nom de l'option"
                  />
                </div>
                <div>
                  <Label htmlFor="categorie">Catégorie *</Label>
                  <select
                    id="categorie"
                    value={newOptionForm.categorieId}
                    onChange={(e) => setNewOptionForm({...newOptionForm, categorieId: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newOptionForm.description}
                  onChange={(e) => setNewOptionForm({...newOptionForm, description: e.target.value})}
                  placeholder="Description de l'option"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <select
                    id="type"
                    value={newOptionForm.type}
                    onChange={(e) => setNewOptionForm({...newOptionForm, type: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="option">Option</option>
                    <option value="supplement">Supplément</option>
                    <option value="service">Service</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="prix">Prix *</Label>
                  <Input
                    id="prix"
                    type="number"
                    step="0.01"
                    value={newOptionForm.prix}
                    onChange={(e) => setNewOptionForm({...newOptionForm, prix: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="prixType">Type de prix *</Label>
                  <select
                    id="prixType"
                    value={newOptionForm.prixType}
                    onChange={(e) => setNewOptionForm({...newOptionForm, prixType: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="fixe">Fixe</option>
                    <option value="pourcentage">Pourcentage</option>
                    <option value="par_nuit">Par nuit</option>
                    <option value="par_personne">Par personne</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="unite">Unité</Label>
                  <Input
                    id="unite"
                    value={newOptionForm.unite}
                    onChange={(e) => setNewOptionForm({...newOptionForm, unite: e.target.value})}
                    placeholder="€"
                  />
                </div>
                <div>
                  <Label htmlFor="minQuantite">Quantité min</Label>
                  <Input
                    id="minQuantite"
                    type="number"
                    value={newOptionForm.minQuantite}
                    onChange={(e) => setNewOptionForm({...newOptionForm, minQuantite: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="maxQuantite">Quantité max</Label>
                  <Input
                    id="maxQuantite"
                    type="number"
                    value={newOptionForm.maxQuantite}
                    onChange={(e) => setNewOptionForm({...newOptionForm, maxQuantite: parseInt(e.target.value) || 1})}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    id="obligatoire"
                    type="checkbox"
                    checked={newOptionForm.obligatoire}
                    onChange={(e) => setNewOptionForm({...newOptionForm, obligatoire: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="obligatoire">Obligatoire</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 p-6 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingOption(false);
                  setEditingOption(null);
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleSaveOption} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                {editingOption ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
