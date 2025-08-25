'use client';

import React, { useState, useEffect } from 'react';
import { Reservation, Hotel, OperateurSocial, DocumentTemplate } from '../../types';
import { ReservationToPDFMapper, ReservationData } from '../../utils/reservationToPDF';
import { PDFGenerator, PDFGenerationOptions } from '../../utils/pdfGenerator';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  MapPin, 
  User, 
  Building,
  AlertTriangle,
  CheckCircle,
  X,
  Edit3,
  Save
} from 'lucide-react';

interface ReservationPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation;
  hotel?: Hotel;
  operateur?: OperateurSocial;
  templates: DocumentTemplate[];
}

interface MissingDataForm {
  hotel?: {
    nom: string;
    adresse: string;
    codePostal: string;
    ville: string;
    telephone: string;
    email: string;
  };
  operateur?: {
    nom: string;
    prenom: string;
    organisation: string;
    telephone: string;
    email: string;
  };
}

export default function ReservationPDFModal({
  isOpen,
  onClose,
  reservation,
  hotel,
  operateur,
  templates
}: ReservationPDFModalProps) {
  console.log('ReservationPDFModal - Props:', { isOpen, reservation, hotel, operateur, templates });
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  const [showMissingDataForm, setShowMissingDataForm] = useState(false);
  const [missingDataForm, setMissingDataForm] = useState<MissingDataForm>({});

  const initialReservationData: ReservationData = {
    reservation,
    hotel,
    operateur,
    chambre: {
      numero: reservation.chambre,
      type: 'Standard',
      prix: reservation.prix
    }
  };

  const [reservationData, setReservationData] = useState<ReservationData>(initialReservationData);
  const compatibleTemplates = ReservationToPDFMapper.getCompatibleTemplates(templates, reservationData);

  useEffect(() => {
    if (selectedTemplate) {
      const variables = ReservationToPDFMapper.mapReservationToVariables(reservationData, selectedTemplate);
      const defaultFilename = `${selectedTemplate.nom.toLowerCase().replace(/\s+/g, '_')}_reservation_${reservation.id}.pdf`;
      setFilename(defaultFilename);
    }
  }, [selectedTemplate, reservation]);

  // Gestion de la fermeture avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Empêcher le scroll du body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleTemplateSelect = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setPdfUrl(null);
    setError(null);
    setShowMissingDataForm(false);
    
    // Vérifier si des données sont manquantes
    const validation = getValidationStatus(template);
    if (!validation.canGenerate) {
      setShowMissingDataForm(true);
      // Pré-remplir le formulaire avec les données existantes
      setMissingDataForm({
        hotel: hotel ? {
          nom: hotel.nom,
          adresse: hotel.adresse,
          codePostal: hotel.codePostal,
          ville: hotel.ville,
          telephone: hotel.telephone,
          email: hotel.email
        } : {
          nom: '',
          adresse: '',
          codePostal: '',
          ville: '',
          telephone: '',
          email: ''
        },
        operateur: operateur ? {
          nom: operateur.nom,
          prenom: operateur.prenom,
          organisation: operateur.organisation,
          telephone: operateur.telephone,
          email: operateur.email
        } : {
          nom: '',
          prenom: '',
          organisation: '',
          telephone: '',
          email: ''
        }
      });
    }
  };

  const handleMissingDataChange = (section: 'hotel' | 'operateur', field: string, value: string) => {
    setMissingDataForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSaveMissingData = () => {
    // Créer des objets temporaires avec les données saisies
    const tempHotel = missingDataForm.hotel ? {
      id: hotel?.id || 0,
      nom: missingDataForm.hotel.nom,
      adresse: missingDataForm.hotel.adresse,
      codePostal: missingDataForm.hotel.codePostal,
      ville: missingDataForm.hotel.ville,
      telephone: missingDataForm.hotel.telephone,
      email: missingDataForm.hotel.email,
      gestionnaire: hotel?.gestionnaire || '',
      statut: hotel?.statut || 'actif',
      chambresTotal: hotel?.chambresTotal || 0,
      chambresOccupees: hotel?.chambresOccupees || 0,
      tauxOccupation: hotel?.tauxOccupation || 0
    } : hotel;

    const tempOperateur = missingDataForm.operateur ? {
      id: operateur?.id || 0,
      nom: missingDataForm.operateur.nom,
      prenom: missingDataForm.operateur.prenom,
      organisation: missingDataForm.operateur.organisation,
      telephone: missingDataForm.operateur.telephone,
      email: missingDataForm.operateur.email,
      statut: operateur?.statut || 'actif',
      specialite: operateur?.specialite || '',
      zoneIntervention: operateur?.zoneIntervention || '',
      nombreReservations: operateur?.nombreReservations || 0,
      dateCreation: operateur?.dateCreation || new Date().toISOString().split('T')[0]
    } : operateur;

    // Mettre à jour les données de réservation avec les données temporaires
    const updatedReservationData: ReservationData = {
      reservation,
      hotel: tempHotel,
      operateur: tempOperateur,
      chambre: {
        numero: reservation.chambre,
        type: 'Standard',
        prix: reservation.prix
      }
    };

    // Vérifier si maintenant on peut générer le document
    if (selectedTemplate) {
      const validation = ReservationToPDFMapper.canGenerateDocument(selectedTemplate, updatedReservationData);
      if (validation.canGenerate) {
        setShowMissingDataForm(false);
        // Stocker les données temporaires pour la génération
        setReservationData(updatedReservationData);
      }
    }
  };

  const generatePDF = async () => {
    if (!selectedTemplate) return;

    console.log('Génération PDF - Template sélectionné:', selectedTemplate);
    setIsLoading(true);
    setError(null);

    try {
      const variables = ReservationToPDFMapper.mapReservationToVariables(reservationData, selectedTemplate);
      console.log('Variables générées:', variables);
      
      const options: PDFGenerationOptions = {
        template: selectedTemplate,
        variables,
        filename,
        format: 'A4',
        orientation: 'portrait'
      };

      console.log('Options PDF:', options);
      const url = await PDFGenerator.previewPDF(options);
      console.log('URL PDF générée:', url);
      setPdfUrl(url);
    } catch (err) {
      console.error('Erreur lors de la génération du PDF:', err);
      setError(`Erreur lors de la génération du PDF: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedTemplate) return;

    try {
      const variables = ReservationToPDFMapper.mapReservationToVariables(reservationData, selectedTemplate);
      
      const options: PDFGenerationOptions = {
        template: selectedTemplate,
        variables,
        filename,
        format: 'A4',
        orientation: 'portrait'
      };

      await PDFGenerator.downloadPDF(options);
    } catch (err) {
      setError('Erreur lors du téléchargement du PDF');
      console.error('Erreur téléchargement:', err);
    }
  };

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setSelectedTemplate(null);
    setError(null);
    setFilename('');
    setShowMissingDataForm(false);
    setMissingDataForm({});
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'facture': return <FileText className="w-5 h-5" />;
      case 'bon_reservation': return <Calendar className="w-5 h-5" />;
      case 'prolongation_reservation': return <Calendar className="w-5 h-5" />;
      case 'fin_prise_charge': return <AlertTriangle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTemplateLabel = (type: string) => {
    switch (type) {
      case 'facture': return 'Facture';
      case 'bon_reservation': return 'Bon de réservation';
      case 'prolongation_reservation': return 'Prolongation';
      case 'fin_prise_charge': return 'Fin de prise en charge';
      default: return type;
    }
  };

  const getValidationStatus = (template: DocumentTemplate) => {
    const validation = ReservationToPDFMapper.canGenerateDocument(template, reservationData);
    return validation;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Générer un PDF pour la réservation #{reservation.id}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Sélectionnez un modèle de document à générer
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full p-6">
            {/* Colonne gauche - Informations et sélection */}
            <div className="space-y-6 min-w-0">
              {/* Informations de la réservation */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-5 h-5" />
                    Informations de la réservation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Usager</p>
                      <p className="font-semibold truncate">{reservation.usager}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Statut</p>
                      <Badge variant="outline">{reservation.statut}</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Date d'arrivée</p>
                      <p>{new Date(reservation.dateArrivee).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Date de départ</p>
                      <p>{new Date(reservation.dateDepart).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Durée</p>
                      <p>{reservation.duree} nuits</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Prix par nuit</p>
                      <p>{reservation.prix.toFixed(2)} €</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {hotel && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building className="w-5 h-5" />
                      Hôtel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">{hotel.nom}</p>
                    <p className="text-sm text-gray-600">{hotel.adresse}, {hotel.codePostal} {hotel.ville}</p>
                    <p className="text-sm text-gray-600">Tél: {hotel.telephone}</p>
                  </CardContent>
                </Card>
              )}

              {operateur && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-5 h-5" />
                      Prescripteur
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">{operateur.prenom} {operateur.nom}</p>
                    <p className="text-sm text-gray-600">{operateur.organisation}</p>
                    <p className="text-sm text-gray-600">Tél: {operateur.telephone}</p>
                  </CardContent>
                </Card>
              )}

              {/* Formulaire de données manquantes */}
              {showMissingDataForm && selectedTemplate && (
                <Card className="shadow-sm border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg text-orange-800">
                      <Edit3 className="w-5 h-5" />
                      Compléter les données manquantes
                    </CardTitle>
                    <CardDescription className="text-orange-700">
                      Veuillez compléter les informations manquantes pour générer le document
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!hotel && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-orange-800">Informations de l'hôtel</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="hotel-nom" className="text-sm">Nom de l'hôtel</Label>
                            <Input
                              id="hotel-nom"
                              value={missingDataForm.hotel?.nom || ''}
                              onChange={(e) => handleMissingDataChange('hotel', 'nom', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="hotel-telephone" className="text-sm">Téléphone</Label>
                            <Input
                              id="hotel-telephone"
                              value={missingDataForm.hotel?.telephone || ''}
                              onChange={(e) => handleMissingDataChange('hotel', 'telephone', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="hotel-adresse" className="text-sm">Adresse</Label>
                          <Input
                            id="hotel-adresse"
                            value={missingDataForm.hotel?.adresse || ''}
                            onChange={(e) => handleMissingDataChange('hotel', 'adresse', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="hotel-cp" className="text-sm">Code postal</Label>
                            <Input
                              id="hotel-cp"
                              value={missingDataForm.hotel?.codePostal || ''}
                              onChange={(e) => handleMissingDataChange('hotel', 'codePostal', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="hotel-ville" className="text-sm">Ville</Label>
                            <Input
                              id="hotel-ville"
                              value={missingDataForm.hotel?.ville || ''}
                              onChange={(e) => handleMissingDataChange('hotel', 'ville', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="hotel-email" className="text-sm">Email</Label>
                          <Input
                            id="hotel-email"
                            type="email"
                            value={missingDataForm.hotel?.email || ''}
                            onChange={(e) => handleMissingDataChange('hotel', 'email', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {!operateur && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-orange-800">Informations du prescripteur</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="operateur-prenom" className="text-sm">Prénom</Label>
                            <Input
                              id="operateur-prenom"
                              value={missingDataForm.operateur?.prenom || ''}
                              onChange={(e) => handleMissingDataChange('operateur', 'prenom', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="operateur-nom" className="text-sm">Nom</Label>
                            <Input
                              id="operateur-nom"
                              value={missingDataForm.operateur?.nom || ''}
                              onChange={(e) => handleMissingDataChange('operateur', 'nom', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="operateur-organisation" className="text-sm">Organisation</Label>
                          <Input
                            id="operateur-organisation"
                            value={missingDataForm.operateur?.organisation || ''}
                            onChange={(e) => handleMissingDataChange('operateur', 'organisation', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="operateur-telephone" className="text-sm">Téléphone</Label>
                            <Input
                              id="operateur-telephone"
                              value={missingDataForm.operateur?.telephone || ''}
                              onChange={(e) => handleMissingDataChange('operateur', 'telephone', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="operateur-email" className="text-sm">Email</Label>
                            <Input
                              id="operateur-email"
                              type="email"
                              value={missingDataForm.operateur?.email || ''}
                              onChange={(e) => handleMissingDataChange('operateur', 'email', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleSaveMissingData}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer et continuer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sélection du template */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Modèles disponibles</CardTitle>
                  <CardDescription>
                    Sélectionnez un modèle de document à générer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {compatibleTemplates.map((template) => {
                      const validation = getValidationStatus(template);
                      return (
                        <div
                          key={template.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedTemplate?.id === template.id
                              ? 'border-orange-500 bg-orange-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          } ${!validation.canGenerate && !showMissingDataForm ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {getTemplateIcon(template.type)}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{template.nom}</p>
                                <p className="text-sm text-gray-600 truncate">{template.description}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">{getTemplateLabel(template.type)}</Badge>
                                  <Badge variant="secondary" className="text-xs">v{template.version}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              {validation.canGenerate ? (
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                              ) : (
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                          {!validation.canGenerate && !showMissingDataForm && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                              <p className="text-xs text-red-700">
                                Données manquantes : {validation.missingData.join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Colonne droite - Prévisualisation PDF */}
            <div className="space-y-4 min-w-0">
              {selectedTemplate && !showMissingDataForm && (
                <Card className="shadow-sm h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Prévisualisation - {selectedTemplate.nom}</CardTitle>
                    <CardDescription>
                      Aperçu du document généré avec les données de la réservation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 h-full">
                    <div className="flex items-center gap-4">
                      <input
                        type="text"
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="nom_du_fichier.pdf"
                      />
                      <Button
                        onClick={generatePDF}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={!selectedTemplate || isLoading}
                      >
                        {isLoading ? 'Génération en cours...' : 'Générer le PDF'}
                      </Button>
                    </div>

                    {error && (
                      <div className="text-red-600 text-sm mt-2">{error}</div>
                    )}

                    {isLoading && (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                        <span className="ml-3 text-gray-600">Génération du PDF en cours...</span>
                      </div>
                    )}

                    {pdfUrl && !isLoading && (
                      <div className="space-y-3 flex-1">
                        <div className="h-96 border border-gray-200 rounded overflow-hidden">
                          <iframe
                            src={pdfUrl}
                            className="w-full h-full"
                            title="PDF Preview"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            onClick={handleDownload}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger PDF
                          </Button>
                        </div>
                      </div>
                    )}

                    {!pdfUrl && !isLoading && !error && selectedTemplate && (
                      <div className="flex items-center justify-center h-64 border border-gray-200 rounded bg-gray-50">
                        <div className="text-center text-gray-500">
                          <div className="text-6xl mb-4">📄</div>
                          <p>Cliquez sur "Générer PDF" pour voir l'aperçu</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {!selectedTemplate && (
                <Card className="shadow-sm h-full">
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center text-gray-500">
                      <div className="text-6xl mb-4">📋</div>
                      <p>Sélectionnez un modèle de document</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {showMissingDataForm && (
                <Card className="shadow-sm h-full">
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center text-orange-500">
                      <div className="text-6xl mb-4">⚠️</div>
                      <p>Veuillez compléter les données manquantes</p>
                      <p className="text-sm text-gray-500 mt-2">Utilisez le formulaire à gauche</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
