'use client';

import React, { useState, useEffect } from 'react';
import { 
  Client, 
  ClientCategory,
  CLIENT_TYPES,
  ClientSearchResult, 
  ClientStatistics, 
  ClientFormData,
  ClientWithDetails,
  ClientContact,
  ClientInteraction,
  ClientNote,
  ClientSegment
} from '../../types';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import AddClientForm from './AddClientForm';

interface ClientManagementProps {
  onClientSelect?: (client: Client) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  selectedTypeForForm?: ClientCategory | null;
  setSelectedTypeForForm?: (type: ClientCategory | null) => void;
}


// Fonction pour générer un numéro client
function generateClientNumber(clientType: ClientCategory, existingNumbers: string[] = []): string {
  const typeCode = clientType === 'Particulier' ? 'PAR' : clientType === 'Entreprise' ? 'ENT' : 'ASS';
  const existingForType = existingNumbers
    .filter(num => num.startsWith(typeCode))
    .map(num => parseInt(num.substring(3)) || 0);
  
  const nextNumber = Math.max(0, ...existingForType) + 1;
  return `${typeCode}${nextNumber.toString().padStart(4, '0')}`;
}

export default function ClientManagement({ onClientSelect, activeTab: externalActiveTab, onTabChange, selectedTypeForForm: externalType, setSelectedTypeForForm: setExternalType }: ClientManagementProps) {
  const [clients, setClients] = useState<ClientSearchResult[]>([]);
  // Client types are now static constants
  const [statistics, setStatistics] = useState<ClientStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ClientCategory | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithDetails | null>(null);
  const [internalActiveTab, setInternalActiveTab] = useState('list');
  const [internalSelectedTypeForForm, setInternalSelectedTypeForForm] = useState<ClientCategory | null>(null);
  const selectedTypeForForm = externalType !== undefined ? externalType : internalSelectedTypeForForm;
  const setSelectedTypeForForm = setExternalType || setInternalSelectedTypeForForm;
  
  // Utiliser l'onglet externe s'il est fourni, sinon utiliser l'onglet interne
  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  // Charger les données initiales
  useEffect(() => {
    // Client types are now static constants
    loadStatistics();
    searchClients();
  }, []);


  const loadStatistics = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_client_statistics');

      if (error) throw error;
      setStatistics(data?.[0] || null);
    } catch (error) {
      // Removed console.error to clean up console output
    }
  };

  const searchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('search_clients', {
          p_search_term: searchTerm || '',
          p_client_type: selectedType,
          p_statut: selectedStatus || null,
          p_limit: 50
        });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      // Removed console.error to clean up console output
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchClients();
  };

  const handleClientSelect = async (client: ClientSearchResult) => {
    try {
      // Charger les détails complets du client
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          contacts:client_contacts(*),
          documents:client_documents(*),
          interactions:client_interactions(*),
          notes:client_notes(*),
          commercial:users(*)
        `)
        .eq('id', client.id)
        .single();

      if (error) throw error;
      setSelectedClient(data);
      setActiveTab('details');
      onClientSelect?.(data);
    } catch (error) {
      // Removed console.error to clean up console output
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actif': return 'bg-green-100 text-green-800';
      case 'inactif': return 'bg-gray-100 text-gray-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      case 'archive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (typeName: string) => {
    switch (typeName) {
      case 'Particulier': return '👤';
      case 'Entreprise': return '🏢';
      case 'Association': return '👥';
      default: return '👤';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{statistics?.total_clients || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Clients Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics?.clients_actifs || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Nouveaux ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics?.nouveaux_ce_mois || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Chiffre d'affaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {statistics?.chiffre_affaires_total?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Liste des Clients</TabsTrigger>
          <TabsTrigger value="add">Ajouter un Client</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedClient}>Détails Client</TabsTrigger>
        </TabsList>

        {/* Onglet Liste des Clients */}
        <TabsContent value="list" className="space-y-4">
          {/* Filtres de recherche */}
      <Card>
        <CardHeader>
              <CardTitle>Rechercher des Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Recherche</Label>
                  <Input
                    id="search"
                    placeholder="Nom, email, numéro client..."
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
                    onChange={(e) => setSelectedType(e.target.value as ClientCategory || null)}
                  >
                    <option value="">Tous les types</option>
                    {CLIENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
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
                    <option value="archive">Archivé</option>
            </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} className="w-full">
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
                <CardTitle>Résultats ({clients.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
              {loading ? (
                <div className="text-center py-8">Chargement...</div>
              ) : clients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun client trouvé
                </div>
              ) : (
                  <div className="space-y-2">
                  {clients.map(client => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleClientSelect(client)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{getTypeIcon(client.client_type)}</div>
                        <div>
                          <div className="font-medium">{client.nom_complet}</div>
                          <div className="text-sm text-gray-500">
                            {client.numero_client} • {client.client_type}
                          </div>
                          {client.email && (
                            <div className="text-sm text-gray-500">{client.email}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(client.statut)}>
                          {client.statut}
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {client.nombre_reservations || 0} réservations
                          </div>
                          <div className="text-sm text-gray-500">
                            {client.montant_total_reservations 
                              ? client.montant_total_reservations.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                              : '0,00 €'
                            }
                          </div>
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
        <TabsContent value="add">
          <div className="space-y-6">
            {/* Sélection rapide du type */}
            <Card>
              <CardHeader>
                <CardTitle>Choisir le type de client</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setSelectedTypeForForm('Particulier')}
                    className="p-6 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-center"
                  >
                    <div className="text-4xl mb-2">👤</div>
                    <div className="font-semibold text-lg text-blue-800">Particulier</div>
                    <div className="text-sm text-gray-600 mt-1">Client individuel</div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedTypeForForm('Entreprise')}
                    className="p-6 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all duration-200 text-center"
                  >
                    <div className="text-4xl mb-2">🏢</div>
                    <div className="font-semibold text-lg text-green-800">Entreprise</div>
                    <div className="text-sm text-gray-600 mt-1">Société ou organisation</div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedTypeForForm('Association')}
                    className="p-6 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 text-center"
                  >
                    <div className="text-4xl mb-2">👥</div>
                    <div className="font-semibold text-lg text-purple-800">Association</div>
                    <div className="text-sm text-gray-600 mt-1">Organisation à but non lucratif</div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Formulaire d'ajout */}
            {selectedTypeForForm && (
              <AddClientForm 
                preSelectedType={selectedTypeForForm}
                onClientAdded={(client) => {
                  setShowAddModal(false);
                  searchClients();
                  loadStatistics();
                  setSelectedTypeForForm(null);
                }}
                onCancel={() => setSelectedTypeForForm(null)}
              />
            )}
          </div>
        </TabsContent>

        {/* Onglet Détails Client */}
        <TabsContent value="details">
          {selectedClient && (
            <ClientDetails 
              client={selectedClient}
              onClientUpdated={() => {
                searchClients();
                loadStatistics();
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Composant pour afficher les détails d'un client
function ClientDetails({ 
  client, 
  onClientUpdated 
}: { 
  client: ClientWithDetails;
  onClientUpdated: () => void;
}) {
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ClientFormData>>({
    nom: client.nom || '',
    prenom: client.prenom || '',
    raison_sociale: client.raison_sociale || '',
    email: client.email || '',
    telephone: client.telephone || '',
    telephone_mobile: client.telephone_mobile || '',
    adresse: client.adresse || '',
    code_postal: client.code_postal || '',
    ville: client.ville || '',
          pays: client.pays || 'France',
      notes: typeof client.notes === 'string' ? client.notes : '',
    conditions_paiement: client.conditions_paiement || '30 jours',
    secteur_activite: client.secteur_activite || '',
    nombre_enfants: client.nombre_enfants || 0,
    siret: client.siret || '',
    numero_agrement: client.numero_agrement || '',
          nombre_adherents: client.nombre_adherents || undefined
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .rpc('update_client', {
          p_client_id: client.id,
          p_nom: formData.nom,
          p_prenom: formData.prenom,
          p_raison_sociale: formData.raison_sociale,
          p_email: formData.email,
          p_telephone: formData.telephone,
          p_telephone_mobile: formData.telephone_mobile,
          p_adresse: formData.adresse,
          p_code_postal: formData.code_postal,
          p_ville: formData.ville,
          p_pays: formData.pays,
          p_notes: formData.notes,
          p_conditions_paiement: formData.conditions_paiement,
          p_secteur_activite: formData.secteur_activite,
          p_nombre_enfants: formData.nombre_enfants,
          p_siret: formData.siret,
          p_numero_agrement: formData.numero_agrement,
          p_nombre_adherents: formData.nombre_adherents
        });

      if (error) throw error;
      
      if (data && data.success) {
        setIsEditing(false);
        onClientUpdated();
        alert('Client mis à jour avec succès');
      } else {
        alert('Erreur lors de la mise à jour: ' + (data?.message || 'Erreur inconnue'));
      }
    } catch (error: any) {
      // Error occurred during client update
      alert('Erreur lors de la mise à jour: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Réinitialiser les données du formulaire
    setFormData({
      nom: client.nom || '',
      prenom: client.prenom || '',
      raison_sociale: client.raison_sociale || '',
      email: client.email || '',
      telephone: client.telephone || '',
      telephone_mobile: client.telephone_mobile || '',
      adresse: client.adresse || '',
      code_postal: client.code_postal || '',
      ville: client.ville || '',
      pays: client.pays || 'France',
      notes: typeof client.notes === 'string' ? client.notes : '',
      conditions_paiement: client.conditions_paiement || '30 jours',
      secteur_activite: client.secteur_activite || '',
      nombre_enfants: client.nombre_enfants || 0,
      siret: client.siret || '',
      numero_agrement: client.numero_agrement || '',
      nombre_adherents: client.nombre_adherents || undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête du client */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {client.client_type === 'Particulier' 
                  ? `${client.nom} ${client.prenom || ''}`.trim()
                  : client.raison_sociale || client.nom
                }
              </CardTitle>
              <div className="text-sm text-gray-500 mt-1">
                {client.numero_client} • {client.client_type}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={client.statut === 'actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {client.statut}
              </Badge>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  Modifier
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    Annuler
                  </Button>
                  <Button onClick={handleSave} disabled={loading} size="sm">
                    {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Onglets des détails */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Informations Générales</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-6">
                  {/* Informations de base */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {client.client_type === 'Particulier' ? (
                      <>
                        <div>
                          <Label htmlFor="edit-nom">Nom *</Label>
                          <Input
                            id="edit-nom"
                            value={formData.nom || ''}
                            onChange={(e) => setFormData({...formData, nom: e.target.value})}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-prenom">Prénom</Label>
                          <Input
                            id="edit-prenom"
                            value={formData.prenom || ''}
                            onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="md:col-span-2">
                        <Label htmlFor="edit-raison-sociale">Raison Sociale *</Label>
                        <Input
                          id="edit-raison-sociale"
                          value={formData.raison_sociale || ''}
                          onChange={(e) => setFormData({...formData, raison_sociale: e.target.value})}
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-telephone">Téléphone</Label>
                      <Input
                        id="edit-telephone"
                        value={formData.telephone || ''}
                        onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-telephone-mobile">Téléphone Mobile</Label>
                      <Input
                        id="edit-telephone-mobile"
                        value={formData.telephone_mobile || ''}
                        onChange={(e) => setFormData({...formData, telephone_mobile: e.target.value})}
                      />
                    </div>

                  </div>

                  {/* Adresse */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-adresse">Adresse</Label>
                      <Input
                        id="edit-adresse"
                        value={formData.adresse || ''}
                        onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-code-postal">Code Postal</Label>
                      <Input
                        id="edit-code-postal"
                        value={formData.code_postal || ''}
                        onChange={(e) => setFormData({...formData, code_postal: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-ville">Ville</Label>
                      <Input
                        id="edit-ville"
                        value={formData.ville || ''}
                        onChange={(e) => setFormData({...formData, ville: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-pays">Pays</Label>
                      <Input
                        id="edit-pays"
                        value={formData.pays || 'France'}
                        onChange={(e) => setFormData({...formData, pays: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Informations spécifiques selon le type */}
                  {client.client_type === 'Entreprise' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-siret">SIRET</Label>
                        <Input
                          id="edit-siret"
                          value={formData.siret || ''}
                          onChange={(e) => setFormData({...formData, siret: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-secteur">Secteur d'activité</Label>
                        <Input
                          id="edit-secteur"
                          value={formData.secteur_activite || ''}
                          onChange={(e) => setFormData({...formData, secteur_activite: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  {client.client_type === 'Association' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-numero-agrement">Numéro d'agrément</Label>
                        <Input
                          id="edit-numero-agrement"
                          value={formData.numero_agrement || ''}
                          onChange={(e) => setFormData({...formData, numero_agrement: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-nombre-adherents">Nombre d'adhérents</Label>
                        <Input
                          id="edit-nombre-adherents"
                          type="number"
                          value={formData.nombre_adherents || ''}
                          onChange={(e) => setFormData({...formData, nombre_adherents: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                  )}

                  {client.client_type === 'Particulier' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-nombre-enfants">Nombre d'enfants</Label>
                        <Input
                          id="edit-nombre-enfants"
                          type="number"
                          value={formData.nombre_enfants || 0}
                          onChange={(e) => setFormData({...formData, nombre_enfants: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-conditions-paiement">Conditions de paiement</Label>
                        <Input
                          id="edit-conditions-paiement"
                          value={formData.conditions_paiement || '30 jours'}
                          onChange={(e) => setFormData({...formData, conditions_paiement: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <Label htmlFor="edit-notes">Notes</Label>
                    <textarea
                      id="edit-notes"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows={3}
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Contact</h3>
                    <div className="space-y-2">
                      {client.email && <div><strong>Email:</strong> {client.email}</div>}
                      {client.telephone && <div><strong>Téléphone:</strong> {client.telephone}</div>}
                      {client.telephone_mobile && <div><strong>Mobile:</strong> {client.telephone_mobile}</div>}
                      {client.site_web && <div><strong>Site web:</strong> {client.site_web}</div>}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-3">Adresse</h3>
                    <div className="space-y-2">
                      {client.adresse && <div>{client.adresse}</div>}
                      {client.complement_adresse && <div>{client.complement_adresse}</div>}
                      <div>{client.code_postal} {client.ville}</div>
                      <div>{client.pays}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-3">Statistiques</h3>
                    <div className="space-y-2">
                      <div><strong>Réservations:</strong> {client.nombre_reservations || 0}</div>
                      <div><strong>Chiffre d'affaires:</strong> {client.montant_total_reservations 
                        ? client.montant_total_reservations.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                        : '0,00 €'
                      }</div>
                      {client.date_derniere_reservation && (
                        <div><strong>Dernière réservation:</strong> {new Date(client.date_derniere_reservation).toLocaleDateString('fr-FR')}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-3">Informations Financières</h3>
                    <div className="space-y-2">
                      <div><strong>Conditions de paiement:</strong> {client.conditions_paiement}</div>
                      {client.limite_credit && <div><strong>Limite de crédit:</strong> {client.limite_credit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>}
                      <div><strong>Solde compte:</strong> {client.solde_compte 
                        ? client.solde_compte.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                        : '0,00 €'
                      }</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {client.contacts && client.contacts.length > 0 ? (
                <div className="space-y-4">
                  {client.contacts.map(contact => (
                    <div key={contact.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                    <div>
                          <div className="font-medium">{contact.prenom} {contact.nom}</div>
                          {contact.fonction && <div className="text-sm text-gray-500">{contact.fonction}</div>}
                        </div>
                        {contact.principal && (
                          <Badge className="bg-blue-100 text-blue-800">Principal</Badge>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        {contact.email && <div className="text-sm">{contact.email}</div>}
                        {contact.telephone && <div className="text-sm">{contact.telephone}</div>}
                        {contact.telephone_mobile && <div className="text-sm">{contact.telephone_mobile}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucun contact enregistré
                </div>
              )}
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="interactions">
        <Card>
            <CardHeader>
              <CardTitle>Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              {client.interactions && client.interactions.length > 0 ? (
                <div className="space-y-4">
                  {client.interactions.map(interaction => (
                    <div key={interaction.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{interaction.type_interaction}</div>
                          {interaction.sujet && <div className="text-sm">{interaction.sujet}</div>}
                            </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {new Date(interaction.date_interaction).toLocaleDateString('fr-FR')}
                          </div>
                          <Badge className={interaction.statut === 'termine' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {interaction.statut}
                          </Badge>
                        </div>
                      </div>
                      {interaction.description && (
                        <div className="mt-2 text-sm text-gray-600">{interaction.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune interaction enregistrée
                            </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {client.notes && client.notes.length > 0 ? (
                <div className="space-y-4">
                  {client.notes.map(note => (
                    <div key={note.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          {note.titre && <div className="font-medium">{note.titre}</div>}
                            <div className="text-sm text-gray-500">
                            {new Date(note.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <Badge className={note.type_note === 'commercial' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                          {note.type_note}
                        </Badge>
                      </div>
                      <div className="mt-2">{note.contenu}</div>
                        </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune note enregistrée
            </div>
              )}
          </CardContent>
        </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 
