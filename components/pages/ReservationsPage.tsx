import { useState, useEffect } from 'react';
import ReservationsCalendar from '../features/ReservationsCalendar';
import ReservationsTable from '../features/ReservationsTable';
import ReservationsAvailability from '../features/ReservationsAvailability';
import ReservationsDashboard from '../features/ReservationsDashboard';
import ReservationDetailPage from './ReservationDetailPage';
import AvailabilitySearchPage from './AvailabilitySearchPage';
import { ProlongationModal, EndCareModal } from '../modals/Modals';
import NewReservationModal from '../modals/NewReservationModal';

import { 
  CalendarDays, 
  Eye, 
  List,
  CheckCircle,
  Search
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
    statut: "confirmed", // Updated to match database enum
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
    statut: "pending", // Updated to match database enum
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
    statut: "completed", // Updated to match database enum
    prescripteur: "Croix-Rouge",
    prix: 180,
    duree: 2,
    usagerDetails: { id: 3, nom: "Durand", prenom: "Pierre", telephone: "0555666777", email: "pierre.durand@email.com" },
    hotelDetails: { id: 3, nom: "Hôtel des Alpes", adresse: "789 Rue de la Montagne", ville: "Grenoble" },
    chambreDetails: { id: 3, nom: "Leroy", prenom: "Claire", organisation: "Croix-Rouge" },
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
  activeSubTab = 'reservations-search'
}: ReservationsPageProps) {
  // État initial basé sur activeSubTab pour éviter les problèmes d'hydratation
  const [activeTab, setActiveTab] = useState(() => {
    switch (activeSubTab) {
      case 'reservations-search':
        return 'availability-search';
      case 'reservations-disponibilite':
        return 'availability-search';
      case 'reservations-liste':
        return 'reservations-all';
      case 'reservations-calendrier':
        return 'reservations-calendar';
      default:
        return 'availability-search';
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

  // Charger les données au montage du composant - seulement côté client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadReservations();
      loadProcessus();
    }
  }, []);

  // Synchronisation avec hydratation-safe - seulement côté client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      switch (activeSubTab) {
        case 'reservations-search':
          setActiveTab('availability-search');
          break;
        case 'reservations-disponibilite':
          setActiveTab('availability-search');
          break;
        case 'reservations-liste':
          setActiveTab('reservations-all');
          break;
        case 'reservations-calendrier':
          setActiveTab('reservations-calendar');
          break;
        default:
          setActiveTab('availability-search');
      }
    }
  }, [activeSubTab]);

  const loadReservations = async () => {
    try {
      console.log('🔍 [DEBUG] Starting loadReservations function');
      setLoading(true);
      setError(null);
      setUseFallbackData(false);
      
      // Vérifier d'abord si Supabase est accessible
      console.log('🔍 [DEBUG] Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('reservations')
        .select('id')
        .limit(1);

      console.log('🔍 [DEBUG] Test query result:', { testData, testError });

      if (testError) {
        console.error('❌ [DEBUG] Erreur de connexion Supabase:', testError);
        console.log('🔍 [DEBUG] Test error details:', {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code
        });
        setError(`Erreur de connexion: ${testError.message}`);
        // Force utilisation des vraies données, pas de fallback
        setUseFallbackData(false);
        setReservations([]);
        setLoading(false);
        return;
      }

      console.log('✅ [DEBUG] Supabase connection successful, executing main query...');
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          usagers:usager_id(id, nom, prenom, telephone, email),
          hotels:hotel_id(id, nom, adresse, ville),
          rooms:chambre_id(id, numero, bed_type, prix)
        `)
        .order('date_arrivee', { ascending: false });

      console.log('🔍 [DEBUG] Main query result:', { dataLength: data?.length, error });

      if (error) {
        console.error('❌ [DEBUG] Erreur lors du chargement des réservations:', error);
        console.log('🔍 [DEBUG] Main query error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setError(`Erreur de chargement: ${error.message}`);
        // Force utilisation des vraies données, pas de fallback
        setUseFallbackData(false);
        setReservations([]);
        setLoading(false);
        return;
      }

      console.log('✅ [DEBUG] Main query successful, transforming data...');
      console.log('🔍 [DEBUG] Raw data sample:', data?.[0]);

      // Transformer les données pour correspondre au format attendu
      const transformedReservations: ReservationWithDetails[] = data?.map(reservation => ({
        id: reservation.id,
        usager: reservation.usagers ? `${reservation.usagers.prenom} ${reservation.usagers.nom}` : 'Usager non spécifié',
        chambre: reservation.rooms?.numero || 'Chambre non spécifiée',
        hotel: reservation.hotels?.nom || 'Hôtel non spécifié',
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
        // Données supplémentaires pour les détails
        usagerDetails: reservation.usagers ? { 
          id: reservation.usagers.id, 
          nom: reservation.usagers.nom, 
          prenom: reservation.usagers.prenom,
          telephone: reservation.usagers.telephone || '',
          email: reservation.usagers.email || ''
        } : undefined,
        hotelDetails: reservation.hotels ? { 
          id: reservation.hotels.id, 
          nom: reservation.hotels.nom, 
          adresse: reservation.hotels.adresse || '', 
          ville: reservation.hotels.ville || '' 
        } : undefined,
        chambreDetails: reservation.rooms ? { 
          id: reservation.rooms.id, 
          numero: reservation.rooms.numero, 
          type: reservation.rooms.bed_type || '' 
        } : undefined,
        operateurDetails: reservation.operateur_id ? {
          id: reservation.operateur_id,
          nom: 'Opérateur',
          prenom: 'Non spécifié',
          organisation: ''
        } : undefined
      })) || [];

      console.log('✅ [DEBUG] Data transformation completed, setting reservations...');
      console.log('🔍 [DEBUG] Transformed reservations count:', transformedReservations.length);
      console.log('🔍 [DEBUG] Transformed data sample:', transformedReservations[0]);
      
      setReservations(transformedReservations);
      setUseFallbackData(false);
      console.log('✅ [DEBUG] loadReservations completed successfully with real data');
      console.log('✅ [DEBUG] Fallback data is DISABLED - using real database data');
    } catch (err) {
      console.error('💥 [DEBUG] Exception lors du chargement des réservations:', err);
      console.log('🔍 [DEBUG] Exception details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      setError(err instanceof Error ? err.message : 'Erreur inconnue lors du chargement');
      // Force utilisation des vraies données, pas de fallback
      setUseFallbackData(false);
      setReservations([]);
      console.log('❌ [DEBUG] Aucune réservation chargée suite à l\'exception');
    } finally {
      setLoading(false);
      console.log('🔍 [DEBUG] loadReservations function completed');
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
          {/* Banner de mode démonstration */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Mode démonstration - Données de test
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>La connexion à la base de données n'est pas disponible. Les données affichées sont des exemples pour la démonstration (3 réservations de test).</p>
                  <p className="mt-1 font-semibold">Erreur: {error || 'Connexion Supabase échouée'}</p>
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

          {renderMainContent()}
        </div>
      );
    }

    return renderMainContent();
  };

  const renderMainContent = () => {
    // Afficher le sélecteur de vue pour les tabs principaux
    const showTabSelector = ['reservations-calendar', 'availability-search', 'reservations-all'].includes(activeTab);

    return (
      <div className="space-y-4">
        {/* Sélecteur de vue */}
        {showTabSelector && (
          <div className="bg-white rounded-lg shadow-sm p-1 inline-flex">
            <button
              onClick={() => setActiveTab('availability-search')}
              className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-2 text-sm ${
                activeTab === 'availability-search'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Search className="w-4 h-4" />
              Disponibilité
            </button>
            <button
              onClick={() => setActiveTab('reservations-calendar')}
              className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-2 text-sm ${
                activeTab === 'reservations-calendar'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Calendrier
            </button>
            <button
              onClick={() => setActiveTab('reservations-all')}
              className={`px-3 py-2 rounded-md font-medium transition-colors flex items-center gap-2 text-sm ${
                activeTab === 'reservations-all'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <List className="w-4 h-4" />
              Réservations
            </button>
          </div>
        )}

        {/* Contenu selon l'onglet actif */}
        {renderTabContent()}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'availability-search':
        return (
          <div>
            <AvailabilitySearchPage 
              selectedHotelId={hotels.find(h => h.nom === selectedHotel)?.id}
              onRoomSelect={(room, criteria) => {
                console.log('Room selected from availability:', room, criteria);
                // Gérer la sélection de chambre si nécessaire
              }}
            />
          </div>
        );

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
              onCancelReservation={handleCancelReservation}
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
      console.log('🔄 [DEBUG] Starting confirmation for reservation:', reservation.id);
      
      // Mise à jour optimiste de l'état local pour un feedback immédiat
      console.log('⚡ [DEBUG] Applying optimistic update for confirmation...');
      setReservations(prev => {
        const updated = prev.map(r => 
          r.id === reservation.id ? { ...r, statut: 'confirmed' } : r
        );
        console.log('📊 [DEBUG] Optimistic confirmation applied, new status:', updated.find(r => r.id === reservation.id)?.statut);
        return updated;
      });
      
      if (!useFallbackData) {
        console.log('🔄 [DEBUG] Updating reservation status to confirmed in database...');
        const { data, error } = await supabase
          .from('reservations')
          .update({ statut: 'confirmed' })
          .eq('id', reservation.id)
          .select();

        if (error) {
          console.error('❌ [DEBUG] Database confirmation failed:', error);
          // Rollback optimistic update on error
          setReservations(prev => prev.map(r => 
            r.id === reservation.id ? { ...r, statut: reservation.statut } : r
          ));
          throw error;
        }

        console.log('✅ [DEBUG] Database confirmation successful:', data);
        console.log('✅ [DEBUG] Optimistic update is consistent with database, no reload needed');
      }
      
      console.log('✅ [DEBUG] Confirmation completed successfully');
    } catch (error) {
      console.error('❌ [DEBUG] Error during confirmation:', error);
      alert(`Erreur lors de la confirmation: ${error.message || 'Erreur inconnue'}`);
    }
  };

  const handleCancelReservation = async (reservation: ReservationWithDetails) => {
    try {
      console.log('🔄 [DEBUG] Starting cancellation for reservation:', reservation.id);
      console.log('📊 [DEBUG] Reservations count before cancellation:', reservations.length);
      
      // Mise à jour optimiste de l'état local pour un feedback immédiat
      console.log('⚡ [DEBUG] Applying optimistic update...');
      setReservations(prev => {
        const updated = prev.map(r => 
          r.id === reservation.id ? { ...r, statut: 'cancelled' } : r
        );
        console.log('📊 [DEBUG] Optimistic update applied, cancelled reservation:', updated.find(r => r.id === reservation.id)?.statut);
        return updated;
      });

      if (!useFallbackData) {
        console.log('🔄 [DEBUG] Updating reservation status to cancelled in database...');
        const { data, error } = await supabase
          .from('reservations')
          .update({ statut: 'cancelled' })
          .eq('id', reservation.id)
          .select();

        if (error) {
          console.error('❌ [DEBUG] Database update failed:', error);
          // Rollback optimistic update on error
          console.log('🔄 [DEBUG] Rolling back optimistic update due to error...');
          setReservations(prev => prev.map(r => 
            r.id === reservation.id ? { ...r, statut: reservation.statut } : r
          ));
          throw error;
        }

        console.log('✅ [DEBUG] Database update successful:', data);
        console.log('✅ [DEBUG] Optimistic update is consistent with database, no reload needed');
      } else {
        console.log('⚠️ [DEBUG] Running in fallback mode - optimistic update is final');
      }

      console.log('✅ [DEBUG] Cancellation completed successfully');
    } catch (error) {
      console.error('❌ [DEBUG] Error during cancellation:', error);
      alert(`Erreur lors de l'annulation: ${error.message || 'Erreur inconnue'}`);
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
