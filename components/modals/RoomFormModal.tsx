'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Bed, Home, Wifi, Tv, Coffee, Car, Users, MapPin, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useHotelEquipmentCRUD } from '@/hooks/useSupabase';
import { roomCategoriesApi } from '@/lib/api/roomCategories';
import type { HotelEquipment, RoomCategory } from '@/lib/supabase';

interface RoomFormData {
  id?: number;
  hotel_id: number;
  numero: string;
  type: string;
  prix: number;
  statut: 'disponible' | 'occupee' | 'maintenance';
  description?: string;
  floor?: number;
  room_size?: number;
  bed_type?: string;
  view_type?: string;
  is_smoking?: boolean;
  equipment_ids?: number[];
  images?: string[];
  notes?: string;
  category_id?: number;
}

interface RoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoomFormData) => Promise<void>;
  initialData?: Partial<RoomFormData>;
  isEditing?: boolean;
  loading?: boolean;
}

export default function RoomFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  loading = false
}: RoomFormModalProps) {
  const [formData, setFormData] = useState<RoomFormData>({
    hotel_id: initialData?.hotel_id || 1,
    numero: initialData?.numero || '',
    type: initialData?.type || 'Simple',
    prix: initialData?.prix || 45,
    statut: initialData?.statut || 'disponible',
    description: initialData?.description || '',
    floor: initialData?.floor || 1,
    room_size: initialData?.room_size || 20,
    bed_type: initialData?.bed_type || 'double',
    view_type: initialData?.view_type || '',
    is_smoking: initialData?.is_smoking || false,
    equipment_ids: initialData?.equipment_ids || [],
    images: initialData?.images || [],
    notes: initialData?.notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Types de chambres disponibles
  const roomTypes = [
    { value: 'Simple', label: 'Chambre Simple', capacity: 1, basePrice: 45 },
    { value: 'Double', label: 'Chambre Double', capacity: 2, basePrice: 65 },
    { value: 'Twin', label: 'Chambre Twin', capacity: 2, basePrice: 65 },
    { value: 'Familiale', label: 'Chambre Familiale', capacity: 4, basePrice: 85 },
    { value: 'Suite', label: 'Suite', capacity: 2, basePrice: 120 },
    { value: 'PMR', label: 'Chambre PMR', capacity: 2, basePrice: 55 },
    { value: 'Studio', label: 'Studio', capacity: 2, basePrice: 55 }
  ];

  // Charger les équipements disponibles pour l'hôtel de cette chambre
  const { equipments, loading: equipmentsLoading } = useHotelEquipmentCRUD(formData.hotel_id);
  
  // Charger les catégories de chambres
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await roomCategoriesApi.getCategories();
        if (response.success && response.data) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Filtrer et organiser les équipements actifs par catégorie
  const equipmentsByCategory = useMemo(() => {
    const activeEquipments = equipments.filter(eq => eq.est_actif);
    return activeEquipments.reduce((acc, equipment) => {
      const category = equipment.categorie || 'general';
      if (!acc[category]) acc[category] = [];
      acc[category].push(equipment);
      return acc;
    }, {} as Record<string, HotelEquipment[]>);
  }, [equipments]);

  // Fonction pour récupérer l'icône appropriée pour un équipement
  const getEquipmentIcon = (equipment: HotelEquipment) => {
    const iconName = equipment.icone?.toLowerCase();
    const categoryName = equipment.categorie?.toLowerCase();
    
    // Map des icônes par nom ou catégorie
    const iconMap: Record<string, any> = {
      wifi: Wifi,
      tv: Tv,
      television: Tv,
      coffee: Coffee,
      car: Car,
      parking: Car,
      users: Users,
      pmr: Users,
      accessibility: Users,
      map: MapPin,
      mappin: MapPin,
      home: Home,
      connectivity: Wifi,
      services: Settings,
      wellness: Home,
      recreation: Home,
      security: Home,
      general: Settings
    };

    // Essayer avec l'icône spécifique d'abord
    if (iconName && iconMap[iconName]) {
      return iconMap[iconName];
    }
    
    // Ensuite essayer avec la catégorie
    if (categoryName && iconMap[categoryName]) {
      return iconMap[categoryName];
    }
    
    // Par défaut selon la catégorie
    switch (equipment.categorie) {
      case 'connectivity':
        return Wifi;
      case 'services':
        return Coffee;
      case 'wellness':
        return Home;
      case 'accessibility':
        return Users;
      case 'security':
        return Home;
      case 'recreation':
        return Home;
      default:
        return Settings;
    }
  };

  // Initialiser le formulaire avec les données initiales
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        // Assurons-nous que l'hotel_id est toujours défini
        hotel_id: initialData.hotel_id || prev.hotel_id || 1,
        // Assurons-nous que les champs tableaux sont toujours définis
        equipment_ids: initialData.equipment_ids || prev.equipment_ids || [],
        images: initialData.images || prev.images || []
      }));
    }
  }, [initialData]);

  // Validation du formulaire
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.numero.trim()) {
      newErrors.numero = 'Le numéro de chambre est obligatoire';
    }

    if (!formData.type) {
      newErrors.type = 'Le type de chambre est obligatoire';
    }

    if (formData.prix <= 0) {
      newErrors.prix = 'Le prix doit être supérieur à 0';
    }

    if (formData.floor !== undefined && formData.floor < 0) {
      newErrors.floor = 'L\'étage ne peut pas être négatif';
    }

    if (formData.room_size !== undefined && formData.room_size <= 0) {
      newErrors.room_size = 'La surface doit être positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gérer les changements de champs
  const handleInputChange = (field: string, value: any) => {
    if (field === 'type') {
      const selectedType = roomTypes.find(t => t.value === value);
      if (selectedType) {
        setFormData(prev => ({ 
          ...prev, 
          [field]: value,
          prix: selectedType.basePrice 
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Gérer les équipements (maintenant avec des IDs)
  const handleEquipmentToggle = (equipmentId: number) => {
    setFormData(prev => {
      const currentEquipment = prev.equipment_ids || [];
      if (currentEquipment.includes(equipmentId)) {
        return {
          ...prev,
          equipment_ids: currentEquipment.filter(id => id !== equipmentId)
        };
      } else {
        return {
          ...prev,
          equipment_ids: [...currentEquipment, equipmentId]
        };
      }
    });
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  // Fermer le modal
  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Modifier la chambre' : 'Nouvelle chambre'}
            </h2>
            <p className="text-gray-600">
              {isEditing 
                ? 'Modifiez les informations de la chambre' 
                : 'Ajoutez une nouvelle chambre à votre établissement'
              }
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bed className="h-5 w-5" />
                  Informations de base
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="numero" className="text-sm font-medium text-gray-700">
                      Numéro de chambre *
                    </Label>
                    <Input
                      id="numero"
                      type="text"
                      value={formData.numero}
                      onChange={(e) => handleInputChange('numero', e.target.value)}
                      placeholder="Ex: 101"
                      className={errors.numero ? 'border-red-500' : ''}
                    />
                    {errors.numero && <p className="text-red-500 text-xs mt-1">{errors.numero}</p>}
                  </div>

                  <div>
                    <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                      Type de chambre *
                    </Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.type ? 'border-red-500' : ''
                      }`}
                    >
                      {roomTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                  </div>

                  <div>
                    <Label htmlFor="category_id" className="text-sm font-medium text-gray-700">
                      Catégorie
                    </Label>
                    <select
                      id="category_id"
                      value={formData.category_id || ''}
                      onChange={(e) => handleInputChange('category_id', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={categoriesLoading}
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name} ({category.capacity} pers.)
                        </option>
                      ))}
                    </select>
                    {categoriesLoading && (
                      <p className="text-xs text-gray-500 mt-1">Chargement des catégories...</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="prix" className="text-sm font-medium text-gray-700">
                      Prix par nuit (€) *
                    </Label>
                    <Input
                      id="prix"
                      type="number"
                      value={formData.prix}
                      onChange={(e) => handleInputChange('prix', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className={errors.prix ? 'border-red-500' : ''}
                    />
                    {errors.prix && <p className="text-red-500 text-xs mt-1">{errors.prix}</p>}
                  </div>

                  <div>
                    <Label htmlFor="statut" className="text-sm font-medium text-gray-700">
                      Statut
                    </Label>
                    <select
                      id="statut"
                      value={formData.statut}
                      onChange={(e) => handleInputChange('statut', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="disponible">Disponible</option>
                      <option value="occupee">Occupée</option>
                      <option value="maintenance">En maintenance</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="floor" className="text-sm font-medium text-gray-700">
                      Étage
                    </Label>
                    <Input
                      id="floor"
                      type="number"
                      value={formData.floor || ''}
                      onChange={(e) => handleInputChange('floor', parseInt(e.target.value) || 0)}
                      min="0"
                      className={errors.floor ? 'border-red-500' : ''}
                    />
                    {errors.floor && <p className="text-red-500 text-xs mt-1">{errors.floor}</p>}
                  </div>

                  <div>
                    <Label htmlFor="room_size" className="text-sm font-medium text-gray-700">
                      Surface (m²)
                    </Label>
                    <Input
                      id="room_size"
                      type="number"
                      value={formData.room_size || ''}
                      onChange={(e) => handleInputChange('room_size', parseFloat(e.target.value) || null)}
                      min="0"
                      step="0.1"
                      placeholder="Ex: 25"
                      className={errors.room_size ? 'border-red-500' : ''}
                    />
                    {errors.room_size && <p className="text-red-500 text-xs mt-1">{errors.room_size}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Détails de la chambre */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Détails de la chambre
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="bed_type" className="text-sm font-medium text-gray-700">
                      Type de lit
                    </Label>
                    <select
                      id="bed_type"
                      value={formData.bed_type || ''}
                      onChange={(e) => handleInputChange('bed_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner</option>
                      <option value="simple">Lit simple</option>
                      <option value="double">Lit double</option>
                      <option value="twin">Lits jumeaux</option>
                      <option value="king">Lit King Size</option>
                      <option value="multiple">Lits multiples</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="view_type" className="text-sm font-medium text-gray-700">
                      Type de vue
                    </Label>
                    <select
                      id="view_type"
                      value={formData.view_type || ''}
                      onChange={(e) => handleInputChange('view_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Aucune vue particulière</option>
                      <option value="mer">Vue mer</option>
                      <option value="jardin">Vue jardin</option>
                      <option value="ville">Vue ville</option>
                      <option value="cour">Vue cour</option>
                      <option value="montagne">Vue montagne</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="is_smoking" className="text-sm font-medium text-gray-700">
                      Chambre fumeur
                    </Label>
                    <select
                      id="is_smoking"
                      value={formData.is_smoking ? 'oui' : 'non'}
                      onChange={(e) => handleInputChange('is_smoking', e.target.value === 'oui')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="non">Non fumeur</option>
                      <option value="oui">Fumeur</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Description de la chambre..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="mt-6">
                  <Label htmlFor="images" className="text-sm font-medium text-gray-700">
                    Images URL (optionnel)
                  </Label>
                  <Textarea
                    id="images"
                    value={(formData.images || []).join('\n')}
                    onChange={(e) => handleInputChange('images', e.target.value.split('\n').filter(url => url.trim()))}
                    placeholder="URLs des images de la chambre (une par ligne)..."
                    rows={3}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Entrez une URL d'image par ligne
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Équipements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Équipements et services de la chambre
                </CardTitle>
              </CardHeader>
              <CardContent>
                {equipmentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Chargement des équipements...</span>
                  </div>
                ) : Object.keys(equipmentsByCategory).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(equipmentsByCategory).map(([category, categoryEquipments]) => {
                      // Labels des catégories
                      const categoryLabels: Record<string, string> = {
                        connectivity: '🌐 Connectivité',
                        multimedia: '📺 Multimédia',
                        comfort: '🛏️ Confort',
                        services: '☕ Services',
                        security: '🔒 Sécurité',
                        wellness: '💆 Bien-être',
                        accessibility: '♿ Accessibilité',
                        general: '⚙️ Général'
                      };
                      
                      return (
                        <div key={category}>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            {categoryLabels[category] || category}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {categoryEquipments.map(equipment => {
                              const IconComponent = getEquipmentIcon(equipment);
                              return (
                                <label 
                                  key={equipment.id} 
                                  className="flex items-start space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                  title={equipment.description || equipment.nom}
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.equipment_ids?.includes(equipment.id) || false}
                                    onChange={() => handleEquipmentToggle(equipment.id)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                                  />
                                  <IconComponent className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-sm text-gray-700 truncate">
                                      {equipment.nom}
                                    </span>
                                    {equipment.est_premium && (
                                      <span className="text-xs text-amber-600 font-medium">Premium</span>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500">
                        {formData.equipment_ids?.length || 0} équipement(s) sélectionné(s)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Aucun équipement disponible pour cet hôtel</p>
                    <p className="text-sm mt-1">
                      Les équipements doivent d'abord être ajoutés à l'hôtel dans la section Paramètres → Équipements.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes internes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes internes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Notes pour le personnel..."
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enregistrement...
                  </div>
                ) : (
                  isEditing ? 'Enregistrer les modifications' : 'Créer la chambre'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}