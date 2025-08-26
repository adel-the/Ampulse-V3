import { useState, useEffect } from 'react';
import TopBar from '../layout/TopBar';
import { 
  Settings, 
  Building2,
  Plus,
  X,
  Users,
  FileText,
  Bed,
  UserCheck,
  History,
  Wrench
} from 'lucide-react';
import { User, Hotel, DocumentTemplate } from '../../types';
import UsersManagement from '../features/UsersManagement';
import DocumentsManagement from '../features/DocumentsManagement';
import ChambresPage from '../pages/ChambresPage';
import OperateursTable from '../features/OperateursTable';
import ModificationHistory from '../features/ModificationHistory';
import EstablishmentsSection from '../features/EstablishmentsSection';
import { establishmentsApi } from '../../lib/api/establishments';
import { useNotifications } from '../../hooks/useNotifications';
import type { Establishment } from '../../lib/api/establishments';
import RoomsSection from '../features/RoomsSection';
import EquipmentsSection from '../features/EquipmentsSection';
import ClientsSection from '../features/ClientsSection';

interface ParametresPageProps {
  features: {
    operateursSociaux: boolean;
  
    statistiques: boolean;
    notifications: boolean;
  };
  selectedHotel?: number | null;
  hotels?: Array<{ id: number; nom: string }>;
  users?: User[];
  templates?: DocumentTemplate[];
  operateurs?: any[];
  reservations?: Array<{ id: number; numero: string; usager: string; hotel: string }>;
  agents?: Array<{ id: number; nom: string; prenom: string; role: string }>;
  onFeatureToggle: (feature: string, enabled: boolean) => void;
  onHotelSelect: (hotelId: number | null) => void;
  onHotelCreate?: (hotel: Omit<Hotel, 'id'>) => void;
  onSaveSettings: () => void;
  onResetSettings: () => void;
  onUserCreate?: (user: Omit<User, 'id'>) => void;
  onUserUpdate?: (id: number, updates: Partial<User>) => void;
  onUserDelete?: (id: number) => void;
  onUserToggleStatus?: (id: number) => void;
  onTemplateCreate?: (template: Omit<DocumentTemplate, 'id'>) => void;
  onTemplateUpdate?: (id: number, updates: Partial<DocumentTemplate>) => void;
  onTemplateDelete?: (id: number) => void;
  onTemplateDuplicate?: (id: number) => void;
  onOperateurSelect?: (operateur: any) => void;
}

export default function ParametresPage({
  features,
  selectedHotel,
  hotels,
  users,
  templates,
  operateurs,
  reservations = [],
  agents = [],
  onFeatureToggle,
  onHotelSelect,
  onHotelCreate,
  onSaveSettings,
  onResetSettings,
  onUserCreate,
  onUserUpdate,
  onUserDelete,
  onUserToggleStatus,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  onTemplateDuplicate,
  onOperateurSelect
}: ParametresPageProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [showAddHotelForm, setShowAddHotelForm] = useState(false);
  const [newHotel, setNewHotel] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    ville: '',
    codePostal: ''
  });
  
  // Global hotel selector state for Rooms and Equipments sections
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [globalSelectedHotelId, setGlobalSelectedHotelId] = useState<number | null>(null);
  const [loadingEstablishments, setLoadingEstablishments] = useState(true);
  const { addNotification } = useNotifications();

  // Load establishments for global hotel selector
  useEffect(() => {
    loadEstablishments();
  }, []);

  const loadEstablishments = async () => {
    try {
      setLoadingEstablishments(true);
      const response = await establishmentsApi.getEstablishments();
      if (response.success && response.data) {
        setEstablishments(response.data);
        // Auto-select first hotel if available
        if (response.data.length > 0 && !globalSelectedHotelId) {
          setGlobalSelectedHotelId(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des établissements:', error);
      addNotification('error', 'Erreur lors du chargement des établissements');
    } finally {
      setLoadingEstablishments(false);
    }
  };

  const topBarItems = [
    {
      id: 'general',
      label: 'Général',
      icon: <Settings className="h-4 w-4" />
    },
    {
      id: 'etablissement',
      label: 'Établissement',
      icon: <Building2 className="h-4 w-4" />
    },
    {
      id: 'chambres',
      label: 'Chambres',
      icon: <Bed className="h-4 w-4" />
    },
    {
      id: 'equipements',
      label: 'Équipements',
      icon: <Wrench className="h-4 w-4" />
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: <UserCheck className="h-4 w-4" />
    },
    {
      id: 'utilisateurs',
      label: 'Utilisateurs',
      icon: <Users className="h-4 w-4" />
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'historique',
      label: 'Historique',
      icon: <History className="h-4 w-4" />
    }
  ];

  const handleAddHotel = () => {
    if (newHotel.nom.trim() && onHotelCreate) {
      onHotelCreate({
        ...newHotel,
        gestionnaire: '',
        statut: 'actif',
        chambresTotal: 0,
        chambresOccupees: 0,
        tauxOccupation: 0
      });
      setNewHotel({
        nom: '',
        adresse: '',
        telephone: '',
        email: '',
        ville: '',
        codePostal: ''
      });
      setShowAddHotelForm(false);
    }
  };

  const handleCancelAddHotel = () => {
    setNewHotel({
      nom: '',
      adresse: '',
      telephone: '',
      email: '',
      ville: '',
      codePostal: ''
    });
    setShowAddHotelForm(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Paramètres généraux</h2>
              <p className="text-gray-600 mb-6">Configurez les fonctionnalités principales de votre application</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Fonctionnalités principales</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium">Gestion des clients</div>
                      <div className="text-sm text-gray-600">Associations, entreprises et particuliers</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        features.operateursSociaux ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {features.operateursSociaux ? 'Activé' : 'Désactivé'}
                      </span>
                      <button
                        onClick={() => onFeatureToggle('operateursSociaux', !features.operateursSociaux)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {features.operateursSociaux ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </div>
                  

                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Fonctionnalités avancées</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium">Statistiques</div>
                      <div className="text-sm text-gray-600">Tableaux de bord et rapports</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        features.statistiques ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {features.statistiques ? 'Activé' : 'Désactivé'}
                      </span>
                      <button
                        onClick={() => onFeatureToggle('statistiques', !features.statistiques)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {features.statistiques ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium">Notifications</div>
                      <div className="text-sm text-gray-600">Alertes en temps réel</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        features.notifications ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {features.notifications ? 'Activé' : 'Désactivé'}
                      </span>
                      <button
                        onClick={() => onFeatureToggle('notifications', !features.notifications)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {features.notifications ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'etablissement':
        return (
          <EstablishmentsSection 
            currentSelectedId={selectedHotel}
            onEstablishmentSelect={(establishment) => {
              // Update the global selected hotel when user selects an establishment
              onHotelSelect(establishment.id);
            }}
          />
        );
         
               case 'chambres':
          return <RoomsSection selectedHotelId={globalSelectedHotelId} />;
         
               case 'equipements':
          return <EquipmentsSection selectedHotelId={globalSelectedHotelId} />;
         
               case 'clients':
          return <ClientsSection />;
         
               case 'utilisateurs':
          return (
            <UsersManagement
              users={users || []}
              hotels={hotels || []}
              onUserCreate={onUserCreate || (() => {})}
              onUserUpdate={onUserUpdate || (() => {})}
              onUserDelete={onUserDelete || (() => {})}
              onUserToggleStatus={onUserToggleStatus || (() => {})}
            />
          );
         
                     case 'documents':
        return (
          <DocumentsManagement
            templates={templates || []}
            onTemplateCreate={onTemplateCreate || (() => {})}
            onTemplateUpdate={onTemplateUpdate || (() => {})}
            onTemplateDelete={onTemplateDelete || (() => {})}
            onTemplateDuplicate={onTemplateDuplicate || (() => {})}
          />
        );
      
      case 'historique':
        return (
          <div className="space-y-6">
            <ModificationHistory 
              reservations={reservations}
              agents={agents}
            />
          </div>
        );
      
      default:
        return <div>Page non trouvée</div>;
    }
  };

  // Render hotel selector for Rooms and Equipments tabs
  const renderHotelSelector = () => {
    if (!['chambres', 'equipements'].includes(activeTab) || loadingEstablishments) {
      return null;
    }

    if (establishments.length === 0) {
      return (
        <div className="text-sm text-gray-500">
          Aucun établissement disponible
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Hôtel :</label>
        <select
          value={globalSelectedHotelId || ''}
          onChange={(e) => setGlobalSelectedHotelId(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {establishments.map(hotel => (
            <option key={hotel.id} value={hotel.id}>
              {hotel.nom} - {hotel.ville}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div>
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-1">
              {topBarItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    {item.icon && <span>{item.icon}</span>}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
            {renderHotelSelector()}
          </div>
        </div>
      </div>
      <div className="px-6">
        {renderContent()}
      </div>
    </div>
  );
} 
