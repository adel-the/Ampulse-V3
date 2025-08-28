'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Search, Plus, Users, Building, UserCheck, Filter, Eye, Edit, Trash2, User, Phone, Mail, MapPin, Calendar, FileText, Download, MoreVertical, RefreshCcw } from 'lucide-react';
import { clientsApi, type ClientWithRelations } from '@/lib/api/clients';
import { useNotifications } from '@/hooks/useNotifications';
import { CLIENT_TYPES } from '@/lib/supabase';
import type { Client, ClientCategory } from '@/lib/supabase';
import ClientEditModal from '../modals/ClientEditModal';
import ConfirmationDialog from '../ui/confirmation-dialog';

interface ClientStats {
  total: number;
  actifs: number;
  inactifs: number;
  prospects: number;
  archives: number;
  particuliers: number;
  entreprises: number;
  associations: number;
}

export default function ClientsSection() {
  const { addNotification } = useNotifications();
  const [clients, setClients] = useState<Client[]>([]);
  // Client types are now static constants
  const [stats, setStats] = useState<ClientStats>({
    total: 0,
    actifs: 0,
    inactifs: 0,
    prospects: 0,
    archives: 0,
    particuliers: 0,
    entreprises: 0,
    associations: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ClientCategory | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState('list');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithRelations | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load data on mount and when filters change
  useEffect(() => {
    // Client types are now static constants
    loadClients();
  }, [selectedType, selectedStatus]);


  // Load clients
  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await clientsApi.searchClients(searchTerm, selectedType || undefined, selectedStatus);
      if (response.success && response.data) {
        setClients(response.data);
        calculateStats(response.data);
      } else {
        addNotification('error', response.error || 'Erreur lors du chargement des clients');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (clientList: Client[]) => {
    const newStats: ClientStats = {
      total: clientList.length,
      actifs: clientList.filter(c => c.statut === 'actif').length,
      inactifs: clientList.filter(c => c.statut === 'inactif').length,
      prospects: clientList.filter(c => c.statut === 'prospect').length,
      archives: 0, // Archive status not yet implemented
      particuliers: clientList.filter(c => c.client_type === 'Particulier').length,
      entreprises: clientList.filter(c => c.client_type === 'Entreprise').length,
      associations: clientList.filter(c => c.client_type === 'Association').length
    };
    setStats(newStats);
  };

  // Handle search
  const handleSearch = () => {
    loadClients();
  };

  // Handle create new client
  const handleCreateClient = () => {
    setSelectedClient(null);
    setShowEditModal(true);
  };

  // Handle edit client
  const handleEditClient = async (client: Client) => {
    setLoading(true);
    try {
      const response = await clientsApi.getClientWithRelations(client.id);
      if (response.success && response.data) {
        setSelectedClient(response.data);
        setShowEditModal(true);
      } else {
        addNotification('error', response.error || 'Erreur lors du chargement du client');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle delete client
  const handleDeleteClient = (client: Client) => {
    setDeletingClient(client);
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingClient) return;

    setDeleteLoading(true);
    try {
      const response = await clientsApi.deleteClient(deletingClient.id);
      if (response.success) {
        addNotification('success', 'Client supprimé avec succès');
        loadClients();
      } else {
        addNotification('error', response.error || 'Erreur lors de la suppression');
      }
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setDeletingClient(null);
    }
  };

  // Handle modal success
  const handleModalSuccess = () => {
    loadClients();
  };

  // Get client type info
  const getClientType = (clientType: ClientCategory) => {
    return clientType || 'Non défini';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'inactif': return 'bg-gray-100 text-gray-800';
      case 'prospect': return 'bg-yellow-100 text-yellow-800';
      case 'archive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get client display name
  const getClientDisplayName = (client: Client) => {
    if (client.client_type === 'Particulier') {
      return `${client.prenom || ''} ${client.nom || ''}`.trim();
    }
    return client.raison_sociale || client.nom || '';
  };

  // Get type icon
  const getTypeIcon = (clientType: ClientCategory) => {
    switch (clientType) {
      case 'Particulier': return User;
      case 'Entreprise': return Building;
      case 'Association': return Users;
      default: return User;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total clients</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Actifs</p>
                  <p className="text-2xl font-bold text-green-600">{stats.actifs}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Entreprises</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.entreprises}</p>
                </div>
                <Building className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Associations</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.associations}</p>
                </div>
                <Users className="h-8 w-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher par nom, email, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedType || ''}
            onChange={(e) => {
              const newValue = e.target.value ? e.target.value as ClientCategory : null;
              setSelectedType(newValue);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les types</option>
            {CLIENT_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="prospect">Prospect</option>
            <option value="archive">Archivé</option>
          </select>
          
          <Button onClick={handleSearch} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtrer
          </Button>

          <Button onClick={loadClients} variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          
          <Button onClick={handleCreateClient}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau client
          </Button>
        </div>

        {/* Main content (previously list tab) */}
        <div>
          {/* View mode toggle removed */}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Chargement des clients...</span>
            </div>
          ) : clients.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client trouvé</h3>
              <p className="text-gray-600">Modifiez vos filtres ou créez un nouveau client</p>
            </Card>
          ) : viewMode === 'table' ? (
            // Table view
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localisation</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date création</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map(client => {
                        const type = getClientType(client.client_type || 'Particulier');
                        const TypeIcon = getTypeIcon(client.client_type || 'Particulier');
                        
                        return (
                          <tr key={client.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium">{getClientDisplayName(client)}</p>
                                <p className="text-xs text-gray-500">{client.numero_client}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <TypeIcon className="h-4 w-4 text-gray-600" />
                                <span className="text-sm">{type?.nom}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1 text-sm">
                                {client.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3 text-gray-400" />
                                    <span className="text-gray-600">{client.email}</span>
                                  </div>
                                )}
                                {client.telephone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-gray-400" />
                                    <span className="text-gray-600">{client.telephone}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {(client.ville || client.code_postal) && (
                                <div className="flex items-center gap-1 text-sm">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-600">
                                    {client.code_postal} {client.ville}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={getStatusColor(client.statut || 'actif')}>
                                {client.statut || 'actif'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-600">
                                {client.created_at && new Date(client.created_at).toLocaleDateString('fr-FR')}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditClient(client)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditClient(client)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteClient(client)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
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
            // Grid view
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map(client => {
                const type = getClientType(client.client_type || 'Particulier');
                const TypeIcon = getTypeIcon(client.client_type || 'Particulier');
                
                return (
                  <Card key={client.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-full bg-gray-100`}>
                            <TypeIcon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{getClientDisplayName(client)}</CardTitle>
                            <p className="text-xs text-gray-500">{client.numero_client}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(client.statut || 'actif')}>
                          {client.statut || 'actif'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm space-y-2">
                        {client.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600 truncate">{client.email}</span>
                          </div>
                        )}
                        {client.telephone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{client.telephone}</span>
                          </div>
                        )}
                        {(client.ville || client.code_postal) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">
                              {client.code_postal} {client.ville}
                            </span>
                          </div>
                        )}
                        {client.siret && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">SIRET: {client.siret}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-xs text-gray-500">
                          Créé le {client.created_at && new Date(client.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditClient(client)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClient(client)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Client Edit Modal */}
      <ClientEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        client={selectedClient}
        onSuccess={handleModalSuccess}
      />

      {/* Delete Confirmation */}
      {showDeleteConfirm && deletingClient && (
        <ConfirmationDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          title="Supprimer le client"
          message={`Êtes-vous sûr de vouloir supprimer le client "${getClientDisplayName(deletingClient)}" ? Cette action est irréversible.`}
          confirmText="Supprimer"
          cancelText="Annuler"
          variant="danger"
          loading={deleteLoading}
        />
      )}
    </div>
  );
}