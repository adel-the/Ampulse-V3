'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import EstablishmentCard from './EstablishmentCard';
import EstablishmentForm from './EstablishmentForm';
import { useNotifications } from '@/hooks/useNotifications';
import { establishmentsApi } from '@/lib/api/establishments';
import type { Establishment, EstablishmentInsert, EstablishmentUpdate } from '@/lib/api/establishments';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Building2, 
  Users, 
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface EstablishmentsManagementProps {
  className?: string;
}

interface Filters {
  search: string;
  statut: 'all' | 'ACTIF' | 'INACTIF';
  type: 'all' | 'hotel' | 'residence' | 'foyer' | 'chrs' | 'chr' | 'autre';
  ville: string;
}

export default function EstablishmentsManagement({ className }: EstablishmentsManagementProps) {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEstablishment, setEditingEstablishment] = useState<Establishment | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    statut: 'all',
    type: 'all',
    ville: ''
  });

  const { addNotification } = useNotifications();

  // Charger les établissements
  const loadEstablishments = async () => {
    try {
      setLoading(true);
      const response = await establishmentsApi.getEstablishments({
        statut: filters.statut !== 'all' ? filters.statut : undefined,
        type_etablissement: filters.type !== 'all' ? filters.type : undefined,
        ville: filters.ville || undefined
      });

      if (response.success && response.data) {
        setEstablishments(response.data);
      } else {
        addNotification('warning', response.error || 'Erreur lors du chargement des établissements');
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      addNotification('warning', 'Erreur lors du chargement des établissements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstablishments();
  }, [filters.statut, filters.type, filters.ville]);

  // Filtrer les établissements selon la recherche
  const filteredEstablishments = useMemo(() => {
    return establishments.filter(establishment => {
      const searchLower = filters.search.toLowerCase();
      return (
        establishment.nom.toLowerCase().includes(searchLower) ||
        establishment.ville.toLowerCase().includes(searchLower) ||
        establishment.adresse.toLowerCase().includes(searchLower) ||
        (establishment.gestionnaire?.toLowerCase().includes(searchLower))
      );
    });
  }, [establishments, filters.search]);

  // Statistiques
  const stats = useMemo(() => {
    const total = establishments.length;
    const active = establishments.filter(e => e.statut === 'ACTIF').length;
    const totalRooms = establishments.reduce((sum, e) => sum + e.chambres_total, 0);
    const occupiedRooms = establishments.reduce((sum, e) => sum + e.chambres_occupees, 0);
    const averageOccupancy = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return {
      total,
      active,
      totalRooms,
      occupiedRooms,
      averageOccupancy
    };
  }, [establishments]);

  // Gestionnaires d'événements
  const handleCreate = () => {
    setEditingEstablishment(null);
    setShowForm(true);
  };

  const handleEdit = (establishment: Establishment) => {
    setEditingEstablishment(establishment);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: EstablishmentInsert | EstablishmentUpdate) => {
    try {
      setActionLoading(editingEstablishment?.id || 0);
      
      let response;
      if (editingEstablishment) {
        response = await establishmentsApi.updateEstablishment(editingEstablishment.id, data as EstablishmentUpdate);
      } else {
        response = await establishmentsApi.createEstablishment(data as EstablishmentInsert);
      }

      if (response.success) {
        addNotification('success', 
          editingEstablishment 
            ? 'Établissement mis à jour avec succès' 
            : 'Établissement créé avec succès'
        );
        setShowForm(false);
        setEditingEstablishment(null);
        await loadEstablishments();
      } else {
        addNotification('warning', response.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addNotification('warning', 'Erreur lors de la sauvegarde');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setActionLoading(id);
      const response = await establishmentsApi.deleteEstablishment(id);

      if (response.success) {
        addNotification('success', 'Établissement supprimé avec succès');
        await loadEstablishments();
      } else {
        addNotification('warning', response.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      addNotification('warning', 'Erreur lors de la suppression');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      setActionLoading(id);
      const response = await establishmentsApi.toggleEstablishmentStatus(id);

      if (response.success) {
        addNotification('success', 'Statut modifié avec succès');
        await loadEstablishments();
      } else {
        addNotification('warning', response.error || 'Erreur lors du changement de statut');
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      addNotification('warning', 'Erreur lors du changement de statut');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRefresh = () => {
    loadEstablishments();
  };

  if (showForm) {
    return (
      <div className={className}>
        <EstablishmentForm
          establishment={editingEstablishment || undefined}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingEstablishment(null);
          }}
          isLoading={actionLoading !== null}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des établissements</h2>
          <p className="text-gray-600">
            Gérez vos établissements, leurs informations et leur statut
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nouvel établissement
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chambres</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRooms}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux d'occupation</p>
                <p className="text-2xl font-bold text-orange-600">{stats.averageOccupancy}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nom, ville, adresse..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                value={filters.statut}
                onChange={(e) => handleFilterChange('statut', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">Tous</option>
                <option value="ACTIF">Actif</option>
                <option value="INACTIF">Inactif</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">Tous</option>
                <option value="hotel">Hôtel</option>
                <option value="residence">Résidence</option>
                <option value="foyer">Foyer</option>
                <option value="chrs">CHRS</option>
                <option value="chr">CHR</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ville">Ville</Label>
              <Input
                id="ville"
                placeholder="Filtrer par ville"
                value={filters.ville}
                onChange={(e) => handleFilterChange('ville', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barre d'outils */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {filteredEstablishments.length} établissement{filteredEstablishments.length > 1 ? 's' : ''}
          </span>
          {filters.search && (
            <Badge variant="outline">
              Recherche: "{filters.search}"
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Liste des établissements */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredEstablishments.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
        }>
          {filteredEstablishments.map((establishment) => (
            <EstablishmentCard
              key={establishment.id}
              establishment={establishment}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              isLoading={actionLoading === establishment.id}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun établissement trouvé
              </h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.statut !== 'all' || filters.type !== 'all' || filters.ville
                  ? 'Aucun établissement ne correspond à vos critères de recherche.'
                  : 'Vous n\'avez pas encore d\'établissement enregistré.'}
              </p>
              {(!filters.search && filters.statut === 'all' && filters.type === 'all' && !filters.ville) && (
                <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le premier établissement
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}