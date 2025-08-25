"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { X, Loader2, Download } from 'lucide-react';
import { Badge } from '../ui/badge';
import { 
  Plus, 
  Trash2, 
  Building2, 
  Bed, 
  Euro, 
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { ConventionPrix, Hotel, OperateurSocial, DocumentTemplate, Reservation } from '../../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function AddRoomModal({ isOpen, onClose, onSubmit, isLoading }: AddRoomModalProps) {
  const [formData, setFormData] = useState({
    numero: '',
    type: 'Simple',
    prix: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Ajouter une chambre</h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="numero">Numéro de chambre</Label>
            <Input
              id="numero"
              value={formData.numero}
              onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              placeholder="ex: 101"
            />
          </div>
          
          <div>
            <Label htmlFor="type">Type de chambre</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="Simple">Simple</option>
              <option value="Double">Double</option>
              <option value="Familiale">Familiale</option>
              <option value="Adaptée">Adaptée</option>
            </select>
          </div>
          
          <div>
            <Label htmlFor="prix">Prix par nuit (€)</Label>
            <Input
              id="prix"
              type="number"
              value={formData.prix}
              onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
              placeholder="50"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la chambre..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? 'Ajout...' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reservationData: any) => void;
  isLoading: boolean;
  hotels: Hotel[];
  operateurs: OperateurSocial[];
  templates: DocumentTemplate[];
}

interface ProlongationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prolongationData: any) => void;
  isLoading: boolean;
  reservation: Reservation;
  hotels: Hotel[];
  operateurs: OperateurSocial[];
  templates: DocumentTemplate[];
}

interface EndCareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (endCareData: any) => void;
  isLoading: boolean;
  reservation: Reservation;
  hotels: Hotel[];
  operateurs: OperateurSocial[];
  templates: DocumentTemplate[];
}

export function NewReservationModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading, 
  hotels, 
  operateurs, 
  templates 
}: NewReservationModalProps) {
  const [formData, setFormData] = useState({
    usager: '',
    hotel: '',
    chambre: '',
    dateArrivee: '',
    dateDepart: '',
    prescripteur: '',
    prix: 0
  });

  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [generatedPDFUrl, setGeneratedPDFUrl] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculer la durée du séjour
    const dateArrivee = new Date(formData.dateArrivee);
    const dateDepart = new Date(formData.dateDepart);
    const duree = Math.ceil((dateDepart.getTime() - dateArrivee.getTime()) / (1000 * 60 * 60 * 24));
    
    // Créer l'objet réservation
    const reservationData = {
      ...formData,
      duree,
      statut: 'CONFIRMEE',
      id: Date.now() // ID temporaire pour la génération du PDF
    };

    // Générer automatiquement le bon de réservation
    await generateBonReservation(reservationData);
    
    // Appeler la fonction onSubmit avec les données
    onSubmit(reservationData);
  };

  const generateBonReservation = async (reservationData: any) => {
    setIsGeneratingPDF(true);
    
    try {
      // Trouver le template de bon de réservation
      const bonReservationTemplate = templates.find(t => t.type === 'bon_reservation');
      
      if (!bonReservationTemplate) {
        console.error('Template de bon de réservation non trouvé');
        return;
      }

      // Trouver les données de l'hôtel et de l'opérateur
      const hotel = hotels.find(h => h.nom === reservationData.hotel);
      const operateur = operateurs.find(o => o.organisation === reservationData.prescripteur);

      // Créer les données de réservation pour le mapping
      const reservationDataForPDF = {
        reservation: reservationData,
        hotel,
        operateur,
        chambre: {
          numero: reservationData.chambre,
          type: 'Standard',
          prix: reservationData.prix
        }
      };

      // Importer les utilitaires nécessaires
      const { ReservationToPDFMapper } = await import('../../utils/reservationToPDF');
      const { PDFGenerator } = await import('../../utils/pdfGenerator');

      // Mapper les variables
      const variables = ReservationToPDFMapper.mapReservationToVariables(reservationDataForPDF, bonReservationTemplate);
      
             // Générer le PDF
       const options = {
         template: bonReservationTemplate,
         variables,
         filename: `bon_reservation_${reservationData.id}.pdf`,
         format: 'A4' as const,
         orientation: 'portrait' as const
       };

      const pdfUrl = await PDFGenerator.previewPDF(options);
      setGeneratedPDFUrl(pdfUrl);
      setShowPDFPreview(true);
      
    } catch (error) {
      console.error('Erreur lors de la génération du bon de réservation:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedPDFUrl) return;
    
    try {
      const bonReservationTemplate = templates.find(t => t.type === 'bon_reservation');
      if (!bonReservationTemplate) return;

      const hotel = hotels.find(h => h.nom === formData.hotel);
      const operateur = operateurs.find(o => o.organisation === formData.prescripteur);

      const reservationDataForPDF = {
        reservation: {
          ...formData,
          id: Date.now(),
          duree: Math.ceil((new Date(formData.dateDepart).getTime() - new Date(formData.dateArrivee).getTime()) / (1000 * 60 * 60 * 24)),
          statut: 'CONFIRMEE'
        },
        hotel,
        operateur,
        chambre: {
          numero: formData.chambre,
          type: 'Standard',
          prix: formData.prix
        }
      };

      const { ReservationToPDFMapper } = await import('../../utils/reservationToPDF');
      const { PDFGenerator } = await import('../../utils/pdfGenerator');

      const variables = ReservationToPDFMapper.mapReservationToVariables(reservationDataForPDF, bonReservationTemplate);
      
             const options = {
         template: bonReservationTemplate,
         variables,
         filename: `bon_reservation_${Date.now()}.pdf`,
         format: 'A4' as const,
         orientation: 'portrait' as const
       };

      await PDFGenerator.downloadPDF(options);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  const handleClose = () => {
    if (generatedPDFUrl) {
      URL.revokeObjectURL(generatedPDFUrl);
      setGeneratedPDFUrl(null);
    }
    setShowPDFPreview(false);
    setFormData({
      usager: '',
      hotel: '',
      chambre: '',
      dateArrivee: '',
      dateDepart: '',
      prescripteur: '',
      prix: 0
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Nouvelle réservation</h2>
          <Button variant="ghost" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex h-full">
          {/* Formulaire de réservation */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="usager">Nom de l'usager</Label>
                <Input
                  id="usager"
                  value={formData.usager}
                  onChange={(e) => setFormData({ ...formData, usager: e.target.value })}
                  placeholder="Nom et prénom"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="hotel">Établissement</Label>
                <select
                  id="hotel"
                  value={formData.hotel}
                  onChange={(e) => setFormData({ ...formData, hotel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Sélectionner un établissement</option>
                  {hotels.map(hotel => (
                    <option key={hotel.id} value={hotel.nom}>{hotel.nom}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="chambre">Chambre</Label>
                <Input
                  id="chambre"
                  value={formData.chambre}
                  onChange={(e) => setFormData({ ...formData, chambre: e.target.value })}
                  placeholder="Numéro de chambre"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateArrivee">Date d'arrivée</Label>
                  <Input
                    id="dateArrivee"
                    type="date"
                    value={formData.dateArrivee}
                    onChange={(e) => setFormData({ ...formData, dateArrivee: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dateDepart">Date de départ</Label>
                  <Input
                    id="dateDepart"
                    type="date"
                    value={formData.dateDepart}
                    onChange={(e) => setFormData({ ...formData, dateDepart: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="prescripteur">Prescripteur</Label>
                <select
                  id="prescripteur"
                  value={formData.prescripteur}
                  onChange={(e) => setFormData({ ...formData, prescripteur: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Sélectionner un prescripteur</option>
                  {operateurs.map(operateur => (
                    <option key={operateur.id} value={operateur.organisation}>
                      {operateur.organisation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="prix">Prix par nuit (€)</Label>
                <Input
                  id="prix"
                  type="number"
                  value={formData.prix}
                  onChange={(e) => setFormData({ ...formData, prix: parseFloat(e.target.value) || 0 })}
                  placeholder="Prix par nuit"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading || isGeneratingPDF}>
                  {isLoading || isGeneratingPDF ? 'Création...' : 'Créer la réservation'}
                </Button>
              </div>
            </form>
          </div>

          {/* Prévisualisation du bon de réservation */}
          <div className="w-1/2 border-l bg-gray-50">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Bon de réservation</h3>
              
              {isGeneratingPDF && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Génération du bon de réservation...</p>
                  </div>
                </div>
              )}

              {generatedPDFUrl && !isGeneratingPDF && (
                <div className="space-y-4">
                  <div className="h-96 border border-gray-200 rounded overflow-hidden bg-white">
                    <iframe
                      src={generatedPDFUrl}
                      className="w-full h-full"
                      title="Bon de réservation"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleDownloadPDF}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger le bon de réservation
                    </Button>
                  </div>
                </div>
              )}

              {!generatedPDFUrl && !isGeneratingPDF && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">📄</div>
                    <p>Le bon de réservation sera généré automatiquement</p>
                    <p className="text-sm mt-2">après la création de la réservation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProlongationModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading, 
  reservation,
  hotels, 
  operateurs, 
  templates 
}: ProlongationModalProps) {
  const [formData, setFormData] = useState({
    nouvelleDateDepart: '',
    motifProlongation: '',
    nuitsSupplementaires: 0,
    prixSupplementaire: 0
  });

  const [generatedPDFUrl, setGeneratedPDFUrl] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Calculer la nouvelle date de départ et les nuits supplémentaires
  useEffect(() => {
    if (formData.nouvelleDateDepart) {
      const dateDepartInitiale = new Date(reservation.dateDepart);
      const nouvelleDateDepart = new Date(formData.nouvelleDateDepart);
      const nuitsSupplementaires = Math.ceil((nouvelleDateDepart.getTime() - dateDepartInitiale.getTime()) / (1000 * 60 * 60 * 24));
      
      setFormData(prev => ({
        ...prev,
        nuitsSupplementaires: nuitsSupplementaires > 0 ? nuitsSupplementaires : 0,
        prixSupplementaire: nuitsSupplementaires > 0 ? nuitsSupplementaires * reservation.prix : 0
      }));
    }
  }, [formData.nouvelleDateDepart, reservation.prix, reservation.dateDepart]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Créer l'objet prolongation
    const prolongationData = {
      reservationId: reservation.id,
      dateDepartInitiale: reservation.dateDepart,
      nouvelleDateDepart: formData.nouvelleDateDepart,
      motifProlongation: formData.motifProlongation,
      nuitsSupplementaires: formData.nuitsSupplementaires,
      prixSupplementaire: formData.prixSupplementaire,
      prixParNuit: reservation.prix
    };

    // Générer automatiquement le bon de prolongation
    await generateBonProlongation(prolongationData);
    
    // Appeler la fonction onSubmit avec les données
    onSubmit(prolongationData);
  };

  const generateBonProlongation = async (prolongationData: any) => {
    setIsGeneratingPDF(true);
    
    try {
      // Trouver le template de prolongation
      const prolongationTemplate = templates.find(t => t.type === 'prolongation_reservation');
      
      if (!prolongationTemplate) {
        console.error('Template de prolongation non trouvé');
        return;
      }

      // Trouver les données de l'hôtel et de l'opérateur
      const hotel = hotels.find(h => h.nom === reservation.hotel);
      const operateur = operateurs.find(o => o.organisation === reservation.prescripteur);

      // Créer une réservation mise à jour avec la nouvelle date de départ
      const reservationMiseAJour = {
        ...reservation,
        dateDepart: prolongationData.nouvelleDateDepart,
        duree: reservation.duree + prolongationData.nuitsSupplementaires
      };

      // Créer les données de réservation pour le mapping
      const reservationDataForPDF = {
        reservation: reservationMiseAJour,
        hotel,
        operateur,
        chambre: {
          numero: reservation.chambre,
          type: 'Standard',
          prix: reservation.prix
        }
      };

      // Importer les utilitaires nécessaires
      const { ReservationToPDFMapper } = await import('../../utils/reservationToPDF');
      const { PDFGenerator } = await import('../../utils/pdfGenerator');

      // Mapper les variables
      const variables = ReservationToPDFMapper.mapReservationToVariables(reservationDataForPDF, prolongationTemplate);
      
      // Générer le PDF
      const options = {
        template: prolongationTemplate,
        variables,
        filename: `prolongation_reservation_${reservation.id}.pdf`,
        format: 'A4' as const,
        orientation: 'portrait' as const
      };

      const pdfUrl = await PDFGenerator.previewPDF(options);
      setGeneratedPDFUrl(pdfUrl);
      
    } catch (error) {
      console.error('Erreur lors de la génération du bon de prolongation:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedPDFUrl) return;
    
    try {
      const prolongationTemplate = templates.find(t => t.type === 'prolongation_reservation');
      if (!prolongationTemplate) return;

      const hotel = hotels.find(h => h.nom === reservation.hotel);
      const operateur = operateurs.find(o => o.organisation === reservation.prescripteur);

      const reservationMiseAJour = {
        ...reservation,
        dateDepart: formData.nouvelleDateDepart,
        duree: reservation.duree + formData.nuitsSupplementaires
      };

      const reservationDataForPDF = {
        reservation: reservationMiseAJour,
        hotel,
        operateur,
        chambre: {
          numero: reservation.chambre,
          type: 'Standard',
          prix: reservation.prix
        }
      };

      const { ReservationToPDFMapper } = await import('../../utils/reservationToPDF');
      const { PDFGenerator } = await import('../../utils/pdfGenerator');

      const variables = ReservationToPDFMapper.mapReservationToVariables(reservationDataForPDF, prolongationTemplate);
      
      const options = {
        template: prolongationTemplate,
        variables,
        filename: `prolongation_reservation_${reservation.id}.pdf`,
        format: 'A4' as const,
        orientation: 'portrait' as const
      };

      await PDFGenerator.downloadPDF(options);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  const handleClose = () => {
    if (generatedPDFUrl) {
      URL.revokeObjectURL(generatedPDFUrl);
      setGeneratedPDFUrl(null);
    }
    setFormData({
      nouvelleDateDepart: '',
      motifProlongation: '',
      nuitsSupplementaires: 0,
      prixSupplementaire: 0
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Prolonger la réservation #{reservation.id}</h2>
          <Button variant="ghost" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex h-full">
          {/* Formulaire de prolongation */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Informations de la réservation actuelle */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Réservation actuelle</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Usager:</strong> {reservation.usager}</div>
                  <div><strong>Hôtel:</strong> {reservation.hotel}</div>
                  <div><strong>Chambre:</strong> {reservation.chambre}</div>
                  <div><strong>Prix/nuit:</strong> {reservation.prix}€</div>
                  <div><strong>Date d'arrivée:</strong> {reservation.dateArrivee}</div>
                  <div><strong>Date de départ:</strong> {reservation.dateDepart}</div>
                  <div><strong>Durée actuelle:</strong> {reservation.duree} nuits</div>
                  <div><strong>Total actuel:</strong> {reservation.prix * reservation.duree}€</div>
                </div>
              </div>

              <div>
                <Label htmlFor="nouvelleDateDepart">Nouvelle date de départ</Label>
                <Input
                  id="nouvelleDateDepart"
                  type="date"
                  value={formData.nouvelleDateDepart}
                  onChange={(e) => setFormData({ ...formData, nouvelleDateDepart: e.target.value })}
                  min={reservation.dateDepart}
                  required
                />
              </div>

              <div>
                <Label htmlFor="motifProlongation">Motif de la prolongation</Label>
                <select
                  id="motifProlongation"
                  value={formData.motifProlongation}
                  onChange={(e) => setFormData({ ...formData, motifProlongation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Sélectionner un motif</option>
                  <option value="Accompagnement social en cours - Recherche de logement permanent">Accompagnement social en cours - Recherche de logement permanent</option>
                  <option value="Accompagnement social en cours - Attente de décision administrative">Accompagnement social en cours - Attente de décision administrative</option>
                  <option value="Accompagnement social en cours - Soins médicaux en cours">Accompagnement social en cours - Soins médicaux en cours</option>
                  <option value="Accompagnement social en cours - Formation professionnelle">Accompagnement social en cours - Formation professionnelle</option>
                  <option value="Accompagnement social en cours - Accompagnement familial">Accompagnement social en cours - Accompagnement familial</option>
                  <option value="Accompagnement social en cours - Insertion professionnelle">Accompagnement social en cours - Insertion professionnelle</option>
                  <option value="Accompagnement social en cours - Accompagnement santé mentale">Accompagnement social en cours - Accompagnement santé mentale</option>
                  <option value="Accompagnement social en cours - Accompagnement addiction">Accompagnement social en cours - Accompagnement addiction</option>
                  <option value="Accompagnement social en cours - Accompagnement handicap">Accompagnement social en cours - Accompagnement handicap</option>
                  <option value="Accompagnement social en cours - Accompagnement global">Accompagnement social en cours - Accompagnement global</option>
                </select>
              </div>

              {/* Résumé de la prolongation */}
              {formData.nuitsSupplementaires > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Résumé de la prolongation</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Nuits supplémentaires:</strong> {formData.nuitsSupplementaires}</div>
                    <div><strong>Prix supplémentaire:</strong> {formData.prixSupplementaire}€</div>
                    <div><strong>Nouvelle durée totale:</strong> {reservation.duree + formData.nuitsSupplementaires} nuits</div>
                    <div><strong>Nouveau total:</strong> {(reservation.prix * reservation.duree) + formData.prixSupplementaire}€</div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading || isGeneratingPDF}>
                  {isLoading || isGeneratingPDF ? 'Prolongation...' : 'Prolonger la réservation'}
                </Button>
              </div>
            </form>
          </div>

          {/* Prévisualisation du bon de prolongation */}
          <div className="w-1/2 border-l bg-gray-50">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Bon de prolongation</h3>
              
              {isGeneratingPDF && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Génération du bon de prolongation...</p>
                  </div>
                </div>
              )}

              {generatedPDFUrl && !isGeneratingPDF && (
                <div className="space-y-4">
                  <div className="h-96 border border-gray-200 rounded overflow-hidden bg-white">
                    <iframe
                      src={generatedPDFUrl}
                      className="w-full h-full"
                      title="Bon de prolongation"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleDownloadPDF}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger le bon de prolongation
                    </Button>
                  </div>
                </div>
              )}

              {!generatedPDFUrl && !isGeneratingPDF && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">📄</div>
                    <p>Le bon de prolongation sera généré automatiquement</p>
                    <p className="text-sm mt-2">après la prolongation de la réservation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EndCareModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading, 
  reservation,
  hotels, 
  operateurs, 
  templates 
}: EndCareModalProps) {
  const [formData, setFormData] = useState({
    dateFinPriseCharge: '',
    motifFinPriseCharge: '',
    observations: ''
  });

  const [generatedPDFUrl, setGeneratedPDFUrl] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Créer l'objet fin de prise en charge
    const endCareData = {
      reservationId: reservation.id,
      dateFinPriseCharge: formData.dateFinPriseCharge,
      motifFinPriseCharge: formData.motifFinPriseCharge,
      observations: formData.observations,
      dateDebutPriseCharge: reservation.dateArrivee,
      dureeTotale: reservation.duree
    };

    // Générer automatiquement le bon de fin de prise en charge
    await generateBonFinPriseCharge(endCareData);
    
    // Appeler la fonction onSubmit avec les données
    onSubmit(endCareData);
  };

  const generateBonFinPriseCharge = async (endCareData: any) => {
    setIsGeneratingPDF(true);
    
    try {
      // Trouver le template de fin de prise en charge
      const finPriseChargeTemplate = templates.find(t => t.type === 'fin_prise_charge');
      
      if (!finPriseChargeTemplate) {
        console.error('Template de fin de prise en charge non trouvé');
        return;
      }

      // Trouver les données de l'hôtel et de l'opérateur
      const hotel = hotels.find(h => h.nom === reservation.hotel);
      const operateur = operateurs.find(o => o.organisation === reservation.prescripteur);

      // Créer une réservation mise à jour avec la date de fin de prise en charge
      const reservationMiseAJour = {
        ...reservation,
        dateFinPriseCharge: endCareData.dateFinPriseCharge,
        statut: 'TERMINEE'
      };

      // Créer les données de réservation pour le mapping
      const reservationDataForPDF = {
        reservation: reservationMiseAJour,
        hotel,
        operateur,
        chambre: {
          numero: reservation.chambre,
          type: 'Standard',
          prix: reservation.prix
        }
      };

      // Importer les utilitaires nécessaires
      const { ReservationToPDFMapper } = await import('../../utils/reservationToPDF');
      const { PDFGenerator } = await import('../../utils/pdfGenerator');

      // Mapper les variables
      const variables = ReservationToPDFMapper.mapReservationToVariables(reservationDataForPDF, finPriseChargeTemplate);
      
      // Générer le PDF
      const options = {
        template: finPriseChargeTemplate,
        variables,
        filename: `fin_prise_charge_${reservation.id}.pdf`,
        format: 'A4' as const,
        orientation: 'portrait' as const
      };

      const pdfUrl = await PDFGenerator.previewPDF(options);
      setGeneratedPDFUrl(pdfUrl);
      
    } catch (error) {
      console.error('Erreur lors de la génération du bon de fin de prise en charge:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedPDFUrl) return;
    
    try {
      const finPriseChargeTemplate = templates.find(t => t.type === 'fin_prise_charge');
      if (!finPriseChargeTemplate) return;

      const hotel = hotels.find(h => h.nom === reservation.hotel);
      const operateur = operateurs.find(o => o.organisation === reservation.prescripteur);

      const reservationMiseAJour = {
        ...reservation,
        dateFinPriseCharge: formData.dateFinPriseCharge,
        statut: 'TERMINEE'
      };

      const reservationDataForPDF = {
        reservation: reservationMiseAJour,
        hotel,
        operateur,
        chambre: {
          numero: reservation.chambre,
          type: 'Standard',
          prix: reservation.prix
        }
      };

      const { ReservationToPDFMapper } = await import('../../utils/reservationToPDF');
      const { PDFGenerator } = await import('../../utils/pdfGenerator');

      const variables = ReservationToPDFMapper.mapReservationToVariables(reservationDataForPDF, finPriseChargeTemplate);
      
      const options = {
        template: finPriseChargeTemplate,
        variables,
        filename: `fin_prise_charge_${reservation.id}.pdf`,
        format: 'A4' as const,
        orientation: 'portrait' as const
      };

      await PDFGenerator.downloadPDF(options);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  const handleClose = () => {
    if (generatedPDFUrl) {
      URL.revokeObjectURL(generatedPDFUrl);
      setGeneratedPDFUrl(null);
    }
    setFormData({
      dateFinPriseCharge: '',
      motifFinPriseCharge: '',
      observations: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-red-700">Mettre fin à la prise en charge - Réservation #{reservation.id}</h2>
          <Button variant="ghost" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex h-full">
          {/* Formulaire de fin de prise en charge */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Informations de la réservation actuelle */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Réservation actuelle</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Usager:</strong> {reservation.usager}</div>
                  <div><strong>Hôtel:</strong> {reservation.hotel}</div>
                  <div><strong>Chambre:</strong> {reservation.chambre}</div>
                  <div><strong>Prix/nuit:</strong> {reservation.prix}€</div>
                  <div><strong>Date d'arrivée:</strong> {reservation.dateArrivee}</div>
                  <div><strong>Date de départ:</strong> {reservation.dateDepart}</div>
                  <div><strong>Durée totale:</strong> {reservation.duree} nuits</div>
                  <div><strong>Total:</strong> {reservation.prix * reservation.duree}€</div>
                </div>
              </div>

              <div>
                <Label htmlFor="dateFinPriseCharge">Date de fin de prise en charge</Label>
                <Input
                  id="dateFinPriseCharge"
                  type="date"
                  value={formData.dateFinPriseCharge}
                  onChange={(e) => setFormData({ ...formData, dateFinPriseCharge: e.target.value })}
                  max={reservation.dateDepart}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  La date ne peut pas dépasser la date de départ prévue
                </p>
              </div>

              <div>
                <Label htmlFor="motifFinPriseCharge">Motif de la fin de prise en charge</Label>
                <select
                  id="motifFinPriseCharge"
                  value={formData.motifFinPriseCharge}
                  onChange={(e) => setFormData({ ...formData, motifFinPriseCharge: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Sélectionner un motif</option>
                  <option value="Logement permanent trouvé">Logement permanent trouvé</option>
                  <option value="Retour en famille">Retour en famille</option>
                  <option value="Départ volontaire">Départ volontaire</option>
                  <option value="Fin d'accompagnement social">Fin d'accompagnement social</option>
                  <option value="Hospitalisation">Hospitalisation</option>
                  <option value="Incarceration">Incarceration</option>
                  <option value="Décès">Décès</option>
                  <option value="Refus de l'hébergement">Refus de l'hébergement</option>
                  <option value="Non-respect du règlement">Non-respect du règlement</option>
                  <option value="Autre motif">Autre motif</option>
                </select>
              </div>

              <div>
                <Label htmlFor="observations">Observations (optionnel)</Label>
                <textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Observations complémentaires..."
                />
              </div>

              {/* Résumé de la fin de prise en charge */}
              {formData.dateFinPriseCharge && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="font-semibold mb-2 text-red-800">Résumé de la fin de prise en charge</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-red-700">
                    <div><strong>Date de fin:</strong> {formData.dateFinPriseCharge}</div>
                    <div><strong>Motif:</strong> {formData.motifFinPriseCharge}</div>
                    <div><strong>Durée effective:</strong> {(() => {
                      const dateArrivee = new Date(reservation.dateArrivee);
                      const dateFin = new Date(formData.dateFinPriseCharge);
                      return Math.ceil((dateFin.getTime() - dateArrivee.getTime()) / (1000 * 60 * 60 * 24));
                    })()} nuits</div>
                    <div><strong>Coût effectif:</strong> {(() => {
                      const dateArrivee = new Date(reservation.dateArrivee);
                      const dateFin = new Date(formData.dateFinPriseCharge);
                      const nuitsEffectives = Math.ceil((dateFin.getTime() - dateArrivee.getTime()) / (1000 * 60 * 60 * 24));
                      return (nuitsEffectives * reservation.prix).toFixed(2);
                    })()}€</div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading || isGeneratingPDF} className="bg-red-600 hover:bg-red-700 text-white">
                  {isLoading || isGeneratingPDF ? 'Mise en fin...' : 'Mettre fin à la prise en charge'}
                </Button>
              </div>
            </form>
          </div>

          {/* Prévisualisation du bon de fin de prise en charge */}
          <div className="w-1/2 border-l bg-gray-50">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-red-700">Bon de fin de prise en charge</h3>
              
              {isGeneratingPDF && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Génération du bon de fin de prise en charge...</p>
                  </div>
                </div>
              )}

              {generatedPDFUrl && !isGeneratingPDF && (
                <div className="space-y-4">
                  <div className="h-96 border border-gray-200 rounded overflow-hidden bg-white">
                    <iframe
                      src={generatedPDFUrl}
                      className="w-full h-full"
                      title="Bon de fin de prise en charge"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleDownloadPDF}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger le bon de fin de prise en charge
                    </Button>
                  </div>
                </div>
              )}

              {!generatedPDFUrl && !isGeneratingPDF && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">📋</div>
                    <p>Le bon de fin de prise en charge sera généré automatiquement</p>
                    <p className="text-sm mt-2">après la validation de la fin de prise en charge</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EditHotelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function EditHotelModal({ isOpen, onClose, onSubmit, isLoading }: EditHotelModalProps) {
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    ville: '',
    codePostal: '',
    telephone: '',
    email: '',
    gestionnaire: ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Modifier l'établissement</h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="nom">Nom de l'établissement</Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Nom de l'établissement"
            />
          </div>
          
          <div>
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              placeholder="Adresse complète"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ville">Ville</Label>
              <Input
                id="ville"
                value={formData.ville}
                onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                placeholder="Ville"
              />
            </div>
            <div>
              <Label htmlFor="codePostal">Code postal</Label>
              <Input
                id="codePostal"
                value={formData.codePostal}
                onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                placeholder="75000"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              placeholder="01.23.45.67.89"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@etablissement.fr"
            />
          </div>
          
          <div>
            <Label htmlFor="gestionnaire">Gestionnaire</Label>
            <Input
              id="gestionnaire"
              value={formData.gestionnaire}
              onChange={(e) => setFormData({ ...formData, gestionnaire: e.target.value })}
              placeholder="Nom du gestionnaire"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? 'Modification...' : 'Modifier'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ConventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (convention: Partial<ConventionPrix>) => void;
  isLoading?: boolean;
  convention?: ConventionPrix;
  hotels: Hotel[];
  operateurs: OperateurSocial[];
  mode: 'create' | 'edit';
}

export function ConventionModal({ isOpen, onClose, onSubmit, isLoading, convention, hotels, operateurs, mode }: ConventionModalProps) {
  type ConventionFormData = {
    operateurId: string;
    hotelId: string;
    typeChambre: string;
    prixStandard: number;
    prixConventionne: number;
    reduction: number;
    dateDebut: string;
    dateFin: string;
    statut: 'active' | 'expiree' | 'suspendue';
    conditions: string;
  };
  const [formData, setFormData] = useState<ConventionFormData>({
    operateurId: convention?.operateurId ? String(convention.operateurId) : '',
    hotelId: convention?.hotelId ? String(convention.hotelId) : (hotels.length > 0 ? String(hotels[0].id) : ''),
    typeChambre: convention?.typeChambre || 'Simple',
    prixStandard: convention?.prixStandard || 0,
    prixConventionne: convention?.prixConventionne || 0,
    reduction: convention?.reduction || 0,
    dateDebut: convention?.dateDebut || '',
    dateFin: convention?.dateFin || '',
    statut: (convention?.statut as 'active' | 'expiree' | 'suspendue') || 'active',
    conditions: convention?.conditions || ''
  });

  const [typesChambres] = useState(['Simple', 'Double', 'Familiale', 'Adaptée']);
  const [statuts] = useState(['active', 'suspendue', 'expiree']);

  const handlePrixStandardChange = (value: number) => {
    const reduction = formData.reduction;
    const prixConventionne = Math.round(value * (1 - reduction / 100));
    setFormData({
      ...formData,
      prixStandard: value,
      prixConventionne
    });
  };

  const handleReductionChange = (value: number) => {
    const prixConventionne = Math.round(formData.prixStandard * (1 - value / 100));
    setFormData({
      ...formData,
      reduction: value,
      prixConventionne
    });
  };

  const handleSubmit = () => {
    const selectedHotel = hotels.find(h => h.id === Number(formData.hotelId));
    const selectedOperateur = operateurs.find(o => o.id === Number(formData.operateurId));
    
    const conventionData = {
      operateurId: Number(formData.operateurId),
      hotelId: Number(formData.hotelId),
      hotelNom: selectedHotel?.nom || '',
      typeChambre: formData.typeChambre,
      prixStandard: formData.prixStandard,
      prixConventionne: formData.prixConventionne,
      reduction: formData.reduction,
      dateDebut: formData.dateDebut,
      dateFin: formData.dateFin || undefined,
      statut: formData.statut as 'active' | 'suspendue' | 'expiree',
      conditions: formData.conditions || undefined
    };

    onSubmit(conventionData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {mode === 'create' ? 'Nouvelle convention de prix' : 'Modifier la convention'}
          </h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-6">
          {/* Sélection opérateur et établissement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="operateur">Opérateur social</Label>
              <select
                id="operateur"
                value={formData.operateurId}
                onChange={(e) => setFormData({ ...formData, operateurId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Sélectionner un opérateur</option>
                {operateurs.map(operateur => (
                  <option key={operateur.id} value={operateur.id}>
                    {operateur.prenom} {operateur.nom} - {operateur.organisation}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="hotel">Établissement</Label>
              <select
                id="hotel"
                value={formData.hotelId}
                onChange={(e) => setFormData({ ...formData, hotelId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Sélectionner un établissement</option>
                {hotels.map(hotel => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.nom} - {hotel.ville}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Type de chambre et statut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="typeChambre">Type de chambre</Label>
              <select
                id="typeChambre"
                value={formData.typeChambre}
                onChange={(e) => setFormData({ ...formData, typeChambre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {typesChambres.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="statut">Statut de la convention</Label>
              <select
                id="statut"
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value as 'active' | 'expiree' | 'suspendue' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {statuts.map(statut => (
                  <option key={statut} value={statut}>
                    {statut === 'active' ? 'Active' : statut === 'suspendue' ? 'Suspendue' : 'Expirée'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prix et réductions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Euro className="h-5 w-5 mr-2" />
                Tarification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="prixStandard">Prix standard (€)</Label>
                  <Input
                    id="prixStandard"
                    type="number"
                    value={formData.prixStandard}
                    onChange={(e) => handlePrixStandardChange(Number(e.target.value))}
                    placeholder="50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="reduction">Réduction (%)</Label>
                  <Input
                    id="reduction"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.reduction}
                    onChange={(e) => handleReductionChange(Number(e.target.value))}
                    placeholder="10"
                  />
                </div>
                
                <div>
                  <Label htmlFor="prixConventionne">Prix conventionné (€)</Label>
                  <div className="flex items-center">
                    <Input
                      id="prixConventionne"
                      type="number"
                      value={formData.prixConventionne}
                      onChange={(e) => setFormData({ ...formData, prixConventionne: Number(e.target.value) })}
                      placeholder="45"
                      className="bg-gray-50"
                    />
                    <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                  </div>
                </div>
              </div>
              
              {formData.reduction > 0 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center text-green-800">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">
                      Économie de {formData.prixStandard - formData.prixConventionne}€ par nuit 
                      ({formData.reduction}% de réduction)
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates de validité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Période de validité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateDebut">Date de début</Label>
                  <Input
                    id="dateDebut"
                    type="date"
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="dateFin">Date de fin (optionnel)</Label>
                  <Input
                    id="dateFin"
                    type="date"
                    value={formData.dateFin}
                    onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Laissez vide pour une convention sans date de fin
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conditions spéciales */}
          <div>
            <Label htmlFor="conditions">Conditions spéciales (optionnel)</Label>
            <textarea
              id="conditions"
              value={formData.conditions}
              onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
              placeholder="Ex: Réservation minimum 3 nuits, paiement à l'avance requis..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Conditions particulières applicables à cette convention
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Enregistrement...' : mode === 'create' ? 'Créer' : 'Modifier'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ModalsProps {
  modalStates: {
    isAddRoomModalOpen: boolean;
    isNewReservationModalOpen: boolean;
    isEditHotelModalOpen: boolean;
    isProcessusModalOpen: boolean;
  };
  onAddRoom: (hotelId: number, room: any) => void;
  onNewReservation: (reservation: any) => void;
  onEditHotel: (hotelId: number, updates: any) => void;
  onHide: () => void;
  hotels: Hotel[];
  operateurs: OperateurSocial[];
  templates: DocumentTemplate[];
  processus: any[];
}

export default function Modals({ 
  modalStates, 
  onAddRoom, 
  onNewReservation, 
  onEditHotel, 
  onHide, 
  hotels, 
  operateurs,
  templates,
  processus 
}: ModalsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [selectedProcessus, setSelectedProcessus] = useState<any>(null);

  const handleAddRoom = async () => {
    if (!selectedHotelId) return;
    setIsLoading(true);
    try {
      // Simulation d'ajout de chambre
      await new Promise(resolve => setTimeout(resolve, 1000));
      onAddRoom(selectedHotelId, {});
    } finally {
      setIsLoading(false);
      onHide();
    }
  };

  const handleNewReservation = async () => {
    setIsLoading(true);
    try {
      // Simulation de création de réservation
      await new Promise(resolve => setTimeout(resolve, 1000));
      onNewReservation({});
    } finally {
      setIsLoading(false);
      onHide();
    }
  };

  const handleEditHotel = async () => {
    setIsLoading(true);
    try {
      // Simulation de modification d'hôtel
      await new Promise(resolve => setTimeout(resolve, 1000));
      onEditHotel(1, {});
    } finally {
      setIsLoading(false);
      onHide();
    }
  };

  return (
    <>
      <AddRoomModal
        isOpen={modalStates.isAddRoomModalOpen}
        onClose={onHide}
        onSubmit={handleAddRoom}
        isLoading={isLoading}
      />
      
              <NewReservationModal
          isOpen={modalStates.isNewReservationModalOpen}
          onClose={onHide}
          onSubmit={handleNewReservation}
          isLoading={isLoading}
          hotels={hotels}
          operateurs={operateurs}
          templates={templates}
        />
      
      <EditHotelModal
        isOpen={modalStates.isEditHotelModalOpen}
        onClose={onHide}
        onSubmit={handleEditHotel}
        isLoading={isLoading}
      />
      
      {modalStates.isProcessusModalOpen && selectedProcessus && (
        <Modal
          isOpen={modalStates.isProcessusModalOpen}
          onClose={onHide}
          title="Détails du processus"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Bon d'hébergement</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Statut: <Badge>{selectedProcessus.etapes.bonHebergement.statut}</Badge></div>
                <div>Numéro: {selectedProcessus.etapes.bonHebergement.numero}</div>
                <div>Date création: {selectedProcessus.etapes.bonHebergement.dateCreation}</div>
                {selectedProcessus.etapes.bonHebergement.dateValidation && (
                  <div>Date validation: {selectedProcessus.etapes.bonHebergement.dateValidation}</div>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Bon de commande</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Statut: <Badge>{selectedProcessus.etapes.bonCommande.statut}</Badge></div>
                {selectedProcessus.etapes.bonCommande.numero && (
                  <div>Numéro: {selectedProcessus.etapes.bonCommande.numero}</div>
                )}
                <div>Montant: {selectedProcessus.etapes.bonCommande.montant}€</div>
                {selectedProcessus.etapes.bonCommande.dateCreation && (
                  <div>Date création: {selectedProcessus.etapes.bonCommande.dateCreation}</div>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Facture</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Statut: <Badge>{selectedProcessus.etapes.facture.statut}</Badge></div>
                {selectedProcessus.etapes.facture.numero && (
                  <div>Numéro: {selectedProcessus.etapes.facture.numero}</div>
                )}
                <div>Montant: {selectedProcessus.etapes.facture.montant}€</div>
                <div>Montant payé: {selectedProcessus.etapes.facture.montantPaye}€</div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
} 
