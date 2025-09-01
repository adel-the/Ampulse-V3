"use client";

import { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { EstablishmentProvider, useEstablishment } from '../contexts/EstablishmentContext';

import ReservationsPage from '../components/pages/ReservationsPage';
import AvailabilitySearchPage from '../components/pages/AvailabilitySearchPage';

import GestionPage from '../components/pages/GestionPage';
import GestionEtablissementPage from '../components/pages/GestionEtablissementPage';

import OperateursTable from '../components/features/OperateursTable';
import ChambresPage from '../components/pages/ChambresPage';
import ClientsSection from '../components/features/ClientsSection';

import ComptabilitePage from '../components/pages/ComptabilitePage';

import ParametresPage from '../components/pages/ParametresPage';

import ReportsPage from '../components/pages/ReportsPage';
import MaintenanceManagement from '../components/features/MaintenanceManagement';
import { 
  generateHotels, 
  generateReservations, 
  generateOperateursSociaux, 
  generateConventionsPrix, 
  generateProcessusReservations,
  generateConversations,
  generateMessages,
  generateUsers,
  generateDocumentTemplates
} from '../utils/dataGenerators';
import { Calendar } from 'lucide-react';
import { Hotel, Reservation, OperateurSocial, ConventionPrix, ProcessusReservation, Message, Conversation, DashboardStats, User, DocumentTemplate } from '../types/index';
import { useNotifications } from '../hooks/useNotifications';
import { supabase } from '../lib/supabase';

function AppContent() {
  const [activeTab, setActiveTab] = useState('reservations');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedHotelId, selectedHotel, setSelectedHotelId, setAvailableHotels } = useEstablishment();
  
  // Données
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [operateurs, setOperateurs] = useState<OperateurSocial[]>([]);
  const [conventions, setConventions] = useState<ConventionPrix[]>([]);
  const [processus, setProcessus] = useState<ProcessusReservation[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);

  // État pour les fonctionnalités activées/désactivées
  const [features, setFeatures] = useState({
    operateursSociaux: true,
    statistiques: true,
    notifications: true
  });

  // Hooks
  const { notifications, addNotification, removeNotification } = useNotifications();

  // Fonctions pour gérer les paramètres
  const handleFeatureToggle = (feature: string, enabled: boolean) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: enabled
    }));
  };

  const handleSaveSettings = () => {
    addNotification('success', 'Paramètres sauvegardés avec succès');
  };

  const handleResetSettings = () => {
    addNotification('info', 'Paramètres réinitialisés');
  };

  const handleReservationSelect = (reservation: Reservation) => {
    addNotification('info', `Réservation sélectionnée : ${reservation.usager}`);
  };

  const handleOperateurSelect = (operateur: OperateurSocial) => {
    addNotification('info', `Opérateur sélectionné : ${operateur.nom} ${operateur.prenom}`);
  };

  const handleSendMessage = (conversationId: number, contenu: string) => {
    addNotification('success', 'Message envoyé avec succès');
  };

  // Fonctions de gestion des utilisateurs
  const handleUserCreate = (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: Math.max(...users.map(u => u.id), 0) + 1 };
    setUsers(prev => [...prev, newUser]);
    addNotification('success', 'Utilisateur créé avec succès');
  };

  const handleUserUpdate = (id: number, updates: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...updates } : user
    ));
    addNotification('success', 'Utilisateur modifié avec succès');
  };

  const handleUserDelete = (id: number) => {
    setUsers(prev => prev.filter(user => user.id !== id));
    addNotification('success', 'Utilisateur supprimé avec succès');
  };

  const handleUserToggleStatus = (id: number) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, statut: user.statut === 'actif' ? 'inactif' : 'actif' } : user
    ));
    addNotification('success', 'Statut utilisateur modifié');
  };

  // Fonctions de gestion des templates de documents
  const handleTemplateCreate = (template: Omit<DocumentTemplate, 'id'>) => {
    const newTemplate = { ...template, id: Math.max(...templates.map(t => t.id), 0) + 1 };
    setTemplates(prev => [...prev, newTemplate]);
    addNotification('success', 'Modèle de document créé avec succès');
  };

  const handleTemplateUpdate = (id: number, updates: Partial<DocumentTemplate>) => {
    setTemplates(prev => prev.map(template => 
      template.id === id ? { ...template, ...updates, dateModification: new Date().toLocaleDateString('fr-FR') } : template
    ));
    addNotification('success', 'Modèle de document modifié avec succès');
  };

  const handleTemplateDelete = (id: number) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
    addNotification('success', 'Modèle de document supprimé avec succès');
  };

  const handleTemplateDuplicate = (id: number) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      const newTemplate = {
        ...template,
        id: Math.max(...templates.map(t => t.id), 0) + 1,
        nom: `${template.nom} (copie)`,
        dateCreation: new Date().toLocaleDateString('fr-FR'),
        dateModification: new Date().toLocaleDateString('fr-FR')
      };
      setTemplates(prev => [...prev, newTemplate]);
      addNotification('success', 'Modèle de document dupliqué avec succès');
    }
  };

  // Chargement des données depuis Supabase
  useEffect(() => {
    const loadDataFromSupabase = async () => {
      setIsLoading(true);
      setError(null);
      
      let transformedHotels: Hotel[] = [];
      let transformedOperateurs: OperateurSocial[] = [];
      
      try {
        // Charger les hôtels depuis Supabase
        const { data: hotelsData, error: hotelsError } = await supabase
          .from('hotels')
          .select('*')
          .order('nom');

        if (hotelsError) {
          // Fallback to generated data if Supabase query fails
          const fallbackHotels = generateHotels();
          setHotels(fallbackHotels);
          setAvailableHotels(fallbackHotels);
          transformedHotels = fallbackHotels;
          
          // Auto-selection will be handled by EstablishmentProvider - DON'T INTERFERE!
          console.log('🏨 APP PAGE: Fallback hotels loaded, selectedHotelId:', selectedHotelId, 'Hotels count:', fallbackHotels.length);
          if (fallbackHotels.length > 0 && !selectedHotelId) {
            const firstHotel = fallbackHotels[0];
            console.log('🏨 APP PAGE: Would show notification for fallback hotel:', firstHotel.nom, '(but selectedHotelId might be restored from localStorage later)');
            // addNotification('info', `Établissement par défaut sélectionné : ${firstHotel.nom}`);
          }
        } else {
          // Transformer les données Supabase pour correspondre au format attendu
          transformedHotels = hotelsData?.map(hotel => ({
            id: hotel.id,
            nom: hotel.nom,
            adresse: hotel.adresse,
            ville: hotel.ville,
            codePostal: hotel.code_postal,
            telephone: hotel.telephone || '',
            email: hotel.email || '',
            gestionnaire: hotel.gestionnaire || 'Non spécifié',
            statut: hotel.statut || 'ACTIF',
            chambresTotal: hotel.chambres_total || 0,
            chambresOccupees: hotel.chambres_occupees || 0,
            tauxOccupation: hotel.taux_occupation || 0
          })) || [];

          setHotels(transformedHotels);
          setAvailableHotels(transformedHotels);
          
          // Auto-selection will be handled by EstablishmentProvider - DON'T INTERFERE!
          console.log('🏨 APP PAGE: Supabase hotels loaded, selectedHotelId:', selectedHotelId, 'Hotels count:', transformedHotels.length);
          if (transformedHotels.length > 0 && !selectedHotelId) {
            const firstHotel = transformedHotels[0];
            console.log('🏨 APP PAGE: Would show notification for supabase hotel:', firstHotel.nom, '(but selectedHotelId might be restored from localStorage later)');
            // addNotification('info', `Établissement par défaut sélectionné : ${firstHotel.nom}`);
          }
        }

        // Charger les opérateurs sociaux depuis Supabase
        const { data: operateursData, error: operateursError } = await supabase
          .from('operateurs_sociaux')
          .select('*')
          .order('nom');

        if (operateursError) {
          // Fallback to generated data if Supabase query fails
          const fallbackOperateurs = generateOperateursSociaux();
          setOperateurs(fallbackOperateurs);
          transformedOperateurs = fallbackOperateurs;
        } else {
          // Transformer les données Supabase pour correspondre au format attendu
          transformedOperateurs = operateursData?.map(operateur => ({
            id: operateur.id,
            nom: operateur.nom,
            prenom: operateur.prenom,
            organisation: operateur.type_organisme,
            telephone: operateur.telephone,
            email: operateur.email,
            statut: operateur.statut,
            specialite: 'Accompagnement global',
            zoneIntervention: operateur.ville,
            nombreReservations: 0,
            dateCreation: operateur.created_at ? new Date(operateur.created_at).toLocaleDateString('fr-FR') : '',
            notes: ''
          })) || [];

          setOperateurs(transformedOperateurs);
        }

        // Utiliser les données de fallback pour les autres tables (à implémenter plus tard)
        setReservations(generateReservations());
        setConventions(generateConventionsPrix(transformedOperateurs, transformedHotels));
        setProcessus(generateProcessusReservations(generateReservations()));
        setConversations(generateConversations(transformedOperateurs));
        setMessages(generateMessages(generateConversations(transformedOperateurs)));
        setUsers(generateUsers(transformedHotels));
        setTemplates(generateDocumentTemplates());
        
        setIsLoading(false);
      } catch (error) {
        // Error occurred while loading data
        setError('Erreur lors du chargement des données');
        setIsLoading(false);
      }
    };

    loadDataFromSupabase();
  }, []);

  // Charger les paramètres au démarrage
  useEffect(() => {
    const savedFeatures = localStorage.getItem('soliReserveFeatures');
    if (savedFeatures) {
      try {
        const parsedFeatures = JSON.parse(savedFeatures);
        setFeatures(parsedFeatures);
      } catch (error) {
        // Error occurred while loading settings
      }
    }
  }, []);

  // Filtrer les données selon l'établissement sélectionné
  const filteredHotels = selectedHotelId ? hotels.filter(h => h.id === selectedHotelId) : hotels;
  const filteredReservations = selectedHotelId ? reservations.filter(r => {
    const hotel = hotels.find(h => h.id === selectedHotelId);
    return hotel && r.hotel === hotel.nom;
  }) : reservations;
  
  // Filtrer les opérateurs selon l'établissement sélectionné (via les conventions)
  const filteredOperateurs = selectedHotelId ? operateurs.filter(operateur => {
    // Vérifier si l'opérateur a des conventions avec l'établissement sélectionné
    const hasConventionWithHotel = conventions.some(convention => 
      convention.operateurId === operateur.id && convention.hotelId === selectedHotelId
    );
    return hasConventionWithHotel;
  }) : operateurs;
  
  // Filtrer les conventions selon l'établissement sélectionné
  const filteredConventions = selectedHotelId ? conventions.filter(convention => 
    convention.hotelId === selectedHotelId
  ) : conventions;
  
  // Filtrer les conversations selon l'établissement sélectionné (via les opérateurs)
  const filteredConversations = selectedHotelId ? conversations.filter(conversation => {
    const operateur = filteredOperateurs.find(op => op.id === conversation.operateurId);
    return operateur !== undefined;
  }) : conversations;

  // Calcul des stats pour Dashboard
  const dashboardStats: DashboardStats = {
    totalHotels: filteredHotels.length,
    activeHotels: filteredHotels.filter(h => h.statut === 'ACTIF').length,
    totalChambres: filteredHotels.reduce((sum, h) => sum + h.chambresTotal, 0),
    chambresOccupees: filteredHotels.reduce((sum, h) => sum + h.chambresOccupees, 0),
    tauxOccupationMoyen: filteredHotels.length > 0 ? Math.round(filteredHotels.reduce((sum, h) => sum + h.tauxOccupation, 0) / filteredHotels.length) : 0,
    reservationsActives: filteredReservations.filter(r => r.statut === 'EN_COURS' || r.statut === 'CONFIRMEE').length,
    revenusMensuel: 12000,
    totalOperateurs: filteredOperateurs.length,
    operateursActifs: filteredOperateurs.filter(o => o.statut === 'actif').length,
  };

  // Rendu du contenu principal
  const renderMainContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement en cours...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'availability-search':
        return (
          <AvailabilitySearchPage
            selectedHotelId={selectedHotelId}
            onRoomSelect={(room, criteria) => {
              addNotification('info', `Chambre ${room.numero} sélectionnée pour réservation`);
              // TODO: Implement reservation creation from selected room
            }}
          />
        );
      case 'reservations':
      case 'reservations-disponibilite':
      case 'reservations-liste':
      case 'reservations-calendrier':
        return (
          <ReservationsPage
            hotels={filteredHotels}
            operateurs={operateurs}
            templates={templates}
            selectedHotel={selectedHotelId ? hotels.find(h => h.id === selectedHotelId)?.nom : undefined}
            onReservationSelect={handleReservationSelect}
            activeSubTab={activeTab}
          />
        );
      case 'chambres':
        return (
          <ChambresPage 
            selectedHotel={selectedHotel} 
            onActionClick={(action) => {
              // Room action triggered
              addNotification('info', `Action chambre: ${action}`);
            }}
          />
        );
      case 'gestion':
        return <GestionPage selectedHotel={selectedHotel} />;

      case 'operateurs':
        if (!features.operateursSociaux) {
          return (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Fonctionnalité désactivée</h2>
              <p className="text-gray-600">La gestion des clients a été désactivée dans les paramètres.</p>
            </div>
          );
        }
        return (
          <OperateursTable
            operateurs={filteredOperateurs}
            onOperateurSelect={handleOperateurSelect}
          />
        );

      case 'gestion-etablissement':
        return <GestionEtablissementPage />;

      case 'analyses-donnees':
        return <ReportsPage hotels={hotels} selectedHotelId={selectedHotelId} />;

      case 'maintenance':
        return (
          <MaintenanceManagement />
        );

      case 'comptabilite':
      case 'comptabilite-journaux':
      case 'comptabilite-facturation-paiements':
      case 'comptabilite-analytique':
      case 'comptabilite-exports':
      case 'comptabilite-tva-taxes':
      case 'comptabilite-clients':
        return (
          <ComptabilitePage 
            hotels={hotels} 
            selectedHotelId={selectedHotelId || undefined}
            activeSubTab={activeTab}
          />
        );

      case 'clients':
        return (
          <div className="space-y-6">
            <ClientsSection />
          </div>
        );

      case 'parametres':
        return (
          <div className="space-y-6">
            <ParametresPage
              features={features}
              users={users}
              templates={templates}
              operateurs={filteredOperateurs}
              reservations={reservations.map(reservation => ({
                id: reservation.id,
                numero: reservation.chambre || '',
                usager: reservation.usager || '',
                hotel: reservation.hotel || ''
              }))}
              agents={users.map(user => ({
                id: user.id,
                nom: user.nom,
                prenom: user.prenom,
                role: user.role || 'utilisateur'
              }))}
              onFeatureToggle={handleFeatureToggle}
              onHotelCreate={(hotel) => {
                const newHotel = { ...hotel, id: Math.max(...hotels.map(h => h.id), 0) + 1 };
                setHotels(prev => [...prev, newHotel]);
                setAvailableHotels([...hotels, newHotel]);
                addNotification('success', 'Établissement créé avec succès');
              }}
              onSaveSettings={handleSaveSettings}
              onResetSettings={handleResetSettings}
              onUserCreate={handleUserCreate}
              onUserUpdate={handleUserUpdate}
              onUserDelete={handleUserDelete}
              onUserToggleStatus={handleUserToggleStatus}
              onTemplateCreate={handleTemplateCreate}
              onTemplateUpdate={handleTemplateUpdate}
              onTemplateDelete={handleTemplateDelete}
              onTemplateDuplicate={handleTemplateDuplicate}
              onOperateurSelect={handleOperateurSelect}
            />
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Onglet en cours de développement</h2>
            <p className="text-gray-600">Cette fonctionnalité sera bientôt disponible.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header notifications={[]} onNotificationClick={() => {}} />
      <div className="flex">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          features={features}
        />
        <main className="flex-1 p-6">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <EstablishmentProvider>
      <AppContent />
    </EstablishmentProvider>
  );
}