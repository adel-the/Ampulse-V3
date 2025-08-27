'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Users, Edit2, Trash2, Home, Check, Ruler } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { roomCategoriesApi } from '../../lib/api/roomCategories';
import type { RoomCategory, RoomCategoryInsert, RoomCategoryUpdate } from '../../lib/supabase';

interface RoomCategoriesSectionProps {
  selectedHotelId: number | null;
}

export default function RoomCategoriesSection({ selectedHotelId }: RoomCategoriesSectionProps) {
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<RoomCategory | null>(null);
  const [formData, setFormData] = useState<Partial<RoomCategory>>({
    name: '',
    capacity: 1,
    surface: null
  });
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadCategories();
  }, [selectedHotelId]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await roomCategoriesApi.getCategories();
      
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        addNotification('error', response.error || 'Erreur lors du chargement des catégories');
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      addNotification('error', 'Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategory = (category: RoomCategory) => {
    setSelectedCategory(category);
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      capacity: 2,
      surface: 20
    });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEdit = (category: RoomCategory) => {
    setFormData(category);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;

    try {
      const response = await roomCategoriesApi.deleteCategory(id);
      
      if (response.success) {
        await loadCategories();
        addNotification('success', 'Catégorie supprimée avec succès');
        
        if (selectedCategory?.id === id) {
          setSelectedCategory(null);
        }
      } else {
        addNotification('error', response.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      addNotification('error', 'Erreur lors de la suppression');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.capacity) {
      addNotification('error', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      let response;
      
      if (isEditing && formData.id) {
        // Update existing category
        const updateData: RoomCategoryUpdate = {
          name: formData.name,
          capacity: formData.capacity,
          surface: formData.surface
        };
        response = await roomCategoriesApi.updateCategory(formData.id, updateData);
      } else {
        // Create new category
        const insertData: RoomCategoryInsert = {
          name: formData.name || '',
          capacity: formData.capacity || 1,
          surface: formData.surface
        };
        response = await roomCategoriesApi.createCategory(insertData);
      }

      if (response.success) {
        await loadCategories();
        addNotification('success', `Catégorie ${isEditing ? 'mise à jour' : 'créée'} avec succès`);
        setShowForm(false);
        setFormData({ name: '', capacity: 1, surface: null });
      } else {
        addNotification('error', response.error || `Erreur lors de ${isEditing ? 'la mise à jour' : 'la création'}`);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addNotification('error', `Erreur lors de ${isEditing ? 'la mise à jour' : 'la création'}`);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ name: '', capacity: 1, surface: null });
  };

  const handleInputChange = (field: keyof RoomCategory, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!selectedHotelId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">
          Veuillez sélectionner un établissement pour gérer ses catégories de chambres.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Catégories de chambres</h1>
        <p className="text-gray-600 mt-1">
          Gérez les différents types de chambres et leurs capacités d'accueil
        </p>
      </div>

      {/* Categories List */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Catégories disponibles</h2>
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Ajouter une catégorie
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : categories.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                Aucune catégorie trouvée. Cliquez sur "Ajouter une catégorie" pour commencer.
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedCategory?.id === category.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSelectCategory(category)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Home className="h-4 w-4 text-gray-500" />
                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                        {selectedCategory?.id === category.id && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-3 w-3" />
                          <span>Capacité: {category.capacity} personne{category.capacity > 1 ? 's' : ''}</span>
                        </div>
                        {category.surface && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Ruler className="h-3 w-3" />
                            <span>Surface: {category.surface} m²</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(category);
                        }}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(category.id);
                        }}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-6">
            {isEditing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Studio, F1, F2..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacité d'accueil *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.capacity || 1}
                  onChange={(e) => handleInputChange('capacity', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Nombre maximum de personnes pouvant occuper ce type de chambre
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Surface (m²)
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  step="0.5"
                  value={formData.surface || ''}
                  onChange={(e) => handleInputChange('surface', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 25.5"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Superficie en mètres carrés (optionnel)
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isEditing ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}