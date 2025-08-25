import { useState, useEffect } from 'react';
import ReservationsCalendar from '../features/ReservationsCalendar';
import ReservationsTable from '../features/ReservationsTable';
import ReservationsAvailability from '../features/ReservationsAvailability';
import ReservationsDashboard from '../features/ReservationsDashboard';
import ReservationDetailPage from './ReservationDetailPage';
import { ProlongationModal, EndCareModal } from '../modals/Modals';
import NewReservationModal from '../modals/NewReservationModal';

import { 
  CalendarDays, 
  Eye, 
  List,
  CheckCircle
} from 'lucide-react';
import { Reservation, ProcessusReservation, Hotel, DocumentTemplate, OperateurSocial } from '../../types';
import { supabase } from '../../lib/supabase';

interface ReservationsPageProps {
  hotels: Hotel[];
  operateurs: OperateurSocial[];
  templates: DocumentTemplate[];
  selectedHotel?: string; // Nom de l'hôtel sélectionné
  onReservationSelect?: (reservation: Reservation) => void;
  activeSubTab?: string; // Sous-onglet actif
}

// Interface étendue pour les réservations avec détails
interface ReservationWithDetails extends Reservation {
  usagerDetails?: {
    id: number;
    nom: string;
    prenom: string;
    telephone?: string;
    email?: string;
  };
  hotelDetails?: {
    id: number;
    nom: string;
    adresse: string;
    ville: string;
  };
  chambreDetails?: {
    id: number;
    numero: string;
    type: string;
  };
  operateurDetails?: {
    id: number;
    nom: string;
    prenom: string;
    organisation: string;
  };
  notes?: string;
}

// Données de fallback pour le développement
const fallbackReservations: ReservationWithDetails[] = [
  {
    id: 1,
    usager: "Jean Dupont",
    chambre: "101",
    hotel: "Hôtel Central",
    dateArrivee: "2024-01-15",
    dateDepart: "2024-01-20",
    statut: "CONFIRMEE",
    prescripteur: "Association Solidarité",
    prix: 450,
    duree: 5,
    usagerDetails: { id: 1, nom: "Dupont", prenom: "Jean", telephone: "0123456789", email: "jean.dupont@email.com" },
    hotelDetails: { id: 1, nom: "Hôtel Central", adresse: "123 Rue de la Paix", ville: "Paris" },
    chambreDetails: { id: 1, numero: "101", type: "Simple" },
    operateurDetails: { id: 1, nom: "Martin", prenom: "Sophie", organisation: "Association Solidarité" },
    notes: "Réservation confirmée"
  },
  {
    id: 2,
    usager: "Marie Martin",
    chambre: "205",
    hotel: "Hôtel du Parc",
    dateArrivee: "2024-01-18",
    dateDepart: "2024-01-25",
    statut: "EN_COURS",
    prescripteur: "CCAS",
    prix: 630,
    duree: 7,
    usagerDetails: { id: 2, nom: "Martin", prenom: "Marie", telephone: "0987654321", email: "marie.martin@email.com" },
    hotelDetails: { id: 2, nom: "Hôtel du Parc", adresse: "456 Avenue des Fleurs", ville: "Lyon" },
    chambreDetails: { id: 2, numero: "205", type: "Double" },
    operateurDetails: { id: 2, nom: "Dubois", prenom: "Pierre", organisation: "CCAS" },
    notes: "En attente de confirmation"
  },
  {
    id: 3,
    usager: "Pierre Durand",
    chambre: "302",
    hotel: "Hôtel des Alpes",
    dateArrivee: "2024-01-20",
    dateDepart: "2024-01-22",
    statut: "TERMINEE",
    prescripteur: "Croix-Rouge",
    prix: 180,
    duree: 2,
    usagerDetails: { id: 3, nom: "Durand", prenom: "Pierre", telephone: "0555666777", email: "pierre.durand@email.com" },
    hotelDetails: { id: 3, nom: "Hôtel des Alpes", adresse: "789 Rue de la Montagne", ville: "Grenoble" },
    chambreDetails: { id: 3, numero: "302", type: "Simple" },
    operateurDetails: { id: 3, nom: "Leroy", prenom: "Claire", organisation: "Croix-Rouge" },
    notes: "Séjour terminé"
  }
];

const fallbackProcessus: ProcessusReservation[] = [
  {
    id: 1,
    reservationId: 1,
    statut: "termine",
    dateDebut: "2024-01-15",
    dateFin: "2024-01-20",
    dureeEstimee: 5,
    priorite: "normale",
    etapes: {
      bonHebergement: {
        statut: "valide",
        dateCreation: "2024-01-10",
        dateValidation: "2024-01-12",
        numero: "BH-2024-001",
        validateur: "Admin",
        commentaires: "Bon validé"
      },
      bonCommande: {
        statut: "valide",
        dateCreation: "2024-01-12",
        dateValidation: "2024-01-13",
        numero: "BC-2024-001",
        validateur: "Manager",
        montant: 450,
        commentaires: "Commande validée"
      },
      facture: {
        statut: "payee",
        dateCreation: "2024-01-20",
        dateEnvoi: "2024-01-20",
        datePaiement: "2024-01-22",
        numero: "FAC-2024-001",
        montant: 450,
        montantPaye: 450,
        commentaires: "Facture payée"
      }
    }
  }
];

export default function ReservationsPage({ 
  hotels, 
  operateurs,
  templates,
  selectedHotel,
  onReservationSelect,
  activeSubTab = 'reservations-disponibilite'
}: ReservationsPageProps) {
  const [activeTab, setActiveTab] = useState(() => {
    // Mapper les sous-onglets du menu principal vers les onglets internes
    switch (activeSubTab) {
      case 'reservations-disponibilite':
        return 'reservations-availability';
      case 'reservations-liste':
        return 'reservations-all';
      case 'reservations-calendrier':
        return 'reservations-calendar';
      default:
        return 'reservations-availability';
    }
  });
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [processus, setProcessus] = useState<ProcessusReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallbackData, setUseFallbackData] = useState(false);
  
  const [isProlongationModalOpen, setIsProlongationModalOpen] = useState(false);
  const [selectedReservationForProlongation, setSelectedReservationForProlongation] = useState<ReservationWithDetails | null>(null);
  const [isEndCareModalOpen, setIsEndCareModalOpen] = useState(false);
  const [selectedReservationForEndCare, setSelectedReservationForEndCare] = useState<ReservationWithDetails | null>(null);
  const [selectedReservationForDetail, setSelectedReservationForDetail] = useState<ReservationWithDetails | null>(null);
  const [isNewReservationModalOpen, setIsNewReservationModalOpen] = useState(false);
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);

  // Charger les données au montage du composant
  useEffect(() => {
    loadReservations();
    loadProcessus();
  }, []);

  // Synchroniser l'onglet actif quand activeSubTab change
  useEffect(() => {
    switch (activeSubTab) {
      case 'reservations-disponibilite':
        setActiveTab('reservations-availability');
        break;
      case 'reservations-liste':
        setActiveTab('reservations-all');
        break;
      case 'reservations-calendrier':
        setActiveTab('reservations-calendar');
        break;
      default:
        setActiveTab('reservations-availability');
    }
  }, [activeSubTab]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      setUseFallbackData(false);
      
      // Vérifier d'abord si Supabase est accessible
      const { data: testData, error: testError } = await supabase
        .from('reservations')
        .select('id')
        .limit(1);

      if (testError) {
        console.warn('Supabase non accessible, utilisation des données de fallback:', testError);
        setUseFallbackData(true);
        setReservations(fallbackReservations);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('date_arrivee', { ascending: false });

      if (error) {
        console.warn('Erreur Supabase, utilisation des données de fallback:', error);
        setUseFallbackData(true);
        setReservations(fallbackReservations);
        setLoading(false);
        return;
      }

      // Transformer les données pour correspondre au format attendu
      const transformedReservations: ReservationWithDetails[] = data?.map(reservation => ({
        id: reservation.id,
        usager: reservation.usagerDetails?.nom || 'Usager non spécifié',
        chambre: reservation.chambreDetails?.numero || 'Chambre non spécifiée',
        hotel: reservation.hotelDetails?.nom || 'Hôtel non spécifié',
        dateArrivee: reservation.date_arrivee,
        dateDepart: reservation.date_depart,
        usager_id: reservation.usager_id,
        chambre_id: reservation.chambre_id,
        hotel_id: reservation.hotel_id,
        date_arrivee: reservation.date_arrivee,
        date_depart: reservation.date_depart,
        statut: reservation.statut,
        prescripteur: reservation.prescripteur,
        prix: reservation.prix,
        duree: reservation.duree,
        operateur_id: reservation.operateur_id,
        notes: reservation.notes,
        created_at: reservation.created_at,
        updated_at: reservation.updated_at,
        // Données supplémentaires pour les détails (à récupérer séparément si nécessaire)
        usagerDetails: { 
          id: reservation.usager_id, 
          nom: 'Usager', 
          prenom: 'Non spécifié',
          telephone: '',
          email: ''
        },
        hotelDetails: { 
          id: reservation.hotel_id, 
          nom: 'Hôtel', 
          adresse: '', 
          ville: '' 
        },
        chambreDetails: { 
          id: reservation.chambre_id, 
          numero: 'Chambre', 
          type: '' 
        },
        operateurDetails: reservation.operateur_id ? {
          id: reservation.operateur_id,
          nom: 'Opérateur',
          prenom: 'Non spécifié',
          organisation: ''
        } : undefined
      })) || [];

      setReservations(transformedReservations);
    } catch (err) {
      console.warn('Exception lors du chargement, utilisation des données de fallback:', err);
      setUseFallbackData(true);
      setReservations(fallbackReservations);
    } finally {
      setLoading(false);
    }
  };

  const loadProcessus = async () => {
    try {
      if (useFallbackData) {
        setProcessus(fallbackProcessus);
        return;
      }

      const { data, error } = await supabase
        .from('processus_reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erreur lors du chargement des processus, utilisation des données de fallback:', error);
        setProcessus(fallbackProcessus);
        return;
      }

      setProcessus(data || []);
    } catch (err) {
      console.warn('Exception lors du chargement des processus, utilisation des données de fallback:', err);
      setProcessus(fallbackProcessus);
    }
  };



  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement des réservations...</p>
          </div>
        </div>
      );
    }

    // Afficher un avertissement si on utilise les données de fallback
    if (useFallbackData) {
      return (
        <div className="space-y-6">
          {/* Banner de mode démonstration masqué */}
          {/*
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Mode démonstration
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>La connexion à la base de données n'est pas disponible. Les données affichées sont des exemples pour la démonstration.</p>
                </div>
                <div className="mt-4">
                  <button 
                    onClick={loadReservations}
                    className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm hover:bg-yellow-200"
                  >
                    Réessayer la connexion
                  </button>
                </div>
              </div>
            </div>
          </div>
          */}

          {renderMainContent()}
        </div>
      );
    }

    return renderMainContent();
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case 'reservations-calendar':
        return <ReservationsCalendar reservations={reservations} hotels={hotels} selectedHotel={selectedHotel} />;

      case 'reservations-availability':
        return (
          <div>
            <ReservationsAvailability 
              reservations={reservations} 
              hotels={hotels} 
              selectedHotel={selectedHotel}
              operateurs={operateurs}
            />
          </div>
        );

      case 'reservations-all':
        return (
          <div>
            <ReservationsTable
              reservations={reservations}
              processus={processus}
              hotels={hotels}
              templates={templates}
              onReservationSelect={handleReservationSelect}
              onProlongReservation={handleProlongReservation}
              onEndCare={handleEndCare}
              onUpdateReservation={handleUpdateReservation}
            />
            {isNewReservationModalOpen && (
              <NewReservationModal
                isOpen={isNewReservationModalOpen}
                onClose={() => setIsNewReservationModalOpen(false)}
                onSubmit={async (reservationData) => {
                  // Création de la réservation dans Supabase
                  if (!useFallbackData) {
                    const { error } = await supabase.from('reservations').insert([reservationData]);
                    if (!error && typeof handleCreateReservationSuccess === 'function') {
                      await handleCreateReservationSuccess();
                    }
                  }
                }}
                onSuccess={handleCreateReservationSuccess}
                hotels={hotels}
                operateurs={operateurs}
              />
            )}
          </div>
        );
      default:
        return (
          <ReservationsDashboard 
            reservations={reservations}
            hotels={hotels}
            operateurs={operateurs}
            onReservationSelect={handleReservationSelect}
            onNewReservation={handleNewReservation}
            onEditReservation={handleEditReservation}
            onDeleteReservation={handleDeleteReservation}
            onConfirmReservation={handleConfirmReservation}
            onCancelReservation={handleCancelReservation}
            onViewDetails={handleViewDetails}
            onGenerateReport={handleGenerateReport}
            onCheckAvailability={handleCheckAvailability}
          />
        );
    }
  };

  const getHotelForReservation = (reservation: ReservationWithDetails): Hotel | undefined => {
    return hotels.find(hotel => hotel.nom === reservation.hotel);
  };

  const getOperateurForReservation = (reservation: ReservationWithDetails): OperateurSocial | undefined => {
    return operateurs.find(operateur => operateur.organisation === reservation.prescripteur);
  };

  const handleProlongReservation = (reservation: ReservationWithDetails) => {
    setSelectedReservationForProlongation(reservation);
    setIsProlongationModalOpen(true);
  };

  const handleProlongationSubmit = async (prolongationData: any) => {
    try {
      console.log('Prolongation soumise:', prolongationData);
      
      if (!useFallbackData) {
        // TODO: Implémenter la logique de prolongation avec Supabase
      }
      
      setIsProlongationModalOpen(false);
      setSelectedReservationForProlongation(null);
      
      // Recharger les données
      await loadReservations();
    } catch (error) {
      console.error('Erreur lors de la prolongation:', error);
    }
  };

  const handleEndCare = (reservation: ReservationWithDetails) => {
    setSelectedReservationForEndCare(reservation);
    setIsEndCareModalOpen(true);
  };

  const handleEndCareSubmit = async (endCareData: any) => {
    try {
      console.log('Fin de prise en charge soumise:', endCareData);
      
      if (!useFallbackData) {
        // TODO: Implémenter la logique de fin de prise en charge avec Supabase
      }
      
      setIsEndCareModalOpen(false);
      setSelectedReservationForEndCare(null);
      
      // Recharger les données
      await loadReservations();
    } catch (error) {
      console.error('Erreur lors de la fin de prise en charge:', error);
    }
  };

  const handleReservationSelect = (reservation: ReservationWithDetails) => {
    setSelectedReservationForDetail(reservation);
    if (onReservationSelect) {
      onReservationSelect(reservation);
    }
  };

  const handleUpdateReservation = async (updatedReservation: ReservationWithDetails) => {
    try {
      console.log('Réservation mise à jour:', updatedReservation);
      
      if (!useFallbackData) {
        // TODO: Implémenter la logique de mise à jour avec Supabase
      }
      
      setSelectedReservationForDetail(null);
      
      // Recharger les données
      await loadReservations();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleDeleteReservation = async (reservation: ReservationWithDetails) => {
    try {
      console.log('Réservation supprimée:', reservation);
      
      if (!useFallbackData) {
        // TODO: Implémenter la logique de suppression avec Supabase
      }
      
      setSelectedReservationForDetail(null);
      
      // Recharger les données
      await loadReservations();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleNewReservation = () => {
    console.log('Création d\'une nouvelle réservation');
    setIsNewReservationModalOpen(true);
  };

  const handleCreateReservationSuccess = async () => {
    console.log('Réservation créée avec succès');
    
    // Recharger les données pour afficher la nouvelle réservation
    await loadReservations();
    await loadProcessus();
    
    // Naviguer vers la liste des réservations
    setActiveTab('reservations-all');
  };

  const handleEditReservation = (reservation: ReservationWithDetails) => {
    console.log('Modification de la réservation:', reservation);
    setSelectedReservationForDetail(reservation);
  };

  const handleConfirmReservation = async (reservation: ReservationWithDetails) => {
    try {
      console.log('Confirmation de la réservation:', reservation);
      
      if (!useFallbackData) {
        const { error } = await supabase
          .from('reservations')
          .update({ statut: 'CONFIRMEE' })
          .eq('id', reservation.id);

        if (error) {
          throw error;
        }
      }

      // Recharger les données
      await loadReservations();
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
    }
  };

  const handleCancelReservation = async (reservation: ReservationWithDetails) => {
    try {
      console.log('Annulation de la réservation:', reservation);
      
      if (!useFallbackData) {
        const { error } = await supabase
          .from('reservations')
          .update({ statut: 'ANNULEE' })
          .eq('id', reservation.id);

        if (error) {
          throw error;
        }
      }

      // Recharger les données
      await loadReservations();
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
    }
  };

  const handleViewDetails = (reservation: ReservationWithDetails) => {
    console.log('Affichage des détails de la réservation:', reservation);
    setSelectedReservationForDetail(reservation);
  };

  const handleGenerateReport = () => {
    console.log('Génération de rapport');
    // TODO: Implémenter la génération de rapport
  };

  const handleCheckAvailability = () => {
    console.log('Vérification de disponibilité');
    // TODO: Implémenter la vérification de disponibilité
  };

  // Afficher la page de détail si une réservation est sélectionnée
  if (selectedReservationForDetail) {
    const hotel = getHotelForReservation(selectedReservationForDetail);
    const operateur = getOperateurForReservation(selectedReservationForDetail);
    const processusReservation = processus.find(p => p.reservationId === selectedReservationForDetail.id);

    return (
      <ReservationDetailPage
        reservation={selectedReservationForDetail}
        hotel={hotel}
        operateur={operateur}
        templates={templates}
        processus={processusReservation}
        onUpdateReservation={handleUpdateReservation}
        onDeleteReservation={(id) => handleDeleteReservation(reservations.find(r => r.id === id)!)}
      />
    );
  }

  return (
    <div className="px-6">
      {renderContent()}

      {/* Modal de prolongation */}
      {selectedReservationForProlongation && (
        <ProlongationModal
          isOpen={isProlongationModalOpen}
          onClose={() => {
            setIsProlongationModalOpen(false);
            setSelectedReservationForProlongation(null);
          }}
          onSubmit={handleProlongationSubmit}
          isLoading={false}
          reservation={selectedReservationForProlongation}
          hotels={hotels}
          operateurs={operateurs}
          templates={templates}
        />
      )}

      {/* Modal de fin de prise en charge */}
      {selectedReservationForEndCare && (
        <EndCareModal
          isOpen={isEndCareModalOpen}
          onClose={() => {
            setIsEndCareModalOpen(false);
            setSelectedReservationForEndCare(null);
          }}
          onSubmit={handleEndCareSubmit}
          isLoading={false}
          reservation={selectedReservationForEndCare}
          hotels={hotels}
          operateurs={operateurs}
          templates={templates}
        />
      )}

      {/* Modal de nouvelle réservation */}
      <NewReservationModal
        isOpen={isNewReservationModalOpen}
        onClose={() => setIsNewReservationModalOpen(false)}
        onSubmit={async (reservationData) => {
          // Création de la réservation dans Supabase
          if (!useFallbackData) {
            const { error } = await supabase.from('reservations').insert([reservationData]);
            if (!error && typeof handleCreateReservationSuccess === 'function') {
              await handleCreateReservationSuccess();
            }
          }
        }}
        onSuccess={handleCreateReservationSuccess}
        hotels={hotels}
        operateurs={operateurs}
      />
    </div>
  );
} 
