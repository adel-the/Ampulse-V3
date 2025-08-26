'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Filter, Search, Wifi, Tv, Coffee, Car, Home, Users, Shield, Settings, X, Save, Building2, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useHotelEquipmentCRUD } from '@/hooks/useSupabase';
import { establishmentsApi } from '@/lib/api/establishments';
import { useNotifications } from '@/hooks/useNotifications';
import type { HotelEquipment, HotelEquipmentInsert } from '@/lib/supabase';
import type { Establishment } from '@/lib/api/establishments';

// Equipment categories with French labels and colors
const EQUIPMENT_CATEGORIES = [
  { value: 'connectivity', label: 'Connectivité', color: 'bg-blue-100 text-blue-800', icon: Wifi },
  { value: 'multimedia', label: 'Multimédia', color: 'bg-purple-100 text-purple-800', icon: Tv },
  { value: 'comfort', label: 'Confort', color: 'bg-green-100 text-green-800', icon: Home },
  { value: 'services', label: 'Services', color: 'bg-orange-100 text-orange-800', icon: Coffee },
  { value: 'security', label: 'Sécurité', color: 'bg-red-100 text-red-800', icon: Shield },
  { value: 'wellness', label: 'Bien-être', color: 'bg-pink-100 text-pink-800', icon: Users },
  { value: 'accessibility', label: 'Accessibilité', color: 'bg-indigo-100 text-indigo-800', icon: Users },
  { value: 'general', label: 'Général', color: 'bg-gray-100 text-gray-800', icon: Settings }
];

export default function EquipmentsSection() {
  // Hotel selection state
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [loadingHotels, setLoadingHotels] = useState(true);

  // Modal and form state
  const [showModal, setShowModal] = useState(false);
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

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('active');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  const { addNotification } = useNotifications();

  // Load hotel equipments using the hook
  const {
    equipments,
    loading: loadingEquipments,
    error: equipmentsError,
    createEquipment,
    updateEquipment,
    deleteEquipment
  } = useHotelEquipmentCRUD(selectedHotelId || undefined);

  // Load establishments on mount
  useEffect(() => {
    loadEstablishments();
  }, []);

  const loadEstablishments = async () => {
    try {
      setLoadingHotels(true);
      const response = await establishmentsApi.getEstablishments();
      if (response.success && response.data) {
        setEstablishments(response.data);
        // Auto-select first hotel if available
        if (response.data.length > 0 && !selectedHotelId) {
          setSelectedHotelId(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des établissements:', error);
      addNotification('error', 'Erreur lors du chargement des établissements');
    } finally {
      setLoadingHotels(false);
    }
  };

  // Get equipment icon
  const getEquipmentIcon = (equipment: HotelEquipment) => {
    const category = EQUIPMENT_CATEGORIES.find(c => c.value === equipment.categorie);
    return category ? category.icon : Settings;
  };

  // Filter equipments
  const filteredEquipments = equipments.filter(equipment => {
    // Search filter
    if (searchTerm && !equipment.nom.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (!equipment.description || !equipment.description.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }

    // Active filter
    if (filterActive === 'active' && !equipment.est_actif) {
      return false;
    }
    if (filterActive === 'inactive' && equipment.est_actif) {
      return false;
    }

    return true;
  });


  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedHotelId) {
      addNotification('error', 'Veuillez sélectionner un hôtel');
      return;
    }

    if (!formData.nom?.trim()) {
      addNotification('error', 'Le nom de l\'équipement est obligatoire');
      return;
    }

    try {
      let response;
      if (editingEquipment) {
        // Update existing equipment
        response = await updateEquipment(editingEquipment.id, formData);
      } else {
        // Create new equipment
        response = await createEquipment(formData as Omit<HotelEquipmentInsert, 'hotel_id'>);
      }

      if (response.success) {
        addNotification('success', editingEquipment ? 'Équipement modifié avec succès' : 'Équipement créé avec succès');
        handleCloseModal();
      } else {
        addNotification('error', response.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addNotification('error', 'Erreur lors de la sauvegarde de l\'équipement');
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
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (equipment: HotelEquipment) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${equipment.nom}" ?`)) {
      try {
        const response = await deleteEquipment(equipment.id);
        if (response.success) {
          addNotification('success', 'Équipement supprimé avec succès');
        } else {
          addNotification('error', response.error || 'Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        addNotification('error', 'Erreur lors de la suppression de l\'équipement');
      }
    }
  };

  // Handle toggle active
  const handleToggleActive = async (equipment: HotelEquipment) => {
    try {
      const response = await updateEquipment(equipment.id, {
        est_actif: !equipment.est_actif
      });
      if (response.success) {
        addNotification('success', equipment.est_actif ? 'Équipement désactivé' : 'Équipement activé');
      } else {
        addNotification('error', response.error || 'Erreur lors du changement de statut');
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      addNotification('error', 'Erreur lors du changement de statut');
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
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
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
  };

  // Loading state
  if (loadingHotels) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Chargement des hôtels...</span>
      </div>
    );
  }

  // No hotels available
  if (establishments.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun établissement disponible</h3>
        <p className="text-gray-600">Veuillez créer un établissement avant de gérer les équipements</p>
      </Card>
    );
  }

  return (
    <div>
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Gestion des équipements</h1>
            <p className="text-sm text-gray-600 mt-1">Gérez les équipements disponibles par établissement</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Hotel selector */}
            <div className="flex items-center gap-2">
              <Label className="text-sm">Établissement :</Label>
              <select
                value={selectedHotelId || ''}
                onChange={(e) => setSelectedHotelId(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {establishments.map(hotel => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.nom} - {hotel.ville}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={openAddModal} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un équipement
            </Button>
          </div>
        </div>
      </div>


      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher un équipement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Active filter */}
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tous</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>

        {/* View mode toggle */}
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Tableau
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            Liste
          </Button>
        </div>
      </div>

      {/* Equipment display */}
      {loadingEquipments ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Chargement des équipements...</span>
        </div>
      ) : equipmentsError ? (
        <Card className="p-8 text-center">
          <p className="text-red-600">Erreur lors du chargement des équipements: {equipmentsError}</p>
        </Card>
      ) : filteredEquipments.length === 0 ? (
        <Card className="p-8 text-center">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun équipement trouvé</h3>
          <p className="text-gray-600">
            {equipments.length === 0
              ? 'Cliquez sur "Ajouter un équipement" pour commencer'
              : 'Modifiez vos filtres pour voir plus de résultats'}
          </p>
        </Card>
      ) : viewMode === 'table' ? (
        // Compact table view
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Icône</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Statut</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Premium</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEquipments.map((equipment, index) => {
                    const EquipIcon = getEquipmentIcon(equipment);
                    return (
                      <tr 
                        key={equipment.id} 
                        className={`hover:bg-gray-50 ${
                          equipment.est_actif ? '' : 'bg-gray-50 opacity-60'
                        }`}
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <EquipIcon className="h-4 w-4 text-gray-600" />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              equipment.est_actif ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {equipment.nom}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {equipment.est_actif ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">Actif</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inactif</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {equipment.est_premium ? (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Oui</Badge>
                          ) : (
                            <span className="text-xs text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              onClick={() => handleToggleActive(equipment)}
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              title={equipment.est_actif ? 'Désactiver' : 'Activer'}
                            >
                              <Check className={`h-3.5 w-3.5 ${
                                equipment.est_actif ? 'text-green-600' : 'text-gray-400'
                              }`} />
                            </Button>
                            <Button
                              onClick={() => handleEdit(equipment)}
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              title="Modifier"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-gray-600" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(equipment)}
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              title="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Simple flat list view
        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              {filteredEquipments.map((equipment, index) => {
                const EquipIcon = getEquipmentIcon(equipment);
                return (
                  <div
                    key={equipment.id}
                    className={`flex items-center justify-between py-1.5 px-2 rounded ${
                      equipment.est_actif ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-60'
                    } transition-colors`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs text-gray-400 w-6">{index + 1}</span>
                      <EquipIcon className="h-3.5 w-3.5 text-gray-500" />
                      <span className={`text-sm ${equipment.est_actif ? 'text-gray-900' : 'text-gray-500'}`}>
                        {equipment.nom}
                      </span>
                      {equipment.est_premium && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs py-0 px-1" variant="secondary">
                          Premium
                        </Badge>
                      )}
                      {!equipment.est_actif && (
                        <Badge variant="secondary" className="text-xs py-0 px-1">Inactif</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button
                        onClick={() => handleToggleActive(equipment)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        title={equipment.est_actif ? 'Désactiver' : 'Activer'}
                      >
                        <Check className={`h-3 w-3 ${equipment.est_actif ? 'text-green-600' : 'text-gray-400'}`} />
                      </Button>
                      <Button
                        onClick={() => handleEdit(equipment)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                      >
                        <Edit2 className="h-3 w-3 text-gray-600" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(equipment)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal for add/edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {editingEquipment ? 'Modifier l\'équipement' : 'Ajouter un équipement'}
              </h2>
              <Button
                onClick={handleCloseModal}
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
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
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
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
            <div className="p-6 border-t flex justify-end gap-3">
              <Button onClick={handleCloseModal} variant="outline">
                Annuler
              </Button>
              <Button onClick={handleSubmit} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {editingEquipment ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}