"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Building2, 
  Users, 
  Calendar, 
  TrendingUp, 
  UserCheck,
  BarChart3,
  PieChart,
  Target,
  Award,
  Clock,
  Star,
  MapPin,
  Euro
} from 'lucide-react';
import { DashboardStats } from '../../types';

interface DashboardProps {
  stats: DashboardStats;
  onActionClick: (action: string) => void;
  features?: {
    operateursSociaux: boolean;
  
    statistiques: boolean;
    notifications: boolean;
  };
  selectedHotel?: {
    id: number;
    nom: string;
    adresse: string;
    ville: string;
    codePostal: string;
    telephone: string;
    email: string;
    gestionnaire: string;
    statut: string;
    chambresTotal: number;
    chambresOccupees: number;
    tauxOccupation: number;
  } | null;
}

export default function Dashboard({ stats, onActionClick, features, selectedHotel }: DashboardProps) {
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'reservations' | 'revenue' | 'occupancy'>('reservations');

  const statCards = [
    {
      title: "Établissements",
      value: stats.totalHotels,
      change: "+2 ce mois",
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Chambres totales",
      value: stats.totalChambres,
      change: "Taux d'occupation: 78%",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Réservations actives",
      value: stats.reservationsActives,
      change: "+12 cette semaine",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    ...(features?.operateursSociaux ? [{
      title: "Opérateurs actifs",
      value: stats.operateursActifs,
      change: `${stats.totalOperateurs} au total`,
      icon: UserCheck,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }] : []),
    {
      title: "Revenus mensuel",
      value: `${stats.revenusMensuel.toLocaleString()}€`,
      change: "+8% vs mois dernier",
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    }
  ];



  // Données pour les graphiques
  const chartData = [
    { month: 'Jan', reservations: 145, revenue: 5200, occupancy: 72, clients: 23 },
    { month: 'Fév', reservations: 132, revenue: 4800, occupancy: 68, clients: 19 },
    { month: 'Mar', reservations: 167, revenue: 6100, occupancy: 75, clients: 28 },
    { month: 'Avr', reservations: 189, revenue: 6800, occupancy: 82, clients: 31 },
    { month: 'Mai', reservations: 201, revenue: 7200, occupancy: 85, clients: 35 },
    { month: 'Juin', reservations: 234, revenue: 8400, occupancy: 88, clients: 42 },
    { month: 'Juil', reservations: 267, revenue: 9600, occupancy: 92, clients: 48 },
    { month: 'Août', reservations: 289, revenue: 10400, occupancy: 95, clients: 52 },
    { month: 'Sep', reservations: 245, revenue: 8800, occupancy: 87, clients: 38 },
    { month: 'Oct', reservations: 198, revenue: 7100, occupancy: 79, clients: 29 },
    { month: 'Nov', reservations: 167, revenue: 6000, occupancy: 73, clients: 25 },
    { month: 'Déc', reservations: 189, revenue: 6800, occupancy: 81, clients: 32 }
  ];

  // Hôtels les plus performants - filtrés selon l'établissement sélectionné
  const topHotels = selectedHotel ? [
    {
      id: selectedHotel.id,
      nom: selectedHotel.nom,
      ville: selectedHotel.ville,
      reservations: stats.reservationsActives,
      revenue: stats.revenusMensuel,
      occupancy: selectedHotel.tauxOccupation,
      rating: 4.8
    }
  ] : [
    {
      id: 1,
      nom: 'Hôtel Central',
      ville: 'Paris',
      reservations: 234,
      revenue: 15600,
      occupancy: 92,
      rating: 4.8
    },
    {
      id: 2,
      nom: 'Résidence du Port',
      ville: 'Marseille',
      reservations: 189,
      revenue: 12800,
      occupancy: 88,
      rating: 4.6
    },
    {
      id: 3,
      nom: 'Château des Alpes',
      ville: 'Chambéry',
      reservations: 156,
      revenue: 11200,
      occupancy: 85,
      rating: 4.7
    },
    {
      id: 4,
      nom: 'Auberge Provençale',
      ville: 'Aix-en-Provence',
      reservations: 134,
      revenue: 9800,
      occupancy: 82,
      rating: 4.5
    },
    {
      id: 5,
      nom: 'Hôtel des Arts',
      ville: 'Lyon',
      reservations: 123,
      revenue: 8900,
      occupancy: 79,
      rating: 4.4
    }
  ];

  // Clients les plus fidèles
  const topClients = [
    {
      id: 1,
      nom: 'Marie Dupont',
      type: 'Particulier',
      reservations: 12,
      totalSpent: 4800,
      lastVisit: '2024-01-18'
    },
    {
      id: 2,
      nom: 'TechCorp',
      type: 'Entreprise',
      reservations: 25,
      totalSpent: 15000,
      lastVisit: '2024-01-20'
    },
    {
      id: 3,
      nom: 'Aide Sociale Plus',
      type: 'Association',
      reservations: 45,
      totalSpent: 18000,
      lastVisit: '2024-01-22'
    },
    {
      id: 4,
      nom: 'Pierre Leroy',
      type: 'Particulier',
      reservations: 18,
      totalSpent: 7200,
      lastVisit: '2024-01-19'
    },
    {
      id: 5,
      nom: 'Jean Martin',
      type: 'Particulier',
      reservations: 15,
      totalSpent: 6000,
      lastVisit: '2024-01-21'
    }
  ];

  // Fonction pour rendre un graphique en barres simple
  const renderBarChart = (data: any[], metric: string) => {
    const maxValue = Math.max(...data.map(d => d[metric]));
    
    return (
      <div className="space-y-2">
        {data.map((item, index) => {
          const percentage = (item[metric] / maxValue) * 100;
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-12 text-xs text-gray-500">{item.month}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="w-16 text-xs text-gray-600 text-right">
                {metric === 'revenue' ? `${item[metric]}€` : item[metric]}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Fonction pour rendre un graphique circulaire simple
  const renderPieChart = (data: { label: string; value: number; color: string }[]) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
              <div className="flex-1 text-sm">{item.label}</div>
              <div className="text-sm font-medium">{percentage.toFixed(1)}%</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête du tableau de bord */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
          <p className="text-gray-600">Vue d'ensemble de vos établissements et réservations</p>
        </div>
        <Button onClick={() => setShowDetailedStats(!showDetailedStats)}>
          {showDetailedStats ? "Masquer" : "Afficher"} les détails
        </Button>
      </div>

      {/* Détails de l'établissement actuel */}
      {selectedHotel && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Building2 className="h-5 w-5 mr-2" />
              Établissement actuel : {selectedHotel.nom}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-800">Informations générales</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Adresse :</span> {selectedHotel.adresse}</p>
                  <p><span className="font-medium">Ville :</span> {selectedHotel.ville} {selectedHotel.codePostal}</p>
                  <p><span className="font-medium">Téléphone :</span> {selectedHotel.telephone}</p>
                  <p><span className="font-medium">Email :</span> {selectedHotel.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-800">Capacité</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Chambres totales :</span> {selectedHotel.chambresTotal}</p>
                  <p><span className="font-medium">Chambres occupées :</span> {selectedHotel.chambresOccupees}</p>
                  <p><span className="font-medium">Taux d'occupation :</span> 
                    <span className="ml-1 font-bold text-green-600">
                      {selectedHotel.tauxOccupation}%
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-800">Statut</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Gestionnaire :</span> {selectedHotel.gestionnaire}</p>
                  <p><span className="font-medium">Statut :</span> 
                    <Badge className={`ml-1 ${
                      selectedHotel.statut === 'ACTIF' ? 'bg-green-100 text-green-800' :
                      selectedHotel.statut === 'INACTIF' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedHotel.statut}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message si aucun établissement sélectionné */}
      {!selectedHotel && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Building2 className="h-5 w-5 mr-2" />
              Établissement par défaut sélectionné
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800">
              Le premier établissement a été automatiquement sélectionné. Vous pouvez changer d'établissement dans les paramètres.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>



      {/* Graphiques et Statistiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique des réservations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Évolution des réservations
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                variant={selectedMetric === 'reservations' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('reservations')}
              >
                Réservations
              </Button>
              <Button
                variant={selectedMetric === 'revenue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('revenue')}
              >
                Revenus
              </Button>
              <Button
                variant={selectedMetric === 'occupancy' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('occupancy')}
              >
                Occupation
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-y-auto">
              {renderBarChart(chartData, selectedMetric)}
            </div>
          </CardContent>
        </Card>

        {/* Répartition des types de clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-green-600" />
              Répartition des clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderPieChart([
              { label: 'Particuliers', value: 45, color: 'bg-blue-500' },
              { label: 'Entreprises', value: 25, color: 'bg-green-500' },
              { label: 'Associations', value: 20, color: 'bg-purple-500' },
              { label: 'Institutions', value: 10, color: 'bg-orange-500' }
            ])}
          </CardContent>
        </Card>
      </div>

      {/* Hôtels les plus performants et Clients fidèles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hôtels les plus performants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-600" />
              Hôtels les plus performants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topHotels.map((hotel, index) => (
                <div key={hotel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{hotel.nom}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {hotel.ville}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{hotel.reservations} réservations</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Star className="h-3 w-3 mr-1 text-yellow-500" />
                      {hotel.rating}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Clients les plus fidèles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Clients les plus fidèles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topClients.map((client, index) => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{client.nom}</div>
                      <div className="text-sm text-gray-500">{client.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{client.reservations} réservations</div>
                    <div className="text-sm text-gray-500">{client.totalSpent}€</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques de performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Métriques de performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-indigo-600" />
              Objectifs mensuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Réservations</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-sm font-medium">85%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Revenus</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="text-sm font-medium">92%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Satisfaction</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                  </div>
                  <span className="text-sm font-medium">96%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
                              <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Nouvelle réservation</div>
                  <div className="text-xs text-gray-500">Hôtel Central - Il y a 2h</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Chambre libérée</div>
                  <div className="text-xs text-gray-500">Résidence du Port - Il y a 4h</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Nouveau client</div>
                  <div className="text-xs text-gray-500">Marie Dupont - Il y a 6h</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Paiement reçu</div>
                  <div className="text-xs text-gray-500">TechCorp - Il y a 8h</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Indicateurs clés */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-red-600" />
              Indicateurs clés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Taux de remplissage</span>
                <span className="text-lg font-bold text-green-600">87%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Durée moyenne séjour</span>
                <span className="text-lg font-bold text-blue-600">3.2 jours</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Revenu moyen/chambre</span>
                <span className="text-lg font-bold text-purple-600">156€</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Temps de réponse</span>
                <span className="text-lg font-bold text-orange-600">2.3h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques détaillées */}
      {showDetailedStats && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiques détaillées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700">Occupation par établissement</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Résidence Saint-Martin</span>
                    <Badge variant="secondary">85%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Foyer Solidaire Belleville</span>
                    <Badge variant="secondary">92%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Hôtel d'Accueil Républicain</span>
                    <Badge variant="secondary">78%</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700">Réservations par statut</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Confirmées</span>
                    <Badge className="bg-green-100 text-green-800">45</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">En cours</span>
                    <Badge className="bg-yellow-100 text-yellow-800">23</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Terminées</span>
                    <Badge className="bg-blue-100 text-blue-800">67</Badge>
                  </div>
                </div>
              </div>
              
              {features?.operateursSociaux && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700">Opérateurs par organisation</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">SIAO 75</span>
                      <Badge className="bg-purple-100 text-purple-800">12</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Emmaüs</span>
                      <Badge className="bg-purple-100 text-purple-800">8</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Secours Catholique</span>
                      <Badge className="bg-purple-100 text-purple-800">6</Badge>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700">Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taux de satisfaction</span>
                    <Badge className="bg-green-100 text-green-800">94%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Temps de réponse</span>
                    <Badge className="bg-blue-100 text-blue-800">2.3h</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taux de remplissage</span>
                    <Badge className="bg-purple-100 text-purple-800">87%</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}