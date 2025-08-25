import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  FileText,
  Search,
  Filter,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Building,
  CalendarDays,
  CheckSquare,
  XSquare,
  RefreshCw
} from 'lucide-react';
import { Reservation, Hotel, OperateurSocial } from '../../types';

interface ReservationsDashboardProps {
  reservations: Reservation[];
  hotels?: Hotel[];
  operateurs?: OperateurSocial[];
  onActionClick?: (action: string, data?: any) => void;
  onReservationSelect?: (reservation: Reservation) => void;
  onNewReservation?: () => void;
  onEditReservation?: (reservation: Reservation) => void;
  onDeleteReservation?: (reservation: Reservation) => void;
  onConfirmReservation?: (reservation: Reservation) => void;
  onCancelReservation?: (reservation: Reservation) => void;
  onViewDetails?: (reservation: Reservation) => void;
  onGenerateReport?: () => void;
  onCheckAvailability?: () => void;
}

export default function ReservationsDashboard({ 
  reservations, 
  hotels = [], 
  operateurs = [],
  onActionClick,
  onReservationSelect,
  onNewReservation,
  onEditReservation,
  onDeleteReservation,
  onConfirmReservation,
  onCancelReservation,
  onViewDetails,
  onGenerateReport,
  onCheckAvailability
}: ReservationsDashboardProps) {
  // Calcul des statistiques
  const totalReservations = reservations.length;
  const reservationsEnCours = reservations.filter(r => r.statut === 'EN_COURS').length;
  const reservationsConfirmees = reservations.filter(r => r.statut === 'CONFIRMEE').length;
  const reservationsAnnulees = reservations.filter(r => r.statut === 'ANNULEE').length;
  
  // Calcul du taux de confirmation
  const tauxConfirmation = totalReservations > 0 ? (reservationsConfirmees / totalReservations * 100).toFixed(1) : '0';
  
  // Réservations par mois (derniers 6 mois)
  const reservationsParMois = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const mois = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const count = reservations.filter(r => {
      const reservationDate = new Date(r.dateArrivee);
      return reservationDate.getMonth() === date.getMonth() && 
             reservationDate.getFullYear() === date.getFullYear();
    }).length;
    return { mois, count };
  }).reverse();

  // Top 5 des hôtels les plus réservés
  const hotelsPopulaires = reservations.reduce((acc, reservation) => {
    const hotelNom = reservation.hotel;
    acc[hotelNom] = (acc[hotelNom] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topHotels = Object.entries(hotelsPopulaires)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([hotelNom, count]) => ({ hotelNom, count }));

  // Réservations récentes (dernières 5)
  const reservationsRecentes = reservations
    .sort((a, b) => new Date(b.dateArrivee).getTime() - new Date(a.dateArrivee).getTime())
    .slice(0, 5);

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'CONFIRMEE': return 'bg-green-100 text-green-800';
      case 'EN_COURS': return 'bg-yellow-100 text-yellow-800';
      case 'ANNULEE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'CONFIRMEE': return <CheckCircle className="h-4 w-4" />;
      case 'EN_COURS': return <Clock className="h-4 w-4" />;
      case 'ANNULEE': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Réservations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReservations}</div>
            <p className="text-xs text-muted-foreground">
              +12% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{reservationsEnCours}</div>
            <p className="text-xs text-muted-foreground">
              En attente de confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reservationsConfirmees}</div>
            <p className="text-xs text-muted-foreground">
              Taux de confirmation: {tauxConfirmation}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annulées</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{reservationsAnnulees}</div>
            <p className="text-xs text-muted-foreground">
              -5% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique des réservations par mois */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des réservations (6 derniers mois)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reservationsParMois.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">{item.mois}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((item.count / Math.max(...reservationsParMois.map(r => r.count))) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-8">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hôtels les plus populaires */}
        <Card>
          <CardHeader>
            <CardTitle>Hôtels les plus réservés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topHotels.map((hotel, index) => (
                <div key={hotel.hotelNom} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{hotel.hotelNom}</p>
                      <p className="text-xs text-gray-500">{hotel.count} réservations</p>
                    </div>
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Réservations récentes */}
        <Card>
          <CardHeader>
            <CardTitle>Réservations récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reservationsRecentes.map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(reservation.statut)}
                    <div>
                      <p className="text-sm font-medium">Réservation #{reservation.id}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(reservation.dateArrivee).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(reservation.statut)}>
                      {reservation.statut}
                    </Badge>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => onViewDetails?.(reservation) || onReservationSelect?.(reservation)}
                        title="Voir détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => onEditReservation?.(reservation)}
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {reservation.statut === 'EN_COURS' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                            onClick={() => onConfirmReservation?.(reservation)}
                            title="Confirmer"
                          >
                            <CheckSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => onCancelReservation?.(reservation)}
                            title="Annuler"
                          >
                            <XSquare className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => onDeleteReservation?.(reservation)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
