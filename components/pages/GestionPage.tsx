import { useState } from 'react';
import TopBar from '../layout/TopBar';
import ClientManagement from '../features/ClientManagement';
import InvoiceManagement from '../features/InvoiceManagement';
import { 
  UserCheck, 
  FileText,
  Building2,
  TrendingUp,
  AlertCircle,
  Clock,
  Euro,
  Users,
  Calendar,
  Plus,
  Search,
  Filter,
  Download,
  Mail,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface GestionPageProps {
  selectedHotel?: {
    id: number;
    nom: string;
  } | null;
}

export default function GestionPage({ selectedHotel }: GestionPageProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [clientManagementTab, setClientManagementTab] = useState('list');
  const [selectedTypeForForm, setSelectedTypeForForm] = useState<number | null>(null);

  // Données simulées pour les statistiques
  const stats = {
    clients: {
      total: 156,
      actifs: 142,
      vip: 23,
      nouveaux: 12
    },
    factures: {
      total: 89,
      payees: 67,
      enRetard: 8,
      enAttente: 14
    },
    revenus: {
      ceMois: 28450,
      ceTrimestre: 89200,
      enAttente: 15600
    },
    alertes: {
      facturesEnRetard: 8,
      clientsInactifs: 14,
      paiementsEnAttente: 12
    }
  };

  const topBarItems = [
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: <TrendingUp className="h-4 w-4" />,
      badge: stats.alertes.facturesEnRetard + stats.alertes.paiementsEnAttente
    },
    {
      id: 'gestion-clients',
      label: 'Gestion clients',
      icon: <UserCheck className="h-4 w-4" />,
      badge: stats.clients.nouveaux
    },
    {
      id: 'gestion-factures',
      label: 'Facturation',
      icon: <FileText className="h-4 w-4" />,
      badge: stats.factures.enRetard
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Clients actifs</p>
                <p className="text-3xl font-bold">{stats.clients.actifs}</p>
                <p className="text-blue-100 text-sm">+{stats.clients.nouveaux} ce mois</p>
              </div>
              <Users className="h-12 w-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Revenus du mois</p>
                <p className="text-3xl font-bold">{stats.revenus.ceMois.toLocaleString()}€</p>
                <p className="text-green-100 text-sm">+12% vs mois dernier</p>
              </div>
              <Euro className="h-12 w-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Factures payées</p>
                <p className="text-3xl font-bold">{stats.factures.payees}</p>
                <p className="text-orange-100 text-sm">sur {stats.factures.total}</p>
              </div>
              <FileText className="h-12 w-12 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">En attente</p>
                <p className="text-3xl font-bold">{stats.revenus.enAttente.toLocaleString()}€</p>
                <p className="text-red-100 text-sm">{stats.factures.enAttente} factures</p>
              </div>
              <Clock className="h-12 w-12 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes et notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-l-4 border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="h-5 w-5 mr-2" />
              Alertes urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.alertes.facturesEnRetard > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm font-medium text-red-800">
                      {stats.alertes.facturesEnRetard} factures en retard
                    </span>
                  </div>
                  <Badge variant="destructive">{stats.alertes.facturesEnRetard}</Badge>
                </div>
              )}
              {stats.alertes.paiementsEnAttente > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center">
                    <Euro className="h-4 w-4 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-orange-800">
                      {stats.alertes.paiementsEnAttente} paiements en attente
                    </span>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">{stats.alertes.paiementsEnAttente}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-700">
              <Bell className="h-5 w-5 mr-2" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <UserCheck className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">
                    Nouveau client VIP enregistré
                  </span>
                </div>
                <span className="text-xs text-blue-600">Il y a 2h</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    Facture FAC-2024-089 payée
                  </span>
                </div>
                <span className="text-xs text-green-600">Il y a 4h</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-purple-800">
                    Relance automatique envoyée
                  </span>
                </div>
                <span className="text-xs text-purple-600">Il y a 6h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et tendances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Tendances du mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">+15%</div>
              <div className="text-sm text-gray-600">Nouveaux clients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">+8%</div>
              <div className="text-sm text-gray-600">Revenus</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">-12%</div>
              <div className="text-sm text-gray-600">Factures en retard</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'gestion-clients':
        return <ClientManagement 
          activeTab={clientManagementTab}
          onTabChange={setClientManagementTab}
          selectedTypeForForm={selectedTypeForForm}
          setSelectedTypeForForm={setSelectedTypeForForm}
        />;
      case 'gestion-factures':
        return <InvoiceManagement />;
      default:
        return renderOverview();
    }
  };

  return (
    <div>
      <TopBar
        items={topBarItems}
        activeItem={activeTab}
        onItemClick={setActiveTab}
        title="Gestion"
        description="Gérez vos clients et factures de manière efficace"
      />
      
      {/* Affichage de l'établissement sélectionné */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <div>
              <span className="text-blue-900 font-semibold text-lg">
                {selectedHotel?.nom || 'Établissement par défaut'}
              </span>
              <p className="text-blue-700 text-sm">
                Gestion centralisée des clients et factures
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-blue-100 text-blue-800">
              {stats.clients.actifs} clients actifs
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              {stats.factures.payees}/{stats.factures.total} factures payées
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-6">
        {renderContent()}
      </div>
    </div>
  );
} 
