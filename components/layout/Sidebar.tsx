"use client";

import { Button } from '../ui/button';
import {
  Building2,
  Calendar,
  MessageSquare,
  Settings,
  BarChart3,
  FileText,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Calculator,
  Receipt,
  DollarSign,
  Download,
  Wrench,
  Menu,
  Grid3X3,
  Bed,
  Building,
  Search,
  Users,
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  BookOpen,
  ClipboardList
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useEstablishment } from '../../contexts/EstablishmentContext';
import { establishmentsApi } from '../../lib/api/establishments';
import type { Establishment } from '../../lib/api/establishments';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  features?: {
    operateursSociaux: boolean;
    statistiques: boolean;
    notifications: boolean;
  };
}

export default function Sidebar({ activeTab, onTabChange, features }: SidebarProps) {
  const [expandedComptabilite, setExpandedComptabilite] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEstablishmentSelector, setShowEstablishmentSelector] = useState(false);
  const [availableEstablishments, setAvailableEstablishments] = useState<Establishment[]>([]);
  
  // Use the establishment context
  const { selectedHotel, selectedHotelId, setSelectedHotelId, setAvailableHotels } = useEstablishment();

  // Load establishments for the selector
  useEffect(() => {
    const loadEstablishments = async () => {
      try {
        const response = await establishmentsApi.getEstablishments();
        if (response.success && response.data) {
          setAvailableEstablishments(response.data);
        }
      } catch (error) {
        console.error('Error loading establishments for sidebar:', error);
      }
    };
    
    loadEstablishments();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEstablishmentSelector) {
        const target = event.target as HTMLElement;
        if (!target.closest('.establishment-selector')) {
          setShowEstablishmentSelector(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEstablishmentSelector]);

  const handleEstablishmentSelect = (establishment: Establishment) => {
    console.log('🏨 Sidebar: Selecting establishment:', establishment.nom, 'ID:', establishment.id);
    
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
    
    // Set as selected hotel in global context
    setSelectedHotelId(establishment.id);
    setShowEstablishmentSelector(false);
  };

  // Protection contre les erreurs de rendu - utilisation de valeurs par défaut
  if (!features) {
    // Removed console.warn to clean up console output
  }

  const tabs = [
    { 
      id: 'reservations-disponibilite', 
      label: 'Tableau de bord', 
      icon: LayoutDashboard, 
      alwaysVisible: true
    },
    { 
      id: 'reservations-liste', 
      label: 'Réservations', 
      icon: ClipboardList, 
      alwaysVisible: true
    },
    { 
      id: 'reservations-calendrier', 
      label: 'Disponibilité', 
      icon: CalendarCheck, 
      alwaysVisible: true
    },
    {
      id: 'availability-search',
      label: 'Recherche de disponibilité',
      icon: Search,
      alwaysVisible: true
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: Wrench,
      alwaysVisible: true
    },
    {
      id: 'analyses-donnees',
      label: 'Analyses de données',
      icon: BarChart3,
      alwaysVisible: true
    },
    {
      id: 'comptabilite',
      label: 'Comptabilité',
      icon: Calculator,
      alwaysVisible: true,
      hasSubmenu: true,
      submenu: [
        { id: 'comptabilite-journaux', label: 'Journaux Comptables', icon: FileText },
        { id: 'comptabilite-facturation-paiements', label: 'Facturation & Paiements', icon: Receipt },
        { id: 'comptabilite-analytique', label: 'Comptabilité Analytique', icon: BarChart3 },
        { id: 'comptabilite-exports', label: 'Exports Comptables', icon: Download },
        { id: 'comptabilite-tva-taxes', label: 'TVA & Taxes', icon: Calculator }
      ]
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Users,
      alwaysVisible: true
    },
    { 
      id: 'gestion-etablissement', 
      label: 'Gestion d\'établissement', 
      icon: Building, 
      alwaysVisible: true
    },
    { id: 'parametres', label: 'Paramètres', icon: Settings, alwaysVisible: true }
  ];

  // Valeurs par défaut si features n'est pas défini
  const defaultFeatures = {
    operateursSociaux: true,
    statistiques: true,
    notifications: true
  };

  const currentFeatures = features || defaultFeatures;

  const visibleTabs = tabs.filter(tab => tab.alwaysVisible);

  const handleTabClick = (tabId: string) => {
    if (tabId === 'comptabilite') {
      setExpandedComptabilite(!expandedComptabilite);
      return;
    }
    onTabChange(tabId);
  };

  const handleSubmenuClick = (submenuId: string) => {
    onTabChange(submenuId);
  };

  interface TabItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    alwaysVisible: boolean;
    hasSubmenu?: boolean;
    submenu?: Array<{
      id: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }>;
  }

  const renderTab = (tab: TabItem) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    const isComptabiliteActive = activeTab.startsWith('comptabilite-');

    return (
      <li key={tab.id} className="relative">
        <Button
          variant={isActive || (tab.id === 'comptabilite' && isComptabiliteActive) ? 'default' : 'ghost'}
          className={`w-full justify-start transition-all duration-200 ${
            isActive || (tab.id === 'comptabilite' && isComptabiliteActive)
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'text-gray-700 hover:bg-gray-100'
          } ${isExpanded ? 'px-3 py-2' : 'px-2 py-3 justify-center'}`}
          onClick={() => handleTabClick(tab.id)}
          title={!isExpanded ? tab.label : undefined}
        >
          <Icon className={`${isExpanded ? 'h-4 w-4 mr-3' : 'h-5 w-5'}`} />
          {isExpanded && (
            <span className="truncate whitespace-nowrap overflow-hidden">
              {tab.label}
            </span>
          )}
          {isExpanded && tab.hasSubmenu && (
            <span className="ml-auto">
              {(tab.id === 'comptabilite' && expandedComptabilite) ?
                <ChevronDown className="h-4 w-4" /> :
                <ChevronRight className="h-4 w-4" />
              }
            </span>
          )}
        </Button>

        {/* Sous-menu pour Comptabilité */}
        {isExpanded && tab.hasSubmenu && tab.id === 'comptabilite' && expandedComptabilite && tab.submenu && (
          <ul className="ml-2 mt-1 space-y-1">
            {tab.submenu.map((subItem) => {
              const SubIcon = subItem.icon;
              const isSubActive = activeTab === subItem.id;

              return (
                <li key={subItem.id}>
                  <Button
                    variant={isSubActive ? 'default' : 'ghost'}
                    className={`w-full justify-start text-sm px-3 py-1.5 ${
                      isSubActive
                        ? 'bg-blue-400 text-white hover:bg-blue-500'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSubmenuClick(subItem.id)}
                  >
                    <SubIcon className="h-3 w-3 mr-2" />
                    <span className="truncate whitespace-nowrap overflow-hidden">
                      {subItem.label}
                    </span>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div 
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
    >
      {/* Header */}
      <div className={`border-b border-gray-200 transition-all duration-300 ${
        isExpanded ? 'p-4' : 'p-2'
      }`}>
        {isExpanded ? (
          <div className="flex items-center justify-between">
            <div className="flex-1 relative establishment-selector">
              <div 
                onClick={() => setShowEstablishmentSelector(!showEstablishmentSelector)}
                className="cursor-pointer p-2 -m-2 rounded hover:bg-gray-50 transition-colors"
              >
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {selectedHotel ? selectedHotel.nom : 'SoliReserve'}
                </h1>
                <p className="text-xs text-gray-600 truncate flex items-center">
                  {selectedHotel ? (selectedHotel.ville || selectedHotel.adresse || 'Gestion hôtelière sociale') : 'Cliquez pour sélectionner un établissement'}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </p>
              </div>

              {/* Establishment Selector Dropdown */}
              {showEstablishmentSelector && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-700 mb-2 px-2 py-1">
                      Sélectionner un établissement
                    </div>
                    {availableEstablishments.length === 0 ? (
                      <div className="text-xs text-gray-500 px-2 py-2">
                        Aucun établissement disponible
                      </div>
                    ) : (
                      availableEstablishments.map((establishment) => (
                        <div
                          key={establishment.id}
                          onClick={() => handleEstablishmentSelect(establishment)}
                          className={`flex items-center px-2 py-2 text-sm rounded cursor-pointer transition-colors ${
                            selectedHotelId === establishment.id
                              ? 'bg-blue-50 text-blue-700'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-medium truncate">{establishment.nom}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {establishment.ville} • {establishment.chambres_total} chambres
                            </div>
                          </div>
                          {selectedHotelId === establishment.id && (
                            <div className="w-3 h-3 bg-blue-600 rounded-full ml-2" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="ml-2 p-1 h-8 w-8"
              title="Réduire le menu"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="p-1 h-8 w-8"
              title="Développer le menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav className={`flex-1 transition-all duration-300 ${
        isExpanded ? 'p-2' : 'p-1'
      }`}>
        <ul className="space-y-1">
          {visibleTabs.map(renderTab)}
        </ul>
      </nav>
      
      {/* Footer */}
      <div className={`border-t border-gray-200 transition-all duration-300 ${
        isExpanded ? 'p-3' : 'p-2'
      }`}>
        {isExpanded ? (
          <div className="text-xs text-gray-500 text-center">
            Version 2.0.0
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-xs text-gray-500 font-bold">2.0</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
