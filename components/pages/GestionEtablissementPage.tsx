import { useState, useEffect } from 'react';
import TopBar from '../layout/TopBar';
import { 
  Building2,
  Bed,
  Wrench,
  MapPin,
  Building,
  Home
} from 'lucide-react';
import EstablishmentsSection from '../features/EstablishmentsSection';
import RoomsSection from '../features/RoomsSection';
import EquipmentsSection from '../features/EquipmentsSection';
import RoomCategoriesSection from '../features/RoomCategoriesSection';
import { useEstablishment } from '../../contexts/EstablishmentContext';
import type { Establishment } from '../../lib/api/establishments';

export default function GestionEtablissementPage() {
  const [activeTab, setActiveTab] = useState('etablissement');
  
  // Use global establishment context instead of local state
  const { selectedHotel, selectedHotelId, setSelectedHotelId, availableHotels, setAvailableHotels } = useEstablishment();

  console.log('🏨 GestionEtablissementPage: selectedHotelId =', selectedHotelId, 'selectedHotel =', selectedHotel?.nom);

  const handleEstablishmentSelect = (establishment: Establishment) => {
    console.log('🏨 GestionEtablissementPage: Selecting establishment:', establishment.nom, 'ID:', establishment.id);
    // Convert Establishment to Hotel format and update global context
    const hotelData = {
      id: establishment.id,
      nom: establishment.nom,
      adresse: establishment.adresse,
      ville: establishment.ville,
      codePostal: establishment.code_postal,
      telephone: establishment.telephone || '',
      email: establishment.email || '',
      gestionnaire: establishment.gestionnaire || 'Non spécifié',
      statut: establishment.statut || 'ACTIF',
      chambresTotal: establishment.chambres_total || 0,
      chambresOccupees: establishment.chambres_occupees || 0,
      tauxOccupation: establishment.taux_occupation || 0
    };
    
    // Update available hotels if this hotel is not already in the list
    const existingHotel = availableHotels.find(h => h.id === establishment.id);
    if (!existingHotel) {
      console.log('🔄 Adding hotel to availableHotels:', hotelData.nom);
      setAvailableHotels([...availableHotels, hotelData]);
    }
    
    // Set as selected hotel in global context
    setSelectedHotelId(establishment.id);
  };

  const topBarItems = [
    {
      id: 'etablissement',
      label: 'Établissements',
      icon: <Building2 className="h-4 w-4" />
    },
    {
      id: 'categories',
      label: 'Catégories de chambre',
      icon: <Home className="h-4 w-4" />
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
            onEstablishmentSelect={handleEstablishmentSelect}
            currentSelectedId={selectedHotelId}
          />
        );
      
      case 'categories':
        return <RoomCategoriesSection selectedHotelId={selectedHotelId} />;
      
      case 'chambres':
        return <RoomsSection selectedHotelId={selectedHotelId} />;
      
      case 'equipements':
        return <EquipmentsSection selectedHotelId={selectedHotelId} />;
      
      default:
        return <div>Page non trouvée</div>;
    }
  };

  // Render selected establishment display for all tabs
  const renderSelectedEstablishment = () => {

    if (!selectedEstablishment) {
      if (activeTab === 'etablissement') {
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="text-sm text-gray-600">
              Sélectionnez un établissement dans la liste ci-dessous
            </span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <span className="text-sm text-yellow-800">
            Aucun établissement sélectionné. Veuillez sélectionner un établissement dans l'onglet Établissements.
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="rounded-full h-3 w-3 bg-blue-600"></div>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium text-gray-900">{selectedEstablishment.nom}</span>
          <span className="flex items-center gap-1 text-gray-600">
            <MapPin className="h-3 w-3" />
            {selectedEstablishment.ville}
          </span>
          <span className="flex items-center gap-1 text-gray-600">
            <Building2 className="h-3 w-3" />
            {selectedEstablishment.chambres_total} chambres
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            selectedEstablishment.statut === 'ACTIF' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {selectedEstablishment.statut}
          </span>
        </div>
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
            {renderSelectedEstablishment()}
          </div>
        </div>
      </div>
      
      <div>
        {renderContent()}
      </div>
    </div>
  );
}