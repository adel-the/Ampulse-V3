'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';
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
  
  // Error state management
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [individualErrors, setIndividualErrors] = useState<Record<string, Record<string, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  // Parse backend errors to extract field-specific errors
  const parseBackendError = (error: string): void => {
    // Clear previous errors
    setFieldErrors({});
    setIndividualErrors({});
    setGlobalError(null);
    
    // Parse common database errors
    if (error.includes('duplicate key') || error.includes('unique constraint')) {
      const match = error.match(/Key \((.*?)\)=/);
      if (match) {
        const field = match[1];
        setFieldErrors(prev => ({
          ...prev,
          [field]: 'Cette valeur existe déjà dans la base de données'
        }));
      } else {
        setGlobalError('Une contrainte d\'unicité a été violée. Vérifiez les doublons.');
      }
    } else if (error.includes('violates not-null constraint')) {
      const match = error.match(/column "(.*?)"/);
      if (match) {
        const field = match[1];
        setFieldErrors(prev => ({
          ...prev,
          [field]: 'Ce champ est obligatoire'
        }));
      }
    } else if (error.includes('violates foreign key constraint')) {
      setGlobalError('Référence invalide. Vérifiez les données liées.');
    } else if (error.includes('violates check constraint')) {
      const match = error.match(/constraint "(.*?)"/);
      if (match) {
        setGlobalError(`Contrainte de validation échouée: ${match[1]}`);
      }
    } else if (error.includes('invalid input syntax')) {
      const match = error.match(/for type (\w+): "(.*)"/);
      if (match) {
        setGlobalError(`Format invalide: attendu ${match[1]}, reçu "${match[2]}"`);
      }
    } else {
      // Default error message
      setGlobalError(error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear global error when user makes changes
    if (globalError) {
      setGlobalError(null);
    }
  };

  const handleSubmit = async () => {
    const isCreating = !usager?.id;
    
    // Clear all errors before submission
    setFieldErrors({});
    setIndividualErrors({});
    setGlobalError(null);
    
    // ========== VALIDATION ==========
    const validationResult = validateUsagerIndividualsData(formData as UsagerFormData, individuals);
    if (!validationResult.isValid) {
      // Parse validation errors and set field-specific errors
      const errors: Record<string, string> = {};
      validationResult.errors.forEach(error => {
        // Try to extract field name from error message
        if (error.includes('nom')) {
          errors.nom = error;
        } else if (error.includes('prénom')) {
          errors.prenom = error;
        } else if (error.includes('email')) {
          errors.email = error;
        } else if (error.includes('téléphone')) {
          errors.telephone = error;
        } else if (error.includes('date de naissance')) {
          errors.date_naissance = error;
        } else {
          // If can't match to a field, show as global error
          setGlobalError(error);
        }
      });
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        
        // Focus on first error field
        setTimeout(() => {
          const firstErrorField = Object.keys(errors)[0];
          const element = document.getElementById(firstErrorField);
          if (element) {
            element.focus();
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
      
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      let result;

      if (isCreating) {
        // ========== CRÉATION AVEC TRANSACTION ==========
        result = await createUsagerWithIndividuals(formData as UsagerFormData, individuals);
      } else {
        // ========== MISE À JOUR USAGER SEULEMENT ==========
        // Les individus existants sont gérés directement par IndividualsSection
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
        
        if (onSuccess) onSuccess();
        handleClose();
      } else {
        // ========== ÉCHEC ==========
        // Parse and display backend error
        parseBackendError(result.error || 'Une erreur est survenue');
        
        // Set global error if no specific field errors were found
        if (Object.keys(fieldErrors).length === 0 && !globalError) {
          setGlobalError('Échec de l\'enregistrement. Corrigez les champs marqués ci-dessous.');
        }
        
        // Focus on first error field if any
        setTimeout(() => {
          const errorFields = Object.keys(fieldErrors);
          if (errorFields.length > 0) {
            const firstErrorField = errorFields[0];
            const element = document.getElementById(firstErrorField);
            if (element) {
              element.focus();
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue est survenue';
      parseBackendError(errorMessage);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
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

        {/* Global Error Banner */}
        {globalError && (
          <Alert variant="destructive" className="mx-6 mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Échec de l'enregistrement</AlertTitle>
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        )}

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
                  className={fieldErrors.nom ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {fieldErrors.nom && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.nom}</p>
                )}
              </div>
              <div>
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => handleInputChange('prenom', e.target.value)}
                  required
                  className={fieldErrors.prenom ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {fieldErrors.prenom && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.prenom}</p>
                )}
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
                  className={fieldErrors.date_naissance ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {fieldErrors.date_naissance && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.date_naissance}</p>
                )}
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
                  className={fieldErrors.telephone ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {fieldErrors.telephone && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.telephone}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={fieldErrors.email ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {fieldErrors.email && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>
                )}
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
            usagerId={usager?.id} // Utiliser l'ID de l'usager pour la gestion BDD
            mainUsagerData={{
              nom: formData.nom,
              prenom: formData.prenom,
              date_naissance: formData.date_naissance,
              lieu_naissance: formData.lieu_naissance,
              telephone: formData.telephone,
              email: formData.email
            }}
            enableTestData={true}
            onTestDataGenerated={(generatedIndividuals) => {
              addNotification('success', `${generatedIndividuals.length} personne${generatedIndividuals.length > 1 ? 's' : ''} générée${generatedIndividuals.length > 1 ? 's' : ''} avec succès`);
            }}
            // Props de compatibilité pour les nouveaux usagers (pas encore en BDD)
            individuals={usager?.id ? undefined : individuals}
            onUpdateIndividuals={usager?.id ? undefined : setIndividuals}
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