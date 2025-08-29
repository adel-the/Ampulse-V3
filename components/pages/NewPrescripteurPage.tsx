'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X, User, Building, Users, Phone, Mail, MapPin, CreditCard, FileText, UserCheck, Calendar, Save, Plus, Trash2, Edit, TestTube, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { clientsApi } from '@/lib/api/clients';
import { conventionsApi } from '@/lib/api/conventions';
import { useNotifications } from '@/hooks/useNotifications';
// ConventionPrix removed - conventions are added via editing existing prescripteurs
import type { ClientWithRelations, ClientFormData, ReferentFormData, ConventionFormData } from '@/lib/api/clients';
import type { ClientCategory } from '@/lib/supabase';

interface NewPrescripteurPageProps {
  initialData?: ClientWithRelations | null;
}

export default function NewPrescripteurPage({ initialData }: NewPrescripteurPageProps) {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('informations');
  
  // Form data
  const [formData, setFormData] = useState<ClientFormData>({
    client_type: 'Particulier',
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

  // Conventions management - removed for new prescripteurs
  // Conventions are handled only when editing existing prescripteurs
  
  // Pricing conventions data - removed for new prescripteurs
  // Conventions can only be added when editing existing prescripteurs

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testDataApplied, setTestDataApplied] = useState(false);

  // Helper function to generate test data based on client type
  const getTestData = (clientType: ClientCategory) => {
    switch (clientType) {
      case 'Particulier':
        return {
          formData: {
            nom: 'Dupont',
            prenom: 'Jean',
            email: 'jean.dupont@example.com',
            telephone: '06 23 45 67 89',
            adresse: '42 Avenue des Champs',
            ville: 'Paris',
            code_postal: '75008',
            nombre_enfants: 2,
            mode_paiement: 'virement' as const,
            delai_paiement: 30,
            taux_tva: 20,
            conditions_paiement: 'Paiement mensuel à réception de facture',
            notes: 'Client régulier, famille de 4 personnes'
          },
          referent: {
            nom: 'Dupont',
            prenom: 'Marie',
            fonction: 'Épouse',
            telephone: '06 87 65 43 21',
            email: 'marie.dupont@example.com'
          },
          convention: null
        };
      case 'Entreprise':
        return {
          formData: {
            raison_sociale: 'Innov Tech SAS',
            nom: 'Moreau',
            prenom: 'Alexandre',
            siret: '98765432101234',
            email: 'contact@innovtech.fr',
            telephone: '01 23 45 67 89',
            adresse: '100 Rue de l\'Innovation',
            ville: 'Lyon',
            code_postal: '69002',
            secteur_activite: 'Technologies de l\'information',
            nombre_employes: 50,
            mode_paiement: 'virement' as const,
            delai_paiement: 45,
            taux_tva: 20,
            conditions_paiement: 'Paiement à 45 jours fin de mois',
            notes: 'Entreprise partenaire depuis 2022'
          },
          referent: {
            nom: 'Dubois',
            prenom: 'Nathalie',
            fonction: 'Responsable RH',
            telephone: '06 45 67 89 01',
            email: 'nathalie.dubois@innovtech.fr'
          },
          convention: {
            date_debut: '2024-01-01',
            date_fin: '2024-12-31',
            reduction_pourcentage: 10,
            forfait_mensuel: 3000,
            conditions: 'Convention entreprise avec 10% de réduction sur le forfait mensuel',
            active: true
          }
        };
      case 'Association':
        return {
          formData: {
            raison_sociale: 'Entraide et Solidarité',
            nom: 'Bernard',
            prenom: 'François',
            siret: '11223344556677',
            email: 'contact@entraide-solidarite.org',
            telephone: '03 12 34 56 78',
            adresse: '15 Place de la Solidarité',
            ville: 'Lille',
            code_postal: '59000',
            numero_agrement: 'AGR-2024-001',
            nombre_adherents: 150,
            mode_paiement: 'cheque' as const,
            delai_paiement: 60,
            taux_tva: 20,
            conditions_paiement: 'Paiement par chèque à 60 jours',
            notes: 'Association partenaire pour l\'hébergement social'
          },
          referent: {
            nom: 'Petit',
            prenom: 'Isabelle',
            fonction: 'Directrice',
            telephone: '06 78 90 12 34',
            email: 'isabelle.petit@entraide-solidarite.org'
          },
          convention: {
            date_debut: '2024-01-15',
            date_fin: '2024-12-15',
            reduction_pourcentage: 25,
            forfait_mensuel: 2000,
            conditions: 'Convention association avec tarif préférentiel',
            active: true
          }
        };
      default:
        return { formData: {}, referent: null, convention: null };
    }
  };

  // Function to apply test data
  const applyTestData = () => {
    const testData = getTestData(formData.client_type);
    setFormData(prev => ({
      ...prev,
      ...testData.formData
    }));
    if (testData.referent) {
      setNewReferent(testData.referent);
    }
    // Conventions test data removed for new prescripteurs
    setTestDataApplied(true);
    setTimeout(() => setTestDataApplied(false), 3000);
  };

  // Function to clear form
  const clearForm = () => {
    setFormData({
      client_type: formData.client_type,
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
    setNewReferent({
      nom: '',
      prenom: '',
      fonction: '',
      telephone: '',
      email: ''
    });
    // Convention state reset removed for new prescripteurs
    setTestDataApplied(false);
  };

  // Load client data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        client_type: initialData.client_type || 'Particulier',
        nom: initialData.nom || '',
        prenom: initialData.prenom || '',
        raison_sociale: initialData.raison_sociale || '',
        email: initialData.email || '',
        telephone: initialData.telephone || '',
        adresse: initialData.adresse || '',
        ville: initialData.ville || '',
        code_postal: initialData.code_postal || '',
        siret: initialData.siret || '',
        secteur_activite: initialData.secteur_activite || '',
        nombre_employes: initialData.nombre_employes || undefined,
        numero_agrement: initialData.numero_agrement || '',
        nombre_adherents: initialData.nombre_adherents || undefined,
        nombre_enfants: initialData.nombre_enfants || undefined,
        statut: initialData.statut || 'actif',
        mode_paiement: initialData.mode_paiement || 'virement',
        delai_paiement: initialData.delai_paiement || 30,
        taux_tva: initialData.taux_tva || 20,
        conditions_paiement: initialData.conditions_paiement || '',
        notes: initialData.notes || ''
      });
      setReferents(initialData.referents || []);
      // Conventions loading removed for new prescripteurs
    }
  }, [initialData]);

  // Get selected client type
  const isParticulier = formData.client_type === 'Particulier';
  const isEntreprise = formData.client_type === 'Entreprise';
  const isAssociation = formData.client_type === 'Association';

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
      // Filter data to only include database fields
      const filteredClientData: any = {
        client_type: formData.client_type,
        nom: formData.nom,
        statut: formData.statut === 'archive' ? 'inactif' : (formData.statut || 'actif')
      };
      
      // Only add optional fields if they have values
      if (formData.prenom?.trim()) filteredClientData.prenom = formData.prenom.trim();
      if (formData.email?.trim()) filteredClientData.email = formData.email.trim();
      if (formData.telephone?.trim()) filteredClientData.telephone = formData.telephone.trim();
      if (formData.adresse?.trim()) filteredClientData.adresse = formData.adresse.trim();
      if (formData.ville?.trim()) filteredClientData.ville = formData.ville.trim();
      if (formData.code_postal?.trim()) filteredClientData.code_postal = formData.code_postal.trim();
      if (formData.raison_sociale?.trim()) filteredClientData.raison_sociale = formData.raison_sociale.trim();
      if (formData.siret?.trim()) filteredClientData.siret = formData.siret.trim();
      
      console.log('Creating new client with formData:', formData);
      console.log('Filtered client data for DB:', filteredClientData);
      const response = await clientsApi.createClient(filteredClientData);
      console.log('API Response:', response);

      if (response.success && response.data?.id) {
        console.log('Success - Client saved:', response.data);
        const clientId = response.data.id;
        
        // For new prescripteurs, conventions are added in a separate step via editing
        addNotification('success', 'Prescripteur créé avec succès. Utilisez "Modifier" pour ajouter des conventions tarifaires.');
        
        // Navigate back to clients section
        router.push('/');
      } else if (response.success) {
        // Success but no client ID returned
        addNotification('success', 'Prescripteur créé avec succès');
        router.push('/');
      } else {
        console.error('API Error Response:', response);
        const errorMessage = response.error || 'Une erreur est survenue';
        console.error('Displaying error to user:', errorMessage);
        addNotification('error', `Erreur: ${errorMessage}`);
      }
    } catch (error) {
      console.error('=== FULL ERROR DETAILS ===');
      console.error('Error saving client:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      addNotification('error', `Erreur lors de l'enregistrement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers
  const handleCancel = () => {
    router.push('/');
  };

  // Referent management functions
  const handleAddReferent = () => {
    if (!newReferent.nom) {
      addNotification('error', 'Le nom du référent est obligatoire');
      return;
    }

    setReferents([...referents, { ...newReferent, id: Date.now() }]);
    setNewReferent({ nom: '', prenom: '', fonction: '', telephone: '', email: '' });
  };

  const handleDeleteReferent = (referentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce référent ?')) return;
    setReferents(referents.filter(r => r.id !== referentId));
  };

  // Convention management functions removed for new prescripteurs
  // Conventions are managed only when editing existing prescripteurs

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleCancel}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {initialData ? 'Modifier le prescripteur' : 'Nouveau prescripteur'}
                </h1>
                {initialData && (
                  <p className="text-sm text-gray-600 mt-1">
                    N° Client : {initialData.numero_client}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancel} disabled={loading}>
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
                    {initialData ? 'Enregistrer' : 'Créer'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Test data notification */}
          {testDataApplied && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription>
                ✅ Données de test appliquées avec succès
              </AlertDescription>
            </Alert>
          )}
          
          {/* Test data buttons for new clients */}
          {!initialData && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyTestData}
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                Remplir avec données test
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearForm}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Effacer
              </Button>
            </div>
          )}
          
          <TabsList className="grid grid-cols-3 w-full max-w-2xl">
            <TabsTrigger value="informations">Informations</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger 
              value="referents" 
              disabled={isParticulier}
              className={isParticulier ? 'opacity-50' : ''}
            >
              Référents
            </TabsTrigger>
          </TabsList>

          {/* Informations Tab */}
          <TabsContent value="informations" className="space-y-8">
            {/* Type selection */}
            <Card>
              <CardHeader>
                <CardTitle>Type de client</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  {[{value: 'Particulier', label: 'Particulier', description: 'Client individuel'}, {value: 'Entreprise', label: 'Entreprise', description: 'Société commerciale'}, {value: 'Association', label: 'Association', description: 'Organisation à but non lucratif'}].map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, client_type: type.value as ClientCategory })}
                      className={`p-6 border-2 rounded-lg transition-all ${
                        formData.client_type === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        {type.value === 'Particulier' && <User className="h-10 w-10 mb-3 text-blue-600" />}
                        {type.value === 'Entreprise' && <Building className="h-10 w-10 mb-3 text-green-600" />}
                        {type.value === 'Association' && <Users className="h-10 w-10 mb-3 text-amber-600" />}
                        <span className="font-medium text-lg">{type.label}</span>
                        <span className="text-sm text-gray-500 mt-1">{type.description}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Conditional fields based on client type */}
                  {isParticulier ? (
                    <>
                      <div>
                        <Label htmlFor="nom">Nom *</Label>
                        <Input
                          id="nom"
                          value={formData.nom}
                          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                          placeholder="Ex: Dupont"
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
                          placeholder="Ex: Jean"
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
                          placeholder="Ex: 2"
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
                          placeholder={isEntreprise ? "Ex: Innov Tech SAS" : "Ex: Entraide et Solidarité"}
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
                          placeholder="Ex: Moreau"
                        />
                      </div>
                      <div>
                        <Label htmlFor="prenom">Contact - Prénom</Label>
                        <Input
                          id="prenom"
                          value={formData.prenom}
                          onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                          placeholder="Ex: Alexandre"
                        />
                      </div>
                      <div>
                        <Label htmlFor="siret">SIRET</Label>
                        <Input
                          id="siret"
                          value={formData.siret}
                          onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                          placeholder="Ex: 12345678901234 (14 chiffres)"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <TabsContent value="contact" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Coordonnées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={isParticulier ? "Ex: jean.dupont@example.com" : "Ex: contact@entreprise.fr"}
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
                      placeholder="Ex: 06 12 34 56 78"
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
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="adresse">Adresse</Label>
                    <Input
                      id="adresse"
                      value={formData.adresse}
                      onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                      placeholder="Ex: 42 Avenue des Champs"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="code_postal">Code postal</Label>
                      <Input
                        id="code_postal"
                        value={formData.code_postal}
                        onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
                        placeholder="Ex: 75008"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ville">Ville</Label>
                      <Input
                        id="ville"
                        value={formData.ville}
                        onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                        placeholder="Ex: Paris"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referents Tab (only for Entreprise/Association) */}
          {!isParticulier && (
            <TabsContent value="referents" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Ajouter un référent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="ref-nom">Nom *</Label>
                      <Input
                        id="ref-nom"
                        value={newReferent.nom}
                        onChange={(e) => setNewReferent({ ...newReferent, nom: e.target.value })}
                        placeholder="Ex: Dubois"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ref-prenom">Prénom</Label>
                      <Input
                        id="ref-prenom"
                        value={newReferent.prenom}
                        onChange={(e) => setNewReferent({ ...newReferent, prenom: e.target.value })}
                        placeholder="Ex: Nathalie"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ref-fonction">Fonction</Label>
                      <Input
                        id="ref-fonction"
                        value={newReferent.fonction}
                        onChange={(e) => setNewReferent({ ...newReferent, fonction: e.target.value })}
                        placeholder="Ex: Responsable RH"
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
                    <div className="space-y-4">
                      {referents.map((referent) => (
                        <div key={referent.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">
                              {referent.prenom} {referent.nom}
                              {referent.fonction && <span className="text-gray-500"> - {referent.fonction}</span>}
                            </p>
                            <div className="flex gap-4 text-sm text-gray-600 mt-1">
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

          {/* Conventions message for new prescripteurs */}
          {!isParticulier && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Conventions tarifaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-800">
                      <div className="space-y-2">
                        <p className="font-medium">Les conventions tarifaires peuvent être configurées après création du prescripteur.</p>
                        <p className="text-sm">
                          Une fois ce prescripteur créé, vous pourrez :
                        </p>
                        <ul className="list-disc list-inside text-sm ml-2 space-y-1">
                          <li>Définir des tarifs spécifiques par catégorie de chambre</li>
                          <li>Configurer des prix variables par mois</li>
                          <li>Ajouter des conditions particulières</li>
                        </ul>
                        <p className="text-sm font-medium mt-3">
                          → Créez d'abord le prescripteur, puis utilisez l'option "Modifier" pour ajouter les conventions.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
}