'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { User, Building, Users, CreditCard, Phone, FileText, TestTube, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ClientType, ClientFormData, Client, ReferentFormData, ConventionFormData } from '../../lib/supabase';

interface AddClientFormProps {
  clientTypes: ClientType[];
  preSelectedType?: number | null;
  client?: Client | null; // For editing existing client
  onClientAdded?: (client: Client) => void;
  onCancel?: () => void;
  className?: string;
}

// Types de clients constants (fallback)
const DEFAULT_CLIENT_TYPES: ClientType[] = [
  { id: 1, nom: 'Particulier', description: 'Client individuel', icone: 'user', couleur: '#3B82F6', ordre: 1, created_at: '', updated_at: '' },
  { id: 2, nom: 'Entreprise', description: 'Société commerciale', icone: 'building', couleur: '#10B981', ordre: 2, created_at: '', updated_at: '' },
  { id: 3, nom: 'Association', description: 'Organisation à but non lucratif', icone: 'users', couleur: '#F59E0B', ordre: 3, created_at: '', updated_at: '' }
];

export default function AddClientForm({ 
  clientTypes = DEFAULT_CLIENT_TYPES, 
  preSelectedType,
  client, // The client to edit (if any)
  onClientAdded,
  onCancel,
  className = ''
}: AddClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<number | null>(client?.type_id || preSelectedType || null);
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<Partial<ClientFormData>>({
    type_id: client?.type_id || preSelectedType || 1,
    statut: client?.statut || 'actif',
    nom: client?.nom || '',
    prenom: client?.prenom || '',
    email: client?.email || '',
    telephone: client?.telephone || '',
    adresse: client?.adresse || '',
    ville: client?.ville || '',
    code_postal: client?.code_postal || '',
    raison_sociale: client?.raison_sociale || '',
    siret: client?.siret || '',
    mode_paiement: 'virement',
    delai_paiement: 30,
    taux_tva: 20
  });
  const [referentData, setReferentData] = useState<Partial<ReferentFormData>>({});
  const [conventionData, setConventionData] = useState<Partial<ConventionFormData>>({
    active: false
  });
  const [testDataApplied, setTestDataApplied] = useState(false);

  // Fonction pour générer les données de test selon le type de client
  const getPlaceholderData = (typeId: number) => {
    const typeData = clientTypes.find(t => t.id === typeId);
    if (!typeData) return { formData: {}, referentData: {}, conventionData: {} };

    switch (typeData.nom) {
      case 'Particulier':
        return {
          formData: {
            nom: 'Durand',
            prenom: 'Marie',
            email: 'marie.durand@example.com',
            telephone: '06 12 34 56 78',
            adresse: '15 Rue de la République',
            ville: 'Lyon',
            code_postal: '69001',
            mode_paiement: 'virement' as const,
            delai_paiement: 30,
            taux_tva: 20
          },
          referentData: {
            nom: 'Durand',
            prenom: 'Jacques',
            fonction: 'Père',
            telephone: '06 98 76 54 32',
            email: 'jacques.durand@example.com'
          },
          conventionData: {
            active: false
          }
        };
      case 'Entreprise':
        return {
          formData: {
            raison_sociale: 'Tech Solutions SARL',
            nom: 'Martin',
            prenom: 'Philippe',
            siret: '12345678901234',
            email: 'contact@techsolutions.fr',
            telephone: '01 40 50 60 70',
            adresse: '25 Boulevard Haussmann',
            ville: 'Paris',
            code_postal: '75009',
            mode_paiement: 'virement' as const,
            delai_paiement: 30,
            taux_tva: 20
          },
          referentData: {
            nom: 'Martin',
            prenom: 'Sophie',
            fonction: 'Directrice Commerciale',
            telephone: '06 11 22 33 44',
            email: 'sophie.martin@techsolutions.fr'
          },
          conventionData: {
            active: true,
            reduction_pourcentage: 15,
            forfait_mensuel: 2500,
            date_debut: '2024-01-01',
            date_fin: '2024-12-31',
            conditions: 'Convention tarifaire entreprise avec réduction de 15% sur tous les services. Facturation mensuelle forfaitaire de 2500€ incluant hébergement et services annexes.'
          }
        };
      case 'Association':
        return {
          formData: {
            raison_sociale: 'Association Solidarité Pour Tous',
            nom: 'Lefevre',
            prenom: 'Claude',
            siret: '98765432109876',
            email: 'contact@solidarite-pour-tous.org',
            telephone: '04 78 90 12 34',
            adresse: '45 Avenue de la Solidarité',
            ville: 'Marseille',
            code_postal: '13001',
            mode_paiement: 'cheque' as const,
            delai_paiement: 45,
            taux_tva: 20
          },
          referentData: {
            nom: 'Lefevre',
            prenom: 'Jean-Paul',
            fonction: 'Président',
            telephone: '06 55 44 33 22',
            email: 'jp.lefevre@solidarite-pour-tous.org'
          },
          conventionData: {
            active: true,
            reduction_pourcentage: 20,
            forfait_mensuel: 1800,
            date_debut: '2024-01-01',
            date_fin: '2024-12-31',
            conditions: 'Convention tarifaire association avec réduction de 20% sur tous les services. Forfait mensuel de 1800€ adapté aux besoins associatifs avec modalités de paiement flexibles.'
          }
        };
      default:
        return { formData: {}, referentData: {}, conventionData: {} };
    }
  };

  // Fonction pour appliquer les données de test
  const applyPlaceholderData = (typeId: number) => {
    const placeholderData = getPlaceholderData(typeId);
    setFormData(prev => ({ 
      ...prev, 
      type_id: typeId, 
      statut: 'actif',
      ...placeholderData.formData 
    }));
    setReferentData(placeholderData.referentData);
    setConventionData(placeholderData.conventionData);
    setTestDataApplied(true);
    
    // Auto-hide the notification after 3 seconds
    setTimeout(() => setTestDataApplied(false), 3000);
  };

  // Fonction pour vider le formulaire
  const clearForm = () => {
    setFormData({
      type_id: selectedType || 1,
      statut: 'actif',
      mode_paiement: 'virement',
      delai_paiement: 30,
      taux_tva: 20
    });
    setReferentData({});
    setConventionData({ active: false });
    setTestDataApplied(false);
  };

  const selectedTypeData = clientTypes.find(t => t.id === selectedType);

  // Appliquer les données de test au montage si un type est présélectionné et pas en mode édition
  useEffect(() => {
    if (!client && preSelectedType && clientTypes.length > 0) {
      applyPlaceholderData(preSelectedType);
    }
  }, [client, preSelectedType, clientTypes]);

  const updateFormData = (field: keyof ClientFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateReferentData = (field: keyof ReferentFormData, value: any) => {
    setReferentData(prev => ({ ...prev, [field]: value }));
  };

  const updateConventionData = (field: keyof ConventionFormData, value: any) => {
    setConventionData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !formData.nom) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);

      // Prepare simplified client data
      const clientData: Partial<Client> = {
        type_id: selectedType,
        nom: formData.nom!,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        adresse: formData.adresse,
        ville: formData.ville,
        code_postal: formData.code_postal,
        raison_sociale: formData.raison_sociale,
        siret: formData.siret,
        statut: formData.statut || 'actif'
      };

      let clientResult: Client;
      
      if (client) {
        // Update existing client
        const { data: updatedClient, error: clientError } = await supabase
          .from('clients')
          .update({
            ...clientData,
            updated_at: new Date().toISOString()
          })
          .eq('id', client.id)
          .select()
          .single();

        if (clientError) throw clientError;
        clientResult = updatedClient;
      } else {
        // Create new client
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert(clientData)
          .select()
          .single();

        if (clientError) throw clientError;
        clientResult = newClient;
      }

      // Create referent if data exists (only for new clients)
      if (!client && referentData.nom && referentData.nom.trim()) {
        const { error: referentError } = await supabase
          .from('referents')
          .insert({
            client_id: clientResult.id,
            nom: referentData.nom!,
            prenom: referentData.prenom,
            fonction: referentData.fonction,
            telephone: referentData.telephone,
            email: referentData.email
          });
        
        if (referentError) {
          console.warn('Erreur lors de la création du référent:', referentError);
        }
      }

      // Create convention if active and for non-Particulier types (only for new clients)
      if (!client && conventionData.active && selectedType !== 1) {
        const { error: conventionError } = await supabase
          .from('conventions_tarifaires')
          .insert({
            client_id: clientResult.id,
            date_debut: conventionData.date_debut,
            date_fin: conventionData.date_fin,
            reduction_pourcentage: conventionData.reduction_pourcentage,
            forfait_mensuel: conventionData.forfait_mensuel,
            conditions: conventionData.conditions,
            active: conventionData.active
          });
        
        if (conventionError) {
          console.warn('Erreur lors de la création de la convention:', conventionError);
        }
      }

      alert(client ? 'Client mis à jour avec succès !' : 'Client créé avec succès !');
      onClientAdded?.(clientResult);
      
      // Reset form
      setFormData({ type_id: preSelectedType || 1, statut: 'actif' });
      setReferentData({});
      setConventionData({ active: false });
      setSelectedType(null);
      setActiveTab('basic');
      
    } catch (error: any) {
      console.error('Erreur lors de la création du client:', error);
      alert('Erreur lors de la création du client: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (typeName: string) => {
    switch (typeName) {
      case 'Particulier': return <User className="h-8 w-8" />;
      case 'Entreprise': return <Building className="h-8 w-8" />;
      case 'Association': return <Users className="h-8 w-8" />;
      default: return <User className="h-8 w-8" />;
    }
  };

  const getTypeColorClass = (typeName: string) => {
    switch (typeName) {
      case 'Particulier': return 'text-blue-600 border-blue-200 hover:border-blue-400 hover:bg-blue-50';
      case 'Entreprise': return 'text-green-600 border-green-200 hover:border-green-400 hover:bg-green-50';
      case 'Association': return 'text-purple-600 border-purple-200 hover:border-purple-400 hover:bg-purple-50';
      default: return 'text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Sélection du type si pas présélectionné */}
      {!preSelectedType && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Choisir le type de client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {clientTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setSelectedType(type.id);
                    applyPlaceholderData(type.id);
                  }}
                  className={`p-6 border-2 rounded-lg transition-all duration-200 text-center ${
                    selectedType === type.id 
                      ? 'border-primary bg-primary/5' 
                      : getTypeColorClass(type.nom)
                  }`}
                >
                  <div className="mb-2">{getTypeIcon(type.nom)}</div>
                  <div className="font-semibold text-lg">{type.nom}</div>
                  <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Affichage du type sélectionné */}
      {preSelectedType && selectedTypeData && (
        <Alert>
          <User className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Type de client :</strong> {selectedTypeData.nom}
                <div className="text-sm text-gray-600">{selectedTypeData.description}</div>
              </div>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} size="sm">
                  Changer de type
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Formulaire principal */}
      {selectedType && (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {client ? 'Modifier le Client' : 'Ajouter un Nouveau Client'} - {selectedTypeData?.nom}
                </div>
                <div className="flex items-center gap-2">
                  {testDataApplied && (
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      Données de test appliquées!
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPlaceholderData(selectedType!)}
                    className="flex items-center gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    Données de test
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearForm}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Vider
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Informations</TabsTrigger>
                  <TabsTrigger value="convention" disabled={selectedType === 1}>Convention</TabsTrigger>
                </TabsList>

                {/* Onglet Informations complètes */}
                <TabsContent value="basic" className="space-y-6">
                  {/* Section Informations personnelles */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <User className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">Informations personnelles</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTypeData?.nom === 'Particulier' ? (
                        <>
                          <div>
                            <Label htmlFor="nom">Nom *</Label>
                            <Input
                              id="nom"
                              value={formData.nom || ''}
                              onChange={(e) => updateFormData('nom', e.target.value)}
                              required
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="prenom">Prénom</Label>
                            <Input
                              id="prenom"
                              value={formData.prenom || ''}
                              onChange={(e) => updateFormData('prenom', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="md:col-span-2">
                            <Label htmlFor="raison_sociale">Raison Sociale *</Label>
                            <Input
                              id="raison_sociale"
                              value={formData.raison_sociale || ''}
                              onChange={(e) => updateFormData('raison_sociale', e.target.value)}
                              required
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="nom">Nom du contact</Label>
                            <Input
                              id="nom"
                              value={formData.nom || ''}
                              onChange={(e) => updateFormData('nom', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="prenom">Prénom du contact</Label>
                            <Input
                              id="prenom"
                              value={formData.prenom || ''}
                              onChange={(e) => updateFormData('prenom', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="siret">SIRET</Label>
                            <Input
                              id="siret"
                              value={formData.siret || ''}
                              onChange={(e) => updateFormData('siret', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Section Contact */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Phone className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold">Informations de contact</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="telephone">Téléphone</Label>
                        <Input
                          id="telephone"
                          value={formData.telephone || ''}
                          onChange={(e) => updateFormData('telephone', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Section Adresse */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Building className="h-5 w-5 text-purple-600" />
                      <h3 className="text-lg font-semibold">Adresse</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="adresse">Adresse complète</Label>
                        <Input
                          id="adresse"
                          value={formData.adresse || ''}
                          onChange={(e) => updateFormData('adresse', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="code_postal">Code Postal</Label>
                        <Input
                          id="code_postal"
                          value={formData.code_postal || ''}
                          onChange={(e) => updateFormData('code_postal', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ville">Ville</Label>
                        <Input
                          id="ville"
                          value={formData.ville || ''}
                          onChange={(e) => updateFormData('ville', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Section Facturation */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <CreditCard className="h-5 w-5 text-orange-600" />
                      <h3 className="text-lg font-semibold">Informations de facturation</h3>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="mode_paiement">Mode de paiement</Label>
                          <select
                            id="mode_paiement"
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            value={formData.mode_paiement || 'virement'}
                            onChange={(e) => updateFormData('mode_paiement', e.target.value)}
                          >
                            <option value="virement">Virement bancaire</option>
                            <option value="cheque">Chèque</option>
                            <option value="especes">Espèces</option>
                            <option value="carte">Carte bancaire</option>
                          </select>
                        </div>
                        
                        <div>
                          <Label htmlFor="delai_paiement">Délai de paiement</Label>
                          <select
                            id="delai_paiement"
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            value={formData.delai_paiement || '30'}
                            onChange={(e) => updateFormData('delai_paiement', Number(e.target.value))}
                          >
                            <option value="0">Immédiat</option>
                            <option value="15">15 jours</option>
                            <option value="30">30 jours</option>
                            <option value="45">45 jours</option>
                            <option value="60">60 jours</option>
                          </select>
                        </div>
                        
                        <div>
                          <Label htmlFor="taux_tva">Taux TVA (%)</Label>
                          <Input
                            id="taux_tva"
                            type="number"
                            step="0.01"
                            value={formData.taux_tva || 20}
                            onChange={(e) => updateFormData('taux_tva', Number(e.target.value))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p><strong>Adresse de facturation :</strong> Identique à l'adresse principale</p>
                        <p><strong>Note :</strong> Les informations de facturation peuvent être modifiées ultérieurement</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Section Référent */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Users className="h-5 w-5 text-indigo-600" />
                      <h3 className="text-lg font-semibold">Référent (optionnel)</h3>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="referent_nom">Nom du référent</Label>
                          <Input
                            id="referent_nom"
                            value={referentData.nom || ''}
                            onChange={(e) => updateReferentData('nom', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="referent_prenom">Prénom du référent</Label>
                          <Input
                            id="referent_prenom"
                            value={referentData.prenom || ''}
                            onChange={(e) => updateReferentData('prenom', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="referent_fonction">Fonction</Label>
                          <Input
                            id="referent_fonction"
                            value={referentData.fonction || ''}
                            onChange={(e) => updateReferentData('fonction', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="referent_telephone">Téléphone du référent</Label>
                          <Input
                            id="referent_telephone"
                            value={referentData.telephone || ''}
                            onChange={(e) => updateReferentData('telephone', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="referent_email">Email du référent</Label>
                          <Input
                            id="referent_email"
                            type="email"
                            value={referentData.email || ''}
                            onChange={(e) => updateReferentData('email', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Onglet Convention */}
                <TabsContent value="convention" className="space-y-4">
                  {selectedTypeData && selectedType !== 1 ? (
                    <>
                      <Alert>
                        <FileText className="h-4 w-4" />
                        <AlertDescription>
                          Convention tarifaire pour {selectedTypeData.nom === 'Entreprise' ? 'les entreprises' : 'les associations'}
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="convention_active"
                            checked={conventionData.active || false}
                            onChange={(e) => updateConventionData('active', e.target.checked)}
                            className="rounded"
                          />
                          <Label htmlFor="convention_active">Convention tarifaire active</Label>
                        </div>

                        {conventionData.active && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="convention_date_debut">Date de début</Label>
                                <Input
                                  id="convention_date_debut"
                                  type="date"
                                  value={conventionData.date_debut || ''}
                                  onChange={(e) => updateConventionData('date_debut', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="convention_date_fin">Date de fin</Label>
                                <Input
                                  id="convention_date_fin"
                                  type="date"
                                  value={conventionData.date_fin || ''}
                                  onChange={(e) => updateConventionData('date_fin', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="convention_reduction">Réduction (%)</Label>
                                <Input
                                  id="convention_reduction"
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={conventionData.reduction_pourcentage || ''}
                                  onChange={(e) => updateConventionData('reduction_pourcentage', parseFloat(e.target.value) || undefined)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="convention_forfait">Forfait mensuel (€)</Label>
                                <Input
                                  id="convention_forfait"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={conventionData.forfait_mensuel || ''}
                                  onChange={(e) => updateConventionData('forfait_mensuel', parseFloat(e.target.value) || undefined)}
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="convention_conditions">Conditions de la convention</Label>
                              <textarea
                                id="convention_conditions"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                rows={4}
                                value={conventionData.conditions || ''}
                                onChange={(e) => updateConventionData('conditions', e.target.value)}
                                placeholder="Détails des conditions tarifaires, réductions, modalités spéciales..."
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        Les conventions tarifaires ne sont disponibles que pour les entreprises et les associations.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>


              {/* Boutons */}
              <div className="flex justify-end space-x-2 mt-6">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Annuler
                  </Button>
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? (client ? 'Mise à jour en cours...' : 'Ajout en cours...') : (client ? 'Mettre à jour le Client' : 'Ajouter le Client')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}