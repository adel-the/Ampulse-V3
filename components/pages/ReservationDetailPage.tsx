'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Building2, 
  Euro, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Plus,
  X,
  Edit,
  Download,
  Phone,
  Mail,
  MapPin,
  Bed,
  Users,
  CreditCard,
  FileCheck,
  CalendarCheck,
  CalendarX,
  Receipt
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Reservation, Hotel, OperateurSocial, DocumentTemplate, ProcessusReservation } from '../../types';
import { ProlongationModal, EndCareModal } from '../modals/Modals';
import { PDFGenerator } from '../../utils/pdfGenerator';

interface ReservationDetailPageProps {
  reservation: Reservation;
  hotel?: Hotel;
  operateur?: OperateurSocial;
  templates: DocumentTemplate[];
  processus?: ProcessusReservation;
  onUpdateReservation?: (reservation: Reservation) => void;
  onDeleteReservation?: (id: number) => void;
}

export default function ReservationDetailPage({
  reservation,
  hotel,
  operateur,
  templates,
  processus,
  onUpdateReservation,
  onDeleteReservation
}: ReservationDetailPageProps) {
  const router = useRouter();
  const [isProlongationModalOpen, setIsProlongationModalOpen] = useState(false);
  const [isEndCareModalOpen, setIsEndCareModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMEE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'EN_ATTENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ANNULEE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'TERMINEE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMEE':
        return <CheckCircle className="w-4 h-4" />;
      case 'EN_ATTENTE':
        return <Clock className="w-4 h-4" />;
      case 'ANNULEE':
        return <XCircle className="w-4 h-4" />;
      case 'TERMINEE':
        return <CalendarX className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleProlongationSubmit = (prolongationData: any) => {
    console.log('Prolongation soumise:', prolongationData);
    // Ici vous pouvez ajouter la logique pour mettre à jour la réservation
    setIsProlongationModalOpen(false);
  };

  const handleEndCareSubmit = (endCareData: any) => {
    console.log('Fin de prise en charge soumise:', endCareData);
    // Ici vous pouvez ajouter la logique pour mettre à jour la réservation
    setIsEndCareModalOpen(false);
  };

  const handleEditReservation = () => {
    console.log('Modification de la réservation:', reservation);
    // Ici vous pouvez ouvrir un modal d'édition ou naviguer vers un formulaire
    // Pour l'instant, on affiche un message dans la console
    alert('Fonctionnalité de modification en cours de développement');
  };

  const handleConfirmReservation = async (reservation: Reservation) => {
    try {
      console.log('Confirmation de la réservation:', reservation);
      
      // Trouver le template de confirmation
      const confirmationTemplate = templates.find(t => t.type === 'bon_reservation');
      if (!confirmationTemplate) {
        alert('Template de confirmation non trouvé');
        return;
      }

      // Préparer les variables pour le PDF
      const variables = {
        nom_usager: reservation.usager,
        nom_hotel: reservation.hotel,
        date_arrivee: new Date(reservation.dateArrivee).toLocaleDateString('fr-FR'),
        date_depart: new Date(reservation.dateDepart).toLocaleDateString('fr-FR'),
        nombre_nuits: reservation.duree.toString(),
        nombre_personnes: '1',
        montant_total: reservation.prix.toString(),
        prescripteur: reservation.prescripteur,
        statut: 'CONFIRMEE',
        numero_dossier: reservation.id.toString(),
        telephone: '',
        email: '',
        adresse: '',
        ville: '',
        code_postal: '',
        handicap: '',
        accompagnement: 'Non',
        notes: '',
        date_creation: new Date().toLocaleDateString('fr-FR'),
        signature: '',
        conditions: 'Conditions standard'
      };

      // Générer et télécharger le PDF
      await PDFGenerator.downloadPDF({
        template: confirmationTemplate,
        variables,
        filename: `confirmation_reservation_${reservation.id}.pdf`
      });

      // Mettre à jour le statut de la réservation
      if (onUpdateReservation) {
        onUpdateReservation({ ...reservation, statut: 'CONFIRMEE' });
      }

      alert('Réservation confirmée et bon de confirmation généré !');

    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const handleDownloadReservation = async () => {
    try {
      console.log('Génération du bon de réservation pour:', reservation);
      
      // Trouver le template de réservation
      const reservationTemplate = templates.find(t => t.type === 'bon_reservation');
      if (!reservationTemplate) {
        alert('Template de réservation non trouvé');
        return;
      }

      // Préparer les variables pour le PDF
      const variables = {
        nom_usager: reservation.usager,
        nom_hotel: reservation.hotel,
        date_arrivee: new Date(reservation.dateArrivee).toLocaleDateString('fr-FR'),
        date_depart: new Date(reservation.dateDepart).toLocaleDateString('fr-FR'),
        nombre_nuits: reservation.duree.toString(),
        nombre_personnes: '1', // Valeur par défaut
        montant_total: reservation.prix.toString(),
        prescripteur: reservation.prescripteur,
        statut: reservation.statut,
        numero_dossier: reservation.id.toString(),
        telephone: '', // Non disponible dans le type Reservation
        email: '', // Non disponible dans le type Reservation
        adresse: '', // Non disponible dans le type Reservation
        ville: '', // Non disponible dans le type Reservation
        code_postal: '', // Non disponible dans le type Reservation
        handicap: '', // Non disponible dans le type Reservation
        accompagnement: 'Non', // Valeur par défaut
        nombre_accompagnants: '0', // Valeur par défaut
        notes: '', // Non disponible dans le type Reservation
        date_generation: new Date().toLocaleDateString('fr-FR')
      };

      await PDFGenerator.downloadPDF({
        template: reservationTemplate,
        variables,
        filename: `reservation_${reservation.id}_${reservation.usager}.pdf`
      });

      console.log('PDF généré avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  };

  const handleDownloadProlongation = async () => {
    try {
      console.log('Génération du bon de prolongation pour:', reservation);
      
      // Trouver le template de prolongation
      const prolongationTemplate = templates.find(t => t.type === 'prolongation_reservation');
      if (!prolongationTemplate) {
        alert('Template de prolongation non trouvé');
        return;
      }

      // Préparer les variables pour le PDF
      const variables = {
        nom_usager: reservation.usager,
        nom_hotel: reservation.hotel,
        date_arrivee: new Date(reservation.dateArrivee).toLocaleDateString('fr-FR'),
        date_depart: new Date(reservation.dateDepart).toLocaleDateString('fr-FR'),
        nombre_nuits: reservation.duree.toString(),
        prescripteur: reservation.prescripteur,
        statut: reservation.statut,
        numero_dossier: reservation.id.toString(),
        date_generation: new Date().toLocaleDateString('fr-FR')
      };

      await PDFGenerator.downloadPDF({
        template: prolongationTemplate,
        variables,
        filename: `prolongation_${reservation.id}_${reservation.usager}.pdf`
      });

      console.log('PDF de prolongation généré avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF de prolongation:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  };

  const handleDownloadEndCare = async () => {
    try {
      console.log('Génération du bon de fin de prise en charge pour:', reservation);
      
      // Trouver le template de fin de prise en charge
      const endCareTemplate = templates.find(t => t.type === 'fin_prise_charge');
      if (!endCareTemplate) {
        alert('Template de fin de prise en charge non trouvé');
        return;
      }

      // Préparer les variables pour le PDF
      const variables = {
        nom_usager: reservation.usager,
        nom_hotel: reservation.hotel,
        date_arrivee: new Date(reservation.dateArrivee).toLocaleDateString('fr-FR'),
        date_depart: new Date(reservation.dateDepart).toLocaleDateString('fr-FR'),
        nombre_nuits: reservation.duree.toString(),
        prescripteur: reservation.prescripteur,
        statut: reservation.statut,
        numero_dossier: reservation.id.toString(),
        date_generation: new Date().toLocaleDateString('fr-FR')
      };

      await PDFGenerator.downloadPDF({
        template: endCareTemplate,
        variables,
        filename: `fin_prise_charge_${reservation.id}_${reservation.usager}.pdf`
      });

      console.log('PDF de fin de prise en charge généré avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF de fin de prise en charge:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      console.log('Génération de la facture pour:', reservation);
      
      // Trouver le template de facture
      const invoiceTemplate = templates.find(t => t.type === 'facture');
      if (!invoiceTemplate) {
        alert('Template de facture non trouvé');
        return;
      }

      // Générer un numéro de facture unique
      const invoiceNumber = `FAC-${new Date().getFullYear()}-${String(reservation.id).padStart(4, '0')}`;
      
      // Calculer les montants
      const montantHT = reservation.prix * reservation.duree;
      const tva = montantHT * 0.20; // 20% de TVA
      const montantTTC = montantHT + tva;

      // Préparer les variables pour le PDF
      const variables = {
        numero_facture: invoiceNumber,
        date_facture: new Date().toLocaleDateString('fr-FR'),
        date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'), // +30 jours
        nom_client: reservation.usager,
        adresse_client: hotel?.adresse || '',
        ville_client: hotel?.ville || '',
        code_postal_client: hotel?.codePostal || '',
        telephone_client: hotel?.telephone || '',
        email_client: hotel?.email || '',
        nom_hotel: reservation.hotel,
        chambre: reservation.chambre,
        date_arrivee: new Date(reservation.dateArrivee).toLocaleDateString('fr-FR'),
        date_depart: new Date(reservation.dateDepart).toLocaleDateString('fr-FR'),
        nombre_nuits: reservation.duree.toString(),
        prix_unitaire: reservation.prix.toString(),
        montant_ht: montantHT.toString(),
        taux_tva: '20',
        montant_tva: tva.toFixed(2),
        montant_ttc: montantTTC.toFixed(2),
        prescripteur: reservation.prescripteur,
        numero_dossier: reservation.id.toString(),
        conditions_paiement: 'Paiement à 30 jours',
        mode_paiement: 'Virement bancaire',
        iban: 'FR76 1234 5678 9012 3456 7890 123',
        bic: 'BNPAFRPP123',
        reference: `REF-${reservation.id}`,
        notes: `Facture générée automatiquement pour la réservation #${reservation.id}`,
        date_generation: new Date().toLocaleDateString('fr-FR')
      };

      // Générer et télécharger le PDF de facture
      await PDFGenerator.downloadPDF({
        template: invoiceTemplate,
        variables,
        filename: `facture_${reservation.id}_${reservation.usager}.pdf`
      });

      console.log('Facture générée avec succès');
      alert('Facture générée et téléchargée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la génération de la facture:', error);
      alert('Erreur lors de la génération de la facture. Veuillez réessayer.');
    }
  };

  const handleDeleteReservation = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      onDeleteReservation?.(reservation.id);
      router.push('/reservations');
    }
  };

  function getEtapeActuelle(processus: ProcessusReservation) {
    if (!processus) return '';
    const { etapes } = processus;
    if (etapes.bonHebergement.statut !== 'valide') return "Bon d'hébergement";
    if (etapes.bonCommande.statut !== 'valide') return 'Bon de commande';
    if (etapes.facture.statut !== 'payee') return 'Facture';
    return 'Terminé';
  }

  function getProgression(processus: ProcessusReservation) {
    if (!processus) return 0;
    const { etapes } = processus;
    let done = 0;
    if (etapes.bonHebergement.statut === 'valide') done++;
    if (etapes.bonCommande.statut === 'valide') done++;
    if (etapes.facture.statut === 'payee') done++;
    return Math.round((done / 3) * 100);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Réservation #{reservation.id}
                </h1>
                <p className="text-sm text-gray-500">
                  {reservation.usager} - {reservation.hotel}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge className={`flex items-center space-x-1 ${getStatusColor(reservation.statut)}`}>
                {getStatusIcon(reservation.statut)}
                <span>{reservation.statut}</span>
              </Badge>
              
              {reservation.statut === 'CONFIRMEE' && (
                <>
                  <Button
                    onClick={() => setIsProlongationModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Prolonger
                  </Button>
                  <Button
                    onClick={() => setIsEndCareModalOpen(true)}
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Fin de prise en charge
                  </Button>
                </>
              )}
              
              <Button
                onClick={handleEditReservation}
                variant="outline"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              
              <Button
                onClick={handleGenerateInvoice}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Receipt className="w-4 h-4 mr-2" />
                Générer facture
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations de la réservation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Détails de la réservation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Usager</p>
                        <p className="text-lg font-semibold">{reservation.usager}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Hôtel</p>
                        <p className="text-lg font-semibold">{reservation.hotel}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Bed className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Chambre</p>
                        <p className="text-lg font-semibold">{reservation.chambre}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Période</p>
                        <p className="text-lg font-semibold">
                          {reservation.dateArrivee} - {reservation.dateDepart}
                        </p>
                        <p className="text-sm text-gray-500">{reservation.duree} nuits</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Euro className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Prix</p>
                        <p className="text-lg font-semibold">{reservation.prix}€ / nuit</p>
                        <p className="text-sm text-gray-500">Total: {reservation.prix * reservation.duree}€</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Prescripteur</p>
                        <p className="text-lg font-semibold">{reservation.prescripteur}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations de l'hôtel */}
            {hotel && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span>Informations de l'hôtel</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Nom</p>
                          <p className="font-semibold">{hotel.nom}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Adresse</p>
                          <p className="font-semibold">{hotel.adresse}</p>
                          <p className="text-sm text-gray-500">{hotel.codePostal} {hotel.ville}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Téléphone</p>
                          <p className="font-semibold">{hotel.telephone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <p className="font-semibold">{hotel.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Gestionnaire</p>
                          <p className="font-semibold">{hotel.gestionnaire}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informations du prescripteur */}
            {operateur && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Informations du prescripteur</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Nom</p>
                          <p className="font-semibold">{operateur.prenom} {operateur.nom}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Organisation</p>
                          <p className="font-semibold">{operateur.organisation}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Téléphone</p>
                          <p className="font-semibold">{operateur.telephone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <p className="font-semibold">{operateur.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processus de réservation */}
            {processus && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileCheck className="w-5 h-5" />
                    <span>Processus de réservation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Progression générale */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Étape actuelle</span>
                        <Badge variant="outline">{getEtapeActuelle(processus)}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Progression</span>
                        <span className="text-sm text-gray-500">{getProgression(processus)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${getProgression(processus)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Étapes du processus */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Étapes du processus</h4>
                      
                      {/* Bon de confirmation */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              processus.etapes.bonHebergement.statut === 'valide' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                              {processus.etapes.bonHebergement.statut === 'valide' ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <h5 className="font-medium">Bon de confirmation</h5>
                              <p className="text-sm text-gray-500">Confirmation de la réservation</p>
                            </div>
                          </div>
                          <Badge className={
                            processus.etapes.bonHebergement.statut === 'valide' ? 'bg-green-100 text-green-800' :
                            processus.etapes.bonHebergement.statut === 'refuse' ? 'bg-red-100 text-red-800' :
                            processus.etapes.bonHebergement.statut === 'expire' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {processus.etapes.bonHebergement.statut.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="text-sm text-gray-500">Numéro:</span>
                            <p className="font-medium">{processus.etapes.bonHebergement.numero || 'Non généré'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Date de création:</span>
                            <p className="font-medium">{processus.etapes.bonHebergement.dateCreation || 'Non créé'}</p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleDownloadReservation}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger
                          </Button>
                          {reservation.statut === 'EN_COURS' && (
                            <Button
                              onClick={() => handleConfirmReservation(reservation)}
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Confirmer
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Bon de prolongation */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              processus.etapes.bonCommande.statut === 'valide' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                              {processus.etapes.bonCommande.statut === 'valide' ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <h5 className="font-medium">Bon de prolongation</h5>
                              <p className="text-sm text-gray-500">Prolongation du séjour</p>
                            </div>
                          </div>
                          <Badge className={
                            processus.etapes.bonCommande.statut === 'valide' ? 'bg-green-100 text-green-800' :
                            processus.etapes.bonCommande.statut === 'refuse' ? 'bg-red-100 text-red-800' :
                            processus.etapes.bonCommande.statut === 'expire' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {processus.etapes.bonCommande.statut.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="text-sm text-gray-500">Numéro:</span>
                            <p className="font-medium">{processus.etapes.bonCommande.numero || 'Non généré'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Montant:</span>
                            <p className="font-medium">{processus.etapes.bonCommande.montant || 'Non défini'}€</p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleDownloadProlongation}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={reservation.statut !== 'CONFIRMEE'}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger
                          </Button>
                          {reservation.statut === 'CONFIRMEE' && (
                            <Button
                              onClick={() => setIsProlongationModalOpen(true)}
                              size="sm"
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Prolonger
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Bon de fin de prise en charge */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              processus.etapes.facture.statut === 'payee' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                              {processus.etapes.facture.statut === 'payee' ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <h5 className="font-medium">Bon de fin de prise en charge</h5>
                              <p className="text-sm text-gray-500">Clôture de la réservation</p>
                            </div>
                          </div>
                          <Badge className={
                            processus.etapes.facture.statut === 'payee' ? 'bg-green-100 text-green-800' :
                            processus.etapes.facture.statut === 'impayee' ? 'bg-red-100 text-red-800' :
                            processus.etapes.facture.statut === 'envoyee' ? 'bg-blue-100 text-blue-800' :
                            processus.etapes.facture.statut === 'generee' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {processus.etapes.facture.statut}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="text-sm text-gray-500">Numéro:</span>
                            <p className="font-medium">{processus.etapes.facture.numero || 'Non généré'}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Montant:</span>
                            <p className="font-medium">{processus.etapes.facture.montant || 'Non défini'}€</p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            onClick={handleDownloadEndCare}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={reservation.statut !== 'CONFIRMEE'}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger
                          </Button>
                          {reservation.statut === 'CONFIRMEE' && (
                            <Button
                              onClick={() => setIsEndCareModalOpen(true)}
                              size="sm"
                              className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Fin de prise en charge
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Documents et actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documents et actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Actions selon le statut */}
                {reservation.statut === 'EN_COURS' && (
                  <Button
                    onClick={() => handleConfirmReservation(reservation)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmer la réservation
                  </Button>
                )}
                
                {reservation.statut === 'CONFIRMEE' && (
                  <>
                    <Button
                      onClick={() => setIsProlongationModalOpen(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Prolonger le séjour
                    </Button>
                    <Button
                      onClick={() => setIsEndCareModalOpen(true)}
                      variant="outline"
                      className="w-full text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Fin de prise en charge
                    </Button>
                  </>
                )}
                
                {/* Documents disponibles */}
                <div className="border-t pt-3 mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Documents</h4>
                  <div className="space-y-2">
                    <Button
                      onClick={handleDownloadReservation}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Bon de réservation
                    </Button>
                    
                    <Button
                      onClick={handleGenerateInvoice}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      Générer facture
                    </Button>
                    
                    {reservation.statut === 'CONFIRMEE' && (
                      <>
                        <Button
                          onClick={handleDownloadProlongation}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Bon de prolongation
                        </Button>
                        <Button
                          onClick={handleDownloadEndCare}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Bon de fin de prise en charge
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Durée du séjour</span>
                  <span className="font-semibold">{reservation.duree} nuits</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Coût total</span>
                  <span className="font-semibold">{reservation.prix * reservation.duree}€</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Prix moyen/nuit</span>
                  <span className="font-semibold">{reservation.prix}€</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProlongationModal
        isOpen={isProlongationModalOpen}
        onClose={() => setIsProlongationModalOpen(false)}
        onSubmit={handleProlongationSubmit}
        isLoading={false}
        reservation={reservation}
        hotels={hotel ? [hotel] : []}
        operateurs={operateur ? [operateur] : []}
        templates={templates}
      />

      <EndCareModal
        isOpen={isEndCareModalOpen}
        onClose={() => setIsEndCareModalOpen(false)}
        onSubmit={handleEndCareSubmit}
        isLoading={false}
        reservation={reservation}
        hotels={hotel ? [hotel] : []}
        operateurs={operateur ? [operateur] : []}
        templates={templates}
      />
    </div>
  );
} 
