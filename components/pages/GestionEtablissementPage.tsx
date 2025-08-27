import { useState, useEffect } from 'react';
import TopBar from '../layout/TopBar';
import { 
  Building2,
  Bed,
  Wrench
} from 'lucide-react';
import EstablishmentsSection from '../features/EstablishmentsSection';
import RoomsSection from '../features/RoomsSection';
import EquipmentsSection from '../features/EquipmentsSection';
import { establishmentsApi } from '../../lib/api/establishments';
import { useNotifications } from '../../hooks/useNotifications';
import type { Establishment } from '../../lib/api/establishments';

export default function GestionEtablissementPage() {
  const [activeTab, setActiveTab] = useState('etablissement');
  
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
      id: 'etablissement',
      label: 'Établissements',
      icon: <Building2 className="h-4 w-4" />
    },
    {
      id: 'equipements',
      label: 'Équipements',
      icon: <Wrench className="h-4 w-4" />
    },
    {
      id: 'chambres',
      label: 'Chambres',
      icon: <Bed className="h-4 w-4" />
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'etablissement':
        return (
          <EstablishmentsSection 
            onEstablishmentUpdate={loadEstablishments}
          />
        );
      
      case 'chambres':
        return <RoomsSection selectedHotelId={globalSelectedHotelId} />;
      
      case 'equipements':
        return <EquipmentsSection selectedHotelId={globalSelectedHotelId} />;
      
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
      
      <div>
        {renderContent()}
      </div>
    </div>
  );
}