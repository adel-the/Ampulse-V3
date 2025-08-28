'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { 
  Search, Plus, Users, Building, UserCheck, Filter, Eye, Edit, Trash2, 
  User, Phone, Mail, MapPin, Calendar, FileText, Download, MoreVertical, 
  RefreshCcw, Shield, Heart, UserPlus, Building2 
} from 'lucide-react';
import { clientsApi, type ClientWithRelations } from '@/lib/api/clients';
import { usagersApi, type UsagerWithPrescripteur, type UsagerStats } from '@/lib/api/usagers';
import { useNotifications } from '@/hooks/useNotifications';
import { CLIENT_TYPES } from '@/lib/supabase';
import type { Client, ClientCategory } from '@/lib/supabase';
import ClientEditModal from '../modals/ClientEditModal';
import UsagerEditModal from '../modals/UsagerEditModal';
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
  
  // View state
  const [activeView, setActiveView] = useState<'prescripteurs' | 'usagers'>('prescripteurs');
  
  // Prescripteurs state
  const [clients, setClients] = useState<Client[]>([]);
  const [clientStats, setClientStats] = useState<ClientStats>({
    total: 0,
    actifs: 0,
    inactifs: 0,
    prospects: 0,
    archives: 0,
    particuliers: 0,
    entreprises: 0,
    associations: 0
  });
  
  // Usagers state
  const [usagers, setUsagers] = useState<UsagerWithPrescripteur[]>([]);
  const [usagerStats, setUsagerStats] = useState<UsagerStats>({
    total: 0,
    actifs: 0,
    inactifs: 0,
    archives: 0,
    autonomes: 0,
    semi_autonomes: 0,
    non_autonomes: 0,
    by_prescripteur_type: {}
  });
  
  // Shared state
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  
  // Prescripteur filters
  const [selectedType, setSelectedType] = useState<ClientCategory | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  // Usager filters
  const [selectedPrescripteur, setSelectedPrescripteur] = useState<number | null>(null);
  const [selectedUsagerStatus, setSelectedUsagerStatus] = useState<string>('');
  const [selectedAutonomie, setSelectedAutonomie] = useState<string>('');
  
  // Modal states
  const [showClientEditModal, setShowClientEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithRelations | null>(null);
  const [showUsagerEditModal, setShowUsagerEditModal] = useState(false);
  const [selectedUsager, setSelectedUsager] = useState<UsagerWithPrescripteur | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ type: 'client' | 'usager', item: any } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load data based on active view
  useEffect(() => {
    if (activeView === 'prescripteurs') {
      loadClients();
    } else {
      loadClients(); // Also load clients for prescripteur filter dropdown
      loadUsagers();
      loadUsagerStatistics();
    }
  }, [activeView, selectedType, selectedStatus, selectedPrescripteur, selectedUsagerStatus, selectedAutonomie]);

  // Load prescripteurs/clients
  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await clientsApi.searchClients(searchTerm, selectedType || undefined, selectedStatus);
      if (response.success && response.data) {
        setClients(response.data);
        calculateClientStats(response.data);
      } else {
        addNotification('error', response.error || 'Erreur lors du chargement des clients');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate client statistics
  const calculateClientStats = (clientList: Client[]) => {
    const newStats: ClientStats = {
      total: clientList.length,
      actifs: clientList.filter(c => c.statut === 'actif').length,
      inactifs: clientList.filter(c => c.statut === 'inactif').length,
      prospects: clientList.filter(c => c.statut === 'prospect').length,
      archives: 0,
      particuliers: clientList.filter(c => c.client_type === 'Particulier').length,
      entreprises: clientList.filter(c => c.client_type === 'Entreprise').length,
      associations: clientList.filter(c => c.client_type === 'Association').length
    };
    setClientStats(newStats);
  };

  // Load usagers
  const loadUsagers = async () => {
    setLoading(true);
    try {
      const response = await usagersApi.searchUsagers(
        searchTerm,
        selectedPrescripteur || undefined,
        selectedUsagerStatus || undefined,
        selectedAutonomie || undefined
      );
      if (response.success && response.data) {
        setUsagers(response.data);
      } else {
        addNotification('error', response.error || 'Erreur lors du chargement des usagers');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load usager statistics
  const loadUsagerStatistics = async () => {
    try {
      const response = await usagersApi.getUsagerStatistics();
      if (response.success && response.data) {
        setUsagerStats(response.data);
      }
    } catch (error) {
      console.error('Error loading usager statistics:', error);
    }
  };

  // Handle search
  const handleSearch = () => {
    if (activeView === 'prescripteurs') {
      loadClients();
    } else {
      loadUsagers();
    }
  };

  // Handle create new client
  const handleCreateClient = () => {
    setSelectedClient(null);
    setShowClientEditModal(true);
  };

  // Handle edit client
  const handleEditClient = async (client: Client) => {
    setLoading(true);
    try {
      const response = await clientsApi.getClientWithRelations(client.id);
      if (response.success && response.data) {
        setSelectedClient(response.data);
        setShowClientEditModal(true);
      } else {
        addNotification('error', response.error || 'Erreur lors du chargement du client');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle create new usager
  const handleCreateUsager = () => {
    setSelectedUsager(null);
    setShowUsagerEditModal(true);
  };

  // Handle edit usager
  const handleEditUsager = async (usager: UsagerWithPrescripteur) => {
    setSelectedUsager(usager);
    setShowUsagerEditModal(true);
  };

  // Handle delete
  const handleDelete = (type: 'client' | 'usager', item: any) => {
    setDeletingItem({ type, item });
    setShowDeleteConfirm(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingItem) return;

    setDeleteLoading(true);
    try {
      let response;
      
      if (deletingItem.type === 'client') {
        response = await clientsApi.deleteClient(deletingItem.item.id);
      } else {
        response = await usagersApi.deleteUsager(deletingItem.item.id);
      }

      if (response.success) {
        addNotification('success', `${deletingItem.type === 'client' ? 'Client' : 'Usager'} supprimé avec succès`);
        if (deletingItem.type === 'client') {
          loadClients();
        } else {
          loadUsagers();
          loadUsagerStatistics();
        }
      } else {
        addNotification('error', response.error || 'Erreur lors de la suppression');
      }
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setDeletingItem(null);
    }
  };

  // Get client display name
  const getClientDisplayName = (client: Client) => {
    if (client.client_type === 'Particulier') {
      return `${client.prenom || ''} ${client.nom || ''}`.trim();
    }
    return client.raison_sociale || client.nom || '';
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

  // Get autonomie color
  const getAutonomieColor = (level: string | null) => {
    switch (level) {
      case 'Autonome': return 'bg-green-100 text-green-800';
      case 'Semi-autonome': return 'bg-yellow-100 text-yellow-800';
      case 'Non-autonome': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'prescripteurs' | 'usagers')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="prescripteurs" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Prescripteurs
          </TabsTrigger>
          <TabsTrigger value="usagers" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Usagers (Bénéficiaires)
          </TabsTrigger>
        </TabsList>

        {/* Prescripteurs View */}
        <TabsContent value="prescripteurs">
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total prescripteurs</p>
                      <p className="text-2xl font-bold">{clientStats.total}</p>
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
                      <p className="text-2xl font-bold">{clientStats.actifs}</p>
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
                      <p className="text-2xl font-bold">{clientStats.entreprises}</p>
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
                      <p className="text-2xl font-bold">{clientStats.associations}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher un prescripteur..."
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
                  </select>
                  
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </Button>
                  
                  <Button onClick={handleCreateClient} className="ml-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau prescripteur
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Chargement des prescripteurs...</span>
              </div>
            ) : clients.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun prescripteur trouvé</h3>
                <p className="text-gray-600">Modifiez vos filtres ou créez un nouveau prescripteur</p>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prescripteur</th>
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
                                  <span className="text-sm">{client.client_type}</span>
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
                                    onClick={() => handleDelete('client', client)}
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
            )}
          </div>
        </TabsContent>

        {/* Usagers View */}
        <TabsContent value="usagers">
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total usagers</p>
                      <p className="text-2xl font-bold">{usagerStats.total}</p>
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
                      <p className="text-2xl font-bold">{usagerStats.actifs}</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Autonomes</p>
                      <p className="text-2xl font-bold">{usagerStats.autonomes}</p>
                    </div>
                    <Shield className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Semi/Non autonomes</p>
                      <p className="text-2xl font-bold">{usagerStats.semi_autonomes + usagerStats.non_autonomes}</p>
                    </div>
                    <Heart className="h-8 w-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher un usager..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                  
                  <select
                    value={selectedPrescripteur || ''}
                    onChange={(e) => setSelectedPrescripteur(e.target.value ? Number(e.target.value) : null)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous les prescripteurs</option>
                    {clients
                      .filter(c => c.statut === 'actif')
                      .map(client => (
                        <option key={client.id} value={client.id}>
                          {client.client_type === 'Particulier' 
                            ? `${client.nom} ${client.prenom || ''}`.trim()
                            : client.raison_sociale || client.nom}
                        </option>
                      ))}
                  </select>
                  
                  <select
                    value={selectedUsagerStatus}
                    onChange={(e) => setSelectedUsagerStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="archive">Archivé</option>
                  </select>
                  
                  <select
                    value={selectedAutonomie}
                    onChange={(e) => setSelectedAutonomie(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous les niveaux</option>
                    <option value="Autonome">Autonome</option>
                    <option value="Semi-autonome">Semi-autonome</option>
                    <option value="Non-autonome">Non-autonome</option>
                  </select>
                  
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </Button>
                  
                  <Button onClick={handleCreateUsager} className="ml-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel usager
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Chargement des usagers...</span>
              </div>
            ) : usagers.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun usager trouvé</h3>
                <p className="text-gray-600">Modifiez vos filtres ou créez un nouvel usager</p>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usager</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prescripteur</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Situation</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Autonomie</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usagers.map(usager => (
                          <tr key={usager.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium">{usager.prenom} {usager.nom}</p>
                                <p className="text-xs text-gray-500">{usager.numero_usager}</p>
                                {usager.date_naissance && (
                                  <p className="text-xs text-gray-500">
                                    Né(e) le {new Date(usager.date_naissance).toLocaleDateString('fr-FR')}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {usager.prescripteur && (
                                <div className="flex items-center gap-2">
                                  {usager.prescripteur.client_type === 'Entreprise' ? (
                                    <Building className="h-4 w-4 text-gray-500" />
                                  ) : usager.prescripteur.client_type === 'Association' ? (
                                    <Users className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <User className="h-4 w-4 text-gray-500" />
                                  )}
                                  <div>
                                    <p className="text-sm">
                                      {usager.prescripteur.raison_sociale || 
                                       `${usager.prescripteur.prenom || ''} ${usager.prescripteur.nom || ''}`.trim()}
                                    </p>
                                    <p className="text-xs text-gray-500">{usager.prescripteur.client_type}</p>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1 text-sm">
                                {usager.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3 text-gray-400" />
                                    <span className="text-gray-600">{usager.email}</span>
                                  </div>
                                )}
                                {usager.telephone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-gray-400" />
                                    <span className="text-gray-600">{usager.telephone}</span>
                                  </div>
                                )}
                                {usager.ville && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-gray-400" />
                                    <span className="text-gray-600">{usager.ville}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm">
                                {usager.situation_familiale && (
                                  <p className="text-gray-600">{usager.situation_familiale}</p>
                                )}
                                {usager.nombre_enfants > 0 && (
                                  <p className="text-xs text-gray-500">
                                    {usager.nombre_enfants} enfant{usager.nombre_enfants > 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={getAutonomieColor(usager.autonomie_level)}>
                                {usager.autonomie_level || 'Non défini'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={getStatusColor(usager.statut)}>
                                {usager.statut}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditUsager(usager)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditUsager(usager)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete('usager', usager)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Client Edit Modal */}
      <ClientEditModal
        isOpen={showClientEditModal}
        onClose={() => setShowClientEditModal(false)}
        client={selectedClient}
        onSuccess={() => {
          loadClients();
          setShowClientEditModal(false);
        }}
      />

      {/* Usager Edit Modal */}
      <UsagerEditModal
        isOpen={showUsagerEditModal}
        onClose={() => setShowUsagerEditModal(false)}
        usager={selectedUsager}
        prescripteurs={clients.filter(c => 
          c.statut === 'actif' && (
            c.client_type === 'Entreprise' || 
            c.client_type === 'Association' ||
            c.client_type === 'Particulier'
          )
        )}
        onSuccess={() => {
          loadUsagers();
          loadUsagerStatistics();
          setShowUsagerEditModal(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingItem(null);
        }}
        onConfirm={confirmDelete}
        title={`Supprimer ${deletingItem?.type === 'client' ? 'le prescripteur' : 'l\'usager'}`}
        message={`Êtes-vous sûr de vouloir supprimer ${
          deletingItem?.type === 'client' 
            ? getClientDisplayName(deletingItem.item) 
            : deletingItem?.item ? `${deletingItem.item.prenom} ${deletingItem.item.nom}` : ''
        } ? Cette action est irréversible.`}
        confirmText="Supprimer"
        confirmVariant="destructive"
        isLoading={deleteLoading}
      />
    </div>
  );
}