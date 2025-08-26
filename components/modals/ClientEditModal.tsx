'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Building, Users, Phone, Mail, MapPin, CreditCard, FileText, UserCheck, Calendar, Save, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { clientsApi } from '@/lib/api/clients';
import { useNotifications } from '@/hooks/useNotifications';
import type { ClientWithRelations, ClientFormData, ReferentFormData, ConventionFormData } from '@/lib/api/clients';
import type { ClientType } from '@/lib/supabase';

interface ClientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: ClientWithRelations | null;
  clientTypes: ClientType[];
  onSuccess?: () => void;
}

export default function ClientEditModal({
  isOpen,
  onClose,
  client,
  clientTypes,
  onSuccess
}: ClientEditModalProps) {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('informations');
  
  // Form data
  const [formData, setFormData] = useState<ClientFormData>({
    type_id: 1,
    nom: '',
    prenom: '',
    raison_sociale: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    code_postal: '',
    siret: '',
    secteur_activite: '',
    nombre_employes: undefined,
    numero_agrement: '',
    nombre_adherents: undefined,
    nombre_enfants: undefined,
    statut: 'actif',
    mode_paiement: 'virement',
    delai_paiement: 30,
    taux_tva: 20,
    conditions_paiement: '',
    notes: ''
  });

  // Referents management
  const [referents, setReferents] = useState<any[]>([]);
  const [newReferent, setNewReferent] = useState<ReferentFormData>({
    nom: '',
    prenom: '',
    fonction: '',
    telephone: '',
    email: ''
  });
  const [editingReferentId, setEditingReferentId] = useState<number | null>(null);

  // Conventions management
  const [conventions, setConventions] = useState<any[]>([]);
  const [newConvention, setNewConvention] = useState<ConventionFormData>({
    date_debut: '',
    date_fin: '',
    reduction_pourcentage: 0,
    forfait_mensuel: 0,
    conditions: '',
    active: true
  });
  const [editingConventionId, setEditingConventionId] = useState<number | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load client data when modal opens
  useEffect(() => {
    if (isOpen && client) {
      setFormData({
        type_id: client.type_id || 1,
        nom: client.nom || '',
        prenom: client.prenom || '',
        raison_sociale: client.raison_sociale || '',
        email: client.email || '',
        telephone: client.telephone || '',
        adresse: client.adresse || '',
        ville: client.ville || '',
        code_postal: client.code_postal || '',
        siret: client.siret || '',
        secteur_activite: client.secteur_activite || '',
        nombre_employes: client.nombre_employes || undefined,
        numero_agrement: client.numero_agrement || '',
        nombre_adherents: client.nombre_adherents || undefined,
        nombre_enfants: client.nombre_enfants || undefined,
        statut: client.statut || 'actif',
        mode_paiement: client.mode_paiement || 'virement',
        delai_paiement: client.delai_paiement || 30,
        taux_tva: client.taux_tva || 20,
        conditions_paiement: client.conditions_paiement || '',
        notes: client.notes || ''
      });
      setReferents(client.referents || []);
      setConventions(client.conventions || []);
    } else if (isOpen) {
      // Reset form for new client
      setFormData({
        type_id: 1,
        nom: '',
        prenom: '',
        raison_sociale: '',
        email: '',
        telephone: '',
        adresse: '',
        ville: '',
        code_postal: '',
        siret: '',
        secteur_activite: '',
        nombre_employes: undefined,
        numero_agrement: '',
        nombre_adherents: undefined,
        nombre_enfants: undefined,
        statut: 'actif',
        mode_paiement: 'virement',
        delai_paiement: 30,
        taux_tva: 20,
        conditions_paiement: '',
        notes: ''
      });
      setReferents([]);
      setConventions([]);
    }
  }, [isOpen, client]);

  // Get selected client type
  const selectedType = clientTypes.find(t => t.id === formData.type_id);
  const isParticulier = formData.type_id === 1;
  const isEntreprise = formData.type_id === 2;
  const isAssociation = formData.type_id === 3;

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields based on client type
    if (isParticulier) {
      if (!formData.nom) newErrors.nom = 'Le nom est obligatoire';
      if (!formData.prenom) newErrors.prenom = 'Le prénom est obligatoire';
    } else {
      if (!formData.raison_sociale) newErrors.raison_sociale = 'La raison sociale est obligatoire';
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    // Phone validation
    if (formData.telephone && !/^[0-9\s\-\+\.]+$/.test(formData.telephone)) {
      newErrors.telephone = 'Numéro de téléphone invalide';
    }

    // SIRET validation (14 digits for French companies)
    if (formData.siret && !/^\d{14}$/.test(formData.siret.replace(/\s/g, ''))) {
      newErrors.siret = 'Le SIRET doit contenir 14 chiffres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      addNotification('error', 'Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setLoading(true);
    try {
      let response;
      
      if (client?.id) {
        // Update existing client
        response = await clientsApi.updateClient(client.id, formData);
      } else {
        // Create new client
        response = await clientsApi.createClient(formData);
      }

      if (response.success) {
        addNotification('success', client ? 'Client modifié avec succès' : 'Client créé avec succès');
        onSuccess?.();
        onClose();
      } else {
        addNotification('error', response.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Error saving client:', error);
      addNotification('error', 'Une erreur est survenue lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  // Referent management functions
  const handleAddReferent = async () => {
    if (!newReferent.nom) {
      addNotification('error', 'Le nom du référent est obligatoire');
      return;
    }

    if (!client?.id) {
      // For new clients, add to local state
      setReferents([...referents, { ...newReferent, id: Date.now() }]);
      setNewReferent({ nom: '', prenom: '', fonction: '', telephone: '', email: '' });
      return;
    }

    setLoading(true);
    try {
      const response = await clientsApi.createReferent(client.id, newReferent);
      if (response.success) {
        setReferents([...referents, response.data!]);
        setNewReferent({ nom: '', prenom: '', fonction: '', telephone: '', email: '' });
        addNotification('success', 'Référent ajouté avec succès');
      } else {
        addNotification('error', response.error || 'Erreur lors de l\'ajout du référent');
      }
    } catch (error) {
      addNotification('error', 'Erreur lors de l\'ajout du référent');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReferent = async (referentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce référent ?')) return;

    if (!client?.id) {
      setReferents(referents.filter(r => r.id !== referentId));
      return;
    }

    setLoading(true);
    try {
      const response = await clientsApi.deleteReferent(referentId);
      if (response.success) {
        setReferents(referents.filter(r => r.id !== referentId));
        addNotification('success', 'Référent supprimé avec succès');
      } else {
        addNotification('error', response.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      addNotification('error', 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  // Convention management functions
  const handleAddConvention = async () => {
    if (!newConvention.date_debut) {
      addNotification('error', 'La date de début est obligatoire');
      return;
    }

    if (!client?.id) {
      // For new clients, add to local state
      setConventions([...conventions, { ...newConvention, id: Date.now() }]);
      setNewConvention({
        date_debut: '',
        date_fin: '',
        reduction_pourcentage: 0,
        forfait_mensuel: 0,
        conditions: '',
        active: true
      });
      return;
    }

    setLoading(true);
    try {
      const response = await clientsApi.createConvention(client.id, newConvention);
      if (response.success) {
        setConventions([...conventions, response.data!]);
        setNewConvention({
          date_debut: '',
          date_fin: '',
          reduction_pourcentage: 0,
          forfait_mensuel: 0,
          conditions: '',
          active: true
        });
        addNotification('success', 'Convention ajoutée avec succès');
      } else {
        addNotification('error', response.error || 'Erreur lors de l\'ajout');
      }
    } catch (error) {
      addNotification('error', 'Erreur lors de l\'ajout de la convention');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConvention = async (conventionId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette convention ?')) return;

    if (!client?.id) {
      setConventions(conventions.filter(c => c.id !== conventionId));
      return;
    }

    setLoading(true);
    try {
      const response = await clientsApi.deleteConvention(conventionId);
      if (response.success) {
        setConventions(conventions.filter(c => c.id !== conventionId));
        addNotification('success', 'Convention supprimée avec succès');
      } else {
        addNotification('error', response.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      addNotification('error', 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {client ? 'Modifier le client' : 'Nouveau client'}
            </h2>
            {client && (
              <p className="text-sm text-gray-600 mt-1">
                N° Client : {client.numero_client}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content with tabs */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="informations">Informations</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger 
                value="referents" 
                disabled={isParticulier}
                className={isParticulier ? 'opacity-50' : ''}
              >
                Référents
              </TabsTrigger>
              <TabsTrigger 
                value="conventions" 
                disabled={isParticulier}
                className={isParticulier ? 'opacity-50' : ''}
              >
                Conventions
              </TabsTrigger>
            </TabsList>

            {/* Informations Tab */}
            <TabsContent value="informations" className="space-y-6 mt-6">
              {/* Type selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Type de client</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {clientTypes.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type_id: type.id })}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          formData.type_id === type.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          {type.id === 1 && <User className="h-8 w-8 mb-2 text-blue-600" />}
                          {type.id === 2 && <Building className="h-8 w-8 mb-2 text-green-600" />}
                          {type.id === 3 && <Users className="h-8 w-8 mb-2 text-amber-600" />}
                          <span className="font-medium">{type.nom}</span>
                          <span className="text-xs text-gray-500">{type.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Conditional fields based on client type */}
                    {isParticulier ? (
                      <>
                        <div>
                          <Label htmlFor="nom">Nom *</Label>
                          <Input
                            id="nom"
                            value={formData.nom}
                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                            className={errors.nom ? 'border-red-500' : ''}
                          />
                          {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
                        </div>
                        <div>
                          <Label htmlFor="prenom">Prénom *</Label>
                          <Input
                            id="prenom"
                            value={formData.prenom}
                            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                            className={errors.prenom ? 'border-red-500' : ''}
                          />
                          {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
                        </div>
                        <div>
                          <Label htmlFor="nombre_enfants">Nombre d'enfants</Label>
                          <Input
                            id="nombre_enfants"
                            type="number"
                            value={formData.nombre_enfants || ''}
                            onChange={(e) => setFormData({ ...formData, nombre_enfants: parseInt(e.target.value) || undefined })}
                            min="0"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="md:col-span-2">
                          <Label htmlFor="raison_sociale">Raison sociale *</Label>
                          <Input
                            id="raison_sociale"
                            value={formData.raison_sociale}
                            onChange={(e) => setFormData({ ...formData, raison_sociale: e.target.value })}
                            className={errors.raison_sociale ? 'border-red-500' : ''}
                          />
                          {errors.raison_sociale && <p className="text-red-500 text-xs mt-1">{errors.raison_sociale}</p>}
                        </div>
                        <div>
                          <Label htmlFor="nom">Contact - Nom</Label>
                          <Input
                            id="nom"
                            value={formData.nom}
                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="prenom">Contact - Prénom</Label>
                          <Input
                            id="prenom"
                            value={formData.prenom}
                            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="siret">SIRET</Label>
                          <Input
                            id="siret"
                            value={formData.siret}
                            onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                            placeholder="14 chiffres"
                            className={errors.siret ? 'border-red-500' : ''}
                          />
                          {errors.siret && <p className="text-red-500 text-xs mt-1">{errors.siret}</p>}
                        </div>
                        {isEntreprise && (
                          <>
                            <div>
                              <Label htmlFor="secteur_activite">Secteur d'activité</Label>
                              <Input
                                id="secteur_activite"
                                value={formData.secteur_activite}
                                onChange={(e) => setFormData({ ...formData, secteur_activite: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="nombre_employes">Nombre d'employés</Label>
                              <Input
                                id="nombre_employes"
                                type="number"
                                value={formData.nombre_employes || ''}
                                onChange={(e) => setFormData({ ...formData, nombre_employes: parseInt(e.target.value) || undefined })}
                                min="0"
                              />
                            </div>
                          </>
                        )}
                        {isAssociation && (
                          <>
                            <div>
                              <Label htmlFor="numero_agrement">Numéro d'agrément</Label>
                              <Input
                                id="numero_agrement"
                                value={formData.numero_agrement}
                                onChange={(e) => setFormData({ ...formData, numero_agrement: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="nombre_adherents">Nombre d'adhérents</Label>
                              <Input
                                id="nombre_adherents"
                                type="number"
                                value={formData.nombre_adherents || ''}
                                onChange={(e) => setFormData({ ...formData, nombre_adherents: parseInt(e.target.value) || undefined })}
                                min="0"
                              />
                            </div>
                          </>
                        )}
                      </>
                    )}
                    
                    {/* Statut */}
                    <div>
                      <Label htmlFor="statut">Statut</Label>
                      <select
                        id="statut"
                        value={formData.statut}
                        onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="actif">Actif</option>
                        <option value="inactif">Inactif</option>
                        <option value="prospect">Prospect</option>
                        <option value="archive">Archivé</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations de paiement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mode_paiement">Mode de paiement</Label>
                      <select
                        id="mode_paiement"
                        value={formData.mode_paiement}
                        onChange={(e) => setFormData({ ...formData, mode_paiement: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="virement">Virement</option>
                        <option value="cheque">Chèque</option>
                        <option value="especes">Espèces</option>
                        <option value="carte">Carte bancaire</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="delai_paiement">Délai de paiement (jours)</Label>
                      <select
                        id="delai_paiement"
                        value={formData.delai_paiement}
                        onChange={(e) => setFormData({ ...formData, delai_paiement: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={0}>Comptant</option>
                        <option value={15}>15 jours</option>
                        <option value={30}>30 jours</option>
                        <option value={45}>45 jours</option>
                        <option value={60}>60 jours</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="taux_tva">Taux de TVA (%)</Label>
                      <Input
                        id="taux_tva"
                        type="number"
                        value={formData.taux_tva}
                        onChange={(e) => setFormData({ ...formData, taux_tva: parseFloat(e.target.value) })}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="conditions_paiement">Conditions de paiement</Label>
                      <Input
                        id="conditions_paiement"
                        value={formData.conditions_paiement}
                        onChange={(e) => setFormData({ ...formData, conditions_paiement: e.target.value })}
                        placeholder="Ex: Net à 30 jours"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notes internes sur ce client..."
                    rows={4}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Coordonnées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <Label htmlFor="telephone">Téléphone</Label>
                      <Input
                        id="telephone"
                        value={formData.telephone}
                        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                        className={errors.telephone ? 'border-red-500' : ''}
                      />
                      {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Adresse</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="adresse">Adresse</Label>
                      <Input
                        id="adresse"
                        value={formData.adresse}
                        onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="code_postal">Code postal</Label>
                        <Input
                          id="code_postal"
                          value={formData.code_postal}
                          onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ville">Ville</Label>
                        <Input
                          id="ville"
                          value={formData.ville}
                          onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Referents Tab (only for Entreprise/Association) */}
            {!isParticulier && (
              <TabsContent value="referents" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Ajouter un référent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ref-nom">Nom *</Label>
                        <Input
                          id="ref-nom"
                          value={newReferent.nom}
                          onChange={(e) => setNewReferent({ ...newReferent, nom: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ref-prenom">Prénom</Label>
                        <Input
                          id="ref-prenom"
                          value={newReferent.prenom}
                          onChange={(e) => setNewReferent({ ...newReferent, prenom: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ref-fonction">Fonction</Label>
                        <Input
                          id="ref-fonction"
                          value={newReferent.fonction}
                          onChange={(e) => setNewReferent({ ...newReferent, fonction: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ref-email">Email</Label>
                        <Input
                          id="ref-email"
                          type="email"
                          value={newReferent.email}
                          onChange={(e) => setNewReferent({ ...newReferent, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ref-telephone">Téléphone</Label>
                        <Input
                          id="ref-telephone"
                          value={newReferent.telephone}
                          onChange={(e) => setNewReferent({ ...newReferent, telephone: e.target.value })}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          type="button" 
                          onClick={handleAddReferent}
                          disabled={loading}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* List of referents */}
                {referents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Référents existants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {referents.map((referent) => (
                          <div key={referent.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">
                                {referent.prenom} {referent.nom}
                                {referent.fonction && <span className="text-gray-500"> - {referent.fonction}</span>}
                              </p>
                              <div className="flex gap-4 text-sm text-gray-600">
                                {referent.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {referent.email}
                                  </span>
                                )}
                                {referent.telephone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {referent.telephone}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteReferent(referent.id)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}

            {/* Conventions Tab (only for Entreprise/Association) */}
            {!isParticulier && (
              <TabsContent value="conventions" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Ajouter une convention tarifaire</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="conv-date-debut">Date de début *</Label>
                        <Input
                          id="conv-date-debut"
                          type="date"
                          value={newConvention.date_debut}
                          onChange={(e) => setNewConvention({ ...newConvention, date_debut: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="conv-date-fin">Date de fin</Label>
                        <Input
                          id="conv-date-fin"
                          type="date"
                          value={newConvention.date_fin}
                          onChange={(e) => setNewConvention({ ...newConvention, date_fin: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="conv-reduction">Réduction (%)</Label>
                        <Input
                          id="conv-reduction"
                          type="number"
                          value={newConvention.reduction_pourcentage}
                          onChange={(e) => setNewConvention({ ...newConvention, reduction_pourcentage: parseFloat(e.target.value) || 0 })}
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="conv-forfait">Forfait mensuel (€)</Label>
                        <Input
                          id="conv-forfait"
                          type="number"
                          value={newConvention.forfait_mensuel}
                          onChange={(e) => setNewConvention({ ...newConvention, forfait_mensuel: parseFloat(e.target.value) || 0 })}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="conv-conditions">Conditions</Label>
                        <Textarea
                          id="conv-conditions"
                          value={newConvention.conditions}
                          onChange={(e) => setNewConvention({ ...newConvention, conditions: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="conv-active"
                          checked={newConvention.active}
                          onChange={(e) => setNewConvention({ ...newConvention, active: e.target.checked })}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="conv-active">Convention active</Label>
                      </div>
                      <div className="flex items-end">
                        <Button 
                          type="button" 
                          onClick={handleAddConvention}
                          disabled={loading}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* List of conventions */}
                {conventions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Conventions existantes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {conventions.map((convention) => (
                          <div key={convention.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={convention.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                  {convention.active ? 'Active' : 'Inactive'}
                                </Badge>
                                <span className="text-sm">
                                  Du {new Date(convention.date_debut).toLocaleDateString('fr-FR')}
                                  {convention.date_fin && ` au ${new Date(convention.date_fin).toLocaleDateString('fr-FR')}`}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {convention.reduction_pourcentage > 0 && (
                                  <span>Réduction : {convention.reduction_pourcentage}%</span>
                                )}
                                {convention.forfait_mensuel > 0 && (
                                  <span>Forfait : {convention.forfait_mensuel}€/mois</span>
                                )}
                              </div>
                              {convention.conditions && (
                                <p className="text-sm text-gray-600 mt-1">{convention.conditions}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteConvention(convention.id)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enregistrement...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {client ? 'Enregistrer' : 'Créer'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}