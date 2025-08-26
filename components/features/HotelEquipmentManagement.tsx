'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit, Settings, Wifi, Tv, Coffee, Car, Users, MapPin, Home, Euro, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useHotelEquipments, useEquipments } from '@/hooks/useSupabase';
import type { Equipment, EquipmentWithHotelInfo, HotelEquipmentInsert } from '@/lib/supabase';

interface HotelEquipmentManagementProps {
  hotelId: number;
  hotelName: string;
}

export default function HotelEquipmentManagement({ hotelId, hotelName }: HotelEquipmentManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [equipmentData, setEquipmentData] = useState<Partial<HotelEquipmentInsert>>({
    est_disponible: true,
    est_gratuit: true,
    prix_supplement: null,
    description_specifique: '',
    conditions_usage: '',
    notes_internes: ''
  });

  // Load hotel equipments and all available equipments
  const { equipments: hotelEquipments, loading: hotelLoading, addEquipmentToHotel, removeEquipmentFromHotel } = useHotelEquipments(hotelId);
  const { equipments: allEquipments, loading: allLoading } = useEquipments({ est_actif: true });

  // Get equipment icon
  const getEquipmentIcon = (equipment: Equipment) => {
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
      connectivity: Wifi,
      services: Settings,
      wellness: Home,
      recreation: Home,
      security: Home,
      general: Settings
    };

    if (iconName && iconMap[iconName]) {
      return iconMap[iconName];
    }
    
    if (categoryName && iconMap[categoryName]) {
      return iconMap[categoryName];
    }
    
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

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'connectivity': return 'bg-blue-100 text-blue-800';
      case 'services': return 'bg-green-100 text-green-800';
      case 'wellness': return 'bg-purple-100 text-purple-800';
      case 'accessibility': return 'bg-orange-100 text-orange-800';
      case 'security': return 'bg-red-100 text-red-800';
      case 'recreation': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get available equipments (not yet added to hotel)
  const availableEquipments = allEquipments.filter(equipment => 
    !hotelEquipments.some(he => he.id === equipment.id && he.is_available_in_hotel)
  );

  const handleAddEquipment = async () => {
    if (!selectedEquipmentId) return;

    try {
      await addEquipmentToHotel(selectedEquipmentId, equipmentData);
      setShowAddModal(false);
      setSelectedEquipmentId(null);
      setEquipmentData({
        est_disponible: true,
        est_gratuit: true,
        prix_supplement: null,
        description_specifique: '',
        conditions_usage: '',
        notes_internes: ''
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'équipement:', error);
    }
  };

  const handleRemoveEquipment = async (equipmentId: number) => {
    if (confirm('Êtes-vous sûr de vouloir retirer cet équipement de l\'hôtel ?')) {
      try {
        await removeEquipmentFromHotel(equipmentId);
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'équipement:', error);
      }
    }
  };

  if (hotelLoading || allLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des équipements...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Équipements de l'hôtel</h2>
          <p className="text-gray-600">{hotelName}</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} disabled={availableEquipments.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un équipement
        </Button>
      </div>

      {/* Current hotel equipments */}
      <Card>
        <CardHeader>
          <CardTitle>Équipements disponibles ({hotelEquipments.filter(e => e.is_available_in_hotel).length})</CardTitle>
        </CardHeader>
        <CardContent>
          {hotelEquipments.filter(e => e.is_available_in_hotel).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>Aucun équipement configuré pour cet hôtel</p>
              <p className="text-sm mt-1">Ajoutez des équipements pour les rendre disponibles aux chambres.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotelEquipments
                .filter(equipment => equipment.is_available_in_hotel)
                .map(equipment => {
                  const IconComponent = getEquipmentIcon(equipment);
                  return (
                    <div key={equipment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <IconComponent className="h-5 w-5 text-gray-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">{equipment.nom}</h3>
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(equipment.categorie)}`}>
                              {equipment.categorie}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEquipment(equipment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          {equipment.is_free ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Gratuit
                            </span>
                          ) : (
                            <span className="text-blue-600 flex items-center gap-1">
                              <Euro className="h-3 w-3" />
                              {equipment.supplement_price}€ supplément
                            </span>
                          )}
                          {equipment.est_premium && (
                            <span className="text-yellow-600 text-xs font-medium">Premium</span>
                          )}
                        </div>
                        
                        {equipment.hotel_equipment?.description_specifique && (
                          <p className="text-sm text-gray-600 mt-2">
                            {equipment.hotel_equipment.description_specifique}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add equipment modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Ajouter un équipement</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Equipment selection */}
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Sélectionner un équipement
                </Label>
                <div className="mt-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                  {availableEquipments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Tous les équipements ont déjà été ajoutés à cet hôtel
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {availableEquipments.map(equipment => {
                        const IconComponent = getEquipmentIcon(equipment);
                        return (
                          <label 
                            key={equipment.id} 
                            className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="radio"
                              name="equipment"
                              value={equipment.id}
                              checked={selectedEquipmentId === equipment.id}
                              onChange={() => setSelectedEquipmentId(equipment.id)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <IconComponent className="h-4 w-4 text-gray-500" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{equipment.nom}</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(equipment.categorie)}`}>
                                  {equipment.categorie}
                                </span>
                              </div>
                              {equipment.description && (
                                <p className="text-xs text-gray-600 mt-1">{equipment.description}</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {selectedEquipmentId && (
                <>
                  {/* Equipment settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Disponibilité
                      </Label>
                      <select
                        value={equipmentData.est_disponible ? 'true' : 'false'}
                        onChange={(e) => setEquipmentData(prev => ({ ...prev, est_disponible: e.target.value === 'true' }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="true">Disponible</option>
                        <option value="false">Indisponible</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Tarification
                      </Label>
                      <select
                        value={equipmentData.est_gratuit ? 'true' : 'false'}
                        onChange={(e) => setEquipmentData(prev => ({ 
                          ...prev, 
                          est_gratuit: e.target.value === 'true',
                          prix_supplement: e.target.value === 'true' ? null : prev.prix_supplement
                        }))}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="true">Gratuit</option>
                        <option value="false">Payant</option>
                      </select>
                    </div>
                  </div>

                  {!equipmentData.est_gratuit && (
                    <div>
                      <Label htmlFor="prix_supplement" className="text-sm font-medium text-gray-700">
                        Prix du supplément (€)
                      </Label>
                      <Input
                        id="prix_supplement"
                        type="number"
                        step="0.01"
                        min="0"
                        value={equipmentData.prix_supplement || ''}
                        onChange={(e) => setEquipmentData(prev => ({ 
                          ...prev, 
                          prix_supplement: e.target.value ? parseFloat(e.target.value) : null 
                        }))}
                        placeholder="Ex: 5.00"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="description_specifique" className="text-sm font-medium text-gray-700">
                      Description spécifique (optionnel)
                    </Label>
                    <Textarea
                      id="description_specifique"
                      value={equipmentData.description_specifique || ''}
                      onChange={(e) => setEquipmentData(prev => ({ ...prev, description_specifique: e.target.value }))}
                      placeholder="Description particulière pour cet hôtel..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="conditions_usage" className="text-sm font-medium text-gray-700">
                      Conditions d'usage (optionnel)
                    </Label>
                    <Textarea
                      id="conditions_usage"
                      value={equipmentData.conditions_usage || ''}
                      onChange={(e) => setEquipmentData(prev => ({ ...prev, conditions_usage: e.target.value }))}
                      placeholder="Conditions particulières d'utilisation..."
                      rows={2}
                    />
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleAddEquipment} 
                  disabled={!selectedEquipmentId}
                >
                  Ajouter l'équipement
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}