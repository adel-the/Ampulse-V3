'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit, Settings, Wifi, Tv, Coffee, Car, Users, MapPin, Home, Check, X, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useHotelEquipmentCRUD } from '@/hooks/useSupabase';
import type { HotelEquipment, HotelEquipmentInsert } from '@/lib/supabase';

interface HotelEquipmentManagementProps {
  hotelId: number;
  hotelName?: string;
}

// Equipment categories
const EQUIPMENT_CATEGORIES = [
  { value: 'connectivity', label: 'Connectivité', color: 'bg-blue-100 text-blue-800' },
  { value: 'multimedia', label: 'Multimédia', color: 'bg-purple-100 text-purple-800' },
  { value: 'comfort', label: 'Confort', color: 'bg-green-100 text-green-800' },
  { value: 'services', label: 'Services', color: 'bg-orange-100 text-orange-800' },
  { value: 'security', label: 'Sécurité', color: 'bg-red-100 text-red-800' },
  { value: 'wellness', label: 'Bien-être', color: 'bg-pink-100 text-pink-800' },
  { value: 'accessibility', label: 'Accessibilité', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'general', label: 'Général', color: 'bg-gray-100 text-gray-800' }
];

export default function HotelEquipmentManagement({ hotelId, hotelName }: HotelEquipmentManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<HotelEquipment | null>(null);
  const [formData, setFormData] = useState<Partial<HotelEquipmentInsert>>({
    nom: '',
    description: '',
    categorie: 'general',
    icone: '',
    couleur: '',
    est_premium: false,
    est_actif: true,
    ordre_affichage: 0
  });

  // Load hotel equipments using the new hook
  const { 
    equipments, 
    loading, 
    error,
    createEquipment, 
    updateEquipment,
    deleteEquipment 
  } = useHotelEquipmentCRUD(hotelId);

  // Get equipment icon
  const getEquipmentIcon = (equipment: HotelEquipment) => {
    const iconName = equipment.icone?.toLowerCase();
    const categoryName = equipment.categorie?.toLowerCase();
    
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
      settings: Settings
    };

    if (iconName && iconMap[iconName]) {
      return iconMap[iconName];
    }
    
    // Default icons by category
    switch (equipment.categorie) {
      case 'connectivity': return Wifi;
      case 'multimedia': return Tv;
      case 'comfort': return Home;
      case 'services': return Coffee;
      case 'security': return Settings;
      case 'wellness': return Home;
      case 'accessibility': return Users;
      default: return Settings;
    }
  };

  // Get category info
  const getCategoryInfo = (category: string) => {
    return EQUIPMENT_CATEGORIES.find(c => c.value === category) || 
           { value: category, label: category, color: 'bg-gray-100 text-gray-800' };
  };

  // Handle form submission for create/update
  const handleSubmit = async () => {
    if (!formData.nom?.trim()) {
      alert('Le nom de l\'équipement est obligatoire');
      return;
    }

    try {
      if (editingEquipment) {
        // Update existing equipment
        await updateEquipment(editingEquipment.id, formData);
      } else {
        // Create new equipment
        await createEquipment(formData as Omit<HotelEquipmentInsert, 'hotel_id'>);
      }

      // Reset form
      setShowAddModal(false);
      setEditingEquipment(null);
      setFormData({
        nom: '',
        description: '',
        categorie: 'general',
        icone: '',
        couleur: '',
        est_premium: false,
        est_actif: true,
        ordre_affichage: 0
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'équipement:', error);
      alert('Erreur lors de la sauvegarde de l\'équipement');
    }
  };

  // Handle edit
  const handleEdit = (equipment: HotelEquipment) => {
    setEditingEquipment(equipment);
    setFormData({
      nom: equipment.nom,
      description: equipment.description,
      categorie: equipment.categorie,
      icone: equipment.icone,
      couleur: equipment.couleur,
      est_premium: equipment.est_premium,
      est_actif: equipment.est_actif,
      ordre_affichage: equipment.ordre_affichage
    });
    setShowAddModal(true);
  };

  // Handle delete
  const handleDelete = async (equipment: HotelEquipment) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${equipment.nom}" ?`)) {
      try {
        await deleteEquipment(equipment.id);
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'équipement:', error);
        alert('Erreur lors de la suppression de l\'équipement');
      }
    }
  };

  // Open add modal
  const openAddModal = () => {
    setEditingEquipment(null);
    setFormData({
      nom: '',
      description: '',
      categorie: 'general',
      icone: '',
      couleur: '',
      est_premium: false,
      est_actif: true,
      ordre_affichage: 0
    });
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des équipements...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
        Erreur lors du chargement des équipements: {error}
      </div>
    );
  }

  // Group equipments by category
  const equipmentsByCategory = equipments.reduce((acc, equipment) => {
    const category = equipment.categorie || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(equipment);
    return acc;
  }, {} as Record<string, HotelEquipment[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Équipements de l'hôtel</h2>
          {hotelName && <p className="text-gray-600">{hotelName}</p>}
          <p className="text-sm text-gray-500 mt-1">
            {equipments.length} équipement{equipments.length > 1 ? 's' : ''} configuré{equipments.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un équipement
        </Button>
      </div>

      {/* Equipment list by category */}
      {Object.entries(equipmentsByCategory).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Aucun équipement configuré pour cet hôtel</p>
            <Button onClick={openAddModal} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter votre premier équipement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(equipmentsByCategory).map(([category, items]) => {
            const categoryInfo = getCategoryInfo(category);
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {categoryInfo.label}
                    <Badge className={categoryInfo.color}>
                      {items.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(equipment => {
                      const IconComponent = getEquipmentIcon(equipment);
                      return (
                        <div 
                          key={equipment.id} 
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <IconComponent className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {equipment.nom}
                                {equipment.est_premium && (
                                  <Badge className="ml-2 bg-yellow-100 text-yellow-800" variant="secondary">
                                    Premium
                                  </Badge>
                                )}
                              </p>
                              {equipment.description && (
                                <p className="text-sm text-gray-500 line-clamp-1">
                                  {equipment.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => handleEdit(equipment)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(equipment)}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">
                  {editingEquipment ? 'Modifier l\'équipement' : 'Ajouter un équipement'}
                </h3>
                <Button
                  onClick={() => setShowAddModal(false)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Nom */}
                <div>
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Ex: WiFi Gratuit"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description de l'équipement"
                    rows={3}
                  />
                </div>

                {/* Catégorie */}
                <div>
                  <Label htmlFor="categorie">Catégorie</Label>
                  <select
                    id="categorie"
                    value={formData.categorie}
                    onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {EQUIPMENT_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Icône */}
                <div>
                  <Label htmlFor="icone">Icône (nom)</Label>
                  <Input
                    id="icone"
                    value={formData.icone}
                    onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                    placeholder="Ex: wifi, tv, coffee"
                  />
                </div>

                {/* Premium */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="est_premium"
                    checked={formData.est_premium}
                    onChange={(e) => setFormData({ ...formData, est_premium: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="est_premium" className="cursor-pointer">
                    Équipement premium
                  </Label>
                </div>

                {/* Actif */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="est_actif"
                    checked={formData.est_actif}
                    onChange={(e) => setFormData({ ...formData, est_actif: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="est_actif" className="cursor-pointer">
                    Équipement actif
                  </Label>
                </div>

                {/* Ordre d'affichage */}
                <div>
                  <Label htmlFor="ordre">Ordre d'affichage</Label>
                  <Input
                    id="ordre"
                    type="number"
                    value={formData.ordre_affichage}
                    onChange={(e) => setFormData({ ...formData, ordre_affichage: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingEquipment ? 'Enregistrer' : 'Ajouter'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}