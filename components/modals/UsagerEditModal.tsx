'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  X, User, MapPin, Shield, Heart, Search, Building, Users, 
  Save, Phone, Mail, Calendar
} from 'lucide-react';
import { usagersApi, type UsagerWithPrescripteur } from '@/lib/api/usagers';
import { clientsApi, type Client } from '@/lib/api/clients';
import { useNotifications } from '@/hooks/useNotifications';

interface UsagerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  usager?: UsagerWithPrescripteur | null;
  prescripteurId?: number;
  onSuccess?: () => void;
}

const SITUATION_FAMILIALE_OPTIONS = [
  'Célibataire',
  'Marié(e)',
  'Divorcé(e)',
  'Veuf/Veuve',
  'Pacsé(e)',
  'Union libre'
];

const AUTONOMIE_LEVELS = [
  { value: 'Autonome', label: 'Autonome', color: 'bg-green-100 text-green-800' },
  { value: 'Semi-autonome', label: 'Semi-autonome', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Non-autonome', label: 'Non-autonome', color: 'bg-red-100 text-red-800' }
];

const TYPE_REVENUS_OPTIONS = [
  'RSA',
  'Salaire',
  'Retraite',
  'AAH',
  'ASS',
  'Allocation familiale',
  'Pension alimentaire',
  'Autre'
];

export default function UsagerEditModal({
  isOpen,
  onClose,
  usager,
  prescripteurId,
  onSuccess
}: UsagerEditModalProps) {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [prescripteurs, setPrescripteurs] = useState<Client[]>([]);
  const [searchPrescripteur, setSearchPrescripteur] = useState('');
  const [showPrescripteurSearch, setShowPrescripteurSearch] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    prescripteur_id: prescripteurId || usager?.prescripteur_id || 0,
    nom: usager?.nom || '',
    prenom: usager?.prenom || '',
    date_naissance: usager?.date_naissance || '',
    lieu_naissance: usager?.lieu_naissance || '',
    nationalite: usager?.nationalite || 'Française',
    adresse: usager?.adresse || '',
    ville: usager?.ville || '',
    code_postal: usager?.code_postal || '',
    telephone: usager?.telephone || '',
    email: usager?.email || '',
    numero_secu: usager?.numero_secu || '',
    caf_number: usager?.caf_number || '',
    situation_familiale: usager?.situation_familiale || null,
    nombre_enfants: usager?.nombre_enfants || 0,
    revenus: usager?.revenus || null,
    type_revenus: usager?.type_revenus || '',
    prestations: usager?.prestations || [],
    autonomie_level: usager?.autonomie_level || 'Autonome',
    observations: usager?.observations || '',
    statut: usager?.statut || 'actif'
  });

  // Load prescripteurs
  useEffect(() => {
    if (isOpen) {
      loadPrescripteurs();
    }
  }, [isOpen]);

  const loadPrescripteurs = async () => {
    const response = await clientsApi.searchClients('', undefined, 'actif');
    if (response.success && response.data) {
      // Filter to only show Entreprise and Association
      const filtered = response.data.filter(c => 
        c.client_type === 'Entreprise' || 
        c.client_type === 'Association' ||
        (c.client_type === 'Particulier' && c.statut === 'actif')
      );
      setPrescripteurs(filtered);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrestationToggle = (prestation: string) => {
    setFormData(prev => ({
      ...prev,
      prestations: prev.prestations?.includes(prestation)
        ? prev.prestations.filter(p => p !== prestation)
        : [...(prev.prestations || []), prestation]
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.nom || !formData.prenom) {
      addNotification('error', 'Le nom et le prénom sont obligatoires');
      return;
    }

    if (!formData.prescripteur_id) {
      addNotification('error', 'Un prescripteur doit être sélectionné');
      return;
    }

    setLoading(true);

    try {
      let response;
      
      if (usager?.id) {
        // Update existing usager
        const { prescripteur_id, ...updates } = formData;
        response = await usagersApi.updateUsager(usager.id, {
          ...updates,
          prescripteur_id: prescripteur_id
        });
      } else {
        // Create new usager
        response = await usagersApi.createUsager(formData);
      }

      if (response.success) {
        addNotification('success', usager ? 'Usager mis à jour avec succès' : 'Usager créé avec succès');
        if (onSuccess) onSuccess();
        handleClose();
      } else {
        addNotification('error', response.error || 'Une erreur est survenue');
      }
    } catch (error) {
      addNotification('error', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      prescripteur_id: 0,
      nom: '',
      prenom: '',
      date_naissance: '',
      lieu_naissance: '',
      nationalite: 'Française',
      adresse: '',
      ville: '',
      code_postal: '',
      telephone: '',
      email: '',
      numero_secu: '',
      caf_number: '',
      situation_familiale: null,
      nombre_enfants: 0,
      revenus: null,
      type_revenus: '',
      prestations: [],
      autonomie_level: 'Autonome',
      observations: '',
      statut: 'actif'
    });
    setActiveTab('general');
    setShowPrescripteurSearch(false);
    onClose();
  };

  const getSelectedPrescripteur = () => {
    return prescripteurs.find(p => p.id === formData.prescripteur_id);
  };

  const getPrescripteurDisplayName = (prescripteur: Client) => {
    if (prescripteur.client_type === 'Entreprise' || prescripteur.client_type === 'Association') {
      return prescripteur.raison_sociale || prescripteur.nom || '';
    }
    return `${prescripteur.prenom || ''} ${prescripteur.nom || ''}`.trim();
  };

  const filteredPrescripteurs = prescripteurs.filter(p => {
    const displayName = getPrescripteurDisplayName(p).toLowerCase();
    return displayName.includes(searchPrescripteur.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {usager ? 'Modifier l\'usager' : 'Nouvel usager'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {usager ? 'Modifiez les informations de l\'usager' : 'Créez un nouvel usager bénéficiaire'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Prescripteur Selection */}
          <Card className="mb-4">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Prescripteur (obligatoire)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {formData.prescripteur_id ? (
                  <div className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {getSelectedPrescripteur()?.client_type === 'Entreprise' ? (
                        <Building className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Users className="h-4 w-4 text-gray-500" />
                      )}
                      <div>
                        <p className="font-medium">{getPrescripteurDisplayName(getSelectedPrescripteur()!)}</p>
                        <p className="text-xs text-gray-500">
                          {getSelectedPrescripteur()?.client_type} - {getSelectedPrescripteur()?.numero_client}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPrescripteurSearch(!showPrescripteurSearch)}
                    >
                      Changer
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowPrescripteurSearch(!showPrescripteurSearch)}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Sélectionner un prescripteur
                  </Button>
                )}

                {showPrescripteurSearch && (
                  <div className="space-y-2 p-2 border rounded">
                    <Input
                      placeholder="Rechercher un prescripteur..."
                      value={searchPrescripteur}
                      onChange={(e) => setSearchPrescripteur(e.target.value)}
                      className="w-full"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredPrescripteurs.map(prescripteur => (
                        <button
                          key={prescripteur.id}
                          className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center gap-2"
                          onClick={() => {
                            handleInputChange('prescripteur_id', prescripteur.id);
                            setShowPrescripteurSearch(false);
                            setSearchPrescripteur('');
                          }}
                        >
                          {prescripteur.client_type === 'Entreprise' ? (
                            <Building className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Users className="h-4 w-4 text-gray-500" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{getPrescripteurDisplayName(prescripteur)}</p>
                            <p className="text-xs text-gray-500">
                              {prescripteur.client_type} - {prescripteur.numero_client}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">
                <User className="h-4 w-4 mr-2" />
                Général
              </TabsTrigger>
              <TabsTrigger value="contact">
                <MapPin className="h-4 w-4 mr-2" />
                Contact
              </TabsTrigger>
              <TabsTrigger value="social">
                <Heart className="h-4 w-4 mr-2" />
                Social
              </TabsTrigger>
              <TabsTrigger value="administratif">
                <Shield className="h-4 w-4 mr-2" />
                Administratif
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => handleInputChange('prenom', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date_naissance">Date de naissance</Label>
                  <Input
                    id="date_naissance"
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) => handleInputChange('date_naissance', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lieu_naissance">Lieu de naissance</Label>
                  <Input
                    id="lieu_naissance"
                    value={formData.lieu_naissance}
                    onChange={(e) => handleInputChange('lieu_naissance', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="nationalite">Nationalité</Label>
                  <Input
                    id="nationalite"
                    value={formData.nationalite}
                    onChange={(e) => handleInputChange('nationalite', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="autonomie">Niveau d'autonomie</Label>
                <select
                  id="autonomie"
                  value={formData.autonomie_level || 'Autonome'}
                  onChange={(e) => handleInputChange('autonomie_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {AUTONOMIE_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="statut">Statut</Label>
                <select
                  id="statut"
                  value={formData.statut}
                  onChange={(e) => handleInputChange('statut', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="archive">Archivé</option>
                </select>
              </div>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-4">
              <div>
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => handleInputChange('adresse', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code_postal">Code postal</Label>
                  <Input
                    id="code_postal"
                    value={formData.code_postal}
                    onChange={(e) => handleInputChange('code_postal', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ville">Ville</Label>
                  <Input
                    id="ville"
                    value={formData.ville}
                    onChange={(e) => handleInputChange('ville', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => handleInputChange('telephone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Social Tab */}
            <TabsContent value="social" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="situation_familiale">Situation familiale</Label>
                  <select
                    id="situation_familiale"
                    value={formData.situation_familiale || ''}
                    onChange={(e) => handleInputChange('situation_familiale', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    {SITUATION_FAMILIALE_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="nombre_enfants">Nombre d'enfants</Label>
                  <Input
                    id="nombre_enfants"
                    type="number"
                    min="0"
                    value={formData.nombre_enfants}
                    onChange={(e) => handleInputChange('nombre_enfants', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="revenus">Revenus mensuels (€)</Label>
                  <Input
                    id="revenus"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.revenus || ''}
                    onChange={(e) => handleInputChange('revenus', parseFloat(e.target.value) || null)}
                  />
                </div>
                <div>
                  <Label htmlFor="type_revenus">Type de revenus</Label>
                  <select
                    id="type_revenus"
                    value={formData.type_revenus}
                    onChange={(e) => handleInputChange('type_revenus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    {TYPE_REVENUS_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Prestations sociales</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['RSA', 'AAH', 'ASS', 'APL', 'Allocation familiale', 'Prime d\'activité'].map(prestation => (
                    <label key={prestation} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.prestations?.includes(prestation) || false}
                        onChange={() => handlePrestationToggle(prestation)}
                        className="rounded"
                      />
                      <span className="text-sm">{prestation}</span>
                    </label>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Administratif Tab */}
            <TabsContent value="administratif" className="space-y-4">
              <div>
                <Label htmlFor="numero_secu">Numéro de sécurité sociale</Label>
                <Input
                  id="numero_secu"
                  value={formData.numero_secu}
                  onChange={(e) => handleInputChange('numero_secu', e.target.value)}
                  placeholder="1 23 45 67 890 123 45"
                />
              </div>

              <div>
                <Label htmlFor="caf_number">Numéro allocataire CAF</Label>
                <Input
                  id="caf_number"
                  value={formData.caf_number}
                  onChange={(e) => handleInputChange('caf_number', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="observations">Observations</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  rows={4}
                  placeholder="Notes et observations particulières..."
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enregistrement...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {usager ? 'Enregistrer' : 'Créer'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}