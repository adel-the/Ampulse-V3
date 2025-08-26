'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Search, Plus, Users, Building, UserCheck, Filter, Eye, Edit, Trash2, MoreVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useClients } from '../../hooks/useSupabase';
import AddClientForm from './AddClientForm';
import ConfirmationDialog from '../ui/confirmation-dialog';
import type { ClientType, ClientWithDetails, ClientSearchResult as ClientSearchResultType, Client } from '../../lib/supabase';

// Types pour les clients avec des informations complètes
interface ClientSearchResult {
  id: number;
  numero_client: string;
  nom_complet: string;
  type_nom: string;
  type_id: number;
  email?: string;
  telephone?: string;
  ville?: string;
  statut: string;
  nombre_reservations: number;
  montant_total_reservations?: number;
  date_creation: string;
  raison_sociale?: string;
}

interface ClientStats {
  total_clients: number;
  clients_actifs: number;
  nouveaux_ce_mois: number;
  particuliers: number;
  entreprises: number;
  associations: number;
}

export default function ClientsSection() {
  const { clients: rawClients, loading, error, getBasicClientStatistics, searchClients: searchClientsHook, updateClient, deleteClient } = useClients();
  const [clients, setClients] = useState<ClientSearchResult[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState('list');
  const [selectedTypeForForm, setSelectedTypeForForm] = useState<number | null>(null);
  
  // New state for edit and delete functionality
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientSearchResult | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load client types and search clients
  useEffect(() => {
    loadClientTypes();
  }, []);

  const loadClientTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('client_types')
        .select('*')
        .order('ordre');

      if (error) throw error;
      setClientTypes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des types de clients:', error);
    }
  };

  const searchClients = async () => {
    try {
      // Use the hook's searchClients method if available, or fallback to simple clients fetch
      if (searchClientsHook) {
        const result = await searchClientsHook(searchTerm, selectedType, selectedStatus);
        if (result.success && result.data) {
          setClients(result.data);
          return;
        }
      }
      
      // Fallback to search_simple_clients function
      const { data, error } = await supabase
        .rpc('search_simple_clients', {
          p_search_term: searchTerm || '',
          p_type_id: selectedType,
          p_statut: selectedStatus || null,
          p_limit: 50
        });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erreur lors de la recherche des clients:', error);
      // If search fails, try to load basic clients as fallback
      if (rawClients && rawClients.length > 0) {
        const mappedClients = rawClients.map(client => ({
          id: client.id,
          numero_client: client.numero_client || `C${client.id.toString().padStart(6, '0')}`,
          nom_complet: client.type_id === 1 ? `${client.nom} ${client.prenom || ''}`.trim() : (client.raison_sociale || client.nom),
          type_nom: 'Client', // Placeholder
          type_id: client.type_id || 1,
          email: client.email,
          telephone: client.telephone,
          ville: client.ville,
          statut: client.statut || 'actif',
          nombre_reservations: 0,
          montant_total_reservations: 0,
          date_creation: client.created_at || new Date().toISOString(),
          raison_sociale: client.raison_sociale
        }));
        setClients(mappedClients);
      }
    }
  };

  const loadStatistics = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_client_statistics');

      if (error) throw error;
      const statistics = data?.[0] || null;
      setStats({
        total_clients: statistics?.total_clients || 0,
        clients_actifs: statistics?.clients_actifs || 0,
        nouveaux_ce_mois: statistics?.nouveaux_ce_mois || 0,
        particuliers: 0,
        entreprises: 0,
        associations: 0
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  // Load data on mount
  useEffect(() => {
    searchClients();
    loadStatistics();
  }, [searchTerm, selectedType, selectedStatus]);

  const handleSearch = () => {
    searchClients();
  };

  // New handlers for CRUD operations
  const handleEditClient = async (client: ClientSearchResult) => {
    try {
      // Fetch full client details from the database
      const { data: fullClient, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', client.id)
        .single();

      if (error) throw error;
      
      setEditingClient(fullClient);
      setSelectedTypeForForm(null); // Reset type form selection
      setActiveTab('add');
    } catch (error) {
      console.error('Erreur lors du chargement du client:', error);
      alert('Erreur lors du chargement du client');
    }
  };

  const handleDeleteClient = (client: ClientSearchResult) => {
    setDeletingClient(client);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteClient = async () => {
    if (!deletingClient || !deleteClient) return;
    
    try {
      setDeleteLoading(true);
      const result = await deleteClient(deletingClient.id);
      
      if (result.success) {
        // Remove client from local state
        setClients(prev => prev.filter(c => c.id !== deletingClient.id));
        alert('Client supprimé avec succès !');
        // Refresh statistics
        loadStatistics();
      } else {
        alert('Erreur lors de la suppression: ' + result.error);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du client');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setDeletingClient(null);
    }
  };

  const handleClientAdded = (client: Client) => {
    // Refresh the client list and statistics
    searchClients();
    loadStatistics();
    
    // Reset editing state
    setEditingClient(null);
    setSelectedTypeForForm(null);
    
    // Show success message
    const message = editingClient ? 'Client modifié avec succès !' : 'Client ajouté avec succès !';
    alert(message);
    
    // Go back to list
    setActiveTab('list');
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
    setSelectedTypeForForm(null);
    setActiveTab('list');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'inactif': return 'bg-gray-100 text-gray-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (typeName: string) => {
    switch (typeName) {
      case 'Particulier': return <UserCheck className="h-5 w-5 text-blue-600" />;
      case 'Entreprise': return <Building className="h-5 w-5 text-green-600" />;
      case 'Association': return <Users className="h-5 w-5 text-purple-600" />;
      default: return <UserCheck className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeIconById = (typeId: number) => {
    const type = clientTypes.find(t => t.id === typeId);
    return getTypeIcon(type?.nom || 'Particulier');
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_clients || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.clients_actifs || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Nouveaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.nouveaux_ce_mois || 0}</div>
            <div className="text-xs text-gray-500">ce mois</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Particuliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{stats?.particuliers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Entreprises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats?.entreprises || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Associations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.associations || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets de gestion */}
      <Tabs value={activeTab} onValueChange={(value) => {
        if (value === 'list') {
          // Clear editing state when going back to list
          setEditingClient(null);
          setSelectedTypeForForm(null);
        }
        setActiveTab(value);
      }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Liste des Clients
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            {editingClient ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingClient ? 'Modifier le Client' : 'Ajouter un Client'}
          </TabsTrigger>
        </TabsList>

        {/* Onglet Liste des Clients */}
        <TabsContent value="list" className="space-y-4">
          {/* Filtres de recherche */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Rechercher des Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Recherche</Label>
                  <Input
                    id="search"
                    placeholder="Nom, prénom, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Type de Client</Label>
                  <select
                    id="type"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={selectedType || ''}
                    onChange={(e) => setSelectedType(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Tous les types</option>
                    {clientTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.nom}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <select
                    id="status"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">Tous les statuts</option>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="prospect">Prospect</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button onClick={handleSearch} className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des clients */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Résultats ({clients.length})
                </CardTitle>
                <Button size="sm" onClick={() => setActiveTab('add')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Client
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(loading) ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-500">Chargement des clients...</p>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client trouvé</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm ? 'Aucun client ne correspond à vos critères de recherche.' : 'Commencez par ajouter votre premier client.'}
                  </p>
                  <Button onClick={() => setActiveTab('add')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un Client
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {clients.map(client => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {getTypeIcon(client.type_nom)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{client.nom_complet}</div>
                          <div className="text-sm text-gray-500">
                            {client.numero_client} • {client.type_nom}
                          </div>
                          {client.email && (
                            <div className="text-sm text-gray-500">{client.email}</div>
                          )}
                          {client.ville && (
                            <div className="text-sm text-gray-400">{client.ville}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            Créé le {new Date(client.date_creation).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        
                        <Badge className={getStatusBadgeColor(client.statut)}>
                          {client.statut}
                        </Badge>
                        
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditClient(client)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:border-blue-300"
                          >
                            <Edit className="h-3 w-3" />
                            Modifier
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteClient(client)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-3 w-3" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Ajouter un Client */}
        <TabsContent value="add" className="space-y-6">
          {/* Sélection rapide du type */}
          {!selectedTypeForForm && !editingClient && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Choisir le type de client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {clientTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedTypeForForm(type.id)}
                      className="p-6 border-2 border-dashed rounded-lg text-center hover:border-primary transition-all duration-200"
                      style={{ 
                        borderColor: type.couleur || '#6B7280',
                        color: type.couleur || '#374151'
                      }}
                    >
                      <div className="mb-2">{getTypeIcon(type.nom)}</div>
                      <h3 className="font-medium text-lg">{type.nom}</h3>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Formulaire d'ajout/modification */}
          {(selectedTypeForForm || editingClient) && (
            <AddClientForm
              clientTypes={clientTypes}
              preSelectedType={selectedTypeForForm || editingClient?.type_id}
              client={editingClient}
              onClientAdded={handleClientAdded}
              onCancel={handleCancelEdit}
            />
          )}
        </TabsContent>

      </Tabs>
      
      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Supprimer le client"
        message={`Êtes-vous sûr de vouloir supprimer le client "${deletingClient?.nom_complet}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={confirmDeleteClient}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeletingClient(null);
        }}
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
}