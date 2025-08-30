'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  X, User, Search, Building, Users, Save
} from 'lucide-react';
import { usagersApi, type UsagerWithPrescripteur } from '@/lib/api/usagers';
import { clientsApi, type Client } from '@/lib/api/clients';
import { useNotifications } from '@/hooks/useNotifications';
import { Individual } from '@/types/individuals';
import IndividualsSection from '../features/IndividualsSection';
import { 
  createUsagerWithIndividuals, 
  updateUsager,
  validateUsagerIndividualsData,
  type UsagerFormData 
} from '@/lib/usagerIndividualsTransaction';

interface UsagerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  usager?: UsagerWithPrescripteur | null;
  prescripteurId?: number;
  prescripteurs?: Client[];
  onSuccess?: () => void;
}

const AUTONOMIE_LEVELS = [
  { value: 'Autonome', label: 'Autonome', color: 'bg-green-100 text-green-800' },
  { value: 'Semi-autonome', label: 'Semi-autonome', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Non-autonome', label: 'Non-autonome', color: 'bg-red-100 text-red-800' }
];

export default function UsagerEditModal({
  isOpen,
  onClose,
  usager,
  prescripteurId,
  prescripteurs: propsPrescripteurs,
  onSuccess
}: UsagerEditModalProps) {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [prescripteurs, setPrescripteurs] = useState<Client[]>([]);
  const [searchPrescripteur, setSearchPrescripteur] = useState('');
  const [showPrescripteurSearch, setShowPrescripteurSearch] = useState(false);
  
  // State for individuals management
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  
  // Debug: track individuals state changes
  useEffect(() => {
    console.log('UsagerEditModal - individuals state changed:', individuals);
  }, [individuals]);
  
  // Form data with test values for new usager
  const getInitialFormData = () => {
    if (usager) {
      // Edit mode - use existing usager data
      return {
        prescripteur_id: prescripteurId || usager.prescripteur_id || null,
        nom: usager.nom || '',
        prenom: usager.prenom || '',
        date_naissance: usager.date_naissance || '',
        lieu_naissance: usager.lieu_naissance || '',
        nationalite: usager.nationalite || 'Française',
        telephone: usager.telephone || '',
        email: usager.email || '',
        autonomie_level: usager.autonomie_level || 'Autonome',
        statut: usager.statut || 'actif'
      };
    } else {
      // Create mode - use test data
      return {
        prescripteur_id: prescripteurId || 0,
        nom: 'MARTIN',
        prenom: 'Jean',
        date_naissance: '1985-03-15',
        lieu_naissance: 'Paris',
        nationalite: 'Française',
        telephone: '06 12 34 56 78',
        email: 'jean.martin@email.fr',
        autonomie_level: 'Autonome',
        statut: 'actif'
      };
    }
  };
  
  const [formData, setFormData] = useState(getInitialFormData());
  
  // Reset form data when modal opens/closes or usager changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
      // Reset individuals when modal opens
      setIndividuals([]);
    }
  }, [isOpen, usager]);
  

  // Load prescripteurs - use props if provided, otherwise fetch
  useEffect(() => {
    if (isOpen) {
      if (propsPrescripteurs && propsPrescripteurs.length > 0) {
        setPrescripteurs(propsPrescripteurs);
      } else {
        loadPrescripteurs();
      }
    }
  }, [isOpen, propsPrescripteurs]);

  const loadPrescripteurs = async () => {
    // Only load if not provided via props
    if (!propsPrescripteurs || propsPrescripteurs.length === 0) {
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
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleSubmit = async () => {
    const isCreating = !usager?.id;
    
    // Validation avec le module de transaction
    const validationResult = validateUsagerIndividualsData(formData as UsagerFormData, individuals);
    
    if (!validationResult.isValid) {
      validationResult.errors.forEach(error => addNotification('error', error));
      return;
    }

    setLoading(true);

    try {
      let result;

      if (isCreating) {
        // ========== CRÉATION AVEC TRANSACTION ==========
        console.log('📦 Création nouvel usager avec', individuals.length, 'individus');
        result = await createUsagerWithIndividuals(formData as UsagerFormData, individuals);
      } else {
        // ========== MISE À JOUR USAGER SEULEMENT ==========
        // Les individus existants sont gérés directement par IndividualsSection
        console.log('🔄 Mise à jour usager ID:', usager.id);
        result = await updateUsager(usager.id, formData as UsagerFormData);
      }

      if (result.success) {
        // ========== SUCCÈS ==========
        const successMessage = isCreating
          ? result.individuCount && result.individuCount > 0
            ? `Usager créé avec succès (${result.individuCount} personne${result.individuCount > 1 ? 's' : ''} liée${result.individuCount > 1 ? 's' : ''})`
            : 'Usager créé avec succès'
          : 'Usager mis à jour avec succès';
        
        addNotification('success', successMessage);
        console.log('✅ Opération réussie:', successMessage);
        
        if (onSuccess) onSuccess();
        handleClose();
      } else {
        // ========== ÉCHEC ==========
        addNotification('error', result.error || 'Une erreur est survenue');
        console.error('❌ Erreur:', result.error);
      }
      
    } catch (error) {
      console.error('🔥 Error in handleSubmit:', error);
      addNotification('error', 'Une erreur inattendue est survenue');
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
      telephone: '',
      email: '',
      autonomie_level: 'Autonome',
      statut: 'actif'
    });
    setShowPrescripteurSearch(false);
    setIndividuals([]); // Reset individuals
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
                        {getSelectedPrescripteur() ? (
                          <>
                            <p className="font-medium">{getPrescripteurDisplayName(getSelectedPrescripteur())}</p>
                            <p className="text-xs text-gray-500">
                              {getSelectedPrescripteur()?.client_type} - {getSelectedPrescripteur()?.numero_client}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">Aucun prescripteur sélectionné</p>
                        )}
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

          {/* Formulaire simplifié sans onglets */}
          <div className="space-y-6">
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

            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Individuals Management Section */}
          <IndividualsSection
            individuals={individuals}
            onUpdateIndividuals={setIndividuals}
            mainUsagerData={{
              nom: formData.nom,
              lieu_naissance: formData.lieu_naissance,
              telephone: formData.telephone,
              email: formData.email
            }}
          />
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