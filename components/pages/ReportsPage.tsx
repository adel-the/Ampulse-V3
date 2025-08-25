"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  Building2, 
  Users, 
  Euro,
  PieChart,
  Filter,
  Search,
  RefreshCw,
  Printer,
  Mail,
  Target,
  Award,
  Activity,
  Eye,
  Settings,
  Code,
  Clock,
  X,
  ChevronDown,
  ChevronRight,
  FileText,
  Database,
  BarChart,
  LineChart,
  PieChart as PieChartIcon
} from 'lucide-react';

interface AnalyticsData {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  period: string;
  data?: any[];
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }[];
}

interface ReportsPageProps {
  hotels?: Array<{ id: number; nom: string }>;
  selectedHotelId?: number | null;
}

export default function ReportsPage({ hotels = [], selectedHotelId }: ReportsPageProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'occupation' | 'reservations' | 'revenus' | 'operateurs'>('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('today');
  const [comparePeriod, setComparePeriod] = useState<string>('31 juil. 2025');
  const [selectedHotel, setSelectedHotel] = useState<string>(selectedHotelId ? selectedHotelId.toString() : 'all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['dashboard']));
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['taux_occupation', 'reservations_actives', 'revenus_jour', 'chambres_disponibles']);

  // Données simulées pour les métriques PMS
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([
    {
      id: 'taux_occupation',
      title: 'Taux d\'occupation',
      value: '78 %',
      change: 5.2,
      changeType: 'increase',
      period: 'Aujourd\'hui'
    },
    {
      id: 'reservations_actives',
      title: 'Réservations actives',
      value: '156',
      change: -2.1,
      changeType: 'decrease',
      period: 'Aujourd\'hui'
    },
    {
      id: 'revenus_jour',
      title: 'Revenus du jour',
      value: '12 450 €',
      change: 8.7,
      changeType: 'increase',
      period: 'Aujourd\'hui'
    },
    {
      id: 'chambres_disponibles',
      title: 'Chambres disponibles',
      value: '23',
      change: 12.5,
      changeType: 'increase',
      period: 'Aujourd\'hui'
    }
  ]);

  // Données pour les graphiques
  const [chartData, setChartData] = useState<ChartData>({
    labels: ['00 h', '02 h', '04 h', '06 h', '08 h', '10 h', '12 h', '14 h', '16 h', '18 h', '20 h', '22 h'],
    datasets: [
      {
        label: '1 août 2025',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      },
      {
        label: '31 juil. 2025',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#9CA3AF',
        backgroundColor: 'rgba(156, 163, 175, 0.1)'
      }
    ]
  });

  // Sections de navigation adaptées au PMS
  const navigationSections = {
    occupation: [
      { id: 'taux_occupation_temps', label: 'Taux d\'occupation dans le temps' },
      { id: 'occupation_par_hotel', label: 'Occupation par établissement' },
      { id: 'occupation_par_type', label: 'Occupation par type de chambre' },
      { id: 'previsions_occupation', label: 'Prévisions d\'occupation' }
    ],
    reservations: [
      { id: 'reservations_temps', label: 'Réservations dans le temps' },
      { id: 'reservations_par_statut', label: 'Réservations par statut' },
      { id: 'reservations_par_operateur', label: 'Réservations par opérateur' },
      { id: 'duree_sejour_moyenne', label: 'Durée de séjour moyenne' },
      { id: 'taux_annulation', label: 'Taux d\'annulation' },
      { id: 'reservations_urgentes', label: 'Réservations urgentes' },
      { id: 'prolongations', label: 'Prolongations de séjour' },
      { id: 'fins_prise_charge', label: 'Fins de prise en charge' }
    ],
    revenus: [
      { id: 'revenus_temps', label: 'Revenus dans le temps' },
      { id: 'revenus_par_hotel', label: 'Revenus par établissement' },
      { id: 'revenus_par_type', label: 'Revenus par type de chambre' },
      { id: 'prix_moyen_nuit', label: 'Prix moyen par nuit' },
      { id: 'conventions_prix', label: 'Conventions de prix' },
      { id: 'facturation', label: 'Facturation et paiements' }
    ],
    operateurs: [
      { id: 'operateurs_actifs', label: 'Opérateurs sociaux actifs' },
      { id: 'reservations_par_operateur', label: 'Réservations par opérateur' },
      { id: 'zones_intervention', label: 'Zones d\'intervention' },
      { id: 'specialites', label: 'Spécialités des opérateurs' }
    ]
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const exportData = (format: 'csv' | 'excel' | 'pdf') => {
    const data = {
      period: selectedPeriod,
      comparePeriod,
      metrics: analyticsData,
      chartData,
      // Données spécifiques au PMS
      pmsData: {
        hotels: hotels,
        selectedHotel: selectedHotel,
        occupationData: {
          tauxOccupation: analyticsData.find(m => m.id === 'taux_occupation')?.value,
          chambresDisponibles: analyticsData.find(m => m.id === 'chambres_disponibles')?.value,
          reservationsActives: analyticsData.find(m => m.id === 'reservations_actives')?.value
        },
        revenueData: {
          revenusJour: analyticsData.find(m => m.id === 'revenus_jour')?.value,
          periode: selectedPeriod
        }
      }
    };
    
    // Simulation d'export avec données PMS
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analyse_pms_${selectedPeriod}_${format}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderMetricCard = (metric: AnalyticsData) => (
    <Card key={metric.id} className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">{metric.title}</CardTitle>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
        {metric.change !== undefined && (
          <div className={`text-sm ${metric.changeType === 'increase' ? 'text-green-600' : metric.changeType === 'decrease' ? 'text-red-600' : 'text-gray-500'}`}>
            {metric.change > 0 ? '+' : ''}{metric.change}% vs {comparePeriod}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderChart = (title: string, type: 'line' | 'bar' | 'pie') => (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            {type === 'line' && <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />}
            {type === 'bar' && <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />}
            {type === 'pie' && <PieChartIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />}
            <p className="text-gray-500">Graphique {title}</p>
            <p className="text-sm text-gray-400">Données de comparaison disponibles</p>
          </div>
        </div>
        <div className="flex justify-center mt-4 space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">1 août 2025</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">31 juil. 2025</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderDataCard = (title: string, data: any[] = []) => (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Aucune donnée trouvée pour cette plage de dates</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar de navigation */}
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <nav className="px-4 pb-4">
          {Object.entries(navigationSections).map(([sectionKey, items]) => (
            <div key={sectionKey} className="mb-4">
              <button
                onClick={() => toggleSection(sectionKey)}
                className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
              >
                <span className="capitalize">{sectionKey}</span>
                {expandedSections.has(sectionKey) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {expandedSections.has(sectionKey) && (
                <div className="ml-4 space-y-1">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(sectionKey as any)}
                      className="block w-full text-left text-sm text-gray-600 hover:text-gray-900 py-1 px-2 rounded hover:bg-gray-100"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* En-tête */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Analyses de données</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant={selectedPeriod === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('today')}
              >
                Aujourd'hui
              </Button>
              <Button variant="outline" size="sm">
                Comparer à : {comparePeriod}
              </Button>
              <Button variant="outline" size="sm">
                Réinitialiser par défaut
              </Button>
            </div>
          </div>

          {/* Métriques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {analyticsData.map(renderMetricCard)}
          </div>

          {/* Graphiques et données PMS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderChart('Taux d\'occupation dans le temps', 'line')}
            {renderDataCard('Répartition des réservations par statut', [
              { label: 'Confirmées', value: '89' },
              { label: 'En cours', value: '45' },
              { label: 'Terminées', value: '156' },
              { label: 'Annulées', value: '12' },
              { label: 'En attente', value: '23' }
            ])}
            {renderDataCard('Occupation par établissement')}
            {renderChart('Revenus dans le temps', 'line')}
            {renderDataCard('Répartition par type de chambre', [
              { label: 'Simple', value: '45 %' },
              { label: 'Double', value: '32 %' },
              { label: 'Triple', value: '15 %' },
              { label: 'Adaptée', value: '8 %' }
            ])}
          </div>

          {/* Boutons d'export */}
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={() => exportData('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
            <Button variant="outline" onClick={() => exportData('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Exporter Excel
            </Button>
            <Button variant="outline" onClick={() => exportData('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
